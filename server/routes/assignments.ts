import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { authenticateToken, validateTenantAccess, requireAdmin } from "../middleware/auth";
import { validate, assignmentSchemas, commonSchemas } from "../middleware/validation";
import { asyncHandler, successResponse, paginatedResponse, ApiError, HTTP_STATUS } from "../middleware/error";
import Joi from "joi";

const router = Router();

/**
 * @route GET /api/assignments
 * @desc Get all template assignments within the authenticated user's tenant
 * @access Private (Admin only)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 100)
 * @query {string} sort - Sort field (assigned_at, user_name, template_name)
 * @query {string} order - Sort order (asc, desc)
 * @query {number} user_id - Filter by user ID
 * @query {number} template_id - Filter by template ID
 */
router.get(
  "/",
  authenticateToken,
  validateTenantAccess,
  requireAdmin,
  validate({ 
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      sort: Joi.string().valid('assigned_at', 'user_name', 'template_name').default('assigned_at'),
      order: Joi.string().valid('asc', 'desc').default('desc'),
      user_id: Joi.number().integer().positive().optional(),
      template_id: Joi.number().integer().positive().optional()
    })
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'assigned_at', 
      order = 'desc',
      user_id,
      template_id 
    } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Build where conditions - ensure tenant isolation through joins
    const where: any = {
      user: {
        tenant_id: req.tenant!.id
      }
    };

    if (user_id) {
      where.user_id = Number(user_id);
    }

    if (template_id) {
      where.template_id = Number(template_id);
    }

    // Get total count for pagination
    const total = await prisma.templateAssignment.count({ where });

    // Define orderBy based on sort parameter
    let orderBy: any = {};
    switch (sort) {
      case 'user_name':
        orderBy = {
          user: {
            first_name: order
          }
        };
        break;
      case 'template_name':
        orderBy = {
          template: {
            name: order
          }
        };
        break;
      default:
        orderBy = {
          [sort as string]: order
        };
    }

    // Get assignments with related data
    const assignments = await prisma.templateAssignment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            title: true,
            department: true,
            role: true
          }
        },
        template: {
          select: {
            id: true,
            name: true,
            is_default: true,
            created_at: true,
            creator: {
              select: {
                id: true,
                first_name: true,
                last_name: true
              }
            }
          }
        }
      },
      orderBy,
      skip: offset,
      take: Number(limit)
    });

    // Transform response
    const assignmentsWithDetails = assignments.map(assignment => ({
      id: assignment.id,
      assigned_at: assignment.assigned_at,
      user: {
        ...assignment.user,
        full_name: `${assignment.user.first_name} ${assignment.user.last_name}`
      },
      template: assignment.template
    }));

    paginatedResponse(
      res,
      assignmentsWithDetails,
      total,
      Number(page),
      Number(limit),
      "Template assignments retrieved successfully"
    );
  })
);

/**
 * @route GET /api/assignments/:id
 * @desc Get a specific template assignment by ID
 * @access Private (Admin only)
 * @param {number} id - Assignment ID
 */
router.get(
  "/:id",
  authenticateToken,
  validateTenantAccess,
  requireAdmin,
  validate({ params: commonSchemas.id }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const assignment = await prisma.templateAssignment.findFirst({
      where: {
        id: Number(id),
        user: {
          tenant_id: req.tenant!.id
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            title: true,
            department: true,
            role: true
          }
        },
        template: {
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
        }
      }
    });

    if (!assignment) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "Template assignment not found",
        "ASSIGNMENT_NOT_FOUND"
      );
    }

    successResponse(res, assignment, "Template assignment retrieved successfully");
  })
);

/**
 * @route POST /api/assignments
 * @desc Create a new template assignment (assign template to user)
 * @access Private (Admin only)
 * @body {number} user_id - User ID to assign template to
 * @body {number} template_id - Template ID to assign
 */
router.post(
  "/",
  authenticateToken,
  validateTenantAccess,
  requireAdmin,
  validate({ body: assignmentSchemas.create }),
  asyncHandler(async (req: Request, res: Response) => {
    const { user_id, template_id } = req.body;

    // Verify user belongs to tenant
    const user = await prisma.user.findFirst({
      where: {
        id: user_id,
        tenant_id: req.tenant!.id
      }
    });

    if (!user) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "User not found in your organization",
        "USER_NOT_FOUND"
      );
    }

    // Verify template belongs to tenant
    const template = await prisma.signatureTemplate.findFirst({
      where: {
        id: template_id,
        tenant_id: req.tenant!.id
      }
    });

    if (!template) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "Template not found in your organization",
        "TEMPLATE_NOT_FOUND"
      );
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.templateAssignment.findFirst({
      where: {
        user_id,
        template_id
      }
    });

    if (existingAssignment) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        "Template is already assigned to this user",
        "ASSIGNMENT_EXISTS"
      );
    }

    // Create assignment
    const assignment = await prisma.templateAssignment.create({
      data: {
        user_id,
        template_id
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            title: true,
            department: true
          }
        },
        template: {
          select: {
            id: true,
            name: true,
            is_default: true
          }
        }
      }
    });

    // Log activity
    await prisma.processingLog.create({
      data: {
        tenant_id: req.tenant!.id,
        user_id: req.user!.userId,
        email_id: `assignment_created_${assignment.id}`,
        status: 'success'
      }
    });

    successResponse(
      res,
      assignment,
      "Template assigned successfully",
      HTTP_STATUS.CREATED
    );
  })
);

/**
 * @route POST /api/assignments/bulk
 * @desc Bulk assign template to multiple users
 * @access Private (Admin only)
 * @body {number[]} user_ids - Array of user IDs to assign template to
 * @body {number} template_id - Template ID to assign
 */
router.post(
  "/bulk",
  authenticateToken,
  validateTenantAccess,
  requireAdmin,
  validate({ body: assignmentSchemas.bulkCreate }),
  asyncHandler(async (req: Request, res: Response) => {
    const { user_ids, template_id } = req.body;

    // Verify template belongs to tenant
    const template = await prisma.signatureTemplate.findFirst({
      where: {
        id: template_id,
        tenant_id: req.tenant!.id
      }
    });

    if (!template) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "Template not found in your organization",
        "TEMPLATE_NOT_FOUND"
      );
    }

    // Verify all users belong to tenant
    const users = await prisma.user.findMany({
      where: {
        id: { in: user_ids },
        tenant_id: req.tenant!.id
      }
    });

    if (users.length !== user_ids.length) {
      const foundUserIds = users.map(u => u.id);
      const missingUserIds = user_ids.filter(id => !foundUserIds.includes(id));
      
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Some users not found in your organization",
        "USERS_NOT_FOUND",
        { missingUserIds }
      );
    }

    // Get existing assignments to avoid duplicates
    const existingAssignments = await prisma.templateAssignment.findMany({
      where: {
        user_id: { in: user_ids },
        template_id
      }
    });

    const existingUserIds = existingAssignments.map(a => a.user_id);
    const newUserIds = user_ids.filter(id => !existingUserIds.includes(id));

    if (newUserIds.length === 0) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        "Template is already assigned to all specified users",
        "ALL_ASSIGNMENTS_EXIST"
      );
    }

    // Create bulk assignments
    const assignmentData = newUserIds.map(user_id => ({
      user_id,
      template_id
    }));

    await prisma.templateAssignment.createMany({
      data: assignmentData
    });

    // Get the created assignments with details
    const createdAssignments = await prisma.templateAssignment.findMany({
      where: {
        user_id: { in: newUserIds },
        template_id
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true
          }
        },
        template: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Log activity
    await prisma.processingLog.create({
      data: {
        tenant_id: req.tenant!.id,
        user_id: req.user!.userId,
        email_id: `bulk_assignment_${template_id}`,
        status: 'success'
      }
    });

    successResponse(
      res,
      {
        created: createdAssignments,
        skipped: existingUserIds.length,
        total: user_ids.length
      },
      `Template assigned to ${newUserIds.length} users successfully`,
      HTTP_STATUS.CREATED
    );
  })
);

/**
 * @route DELETE /api/assignments/:id
 * @desc Remove a template assignment
 * @access Private (Admin only)
 * @param {number} id - Assignment ID
 */
router.delete(
  "/:id",
  authenticateToken,
  validateTenantAccess,
  requireAdmin,
  validate({ params: commonSchemas.id }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Check if assignment exists and user belongs to tenant
    const assignment = await prisma.templateAssignment.findFirst({
      where: {
        id: Number(id),
        user: {
          tenant_id: req.tenant!.id
        }
      },
      include: {
        user: {
          select: { first_name: true, last_name: true, email: true }
        },
        template: {
          select: { name: true }
        }
      }
    });

    if (!assignment) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "Template assignment not found",
        "ASSIGNMENT_NOT_FOUND"
      );
    }

    await prisma.templateAssignment.delete({
      where: {
        id: Number(id)
      }
    });

    // Log activity
    await prisma.processingLog.create({
      data: {
        tenant_id: req.tenant!.id,
        user_id: req.user!.userId,
        email_id: `assignment_deleted_${id}`,
        status: 'success'
      }
    });

    successResponse(
      res,
      {
        message: `Template "${assignment.template.name}" unassigned from ${assignment.user.first_name} ${assignment.user.last_name}`
      },
      "Template assignment removed successfully",
      HTTP_STATUS.NO_CONTENT
    );
  })
);

/**
 * @route DELETE /api/assignments/bulk
 * @desc Bulk remove template assignments
 * @access Private (Admin only)
 * @body {number[]} assignment_ids - Array of assignment IDs to remove
 */
router.delete(
  "/bulk",
  authenticateToken,
  validateTenantAccess,
  requireAdmin,
  validate({ 
    body: Joi.object({
      assignment_ids: Joi.array().items(Joi.number().integer().positive()).min(1).max(50).required()
    })
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { assignment_ids } = req.body;

    // Verify all assignments belong to tenant
    const assignments = await prisma.templateAssignment.findMany({
      where: {
        id: { in: assignment_ids },
        user: {
          tenant_id: req.tenant!.id
        }
      }
    });

    if (assignments.length !== assignment_ids.length) {
      const foundIds = assignments.map(a => a.id);
      const missingIds = assignment_ids.filter(id => !foundIds.includes(id));
      
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Some assignments not found",
        "ASSIGNMENTS_NOT_FOUND",
        { missingIds }
      );
    }

    // Delete assignments
    await prisma.templateAssignment.deleteMany({
      where: {
        id: { in: assignment_ids }
      }
    });

    // Log activity
    await prisma.processingLog.create({
      data: {
        tenant_id: req.tenant!.id,
        user_id: req.user!.userId,
        email_id: `bulk_unassignment_${assignment_ids.length}`,
        status: 'success'
      }
    });

    successResponse(
      res,
      { removed: assignment_ids.length },
      `${assignment_ids.length} template assignments removed successfully`,
      HTTP_STATUS.NO_CONTENT
    );
  })
);

/**
 * @route GET /api/assignments/user/:userId
 * @desc Get all template assignments for a specific user
 * @access Private (Admin or self)
 * @param {number} userId - User ID
 */
router.get(
  "/user/:userId",
  authenticateToken,
  validateTenantAccess,
  validate({ params: Joi.object({ userId: Joi.number().integer().positive().required() }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const isAdmin = req.user!.role === 'admin';
    const isSelf = req.user!.userId === Number(userId);

    // Check permissions
    if (!isAdmin && !isSelf) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        "You can only view your own assignments",
        "INSUFFICIENT_PERMISSIONS"
      );
    }

    // Verify user belongs to tenant
    const user = await prisma.user.findFirst({
      where: {
        id: Number(userId),
        tenant_id: req.tenant!.id
      }
    });

    if (!user) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "User not found",
        "USER_NOT_FOUND"
      );
    }

    const assignments = await prisma.templateAssignment.findMany({
      where: {
        user_id: Number(userId)
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            html_content: true,
            is_default: true,
            created_at: true,
            updated_at: true
          }
        }
      },
      orderBy: {
        assigned_at: 'desc'
      }
    });

    successResponse(
      res,
      assignments,
      "User template assignments retrieved successfully"
    );
  })
);

/**
 * @route GET /api/assignments/template/:templateId
 * @desc Get all users assigned to a specific template
 * @access Private (Admin only)
 * @param {number} templateId - Template ID
 */
router.get(
  "/template/:templateId",
  authenticateToken,
  validateTenantAccess,
  requireAdmin,
  validate({ params: Joi.object({ templateId: Joi.number().integer().positive().required() }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const { templateId } = req.params;

    // Verify template belongs to tenant
    const template = await prisma.signatureTemplate.findFirst({
      where: {
        id: Number(templateId),
        tenant_id: req.tenant!.id
      }
    });

    if (!template) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "Template not found",
        "TEMPLATE_NOT_FOUND"
      );
    }

    const assignments = await prisma.templateAssignment.findMany({
      where: {
        template_id: Number(templateId)
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            title: true,
            department: true,
            role: true
          }
        }
      },
      orderBy: {
        assigned_at: 'desc'
      }
    });

    successResponse(
      res,
      {
        template: {
          id: template.id,
          name: template.name
        },
        assignments: assignments.map(assignment => ({
          id: assignment.id,
          assigned_at: assignment.assigned_at,
          user: {
            ...assignment.user,
            full_name: `${assignment.user.first_name} ${assignment.user.last_name}`
          }
        }))
      },
      "Template assignments retrieved successfully"
    );
  })
);

export default router;