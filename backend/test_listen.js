require('dotenv').config();
const app = require('./src/app');

const PORT = 5000;

try {
  const server = app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  server.on('error', (e) => {
    console.error("Server error event:", e.message);
  });
} catch (e) {
  console.error("Catch block:", e);
}
