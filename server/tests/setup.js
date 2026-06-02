/**
 * Global test setup — sets env vars before any module loads.
 */
process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET = "test-secret";
process.env.JWT_EXPIRES_IN = "3600";
process.env.SMTP_HOST = "smtp.test.com";
process.env.SMTP_PORT = "465";
process.env.SMTP_USER = "test@test.com";
process.env.SMTP_PASS = "test-pass";
process.env.GEMINI_API_KEY = "test-gemini-key";
process.env.NODE_ENV = "test";
