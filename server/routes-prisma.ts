import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import { storage } from "./storage-prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Auth middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Tenant middleware
const validateTenantAccess = async (req: any, res: any, next: any) => {
  try {
    const user = await storage.getUser(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add tenant info to request
    req.tenant = await storage.getTenant(user.tenant_id);
    if (!req.tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate tenant access' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Auth routes
  app.post("/api/register", async (req, res) => {
    try {
      const { 
        organizationName, 
        domain, 
        firstName, 
        lastName, 
        email, 
        password,
        confirmPassword 
      } = req.body;

      // Validate input
      if (!organizationName || !domain || !firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
      }

      // Check if tenant domain already exists
      const existingTenant = await storage.getTenantByDomain(domain);
      if (existingTenant) {
        return res.status(400).json({ error: 'Domain already taken' });
      }

      // Check if user email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Create tenant
      const tenant = await storage.createTenant({
        name: organizationName,
        domain: domain,
        subscription_plan: 'starter'
      });

      // Create admin user
      const user = await storage.createUser({
        tenant_id: tenant.id,
        email,
        password,
        role: 'admin',
        first_name: firstName,
        last_name: lastName,
        title: 'Administrator',
        department: 'Management'
      });

      // Generate JWT token
      const tokenPayload = {
        userId: user.id,
        tenantId: tenant.id,
        email: user.email,
        role: user.role,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          domain: tenant.domain,
          plan: tenant.subscription_plan,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Validate credentials
      const user = await storage.validateUserCredentials(email, password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Get tenant info
      const tenant = await storage.getTenant(user.tenant_id);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      // Generate JWT token
      const tokenPayload = {
        userId: user.id,
        tenantId: tenant.id,
        email: user.email,
        role: user.role,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          domain: tenant.domain,
          plan: tenant.subscription_plan,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  });

  // User profile route
  app.get("/api/user", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const tenant = await storage.getTenant(user.tenant_id);

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
          id: tenant?.id,
          name: tenant?.name,
          domain: tenant?.domain,
          plan: tenant?.subscription_plan,
        },
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  });

  // Dashboard analytics
  app.get("/api/dashboard/stats", authenticateToken, validateTenantAccess, async (req: any, res) => {
    try {
      const stats = await storage.getTenantStats(req.tenant.id);
      res.json(stats);
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Failed to get dashboard stats' });
    }
  });

  // Recent activity
  app.get("/api/dashboard/activity", authenticateToken, validateTenantAccess, async (req: any, res) => {
    try {
      const activities = await storage.getProcessingLogsByTenant(req.tenant.id, 10);
      res.json(activities);
    } catch (error) {
      console.error('Get activity error:', error);
      res.status(500).json({ error: 'Failed to get recent activity' });
    }
  });

  // Template routes
  app.get("/api/templates", authenticateToken, validateTenantAccess, async (req: any, res) => {
    try {
      const templates = await storage.getSignatureTemplatesByTenant(req.tenant.id);
      res.json(templates);
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({ error: 'Failed to get templates' });
    }
  });

  app.get("/api/templates/:id", authenticateToken, validateTenantAccess, async (req: any, res) => {
    try {
      const template = await storage.getSignatureTemplate(parseInt(req.params.id));
      if (!template || template.tenant_id !== req.tenant.id) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json(template);
    } catch (error) {
      console.error('Get template error:', error);
      res.status(500).json({ error: 'Failed to get template' });
    }
  });

  app.post("/api/templates", authenticateToken, validateTenantAccess, async (req: any, res) => {
    try {
      const { name, html_content, is_default } = req.body;

      if (!name || !html_content) {
        return res.status(400).json({ error: 'Name and HTML content are required' });
      }

      const template = await storage.createSignatureTemplate({
        tenant_id: req.tenant.id,
        name,
        html_content,
        is_default: is_default || false,
        created_by: req.user.userId,
      });

      res.json(template);
    } catch (error) {
      console.error('Create template error:', error);
      res.status(500).json({ error: 'Failed to create template' });
    }
  });

  app.patch("/api/templates/:id", authenticateToken, validateTenantAccess, async (req: any, res) => {
    try {
      const template = await storage.getSignatureTemplate(parseInt(req.params.id));
      if (!template || template.tenant_id !== req.tenant.id) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const updatedTemplate = await storage.updateSignatureTemplate(parseInt(req.params.id), req.body);
      if (!updatedTemplate) {
        return res.status(404).json({ error: 'Failed to update template' });
      }

      res.json(updatedTemplate);
    } catch (error) {
      console.error('Update template error:', error);
      res.status(500).json({ error: 'Failed to update template' });
    }
  });

  app.delete("/api/templates/:id", authenticateToken, validateTenantAccess, async (req: any, res) => {
    try {
      const template = await storage.getSignatureTemplate(parseInt(req.params.id));
      if (!template || template.tenant_id !== req.tenant.id) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const success = await storage.deleteSignatureTemplate(parseInt(req.params.id));
      if (!success) {
        return res.status(500).json({ error: 'Failed to delete template' });
      }

      res.json({ message: 'Template deleted successfully' });
    } catch (error) {
      console.error('Delete template error:', error);
      res.status(500).json({ error: 'Failed to delete template' });
    }
  });

  // Team management routes
  app.get("/api/team", authenticateToken, validateTenantAccess, async (req: any, res) => {
    try {
      const users = await storage.getUsersByTenant(req.tenant.id);
      res.json(users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        title: user.title,
        department: user.department,
        isActive: true,
        createdAt: user.created_at,
      })));
    } catch (error) {
      console.error('Get team error:', error);
      res.status(500).json({ error: 'Failed to get team members' });
    }
  });

  app.post("/api/team/invite", authenticateToken, validateTenantAccess, async (req: any, res) => {
    try {
      const { email, firstName, lastName, role, title, department } = req.body;

      if (!email || !firstName || !lastName) {
        return res.status(400).json({ error: 'Email, first name, and last name are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // For now, create user with a temporary password
      // In a real app, you'd send an invitation email
      const user = await storage.createUser({
        tenant_id: req.tenant.id,
        email,
        password: 'temp123', // This should be handled with invitation flow
        role: role || 'user',
        first_name: firstName,
        last_name: lastName,
        title: title || '',
        department: department || '',
      });

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        title: user.title,
        department: user.department,
      });
    } catch (error) {
      console.error('Invite user error:', error);
      res.status(500).json({ error: 'Failed to invite user' });
    }
  });

  // Template assignment routes
  app.get("/api/assignments", authenticateToken, validateTenantAccess, async (req: any, res) => {
    try {
      const assignments = await storage.getTemplateAssignmentsByTenant(req.tenant.id);
      res.json(assignments);
    } catch (error) {
      console.error('Get assignments error:', error);
      res.status(500).json({ error: 'Failed to get template assignments' });
    }
  });

  app.post("/api/assignments", authenticateToken, validateTenantAccess, async (req: any, res) => {
    try {
      const { user_id, template_id } = req.body;

      if (!user_id || !template_id) {
        return res.status(400).json({ error: 'User ID and template ID are required' });
      }

      // Verify user belongs to tenant
      const user = await storage.getUser(user_id);
      if (!user || user.tenant_id !== req.tenant.id) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify template belongs to tenant
      const template = await storage.getSignatureTemplate(template_id);
      if (!template || template.tenant_id !== req.tenant.id) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const assignment = await storage.createTemplateAssignment({
        user_id,
        template_id,
      });

      res.json(assignment);
    } catch (error) {
      console.error('Create assignment error:', error);
      res.status(500).json({ error: 'Failed to create template assignment' });
    }
  });

  // Processing logs
  app.post("/api/processing-logs", authenticateToken, validateTenantAccess, async (req: any, res) => {
    try {
      const { email_id, status } = req.body;

      if (!email_id || !status) {
        return res.status(400).json({ error: 'Email ID and status are required' });
      }

      const log = await storage.createProcessingLog({
        tenant_id: req.tenant.id,
        user_id: req.user.userId,
        email_id,
        status,
      });

      res.json(log);
    } catch (error) {
      console.error('Create processing log error:', error);
      res.status(500).json({ error: 'Failed to create processing log' });
    }
  });

  // File upload endpoint (keeping for compatibility)
  app.post("/api/upload", authenticateToken, validateTenantAccess, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // In a real app, you'd save file info to database and move to permanent storage
      const fileUrl = `/uploads/${req.file.filename}`;

      res.json({
        id: Date.now(), // Mock ID
        name: req.file.originalname,
        filename: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  return httpServer;
}