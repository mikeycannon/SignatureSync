import { Request, Response, NextFunction } from "express";
import Joi from "joi";

/**
 * Validation middleware factory
 * Creates middleware to validate request data against Joi schemas
 */
export const validate = (schema: {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) {
        errors.push(`Body: ${error.message}`);
      }
    }

    // Validate request params
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) {
        errors.push(`Params: ${error.message}`);
      }
    }

    // Validate request query
    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) {
        errors.push(`Query: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: errors
      });
    }

    next();
  };
};

/**
 * Common validation schemas
 */
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid('created_at', 'updated_at', 'name', 'email').default('created_at'),
  order: Joi.string().valid('asc', 'desc').default('desc')
});

export const commonSchemas = {
  // ID parameter validation
  id: Joi.object({
    id: Joi.number().integer().positive().required()
  }),

  // Pagination query validation
  pagination: paginationSchema,

  // Search query validation
  search: Joi.object({
    q: Joi.string().min(1).max(100),
    filter: Joi.string().valid('active', 'inactive', 'all').default('all')
  }).concat(paginationSchema)
};

/**
 * Auth validation schemas
 */
export const authSchemas = {
  register: Joi.object({
    organizationName: Joi.string().trim().min(2).max(100).required()
      .messages({
        'string.min': 'Organization name must be at least 2 characters',
        'string.max': 'Organization name cannot exceed 100 characters',
        'any.required': 'Organization name is required'
      }),
    domain: Joi.string().trim().min(3).max(50)
      .pattern(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/)
      .required()
      .messages({
        'string.pattern.base': 'Please enter a valid domain (e.g., company.com)',
        'any.required': 'Domain is required'
      }),
    firstName: Joi.string().trim().min(1).max(50).required()
      .messages({
        'string.min': 'First name is required',
        'string.max': 'First name cannot exceed 50 characters'
      }),
    lastName: Joi.string().trim().min(1).max(50).required()
      .messages({
        'string.min': 'Last name is required',
        'string.max': 'Last name cannot exceed 50 characters'
      }),
    email: Joi.string().email().trim().lowercase().required()
      .messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string().min(8).max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
        'any.required': 'Password is required'
      }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Password confirmation is required'
      })
  }),

  login: Joi.object({
    email: Joi.string().email().trim().lowercase().required()
      .messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string().min(1).required()
      .messages({
        'string.min': 'Password is required',
        'any.required': 'Password is required'
      })
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().optional()
  })
};

/**
 * Template validation schemas
 */
export const templateSchemas = {
  create: Joi.object({
    name: Joi.string().trim().min(1).max(100).required()
      .messages({
        'string.min': 'Template name is required',
        'string.max': 'Template name cannot exceed 100 characters'
      }),
    html_content: Joi.string().min(1).max(50000).required()
      .messages({
        'string.min': 'Template content is required',
        'string.max': 'Template content is too large (max 50KB)'
      }),
    is_default: Joi.boolean().default(false),
    description: Joi.string().trim().max(500).optional()
      .messages({
        'string.max': 'Description cannot exceed 500 characters'
      })
  }),

  update: Joi.object({
    name: Joi.string().trim().min(1).max(100).optional(),
    html_content: Joi.string().min(1).max(50000).optional(),
    is_default: Joi.boolean().optional(),
    description: Joi.string().trim().max(500).optional()
  }).min(1)
};

/**
 * User validation schemas
 */
export const userSchemas = {
  create: Joi.object({
    email: Joi.string().email().trim().lowercase().required()
      .messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
      }),
    firstName: Joi.string().trim().min(1).max(50).required(),
    lastName: Joi.string().trim().min(1).max(50).required(),
    role: Joi.string().valid('admin', 'user').default('user'),
    title: Joi.string().trim().max(100).optional(),
    department: Joi.string().trim().max(100).optional(),
    password: Joi.string().min(8).max(128).optional()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      })
  }),

  update: Joi.object({
    firstName: Joi.string().trim().min(1).max(50).optional(),
    lastName: Joi.string().trim().min(1).max(50).optional(),
    role: Joi.string().valid('admin', 'user').optional(),
    title: Joi.string().trim().max(100).optional(),
    department: Joi.string().trim().max(100).optional(),
    password: Joi.string().min(8).max(128).optional()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  }).min(1)
};

/**
 * Assignment validation schemas
 */
export const assignmentSchemas = {
  create: Joi.object({
    user_id: Joi.number().integer().positive().required(),
    template_id: Joi.number().integer().positive().required()
  }),

  bulkCreate: Joi.object({
    user_ids: Joi.array().items(Joi.number().integer().positive()).min(1).max(50).required(),
    template_id: Joi.number().integer().positive().required()
  })
};

/**
 * Upload validation schemas
 */
export const uploadSchemas = {
  query: Joi.object({
    type: Joi.string().valid('logo', 'image', 'avatar').default('image'),
    resize: Joi.boolean().default(false),
    width: Joi.number().integer().min(50).max(2000).when('resize', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    height: Joi.number().integer().min(50).max(2000).when('resize', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  })
};