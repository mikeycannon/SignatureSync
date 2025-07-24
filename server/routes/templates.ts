import { Router, Request, Response } from "express";
import Joi from "joi";
import { prisma } from "../prisma";
import { authenticateToken, validateTenantAccess, requireAdmin } from "../middleware/auth";
import { validate, templateSchemas, commonSchemas } from "../middleware/validation";
import { asyncHandler, successResponse, paginatedResponse, ApiError, HTTP_STATUS } from "../middleware/error";

const router = Router();

/**
 * @route GET /api/templates
 * @desc Get all signature templates for the authenticated user's tenant
 * @access Private
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 100)
 * @query {string} sort - Sort field (created_at, updated_at, name)
 * @query {string} order - Sort order (asc, desc)
 * @query {string} q - Search query (searches name and description)
 * @query {string} filter - Filter templates (all, active, default)
 */
router.get(
  "/",
  authenticateToken,
  validateTenantAccess,
  validate({ query: commonSchemas.search }),
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, sort = 'created_at', order = 'desc', q, filter = 'all' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Build search conditions
    const where: any = {
      tenant_id: req.tenant!.id
    };

    if (q) {
      where.OR = [
        { name: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } }
      ];
    }

    if (filter === 'default') {
      where.is_default = true;
    }

    // Get total count for pagination
    const total = await prisma.signatureTemplate.count({ where });

    // Get templates with pagination and sorting
    const templates = await prisma.signatureTemplate.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        template_assignments: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            template_assignments: true
          }
        }
      },
      orderBy: {
        [sort as string]: order
      },
      skip: offset,
      take: Number(limit)
    });

    // Transform response to include usage statistics
    const templatesWithStats = templates.map(template => ({
      id: template.id,
      name: template.name,
      html_content: template.html_content,
      is_default: template.is_default,
      created_at: template.created_at,
      updated_at: template.updated_at,
      creator: template.creator,
      assignments_count: template._count.template_assignments,
      assignments: template.template_assignments.map(assignment => ({
        id: assignment.id,
        user: assignment.user,
        assigned_at: assignment.assigned_at
      }))
    }));

    paginatedResponse(
      res,
      templatesWithStats,
      total,
      Number(page),
      Number(limit),
      "Templates retrieved successfully"
    );
  })
);

/**
 * @route GET /api/templates/:id
 * @desc Get a specific signature template by ID
 * @access Private
 * @param {number} id - Template ID
 */
router.get(
  "/:id",
  authenticateToken,
  validateTenantAccess,
  validate({ params: commonSchemas.id }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const template = await prisma.signatureTemplate.findFirst({
      where: {
        id: Number(id),
        tenant_id: req.tenant!.id
      },
      include: {
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        template_assignments: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                title: true,
                department: true
              }
            }
          },
          orderBy: {
            assigned_at: 'desc'
          }
        }
      }
    });

    if (!template) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "Template not found",
        "TEMPLATE_NOT_FOUND"
      );
    }

    successResponse(res, template, "Template retrieved successfully");
  })
);

/**
 * @route POST /api/templates
 * @desc Create a new signature template
 * @access Private
 * @body {string} name - Template name
 * @body {string} html_content - Template HTML content
 * @body {boolean} is_default - Whether this is a default template
 * @body {string} description - Template description (optional)
 */
router.post(
  "/",
  authenticateToken,
  validateTenantAccess,
  validate({ body: templateSchemas.create }),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, html_content, is_default = false, description } = req.body;

    // If setting as default, unset any existing default templates
    if (is_default) {
      await prisma.signatureTemplate.updateMany({
        where: {
          tenant_id: req.tenant!.id,
          is_default: true
        },
        data: {
          is_default: false
        }
      });
    }

    const template = await prisma.signatureTemplate.create({
      data: {
        name,
        html_content,
        is_default,
        description,
        tenant_id: req.tenant!.id,
        created_by: req.user!.userId
      },
      include: {
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    });

    // Log activity
    await prisma.processingLog.create({
      data: {
        tenant_id: req.tenant!.id,
        user_id: req.user!.userId,
        email_id: `template_created_${template.id}`,
        status: 'success'
      }
    });

    successResponse(
      res,
      template,
      "Template created successfully",
      HTTP_STATUS.CREATED
    );
  })
);

/**
 * @route PUT /api/templates/:id
 * @desc Update a signature template
 * @access Private
 * @param {number} id - Template ID
 * @body {string} name - Template name (optional)
 * @body {string} html_content - Template HTML content (optional)
 * @body {boolean} is_default - Whether this is a default template (optional)
 * @body {string} description - Template description (optional)
 */
router.put(
  "/:id",
  authenticateToken,
  validateTenantAccess,
  validate({ 
    params: commonSchemas.id,
    body: templateSchemas.update
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if template exists and belongs to tenant
    const existingTemplate = await prisma.signatureTemplate.findFirst({
      where: {
        id: Number(id),
        tenant_id: req.tenant!.id
      }
    });

    if (!existingTemplate) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "Template not found",
        "TEMPLATE_NOT_FOUND"
      );
    }

    // If setting as default, unset any existing default templates
    if (updateData.is_default) {
      await prisma.signatureTemplate.updateMany({
        where: {
          tenant_id: req.tenant!.id,
          is_default: true,
          id: { not: Number(id) }
        },
        data: {
          is_default: false
        }
      });
    }

    const updatedTemplate = await prisma.signatureTemplate.update({
      where: {
        id: Number(id)
      },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        _count: {
          select: {
            template_assignments: true
          }
        }
      }
    });

    // Log activity
    await prisma.processingLog.create({
      data: {
        tenant_id: req.tenant!.id,
        user_id: req.user!.userId,
        email_id: `template_updated_${id}`,
        status: 'success'
      }
    });

    successResponse(res, updatedTemplate, "Template updated successfully");
  })
);

/**
 * @route DELETE /api/templates/:id
 * @desc Delete a signature template
 * @access Private (Admin only)
 * @param {number} id - Template ID
 */
router.delete(
  "/:id",
  authenticateToken,
  validateTenantAccess,
  requireAdmin,
  validate({ params: commonSchemas.id }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Check if template exists and belongs to tenant
    const existingTemplate = await prisma.signatureTemplate.findFirst({
      where: {
        id: Number(id),
        tenant_id: req.tenant!.id
      },
      include: {
        _count: {
          select: {
            template_assignments: true
          }
        }
      }
    });

    if (!existingTemplate) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "Template not found",
        "TEMPLATE_NOT_FOUND"
      );
    }

    // Check if template has assignments
    if (existingTemplate._count.template_assignments > 0) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        "Cannot delete template with active assignments. Remove assignments first.",
        "TEMPLATE_HAS_ASSIGNMENTS",
        { assignmentsCount: existingTemplate._count.template_assignments }
      );
    }

    await prisma.signatureTemplate.delete({
      where: {
        id: Number(id)
      }
    });

    // Log activity
    await prisma.processingLog.create({
      data: {
        tenant_id: req.tenant!.id,
        user_id: req.user!.userId,
        email_id: `template_deleted_${id}`,
        status: 'success'
      }
    });

    successResponse(res, null, "Template deleted successfully", HTTP_STATUS.NO_CONTENT);
  })
);

/**
 * @route POST /api/templates/:id/duplicate
 * @desc Duplicate an existing template
 * @access Private
 * @param {number} id - Template ID to duplicate
 * @body {string} name - New template name
 */
router.post(
  "/:id/duplicate",
  authenticateToken,
  validateTenantAccess,
  validate({ 
    params: commonSchemas.id,
    body: Joi.object({
      name: Joi.string().trim().min(1).max(100).required()
    })
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;

    // Get original template
    const originalTemplate = await prisma.signatureTemplate.findFirst({
      where: {
        id: Number(id),
        tenant_id: req.tenant!.id
      }
    });

    if (!originalTemplate) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "Template not found",
        "TEMPLATE_NOT_FOUND"
      );
    }

    // Create duplicate
    const duplicatedTemplate = await prisma.signatureTemplate.create({
      data: {
        name,
        html_content: originalTemplate.html_content,
        is_default: false, // Duplicates are never default
        description: originalTemplate.description ? `Copy of ${originalTemplate.description}` : null,
        tenant_id: req.tenant!.id,
        created_by: req.user!.userId
      },
      include: {
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    });

    successResponse(
      res,
      duplicatedTemplate,
      "Template duplicated successfully",
      HTTP_STATUS.CREATED
    );
  })
);

export default router;