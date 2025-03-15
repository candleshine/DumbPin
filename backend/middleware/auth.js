/**
 * Authentication Middleware
 * Handles basic authentication and access control
 */

// Simple mock user store (to be replaced with a proper database in future phases)
const users = {
  'user1': { id: 'user1', name: 'Test User' },
  'user2': { id: 'user2', name: 'Another User' }
};

/**
 * Basic authentication middleware
 * For Phase 1, this is a simple mock implementation
 */
const authenticate = (req, res, next) => {
  // For Phase 1, we'll use a simple header-based authentication
  const userId = req.headers['user-id'];
  
  if (!userId || !users[userId]) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  // Attach user to request object
  req.user = users[userId];
  next();
};

/**
 * Resource ownership check middleware
 * Verifies that the authenticated user owns the requested resource
 */
const checkOwnership = (resourceGetter) => {
  return (req, res, next) => {
    const resource = resourceGetter(req);
    
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    if (resource.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  checkOwnership
};