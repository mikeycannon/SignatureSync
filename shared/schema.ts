import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tenants table
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: text("plan").notNull().default("starter"), // starter, professional, enterprise
  maxUsers: integer("max_users").notNull().default(5),
  maxTemplates: integer("max_templates").notNull().default(10),
  maxStorage: integer("max_storage_mb").notNull().default(100),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Users table with tenant association
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  email: text("email").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("member"), // admin, member
  avatar: text("avatar"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Signature templates
export const signatureTemplates = pgTable("signature_templates", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  content: json("content").notNull(), // Rich content structure
  htmlContent: text("html_content").notNull(),
  status: text("status").notNull().default("draft"), // draft, active, archived
  createdBy: integer("created_by").references(() => users.id).notNull(),
  isShared: boolean("is_shared").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Asset library for logos, images, etc.
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(), // in bytes
  url: text("url").notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User signatures (instances of templates)
export const userSignatures = pgTable("user_signatures", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  templateId: integer("template_id").references(() => signatureTemplates.id).notNull(),
  personalizedContent: json("personalized_content"), // User-specific overrides
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Activity log
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // created, updated, deleted, etc.
  entityType: text("entity_type").notNull(), // template, user, asset
  entityId: integer("entity_id").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const insertSignatureTemplateSchema = createInsertSchema(signatureTemplates).omit({
  id: true,
  tenantId: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  tenantId: true,
  uploadedBy: true,
  createdAt: true,
});

export const insertUserSignatureSchema = createInsertSchema(userSignatures).omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Types
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;

export type SignatureTemplate = typeof signatureTemplates.$inferSelect;
export type InsertSignatureTemplate = z.infer<typeof insertSignatureTemplateSchema>;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type UserSignature = typeof userSignatures.$inferSelect;
export type InsertUserSignature = z.infer<typeof insertUserSignatureSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Auth token payload
export type AuthTokenPayload = {
  userId: number;
  tenantId: number;
  email: string;
  role: string;
};
