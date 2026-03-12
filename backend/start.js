// ES Module version
import app from './server.js'; // or whatever your main server file is named
import { connectToDatabase } from './utils/database.js';

const PORT = process.env.PORT || 5000;

connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  });
});