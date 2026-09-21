require('dotenv').config();
const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const { startCronJobs } = require('./jobs');
const authService = require('./services/authService');
const settingsRepository = require('./repositories/settingsRepository');

async function bootstrap() {
  await connectDB();
  await authService.ensureSeedAdmin();
  await settingsRepository.getSettings();
  startCronJobs();

  const server = app.listen(env.port, () => {
    console.log(`API running on http://localhost:${env.port}`);
  });

  server.on('error', (err) => {
    console.error('Server failed to start:', err.message);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
