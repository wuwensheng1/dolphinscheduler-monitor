import { app, initLocalDb, closeAllPools } from './app';

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await initLocalDb();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  closeAllPools();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeAllPools();
  process.exit(0);
});

start();
