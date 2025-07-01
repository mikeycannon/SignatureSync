import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { AuthService } from "../auth";
import { authenticateToken, validateTenantAccess, requireAdmin } from "../middleware/auth";
import { validate, userSchemas, commonSchemas } from "../middleware/validation";
import { asyncHandler, successResponse, paginatedResponse, ApiError, HTTP_STATUS } from "../middleware/error";
import Joi from "joi";

const router = Router();

/**
 * @route GET /api/users
 * @desc Get all users within the authenticated user's tenant
 * @access Private (Admin only)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 100)
 * @query {string} sort - Sort field (created_at, email, first_name, last_name)
 * @query {string} order - Sort order (asc, desc)
 * @query {string} q - Search query (searches name and email)
 * @query {string} filter - Filter users (all, active, admin, user)
 */
router.get(
  "/",
  authenticateToken,
  validateTenantAccess,
  requireAdmin,
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
        { first_name: { contains: q as string, mode: 'insensitive' } },
        { last_name: { contains: q as string, mode: 'insensitive' } },
        { email: { contains: q as string, mode: 'insensitive' } },
        { title: { contains: q as string, mode: 'insensitive' } },
        { department: { contains: q as string, mode: 'insensitive' } }
      ];
    }

    if (filter === 'admin') {
      where.role = 'admin';
    } else if (filter === 'user') {
      where.role = 'user';
    }

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    // Get users with pagination and sorting
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        title: true,
        department: true,
        created_at: true,
        updated_at: true,
        template_assignments: {
          include: {
            template: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            template_assignments: true,
            processing_logs: true
          }
        }
      },
      orderBy: {
        [sort as string]: order
      },
      skip: offset,
      take: Number(limit)
    });

    // Transform response to include user statistics
    const usersWithStats = users.map(user => ({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: `${user.first_name} ${user.last_name}`,
      role: user.role,
      title: user.title,
      department: user.department,
      created_at: user.created_at,
      updated_at: user.updated_at,
      stats: {
        templates_assigned: user._count.template_assignments,
        emails_processed: user._count.processing_logs
      },
      active_templates: user.template_assignments.map(assignment => ({
        id: assignment.template.id,
        name: assignment.template.name,
        assigned_at: assignment.assigned_at
      }))
    }));

    paginatedResponse(
      res,
      usersWithStats,
      total,
      Number(page),
      Number(limit),
      "Users retrieved successfully"
    );
  })
);

/**
 * @route GET /api/users/:id
 * @desc Get a specific user by ID within the tenant
 * @access Private (Admin only)
 * @param {number} id - User ID
 */
router.get(
  "/:id",
  authenticateToken,
  validateTenantAccess,
  requireAdmin,
  validate({ params: commonSchemas.id }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        id: Number(id),
        tenant_id: req.tenant!.id
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        title: true,
        department: true,
        token_version: true,
        created_at: true,
        updated_at: true,
        template_assignments: {
          include: {
            template: {
              select: {
                id: true,
                name: true,
                is_default: true
              }
            }
          },
          orderBy: {
            assigned_at: 'desc'
          }
        },
        created_templates: {
          select: {
            id: true,
            name: true,
            created_at: true
          }
        },
        processing_logs: {
          select: {
            id: true,
            email_id: true,
            status: true,
            processed_at: true
          },
          orderBy: {
            processed_at: 'desc'
          },
          take: 10
        }
      }
    });

    if (!user) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "User not found",
        "USER_NOT_FOUND"
      );
    }

    successResponse(res, user, "User retrieved successfully");
  })
);

/**
 * @route POST /api/users
 * @desc Create a new user (invite user to tenant)
 * @access Private (Admin only)
 * @body {string} email - User email
 * @body {string} firstName - User first name
 * @body {string} lastName - User last name
 * @body {string} role - User role (admin, user)
 * @body {string} title - User title (optional)
 * @body {string} department - User department (optional)
 * @body {string} password - Temporary password (optional)
 */
router.post(
  "/",
  authenticateToken,
  validateTenantAccess,
  requireAdmin,
  validate({ body: userSchemas.create }),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, firstName, lastName, role = 'user', title, department, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        "User with this email already exists",
        "USER_EXISTS"
      );
    }

    // Generate temporary password if not provided
    const userPassword = password || Math.random().toString(36).slice(-12);

    const user = await AuthService.createUser({
      tenant_id: req.tenant!.id,
      email: email.toLowerCase(),
      password: userPassword,
      role,
      first_name: firstName,
      last_name: lastName,
      title: title || null,
      department: department || null
    });

    // If there's a default template, auto-assign it
    const defaultTemplate = await prisma.signatureTemplate.findFirst({
      where: {
        tenant_id: req.tenant!.id,
        is_default: true
      }
    });

    if (defaultTemplate) {
      await prisma.templateAssignment.create({
        data: {
          user_id: user.id,
          template_id: defaultTemplate.id
        }
      });
    }

    // Log activity
    await prisma.processingLog.create({
      data: {
        tenant_id: req.tenant!.id,
        user_id: req.user!.userId,
        email_id: `user_created_${user.id}`,
        status: 'success'
      }
    });

    // Return user without password
    const { password_hash, token_version, ...userResponse } = user;

    successResponse(
      res,
      {
        ...userResponse,
        temporaryPassword: password ? undefined : userPassword // Only include if auto-generated
      },
      "User created successfully",
      HTTP_STATUS.CREATED
    );
  })
);

/**
 * @route PUT /api/users/:id
 * @desc Update user information
 * @access Private (Admin or self)
 * @param {number} id - User ID
 * @body {string} firstName - User first name (optional)
 * @body {string} lastName - User last name (optional)
 * @body {string} role - User role (optional, admin only)
 * @body {string} title - User title (optional)
 * @body {string} department - User department (optional)
 * @body {string} password - New password (optional)
 */
router.put(
  "/:id",
  authenticateToken,
  validateTenantAccess,
  validate({ 
    params: commonSchemas.id,
    body: userSchemas.update
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    const isAdmin = req.user!.role === 'admin';
    const isSelf = req.user!.userId === Number(id);

    // Check permissions
    if (!isAdmin && !isSelf) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        "You can only update your own profile",
        "INSUFFICIENT_PERMISSIONS"
      );
    }

    // Only admins can change roles
    if (updateData.role && !isAdmin) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        "Only administrators can change user roles",
        "ROLE_CHANGE_FORBIDDEN"
      );
    }

    // Check if user exists and belongs to tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        id: Number(id),
        tenant_id: req.tenant!.id
      }
    });

    if (!existingUser) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "User not found",
        "USER_NOT_FOUND"
      );
    }

    // Prepare update data
    const dataToUpdate: any = {
      first_name: updateData.firstName,
      last_name: updateData.lastName,
      title: updateData.title,
      department: updateData.department
    };

    // Only include role if user is admin
    if (isAdmin && updateData.role) {
      dataToUpdate.role = updateData.role;
    }

    // Hash password if provided
    if (updateData.password) {
      dataToUpdate.password_hash = await AuthService.hashPassword(updateData.password);
      // Increment token version to invalidate existing tokens
      dataToUpdate.token_version = { increment: 1 };
    }

    // Remove undefined values
    Object.keys(dataToUpdate).forEach(key => {
      if (dataToUpdate[key] === undefined) {
        delete dataToUpdate[key];
      }
    });

    const updatedUser = await prisma.user.update({
      where: {
        id: Number(id)
      },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        title: true,
        department: true,
        created_at: true,
        updated_at: true
      }
    });

    // Log activity
    await prisma.processingLog.create({
      data: {
        tenant_id: req.tenant!.id,
        user_id: req.user!.userId,
        email_id: `user_updated_${id}`,
        status: 'success'
      }
    });

    successResponse(res, updatedUser, "User updated successfully");
  })
);

/**
 * @route DELETE /api/users/:id
 * @desc Delete a user (admin only)
 * @access Private (Admin only)
 * @param {number} id - User ID
 */
router.delete(
  "/:id",
  authenticateToken,
  validateTenantAccess,
  requireAdmin,
  validate({ params: commonSchemas.id }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user!.userId === Number(id)) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        "You cannot delete your own account",
        "SELF_DELETE_FORBIDDEN"
      );
    }

    // Check if user exists and belongs to tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        id: Number(id),
        tenant_id: req.tenant!.id
      },
      include: {
        _count: {
          select: {
            created_templates: true,
            template_assignments: true
          }
        }
      }
    });

    if (!existingUser) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "User not found",
        "USER_NOT_FOUND"
      );
    }

    // Check for dependencies
    if (existingUser._count.created_templates > 0) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        "Cannot delete user who has created templates. Transfer ownership first.",
        "USER_HAS_TEMPLATES",
        { templatesCount: existingUser._count.created_templates }
      );
    }

    // Delete user (cascade will handle assignments and logs)
    await prisma.user.delete({
      where: {
        id: Number(id)
      }
    });

    // Log activity
    await prisma.processingLog.create({
      data: {
        tenant_id: req.tenant!.id,
        user_id: req.user!.userId,
        email_id: `user_deleted_${id}`,
        status: 'success'
      }
    });

    successResponse(res, null, "User deleted successfully", HTTP_STATUS.NO_CONTENT);
  })
);

/**
 * @route POST /api/users/:id/reset-password
 * @desc Reset user password (admin only)
 * @access Private (Admin only)
 * @param {number} id - User ID
 * @body {string} newPassword - New password (optional, will generate if not provided)
 */
router.post(
  "/:id/reset-password",
  authenticateToken,
  validateTenantAccess,
  requireAdmin,
  validate({ 
    params: commonSchemas.id,
    body: Joi.object({
      newPassword: Joi.string().min(8).max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .optional()
    })
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Check if user exists and belongs to tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        id: Number(id),
        tenant_id: req.tenant!.id
      }
    });

    if (!existingUser) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "User not found",
        "USER_NOT_FOUND"
      );
    }

    // Generate password if not provided
    const password = newPassword || Math.random().toString(36).slice(-12);
    const hashedPassword = await AuthService.hashPassword(password);

    // Update password and increment token version
    await prisma.user.update({
      where: {
        id: Number(id)
      },
      data: {
        password_hash: hashedPassword,
        token_version: { increment: 1 }
      }
    });

    // Log activity
    await prisma.processingLog.create({
      data: {
        tenant_id: req.tenant!.id,
        user_id: req.user!.userId,
        email_id: `password_reset_${id}`,
        status: 'success'
      }
    });

    successResponse(
      res,
      {
        message: "Password reset successfully",
        temporaryPassword: newPassword ? undefined : password
      },
      "Password reset successfully"
    );
  })
);

/**
 * @route GET /api/users/me
 * @desc Get current user profile
 * @access Private
 */
router.get(
  "/me",
  authenticateToken,
  validateTenantAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user!.userId
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        title: true,
        department: true,
        created_at: true,
        template_assignments: {
          include: {
            template: {
              select: {
                id: true,
                name: true,
                html_content: true,
                is_default: true
              }
            }
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            domain: true,
            subscription_plan: true
          }
        }
      }
    });

    if (!user) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "User not found",
        "USER_NOT_FOUND"
      );
    }

    successResponse(res, user, "User profile retrieved successfully");
  })
);

export default router;