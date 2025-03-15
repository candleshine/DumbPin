/**
 * Configuration Settings
 * Central configuration for the backend application
 */

const path = require('path');

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  
  // File storage configuration
  storage: {
    uploadDir: path.join(__dirname, '../../uploads'),
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
    tempDir: path.join(__dirname, '../../uploads/temp')
  },
  
  // Authentication configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dumbpin_development_secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    cookieName: 'dumbpin_auth'
  }
};