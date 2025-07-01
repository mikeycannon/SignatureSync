import { 
  tenants, users, signatureTemplates, assets, userSignatures, activities,
  type Tenant, type InsertTenant, type User, type InsertUser, 
  type SignatureTemplate, type InsertSignatureTemplate,
  type Asset, type InsertAsset, type UserSignature, type InsertUserSignature,
  type Activity, type InsertActivity, type AuthTokenPayload
} from "@shared/schema";

export interface IStorage {
  // Tenant operations
  getTenant(id: number): Promise<Tenant | undefined>;
  getTenantBySlug(slug: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: number, tenant: Partial<InsertTenant>): Promise<Tenant | undefined>;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByTenant(tenantId: number): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Authentication
  validateUserCredentials(email: string, password: string): Promise<User | null>;

  // Signature template operations
  getSignatureTemplate(id: number): Promise<SignatureTemplate | undefined>;
  getSignatureTemplatesByTenant(tenantId: number): Promise<SignatureTemplate[]>;
  createSignatureTemplate(template: InsertSignatureTemplate & { tenantId: number; createdBy: number }): Promise<SignatureTemplate>;
  updateSignatureTemplate(id: number, template: Partial<InsertSignatureTemplate>): Promise<SignatureTemplate | undefined>;
  deleteSignatureTemplate(id: number): Promise<boolean>;

  // Asset operations
  getAsset(id: number): Promise<Asset | undefined>;
  getAssetsByTenant(tenantId: number): Promise<Asset[]>;
  createAsset(asset: InsertAsset & { tenantId: number; uploadedBy: number }): Promise<Asset>;
  deleteAsset(id: number): Promise<boolean>;

  // User signature operations
  getUserSignature(id: number): Promise<UserSignature | undefined>;
  getUserSignaturesByUser(userId: number): Promise<UserSignature[]>;
  getUserSignaturesByTenant(tenantId: number): Promise<UserSignature[]>;
  createUserSignature(signature: InsertUserSignature & { tenantId: number }): Promise<UserSignature>;
  updateUserSignature(id: number, signature: Partial<InsertUserSignature>): Promise<UserSignature | undefined>;
  deleteUserSignature(id: number): Promise<boolean>;

  // Activity operations
  getActivitiesByTenant(tenantId: number, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Dashboard analytics
  getTenantStats(tenantId: number): Promise<{
    activeTemplates: number;
    teamMembers: number;
    signaturesUsed: number;
    storageUsed: number;
  }>;
}

export class MemStorage implements IStorage {
  private tenants: Map<number, Tenant>;
  private users: Map<number, User>;
  private signatureTemplates: Map<number, SignatureTemplate>;
  private assets: Map<number, Asset>;
  private userSignatures: Map<number, UserSignature>;
  private activities: Map<number, Activity>;
  private currentId: number;

  constructor() {
    this.tenants = new Map();
    this.users = new Map();
    this.signatureTemplates = new Map();
    this.assets = new Map();
    this.userSignatures = new Map();
    this.activities = new Map();
    this.currentId = 1;

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create default tenant
    const defaultTenant: Tenant = {
      id: 1,
      name: "Acme Corporation",
      slug: "acme",
      plan: "professional",
      maxUsers: 50,
      maxTemplates: 25,
      maxStorage: 1000,
      createdAt: new Date(),
    };
    this.tenants.set(1, defaultTenant);

    // Create admin user
    const adminUser: User = {
      id: 1,
      tenantId: 1,
      email: "admin@acme.com",
      username: "admin",
      password: "$2b$10$YourHashedPasswordHere", // In real app, use bcrypt
      firstName: "John",
      lastName: "Doe",
      role: "admin",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&h=64",
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(1, adminUser);

    this.currentId = 2;
  }

  async getTenant(id: number): Promise<Tenant | undefined> {
    return this.tenants.get(id);
  }

  async getTenantBySlug(slug: string): Promise<Tenant | undefined> {
    return Array.from(this.tenants.values()).find(tenant => tenant.slug === slug);
  }

  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const id = this.currentId++;
    const tenant: Tenant = {
      ...insertTenant,
      id,
      createdAt: new Date(),
    };
    this.tenants.set(id, tenant);
    return tenant;
  }

  async updateTenant(id: number, tenant: Partial<InsertTenant>): Promise<Tenant | undefined> {
    const existing = this.tenants.get(id);
    if (!existing) return undefined;
    
    const updated: Tenant = { ...existing, ...tenant };
    this.tenants.set(id, updated);
    return updated;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUsersByTenant(tenantId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.tenantId === tenantId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    
    const updated: User = { ...existing, ...user };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async validateUserCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.isActive) return null;
    
    // In real app, use bcrypt.compare(password, user.password)
    // For demo purposes, we'll do simple comparison
    if (password === "password" || user.password === password) {
      return user;
    }
    return null;
  }

  async getSignatureTemplate(id: number): Promise<SignatureTemplate | undefined> {
    return this.signatureTemplates.get(id);
  }

  async getSignatureTemplatesByTenant(tenantId: number): Promise<SignatureTemplate[]> {
    return Array.from(this.signatureTemplates.values()).filter(template => template.tenantId === tenantId);
  }

  async createSignatureTemplate(template: InsertSignatureTemplate & { tenantId: number; createdBy: number }): Promise<SignatureTemplate> {
    const id = this.currentId++;
    const now = new Date();
    const signatureTemplate: SignatureTemplate = {
      ...template,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.signatureTemplates.set(id, signatureTemplate);
    return signatureTemplate;
  }

  async updateSignatureTemplate(id: number, template: Partial<InsertSignatureTemplate>): Promise<SignatureTemplate | undefined> {
    const existing = this.signatureTemplates.get(id);
    if (!existing) return undefined;
    
    const updated: SignatureTemplate = { 
      ...existing, 
      ...template, 
      updatedAt: new Date() 
    };
    this.signatureTemplates.set(id, updated);
    return updated;
  }

  async deleteSignatureTemplate(id: number): Promise<boolean> {
    return this.signatureTemplates.delete(id);
  }

  async getAsset(id: number): Promise<Asset | undefined> {
    return this.assets.get(id);
  }

  async getAssetsByTenant(tenantId: number): Promise<Asset[]> {
    return Array.from(this.assets.values()).filter(asset => asset.tenantId === tenantId);
  }

  async createAsset(asset: InsertAsset & { tenantId: number; uploadedBy: number }): Promise<Asset> {
    const id = this.currentId++;
    const newAsset: Asset = {
      ...asset,
      id,
      createdAt: new Date(),
    };
    this.assets.set(id, newAsset);
    return newAsset;
  }

  async deleteAsset(id: number): Promise<boolean> {
    return this.assets.delete(id);
  }

  async getUserSignature(id: number): Promise<UserSignature | undefined> {
    return this.userSignatures.get(id);
  }

  async getUserSignaturesByUser(userId: number): Promise<UserSignature[]> {
    return Array.from(this.userSignatures.values()).filter(sig => sig.userId === userId);
  }

  async getUserSignaturesByTenant(tenantId: number): Promise<UserSignature[]> {
    return Array.from(this.userSignatures.values()).filter(sig => sig.tenantId === tenantId);
  }

  async createUserSignature(signature: InsertUserSignature & { tenantId: number }): Promise<UserSignature> {
    const id = this.currentId++;
    const now = new Date();
    const userSignature: UserSignature = {
      ...signature,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.userSignatures.set(id, userSignature);
    return userSignature;
  }

  async updateUserSignature(id: number, signature: Partial<InsertUserSignature>): Promise<UserSignature | undefined> {
    const existing = this.userSignatures.get(id);
    if (!existing) return undefined;
    
    const updated: UserSignature = { 
      ...existing, 
      ...signature, 
      updatedAt: new Date() 
    };
    this.userSignatures.set(id, updated);
    return updated;
  }

  async deleteUserSignature(id: number): Promise<boolean> {
    return this.userSignatures.delete(id);
  }

  async getActivitiesByTenant(tenantId: number, limit: number = 10): Promise<Activity[]> {
    const activities = Array.from(this.activities.values())
      .filter(activity => activity.tenantId === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    return activities;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentId++;
    const activity: Activity = {
      ...insertActivity,
      id,
      createdAt: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }

  async getTenantStats(tenantId: number): Promise<{
    activeTemplates: number;
    teamMembers: number;
    signaturesUsed: number;
    storageUsed: number;
  }> {
    const templates = await this.getSignatureTemplatesByTenant(tenantId);
    const users = await this.getUsersByTenant(tenantId);
    const signatures = await this.getUserSignaturesByTenant(tenantId);
    const assets = await this.getAssetsByTenant(tenantId);

    const activeTemplates = templates.filter(t => t.status === 'active').length;
    const teamMembers = users.filter(u => u.isActive).length;
    const signaturesUsed = signatures.filter(s => s.isActive).length;
    const storageUsed = assets.reduce((sum, asset) => sum + asset.size, 0);

    return {
      activeTemplates,
      teamMembers,
      signaturesUsed,
      storageUsed: Math.round(storageUsed / (1024 * 1024)), // Convert to MB
    };
  }
}

export const storage = new MemStorage();
