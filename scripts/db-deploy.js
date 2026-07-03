const { execSync } = require('child_process');

// Ensure we are in a production or CI environment
const isProd = process.env.NODE_ENV === 'production' || process.env.CI === 'true' || process.env.RAILWAY_ENVIRONMENT === 'production';

if (!isProd) {
  console.warn('⚠️ WARNING: db:deploy is intended for production/CI environments.');
  console.warn('For local development, consider using db:push instead.');
}

console.log('🚀 Running production database migrations...');

try {
  // prisma migrate deploy is safe for production. It applies pending migrations without dropping data.
  execSync('npx prisma migrate deploy --schema=prisma/schema.prisma', { stdio: 'inherit' });
  console.log('✅ Migrations applied successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
