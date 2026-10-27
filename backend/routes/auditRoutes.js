const router = require('express').Router();
const AuditLog = require('../models/AuditLog');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyAdmin, async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 500) : 200;
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(limit).lean();
    return res.status(200).json(logs);
  } catch (error) {
    console.error('Audit log retrieval failed:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to load system audit logs.' });
  }
});

module.exports = router;
