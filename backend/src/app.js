const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const config = require('./config/config');

// Import routes
const queryRoutes = require('./routes/query.routes');

// Import middleware
const { apiLimiter } = require('./middleware/rateLimit.middleware');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
  // Disable CSP which can interfere with Express route parsing
  contentSecurityPolicy: false
})); // Set security-related HTTP headers
app.use(cors());
app.use(express.json());

// Apply rate limiting to all requests
app.use(apiLimiter);

// Connect to MongoDB
mongoose.connect(config.mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/query', queryRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Serve static files from the frontend dist directory
// Do this in both development and production
const frontendPath = path.join(__dirname, '../../frontend/dist');

// Check if the frontend directory exists before trying to serve from it
if (fs.existsSync(frontendPath)) {
  console.log(`Serving frontend files from: ${frontendPath}`);
  app.use(express.static(frontendPath));
  
  // For any request that doesn't match API routes, send back index.html
  // This allows client-side routing to work
  app.get('/*', (req, res) => {
    // Check if index.html exists
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Frontend files not found. Did you build the frontend?');
    }
  });
} else {
  console.log(`Frontend path not found: ${frontendPath}`);
  // If frontend directory doesn't exist, show helpful message
  app.get('/', (req, res) => {
    res.status(404).send(`
      <h1>Frontend not built</h1>
      <p>The frontend distribution files were not found at ${frontendPath}.</p>
      <p>Please make sure you have built the frontend before starting the server:</p>
      <pre>
        cd frontend
        npm run build
      </pre>
    `);
  });
  
  // For other routes that aren't API routes
  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api/') && req.path !== '/health') {
      return res.status(404).json({ 
        message: 'Route not found',
        error: 'Frontend files not available or API endpoint not defined'
      });
    }
    next();
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Visit http://localhost:${PORT} in your browser`);
});

module.exports = app;
