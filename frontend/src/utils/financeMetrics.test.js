import { describe, it, expect } from '@jest/globals';
import {
  getReceiptsInDateRange,
  getRevenueChartSeries,
  getVerifiedPaymentDate,
  localDateKey,
  sumReceiptAmounts,
} from './financeMetrics';

describe('finance revenue metrics', () => {
  it('filters the selected date range inclusively using the payment verification date', () => {
    const receipts = [
      { applicationId: 'before', paymentVerifiedAt: '2026-10-02T12:00:00.000Z', amountPaid: 100 },
      { applicationId: 'inside', paymentVerifiedAt: '2026-10-03T12:00:00.000Z', amountPaid: 150 },
      { applicationId: 'after', paymentVerifiedAt: '2026-10-04T12:00:00.000Z', amountPaid: 200 },
    ];

    const selected = getReceiptsInDateRange(receipts, '2026-10-03', '2026-10-03');

    expect(selected.map((item) => item.applicationId)).toEqual(['inside']);
    expect(sumReceiptAmounts(selected)).toBe(150);
  });

  it('prefers finance approval history over a later completion update date', () => {
    const item = {
      updatedAt: '2026-10-10T12:00:00.000Z',
      statusHistory: [
        { status: 'APPROVED_BY_FINANCE', changedAt: '2026-10-03T08:00:00.000Z' },
        { status: 'COMPLETED', changedAt: '2026-10-10T12:00:00.000Z' },
      ],
    };

    expect(localDateKey(getVerifiedPaymentDate(item))).toBe('2026-10-03');
  });

  it('does not treat generic application creation or update dates as payment dates', () => {
    const receipt = {
      createdAt: '2026-10-03T09:00:00.000Z',
      updatedAt: '2026-10-03T12:00:00.000Z',
      status: 'COMPLETED',
      statusHistory: [{ status: 'COMPLETED', changedAt: '2026-10-03T12:00:00.000Z' }],
      amountPaid: 200,
    };

    expect(getVerifiedPaymentDate(receipt)).toBeNull();
    expect(getReceiptsInDateRange([receipt], '2026-10-03', '2026-10-03')).toEqual([]);
  });

  it('handles date-only values as local dates and ignores invalid dates', () => {
    expect(localDateKey('2026-10-03')).toBe('2026-10-03');
    expect(localDateKey('2026-02-30')).toBe('');
  });

  it('aggregates verified receipts into daily and monthly chart buckets', () => {
    const receipts = [
      { paymentVerifiedAt: '2026-10-07T10:00:00', amountPaid: 100 },
      { paymentVerifiedAt: '2026-10-07T11:00:00', amountPaid: 50 },
      { paymentVerifiedAt: '2026-09-30T12:00:00', amountPaid: 200 },
      { paymentVerifiedAt: '2026-08-01T12:00:00', amountPaid: 300 },
    ];

    const daily = getRevenueChartSeries(receipts, 'daily', new Date(2026, 9, 7));
    const monthly = getRevenueChartSeries(receipts, 'monthly', new Date(2026, 9, 7));

    expect(daily).toHaveLength(14);
    expect(daily.find((bucket) => bucket.key === '2026-10-07').amount).toBe(150);
    expect(monthly).toHaveLength(12);
    expect(monthly.find((bucket) => bucket.key === '2026-10').amount).toBe(150);
    expect(monthly.find((bucket) => bucket.key === '2026-09').amount).toBe(200);
  });
});
