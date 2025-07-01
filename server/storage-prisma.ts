import { prisma } from './prisma';
import bcrypt from 'bcrypt';

export interface IStorage {
  // Tenant operations
  getTenant(id: number): Promise<any | undefined>;
  getTenantByDomain(domain: string): Promise<any | undefined>;
  createTenant(tenant: any): Promise<any>;
  updateTenant(id: number, tenant: any): Promise<any | undefined>;

  // User operations
  getUser(id: number): Promise<any | undefined>;
  getUserByEmail(email: string): Promise<any | undefined>;
  getUsersByTenant(tenantId: number): Promise<any[]>;
  createUser(user: any): Promise<any>;
  updateUser(id: number, user: any): Promise<any | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Authentication
  validateUserCredentials(email: string, password: string): Promise<any | null>;

  // Signature template operations
  getSignatureTemplate(id: number): Promise<any | undefined>;
  getSignatureTemplatesByTenant(tenantId: number): Promise<any[]>;
  createSignatureTemplate(template: any): Promise<any>;
  updateSignatureTemplate(id: number, template: any): Promise<any | undefined>;
  deleteSignatureTemplate(id: number): Promise<boolean>;

  // Template assignment operations
  getTemplateAssignment(id: number): Promise<any | undefined>;
  getTemplateAssignmentsByUser(userId: number): Promise<any[]>;
  getTemplateAssignmentsByTenant(tenantId: number): Promise<any[]>;
  createTemplateAssignment(assignment: any): Promise<any>;
  deleteTemplateAssignment(id: number): Promise<boolean>;

  // Processing log operations
  getProcessingLogsByTenant(tenantId: number, limit?: number): Promise<any[]>;
  createProcessingLog(log: any): Promise<any>;

  // Dashboard analytics
  getTenantStats(tenantId: number): Promise<{
    activeTemplates: number;
    teamMembers: number;
    signaturesProcessed: number;
    recentActivity: number;
  }>;
}

export class PrismaStorage implements IStorage {
  // Tenant operations
  async getTenant(id: number): Promise<any | undefined> {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        users: true,
        signature_templates: true,
      },
    });
    return tenant || undefined;
  }

  async getTenantByDomain(domain: string): Promise<any | undefined> {
    const tenant = await prisma.tenant.findUnique({
      where: { domain },
      include: {
        users: true,
        signature_templates: true,
      },
    });
    return tenant || undefined;
  }

  async createTenant(tenant: any): Promise<any> {
    return await prisma.tenant.create({
      data: {
        name: tenant.name,
        domain: tenant.domain,
        subscription_plan: tenant.subscription_plan || 'starter',
      },
    });
  }

  async updateTenant(id: number, tenant: any): Promise<any | undefined> {
    try {
      return await prisma.tenant.update({
        where: { id },
        data: tenant,
      });
    } catch (error) {
      return undefined;
    }
  }

  // User operations
  async getUser(id: number): Promise<any | undefined> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        tenant: true,
        created_templates: true,
        template_assignments: {
          include: {
            template: true,
          },
        },
      },
    });
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<any | undefined> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
        created_templates: true,
        template_assignments: {
          include: {
            template: true,
          },
        },
      },
    });
    return user || undefined;
  }

  async getUsersByTenant(tenantId: number): Promise<any[]> {
    return await prisma.user.findMany({
      where: { tenant_id: tenantId },
      include: {
        template_assignments: {
          include: {
            template: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async createUser(user: any): Promise<any> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    return await prisma.user.create({
      data: {
        tenant_id: user.tenant_id,
        email: user.email,
        password_hash: hashedPassword,
        role: user.role || 'user',
        first_name: user.first_name,
        last_name: user.last_name,
        title: user.title,
        department: user.department,
      },
    });
  }

  async updateUser(id: number, user: any): Promise<any | undefined> {
    try {
      const updateData: any = { ...user };
      
      // Hash password if provided
      if (user.password) {
        updateData.password_hash = await bcrypt.hash(user.password, 10);
        delete updateData.password;
      }

      return await prisma.user.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      return undefined;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      await prisma.user.delete({ where: { id } });
      return true;
    } catch (error) {
      return false;
    }
  }

  async validateUserCredentials(email: string, password: string): Promise<any | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) return null;

    return user;
  }

  // Signature template operations
  async getSignatureTemplate(id: number): Promise<any | undefined> {
    const template = await prisma.signatureTemplate.findUnique({
      where: { id },
      include: {
        tenant: true,
        creator: true,
        template_assignments: {
          include: {
            user: true,
          },
        },
      },
    });
    return template || undefined;
  }

  async getSignatureTemplatesByTenant(tenantId: number): Promise<any[]> {
    return await prisma.signatureTemplate.findMany({
      where: { tenant_id: tenantId },
      include: {
        creator: true,
        template_assignments: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async createSignatureTemplate(template: any): Promise<any> {
    return await prisma.signatureTemplate.create({
      data: {
        tenant_id: template.tenant_id,
        name: template.name,
        html_content: template.html_content,
        is_default: template.is_default || false,
        created_by: template.created_by,
      },
    });
  }

  async updateSignatureTemplate(id: number, template: any): Promise<any | undefined> {
    try {
      return await prisma.signatureTemplate.update({
        where: { id },
        data: template,
      });
    } catch (error) {
      return undefined;
    }
  }

  async deleteSignatureTemplate(id: number): Promise<boolean> {
    try {
      await prisma.signatureTemplate.delete({ where: { id } });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Template assignment operations
  async getTemplateAssignment(id: number): Promise<any | undefined> {
    const assignment = await prisma.templateAssignment.findUnique({
      where: { id },
      include: {
        user: true,
        template: true,
      },
    });
    return assignment || undefined;
  }

  async getTemplateAssignmentsByUser(userId: number): Promise<any[]> {
    return await prisma.templateAssignment.findMany({
      where: { user_id: userId },
      include: {
        template: true,
      },
      orderBy: { assigned_at: 'desc' },
    });
  }

  async getTemplateAssignmentsByTenant(tenantId: number): Promise<any[]> {
    return await prisma.templateAssignment.findMany({
      where: {
        user: {
          tenant_id: tenantId,
        },
      },
      include: {
        user: true,
        template: true,
      },
      orderBy: { assigned_at: 'desc' },
    });
  }

  async createTemplateAssignment(assignment: any): Promise<any> {
    return await prisma.templateAssignment.create({
      data: {
        user_id: assignment.user_id,
        template_id: assignment.template_id,
      },
    });
  }

  async deleteTemplateAssignment(id: number): Promise<boolean> {
    try {
      await prisma.templateAssignment.delete({ where: { id } });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Processing log operations
  async getProcessingLogsByTenant(tenantId: number, limit: number = 50): Promise<any[]> {
    return await prisma.processingLog.findMany({
      where: { tenant_id: tenantId },
      include: {
        user: true,
      },
      orderBy: { processed_at: 'desc' },
      take: limit,
    });
  }

  async createProcessingLog(log: any): Promise<any> {
    return await prisma.processingLog.create({
      data: {
        tenant_id: log.tenant_id,
        user_id: log.user_id,
        email_id: log.email_id,
        status: log.status,
      },
    });
  }

  // Dashboard analytics
  async getTenantStats(tenantId: number): Promise<{
    activeTemplates: number;
    teamMembers: number;
    signaturesProcessed: number;
    recentActivity: number;
  }> {
    const [activeTemplates, teamMembers, signaturesProcessed, recentActivity] = await Promise.all([
      // Count active templates
      prisma.signatureTemplate.count({
        where: { tenant_id: tenantId },
      }),
      
      // Count team members
      prisma.user.count({
        where: { tenant_id: tenantId },
      }),
      
      // Count successful signature processings
      prisma.processingLog.count({
        where: {
          tenant_id: tenantId,
          status: 'success',
        },
      }),
      
      // Count recent activity (last 30 days)
      prisma.processingLog.count({
        where: {
          tenant_id: tenantId,
          processed_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      activeTemplates,
      teamMembers,
      signaturesProcessed,
      recentActivity,
    };
  }
}

// Export the storage instance
export const storage = new PrismaStorage();