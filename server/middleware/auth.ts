import { Request, Response, NextFunction } from "express";
import { AuthService, AuthTokenPayload } from "../auth";
import { prisma } from "../prisma";

// Extend Express Request type to include user and tenant
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
      tenant?: any;
    }
  }
}

// Authentication middleware - verifies JWT access token
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: "Access token required",
      code: "TOKEN_MISSING"
    });
  }

  const payload = AuthService.verifyAccessToken(token);
  if (!payload) {
    return res.status(403).json({
      error: "Invalid or expired access token",
      code: "TOKEN_INVALID"
    });
  }

  req.user = payload;
  next();
};

// Tenant isolation middleware - ensures user belongs to valid tenant
export const validateTenantAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        code: "AUTH_REQUIRED"
      });
    }

    // Get user with tenant information
    const user = await AuthService.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    if (!user.tenant) {
      return res.status(404).json({
        error: "Tenant not found",
        code: "TENANT_NOT_FOUND"
      });
    }

    // Verify token tenant matches user's tenant
    if (user.tenant_id !== req.user.tenantId) {
      return res.status(403).json({
        error: "Tenant access denied",
        code: "TENANT_MISMATCH"
      });
    }

    // Add tenant to request
    req.tenant = user.tenant;
    next();
  } catch (error) {
    console.error("Tenant validation error:", error);
    res.status(500).json({
      error: "Failed to validate tenant access",
      code: "TENANT_VALIDATION_ERROR"
    });
  }
};

// Admin role middleware - requires admin role within tenant
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
      code: "AUTH_REQUIRED"
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: "Admin access required",
      code: "ADMIN_REQUIRED"
    });
  }

  next();
};

// Optional authentication middleware - doesn't fail if no token
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const payload = AuthService.verifyAccessToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
};

// Rate limiting middleware for auth endpoints
const authRateLimits = new Map<string, { count: number; resetTime: number }>();

export const authRateLimit = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || 'unknown';
    const now = Date.now();
    
    const record = authRateLimits.get(identifier);
    
    if (!record || now > record.resetTime) {
      authRateLimits.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    if (record.count >= maxAttempts) {
      return res.status(429).json({
        error: "Too many authentication attempts",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }
    
    record.count++;
    next();
  };
};