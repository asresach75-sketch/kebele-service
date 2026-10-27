export const PENDING_STATUSES = ['PENDING_OFFICER', 'PENDING', 'Pending', 'pending'];

export const getOfficerApplicationStatusGroup = (status) => {
  const normalizedStatus = String(status || 'Pending').trim().toUpperCase().replaceAll(' ', '_');
  if (PENDING_STATUSES.some((pendingStatus) => pendingStatus.toUpperCase() === normalizedStatus)) return 'pending';
  if (['APPROVED_BY_OFFICER', 'APPROVED_BY_FINANCE', 'PAID_PENDING_FINANCE', 'PAYMENT_VERIFIED', 'APPROVED', 'APPROVED_-_PENDING_PAYMENT', 'COMPLETED'].includes(normalizedStatus)) return 'approved';
  if (normalizedStatus === 'NEEDS_CORRECTION') return 'correction';
  if (normalizedStatus === 'REJECTED') return 'rejected';
  return 'other';
};
