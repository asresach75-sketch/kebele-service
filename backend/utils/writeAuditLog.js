const AuditLog = require('../models/AuditLog');

const writeAuditLog = async ({ req, actor, action, entityType = '', entityId = '', details = '' }) => {
  try {
    await AuditLog.create({
      actorId: String(actor?.id || actor?._id || ''),
      actorName: String(actor?.fullName || ''),
      actorEmail: String(actor?.email || '').trim().toLowerCase(),
      actorRole: String(actor?.role || 'system'),
      action,
      entityType,
      entityId: String(entityId || ''),
      details: String(details || ''),
      ipAddress: String(req?.ip || ''),
      userAgent: String(req?.get?.('user-agent') || ''),
    });
  } catch (error) {
    console.error(`Audit log write failed for ${action}:`, error.message);
  }
};

module.exports = writeAuditLog;
