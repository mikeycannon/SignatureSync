import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertTenantSchema, 
  loginSchema, 
  insertSignatureTemplateSchema,
  insertAssetSchema,
  type AuthTokenPayload 
} from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";

// Middleware to extract tenant context from JWT
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const payload = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    const user = await storage.getUser(payload.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid or inactive user" });
    }

    req.user = user;
    req.tenantId = payload.tenantId;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Tenant isolation middleware
const requireTenantAccess = (req: any, res: any, next: any) => {
  const resourceTenantId = parseInt(req.params.tenantId) || req.body.tenantId || req.tenantId;
  
  if (req.tenantId !== resourceTenantId) {
    return res.status(403).json({ error: "Access denied to this tenant resource" });
  }
  
  next();
};

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { tenantName, tenantSlug, ...userData } = req.body;
      
      // Validate tenant data
      const tenantData = insertTenantSchema.parse({
        name: tenantName,
        slug: tenantSlug,
      });

      // Validate user data
      const validatedUserData = insertUserSchema.parse(userData);

      // Check if tenant slug is available
      const existingTenant = await storage.getTenantBySlug(tenantData.slug);
      if (existingTenant) {
        return res.status(400).json({ error: "Tenant slug already taken" });
      }

      // Check if user email is available
      const existingUser = await storage.getUserByEmail(validatedUserData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Create tenant first
      const tenant = await storage.createTenant(tenantData);

      // Create admin user for tenant
      const user = await storage.createUser({
        ...validatedUserData,
        tenantId: tenant.id,
        role: "admin",
      });

      // Generate JWT token
      const tokenPayload: AuthTokenPayload = {
        userId: user.id,
        tenantId: tenant.id,
        email: user.email,
        role: user.role,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '30d' });

      // Log activity
      await storage.createActivity({
        tenantId: tenant.id,
        userId: user.id,
        action: "registered",
        entityType: "user",
        entityId: user.id,
        metadata: { email: user.email },
      });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          plan: tenant.plan,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await storage.validateUserCredentials(email, password);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const tenant = await storage.getTenant(user.tenantId);
      if (!tenant) {
        return res.status(500).json({ error: "Tenant not found" });
      }

      const tokenPayload: AuthTokenPayload = {
        userId: user.id,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '30d' });

      // Log activity
      await storage.createActivity({
        tenantId: user.tenantId,
        userId: user.id,
        action: "logged_in",
        entityType: "user",
        entityId: user.id,
        metadata: {},
      });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          plan: tenant.plan,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: any, res) => {
    const tenant = await storage.getTenant(req.user.tenantId);
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        avatar: req.user.avatar,
      },
      tenant: {
        id: tenant?.id,
        name: tenant?.name,
        slug: tenant?.slug,
        plan: tenant?.plan,
      },
    });
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", requireAuth, async (req: any, res) => {
    try {
      const stats = await storage.getTenantStats(req.tenantId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/dashboard/recent-activity", requireAuth, async (req: any, res) => {
    try {
      const activities = await storage.getActivitiesByTenant(req.tenantId, 10);
      
      // Enrich activities with user information
      const enrichedActivities = await Promise.all(
        activities.map(async (activity) => {
          const user = await storage.getUser(activity.userId);
          return {
            ...activity,
            user: user ? {
              firstName: user.firstName,
              lastName: user.lastName,
              avatar: user.avatar,
            } : null,
          };
        })
      );

      res.json(enrichedActivities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent activity" });
    }
  });

  // Signature template routes
  app.get("/api/templates", requireAuth, async (req: any, res) => {
    try {
      const templates = await storage.getSignatureTemplatesByTenant(req.tenantId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/:id", requireAuth, async (req: any, res) => {
    try {
      const template = await storage.getSignatureTemplate(parseInt(req.params.id));
      if (!template || template.tenantId !== req.tenantId) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  app.post("/api/templates", requireAuth, async (req: any, res) => {
    try {
      const templateData = insertSignatureTemplateSchema.parse(req.body);
      
      const template = await storage.createSignatureTemplate({
        ...templateData,
        tenantId: req.tenantId,
        createdBy: req.user.id,
      });

      // Log activity
      await storage.createActivity({
        tenantId: req.tenantId,
        userId: req.user.id,
        action: "created",
        entityType: "template",
        entityId: template.id,
        metadata: { name: template.name },
      });

      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  app.put("/api/templates/:id", requireAuth, async (req: any, res) => {
    try {
      const templateData = insertSignatureTemplateSchema.partial().parse(req.body);
      
      const existing = await storage.getSignatureTemplate(parseInt(req.params.id));
      if (!existing || existing.tenantId !== req.tenantId) {
        return res.status(404).json({ error: "Template not found" });
      }

      const template = await storage.updateSignatureTemplate(parseInt(req.params.id), templateData);

      // Log activity
      await storage.createActivity({
        tenantId: req.tenantId,
        userId: req.user.id,
        action: "updated",
        entityType: "template",
        entityId: parseInt(req.params.id),
        metadata: { name: template?.name },
      });

      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  app.delete("/api/templates/:id", requireAuth, async (req: any, res) => {
    try {
      const existing = await storage.getSignatureTemplate(parseInt(req.params.id));
      if (!existing || existing.tenantId !== req.tenantId) {
        return res.status(404).json({ error: "Template not found" });
      }

      const success = await storage.deleteSignatureTemplate(parseInt(req.params.id));

      if (success) {
        // Log activity
        await storage.createActivity({
          tenantId: req.tenantId,
          userId: req.user.id,
          action: "deleted",
          entityType: "template",
          entityId: parseInt(req.params.id),
          metadata: { name: existing.name },
        });
      }

      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // Team management routes
  app.get("/api/team", requireAuth, async (req: any, res) => {
    try {
      const users = await storage.getUsersByTenant(req.tenantId);
      const safeUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt,
      }));
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  app.post("/api/team/invite", requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Only admins can invite users" });
      }

      const userData = insertUserSchema.parse({
        ...req.body,
        password: "temp-password", // In real app, send invitation email
        confirmPassword: "temp-password",
      });

      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const user = await storage.createUser({
        ...userData,
        tenantId: req.tenantId,
        role: userData.role || "member",
      });

      // Log activity
      await storage.createActivity({
        tenantId: req.tenantId,
        userId: req.user.id,
        action: "invited",
        entityType: "user",
        entityId: user.id,
        metadata: { email: user.email },
      });

      res.status(201).json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to invite user" });
    }
  });

  // Asset management routes
  app.get("/api/assets", requireAuth, async (req: any, res) => {
    try {
      const assets = await storage.getAssetsByTenant(req.tenantId);
      res.json(assets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assets" });
    }
  });

  app.post("/api/assets/upload", requireAuth, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const asset = await storage.createAsset({
        name: req.body.name || req.file.originalname,
        filename: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`,
        tenantId: req.tenantId,
        uploadedBy: req.user.id,
      });

      // Log activity
      await storage.createActivity({
        tenantId: req.tenantId,
        userId: req.user.id,
        action: "uploaded",
        entityType: "asset",
        entityId: asset.id,
        metadata: { name: asset.name, size: asset.size },
      });

      res.status(201).json(asset);
    } catch (error) {
      res.status(500).json({ error: "Failed to upload asset" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
