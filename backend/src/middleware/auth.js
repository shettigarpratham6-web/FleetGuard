const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Token missing.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyreplaceinproduction');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
};

const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access forbidden. Insufficient permissions.' });
    }

    next();
  };
};

module.exports = { auth, authorize };
