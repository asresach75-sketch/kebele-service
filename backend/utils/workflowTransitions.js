const pendingStatuses = new Set(['PENDING', 'PENDING_OFFICER']);
const idServices = new Set(['NEW_ID_CARD', 'ID_RENEWAL', 'ID_REPLACEMENT']);
const vitalServices = new Set([
  'BIRTH_REGISTRATION',
  'MARRIAGE_REGISTRATION',
  'DIVORCE_REGISTRATION',
  'DEATH_REGISTRATION',
]);

const normalize = (value) => String(value || '').trim().toUpperCase().replaceAll(' ', '_');

const getAllowedNextStatus = ({ role, currentStatus, requestedStatus, serviceType }) => {
  const actor = normalize(role);
  const current = normalize(currentStatus);
  const requested = normalize(requestedStatus);
  const service = normalize(serviceType);
  const isPending = pendingStatuses.has(current);

  if (actor === 'OFFICER' && isPending) {
    if (requested === 'APPROVED' || requested === 'APPROVED_BY_OFFICER') return 'APPROVED_BY_OFFICER';
    if (requested === 'NEEDS_CORRECTION') return 'NEEDS_CORRECTION';
    if (requested === 'REJECTED') return 'REJECTED';
  }

  if (actor === 'VERIFIER' && isPending && idServices.has(service)) {
    if (requested === 'APPROVED' || requested === 'APPROVED_BY_OFFICER') return 'APPROVED_BY_OFFICER';
    if (requested === 'REJECTED') return 'REJECTED';
  }

  if (actor === 'VITAL' && isPending && vitalServices.has(service)) {
    if (requested === 'APPROVED' || requested === 'APPROVED_BY_OFFICER') return 'APPROVED_BY_OFFICER';
    if (requested === 'REJECTED') return 'REJECTED';
  }

  if (actor === 'ADMIN' && isPending) {
    if (requested === 'APPROVED' || requested === 'APPROVED_BY_OFFICER') return 'APPROVED_BY_OFFICER';
    if (requested === 'NEEDS_CORRECTION') return 'NEEDS_CORRECTION';
    if (requested === 'REJECTED') return 'REJECTED';
  }

  if (actor === 'FINANCE' && ['PAID_PENDING_FINANCE', 'PAYMENT_VERIFIED'].includes(current)
    && ['PAYMENT_VERIFIED', 'APPROVED_BY_FINANCE'].includes(requested)) {
    if (service === 'BIRTH_REGISTRATION') return 'COMPLETED';
    return 'APPROVED_BY_FINANCE';
  }

  if (actor === 'ADMIN' && ['APPROVED_BY_FINANCE', 'PAYMENT_VERIFIED'].includes(current)
    && ['COMPLETED', 'COMPLETE'].includes(requested)) {
    return 'COMPLETED';
  }

  return null;
};

module.exports = getAllowedNextStatus;