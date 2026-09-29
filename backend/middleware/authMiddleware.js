const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access Denied. No token provided.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'dev_jwt_secret';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const verifyRole = (...allowedRoles) => {
  return (req, res, next) => {
    verifyToken(req, res, () => {
      if (!req.user || !req.user.role) {
        return res.status(403).json({ success: false, message: 'Access Forbidden: Role not found.' });
      }

      if (req.user.role === 'admin' || allowedRoles.includes(req.user.role)) {
        return next();
      }

      return res.status(403).json({ success: false, message: 'Access Forbidden: You do not have permission.' });
    });
  };
};

const verifyAdmin = verifyRole('admin');

module.exports = { verifyToken, verifyRole, verifyAdmin };
