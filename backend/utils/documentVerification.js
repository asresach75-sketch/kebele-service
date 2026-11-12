const VERIFIED_ID_SERVICE_TYPES = new Set(['NEW_ID_CARD', 'ID_RENEWAL', 'ID_REPLACEMENT']);

const getDocumentVerificationUrl = (applicationId) => {
  const baseUrl = (process.env.PUBLIC_APP_URL || 'http://localhost:3001').replace(/\/+$/, '');
  return `${baseUrl}/verify-document/${encodeURIComponent(applicationId)}`;
};

const isDocumentVerificationEligible = ({ serviceType, status, paymentStatus }) => (
  status === 'COMPLETED'
  || (
    VERIFIED_ID_SERVICE_TYPES.has(serviceType)
    && status === 'APPROVED_BY_FINANCE'
    && paymentStatus === 'Verified'
  )
);

module.exports = { getDocumentVerificationUrl, isDocumentVerificationEligible };
