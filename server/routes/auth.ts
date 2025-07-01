import { Router, Request, Response } from "express";
import { z } from "zod";
import { AuthService } from "../auth";
import { prisma } from "../prisma";
import { authRateLimit } from "../middleware/auth";

const router = Router();

// Validation schemas
const registerSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
  domain: z.string().min(1, "Domain is required").regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid domain format"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// Register new organization and admin user
router.post("/register", authRateLimit(3, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { organizationName, domain, firstName, lastName, email, password } = validatedData;

    // Check if tenant domain already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { domain }
    });

    if (existingTenant) {
      return res.status(400).json({
        error: "Domain already taken",
        code: "DOMAIN_EXISTS"
      });
    }

    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        error: "Email already registered",
        code: "EMAIL_EXISTS"
      });
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: organizationName,
        domain: domain.toLowerCase(),
        subscription_plan: 'starter'
      }
    });

    // Create admin user
    const user = await AuthService.createUser({
      tenant_id: tenant.id,
      email: email.toLowerCase(),
      password,
      role: 'admin',
      first_name: firstName,
      last_name: lastName,
      title: 'Administrator',
      department: 'Management'
    });

    // Generate tokens
    const { accessToken, refreshToken } = await AuthService.generateTokensForUser(user);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: "Registration successful",
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        title: user.title,
        department: user.department,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain,
        plan: tenant.subscription_plan,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: error.errors
      });
    }

    console.error("Registration error:", error);
    res.status(500).json({
      error: "Failed to register user",
      code: "REGISTRATION_ERROR"
    });
  }
});

// User login
router.post("/login", authRateLimit(5, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Authenticate user
    const user = await AuthService.authenticateUser(email.toLowerCase(), password);
    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS"
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = await AuthService.generateTokensForUser(user);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: "Login successful",
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        title: user.title,
        department: user.department,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        domain: user.tenant.domain,
        plan: user.tenant.subscription_plan,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: error.errors
      });
    }

    console.error("Login error:", error);
    res.status(500).json({
      error: "Failed to login",
      code: "LOGIN_ERROR"
    });
  }
});

// Refresh access token
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    // Try to get refresh token from cookie first, then body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        error: "Refresh token required",
        code: "REFRESH_TOKEN_MISSING"
      });
    }

    const newAccessToken = await AuthService.refreshAccessToken(refreshToken);
    if (!newAccessToken) {
      // Clear invalid refresh token cookie
      res.clearCookie('refreshToken');
      
      return res.status(403).json({
        error: "Invalid or expired refresh token",
        code: "INVALID_REFRESH_TOKEN"
      });
    }

    res.json({
      message: "Token refreshed successfully",
      accessToken: newAccessToken
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      error: "Failed to refresh token",
      code: "REFRESH_ERROR"
    });
  }
});

// Logout (single device)
router.post("/logout", async (req: Request, res: Response) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    res.json({
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "Failed to logout",
      code: "LOGOUT_ERROR"
    });
  }
});

// Logout all devices
router.post("/logout-all", async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (refreshToken) {
      const payload = AuthService.verifyRefreshToken(refreshToken);
      if (payload) {
        // Revoke all refresh tokens for this user
        await AuthService.revokeUserTokens(payload.userId);
      }
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    res.json({
      message: "Logged out from all devices successfully"
    });
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({
      error: "Failed to logout from all devices",
      code: "LOGOUT_ALL_ERROR"
    });
  }
});

// Get current user profile
router.get("/me", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

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

    const user = await AuthService.getUserById(payload.userId);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        title: user.title,
        department: user.department,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        domain: user.tenant.domain,
        plan: user.tenant.subscription_plan,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      error: "Failed to get user",
      code: "GET_USER_ERROR"
    });
  }
});

export default router;