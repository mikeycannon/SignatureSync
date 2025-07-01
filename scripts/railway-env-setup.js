#!/usr/bin/env node
/**
 * Railway Environment Variable Setup Helper
 * Generates secure environment variables for Railway deployment
 */

import crypto from 'crypto';

console.log('🚂 Railway Environment Variable Setup\n');

// Generate secure JWT secret
const jwtSecret = crypto.randomBytes(64).toString('hex');

console.log('📋 Copy these environment variables to your Railway dashboard:\n');

console.log('Variable Name: JWT_SECRET');
console.log(`Value: ${jwtSecret}\n`);

console.log('Variable Name: NODE_ENV');
console.log('Value: production\n');

console.log('Variable Name: ALLOWED_ORIGINS');
console.log('Value: https://your-app-name.up.railway.app\n');

console.log('📝 Notes:');
console.log('- Replace "your-app-name" with your actual Railway app name');
console.log('- DATABASE_URL and REDIS_URL are automatically provided by Railway');
console.log('- Add custom domain to ALLOWED_ORIGINS if using one');
console.log('- Keep JWT_SECRET secure and never share it publicly\n');

console.log('🔧 Railway Setup Steps:');
console.log('1. Go to railway.app and create new project from GitHub');
console.log('2. Add PostgreSQL and Redis services');
console.log('3. Add the environment variables above to your app service');
console.log('4. Deploy and test at your Railway URL\n');

console.log('✅ Your app will be available at: https://your-app-name.up.railway.app');
console.log('🔍 Health check: https://your-app-name.up.railway.app/api/health');
console.log('🔐 Demo login: admin@acme.com / password');

// Validate current environment (if running in development)
if (process.env.NODE_ENV === 'development') {
  console.log('\n🧪 Current Development Environment Check:');
  
  const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length === 0) {
    console.log('✅ All required environment variables are set');
  } else {
    console.log('⚠️  Missing variables:', missing.join(', '));
  }
}