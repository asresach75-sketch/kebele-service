const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../utils/securityConfig');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access Denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const verifyRole = (...allowedRoles) => {
  const normalizedAllowedRoles = allowedRoles.map((role) => String(role).toLowerCase());
  return (req, res, next) => {
    verifyToken(req, res, () => {
      if (!req.user || !req.user.role) {
        return res.status(403).json({ success: false, message: 'Access Forbidden: Role not found.' });
      }

      const userRole = String(req.user.role).toLowerCase();
      if (userRole === 'admin' || normalizedAllowedRoles.includes(userRole)) {
        return next();
      }

      return res.status(403).json({ success: false, message: 'Access Forbidden: You do not have permission.' });
    });
  };
};

const verifyAdmin = verifyRole('admin');

module.exports = { verifyToken, verifyRole, verifyAdmin };
