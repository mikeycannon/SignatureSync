import { Router } from "express";
import authRoutes from "./auth";
import templateRoutes from "./templates";
import userRoutes from "./users";
import assignmentRoutes from "./assignments";
import uploadRoutes from "./upload";

const router = Router();

/**
 * API Routes Registration
 * All routes are prefixed with /api
 */

// Authentication routes - /api/auth/*
router.use("/auth", authRoutes);

// Template management routes - /api/templates/*
router.use("/templates", templateRoutes);

// User management routes - /api/users/*
router.use("/users", userRoutes);

// Template assignment routes - /api/assignments/*
router.use("/assignments", assignmentRoutes);

// File upload routes - /api/upload/*
router.use("/upload", uploadRoutes);

// API health check
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development"
  });
});

// API information endpoint
router.get("/", (req, res) => {
  res.json({
    name: "Email Signature Generator API",
    version: "1.0.0",
    description: "RESTful API for multi-tenant email signature management",
    endpoints: {
      auth: "/api/auth",
      templates: "/api/templates", 
      users: "/api/users",
      assignments: "/api/assignments",
      upload: "/api/upload",
      health: "/api/health"
    },
    documentation: "See route handlers for detailed API documentation"
  });
});

export default router;