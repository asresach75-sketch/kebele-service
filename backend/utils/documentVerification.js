const getDocumentVerificationUrl = (applicationId) => {
  const baseUrl = (process.env.PUBLIC_APP_URL || 'http://localhost:3001').replace(/\/+$/, '');
  return `${baseUrl}/verify-document/${encodeURIComponent(applicationId)}`;
};

module.exports = { getDocumentVerificationUrl };
