import { isValidApplicantName } from './idApplicationValidation';

export const getReceiptApplicantName = (name) => {
  const value = String(name || '').trim();
  if (!value) return 'Not recorded';
  return isValidApplicantName(value) ? value : 'Update required';
};

export const isSimulatedPayment = (paymentMethod, paymentRef) => (
  /simulat|demo/i.test(String(paymentMethod || ''))
  || /(?:^|-)(?:sim|demo)(?:-|$)/i.test(String(paymentRef || ''))
);

export const getRealPaymentReceipts = (receipts) => (
  receipts.filter((item) => !isSimulatedPayment(item.paymentMethod, item.paymentRef))
);

export const getReceiptPaymentMethod = (paymentMethod, paymentRef) => {
  const method = String(paymentMethod || '').trim();
  const reference = String(paymentRef || '').trim();
  const simulated = isSimulatedPayment(method, reference);
  const provider = method.replace(/\s*\(simulated\)\s*/i, '').trim()
    || (/^telebirr/i.test(reference) ? 'Telebirr' : /^chapa/i.test(reference) ? 'Chapa' : '');

  if (!provider && !simulated) return 'Not recorded';
  if (!provider) return 'Simulated payment';
  return simulated ? `${provider} (Simulated)` : provider;
};
