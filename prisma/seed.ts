import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create test tenants
  const acmeCorp = await prisma.tenant.create({
    data: {
      name: 'Acme Corporation',
      domain: 'acme.com',
      subscription_plan: 'professional',
    },
  });

  const techStart = await prisma.tenant.create({
    data: {
      name: 'TechStart Inc',
      domain: 'techstart.io',
      subscription_plan: 'starter',
    },
  });

  console.log(`Created tenants: ${acmeCorp.name}, ${techStart.name}`);

  // Hash passwords for test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create test users for Acme Corp
  const johnAdmin = await prisma.user.create({
    data: {
      tenant_id: acmeCorp.id,
      email: 'john.admin@acme.com',
      password_hash: hashedPassword,
      role: 'admin',
      first_name: 'John',
      last_name: 'Smith',
      title: 'CEO',
      department: 'Executive',
    },
  });

  const janeDoe = await prisma.user.create({
    data: {
      tenant_id: acmeCorp.id,
      email: 'jane.doe@acme.com',
      password_hash: hashedPassword,
      role: 'user',
      first_name: 'Jane',
      last_name: 'Doe',
      title: 'Marketing Manager',
      department: 'Marketing',
    },
  });

  const bobJohnson = await prisma.user.create({
    data: {
      tenant_id: acmeCorp.id,
      email: 'bob.johnson@acme.com',
      password_hash: hashedPassword,
      role: 'user',
      first_name: 'Bob',
      last_name: 'Johnson',
      title: 'Sales Director',
      department: 'Sales',
    },
  });

  // Create test users for TechStart
  const aliceFounder = await prisma.user.create({
    data: {
      tenant_id: techStart.id,
      email: 'alice@techstart.io',
      password_hash: hashedPassword,
      role: 'admin',
      first_name: 'Alice',
      last_name: 'Wilson',
      title: 'Founder & CTO',
      department: 'Engineering',
    },
  });

  const charlieDev = await prisma.user.create({
    data: {
      tenant_id: techStart.id,
      email: 'charlie@techstart.io',
      password_hash: hashedPassword,
      role: 'user',
      first_name: 'Charlie',
      last_name: 'Brown',
      title: 'Senior Developer',
      department: 'Engineering',
    },
  });

  console.log(`Created ${5} test users`);

  // Create signature templates for Acme Corp
  const acmeDefaultTemplate = await prisma.signatureTemplate.create({
    data: {
      tenant_id: acmeCorp.id,
      name: 'Acme Corporate Standard',
      html_content: `
        <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
          <div style="font-weight: bold; font-size: 16px;">{{ first_name }} {{ last_name }}</div>
          <div style="color: #666;">{{ title }}</div>
          <div style="color: #666;">{{ department }}</div>
          <div style="margin-top: 10px;">
            <div><strong>Acme Corporation</strong></div>
            <div>Email: {{ email }}</div>
            <div>Website: www.acme.com</div>
          </div>
        </div>
      `,
      is_default: true,
      created_by: johnAdmin.id,
    },
  });

  const acmeMarketingTemplate = await prisma.signatureTemplate.create({
    data: {
      tenant_id: acmeCorp.id,
      name: 'Marketing Team Template',
      html_content: `
        <div style="font-family: 'Segoe UI', sans-serif; font-size: 14px;">
          <div style="color: #2c5aa0; font-weight: bold; font-size: 18px;">{{ first_name }} {{ last_name }}</div>
          <div style="color: #555; font-style: italic;">{{ title }} | {{ department }}</div>
          <div style="margin: 15px 0; height: 2px; background: linear-gradient(to right, #2c5aa0, #ff6b35);"></div>
          <div style="color: #333;">
            <div><strong style="color: #2c5aa0;">ACME CORPORATION</strong></div>
            <div>📧 {{ email }}</div>
            <div>🌐 www.acme.com</div>
            <div style="margin-top: 10px; font-size: 12px; color: #888;">Making business happen since 1985</div>
          </div>
        </div>
      `,
      is_default: false,
      created_by: janeDoe.id,
    },
  });

  // Create signature template for TechStart
  const techStartTemplate = await prisma.signatureTemplate.create({
    data: {
      tenant_id: techStart.id,
      name: 'TechStart Modern',
      html_content: `
        <div style="font-family: 'SF Pro Display', 'Helvetica', sans-serif; font-size: 14px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 8px;">
            <div style="font-weight: bold; font-size: 18px;">{{ first_name }} {{ last_name }}</div>
            <div style="opacity: 0.9;">{{ title }}</div>
          </div>
          <div style="margin-top: 12px; color: #333;">
            <div style="font-weight: bold; color: #667eea;">TechStart Inc</div>
            <div>{{ email }}</div>
            <div style="color: #667eea;">techstart.io</div>
            <div style="margin-top: 8px; font-size: 12px; color: #999;">🚀 Building the future, one line of code at a time</div>
          </div>
        </div>
      `,
      is_default: true,
      created_by: aliceFounder.id,
    },
  });

  console.log(`Created ${3} signature templates`);

  // Create template assignments
  await prisma.templateAssignment.createMany({
    data: [
      { user_id: johnAdmin.id, template_id: acmeDefaultTemplate.id },
      { user_id: janeDoe.id, template_id: acmeMarketingTemplate.id },
      { user_id: bobJohnson.id, template_id: acmeDefaultTemplate.id },
      { user_id: aliceFounder.id, template_id: techStartTemplate.id },
      { user_id: charlieDev.id, template_id: techStartTemplate.id },
    ],
  });

  console.log(`Created ${5} template assignments`);

  // Create sample processing logs
  await prisma.processingLog.createMany({
    data: [
      {
        tenant_id: acmeCorp.id,
        user_id: johnAdmin.id,
        email_id: 'email_001_john',
        status: 'success',
      },
      {
        tenant_id: acmeCorp.id,
        user_id: janeDoe.id,
        email_id: 'email_002_jane',
        status: 'success',
      },
      {
        tenant_id: acmeCorp.id,
        user_id: bobJohnson.id,
        email_id: 'email_003_bob',
        status: 'error',
      },
      {
        tenant_id: techStart.id,
        user_id: aliceFounder.id,
        email_id: 'email_004_alice',
        status: 'success',
      },
      {
        tenant_id: techStart.id,
        user_id: charlieDev.id,
        email_id: 'email_005_charlie',
        status: 'pending',
      },
    ],
  });

  console.log(`Created ${5} processing logs`);

  console.log('Database seeded successfully!');
  
  // Print summary
  console.log('\n=== SEED DATA SUMMARY ===');
  console.log('Test Accounts (password: password123):');
  console.log('- john.admin@acme.com (Admin at Acme Corp)');
  console.log('- jane.doe@acme.com (Marketing Manager at Acme Corp)');
  console.log('- bob.johnson@acme.com (Sales Director at Acme Corp)');
  console.log('- alice@techstart.io (Founder at TechStart)');
  console.log('- charlie@techstart.io (Developer at TechStart)');
  console.log('========================');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });