import {
  getReceiptApplicantName,
  getReceiptPaymentMethod,
  getRealPaymentReceipts,
  isSimulatedPayment,
} from './paymentReceipt';

describe('payment receipt display values', () => {
  it('does not print invalid test names as applicant names', () => {
    expect(getReceiptApplicantName('Asresach Adugna')).toBe('Asresach Adugna');
    expect(getReceiptApplicantName('a b as')).toBe('Update required');
    expect(getReceiptApplicantName('')).toBe('Not recorded');
  });

  it('detects simulated payment references even when the method was not saved', () => {
    expect(isSimulatedPayment('', 'TELEBIRR-SIM-1792981518231')).toBe(true);
    expect(getReceiptPaymentMethod('', 'TELEBIRR-SIM-1792981518231')).toBe('Telebirr (Simulated)');
    expect(getReceiptPaymentMethod('Chapa (Simulated)', '')).toBe('Chapa (Simulated)');
  });

  it('keeps real gateway payment methods distinct from simulated payments', () => {
    expect(isSimulatedPayment('Telebirr', 'TELEBIRR-12345')).toBe(false);
    expect(getReceiptPaymentMethod('Telebirr', 'TELEBIRR-12345')).toBe('Telebirr');
  });

  it('excludes simulated transactions from real revenue receipts', () => {
    const receipts = [
      { paymentMethod: 'Telebirr (Simulated)', paymentRef: 'TELEBIRR-SIM-123' },
      { paymentMethod: 'Chapa', paymentRef: 'CHAPA-123' },
      { paymentMethod: '', paymentRef: 'TELEBIRR-SIM-456' },
    ];

    expect(getRealPaymentReceipts(receipts)).toEqual([receipts[1]]);
  });
});
