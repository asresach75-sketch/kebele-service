const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  if (typeof value === 'string') {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (dateOnly) {
      const [, year, month, day] = dateOnly;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      if (date.getFullYear() !== Number(year)
        || date.getMonth() !== Number(month) - 1
        || date.getDate() !== Number(day)) return null;
      return date;
    }
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const localDateKey = (value) => {
  const date = parseDate(value);
  if (!date) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const getVerifiedPaymentDate = (item) => {
  const directDate = parseDate(item.paymentVerifiedAt);
  if (directDate) return directDate;

  const history = Array.isArray(item.statusHistory) ? item.statusHistory : [];
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const status = String(history[index]?.status || '').trim().toUpperCase().replaceAll(' ', '_');
    if (['APPROVED_BY_FINANCE', 'PAYMENT_VERIFIED'].includes(status)) {
      const historyDate = parseDate(history[index]?.changedAt);
      if (historyDate) return historyDate;
    }
  }

  return null;
};

export const getReceiptsInDateRange = (receipts, dateFrom, dateTo) => receipts.filter((item) => {
  const paidDate = localDateKey(getVerifiedPaymentDate(item));
  return paidDate && (!dateFrom || paidDate >= dateFrom) && (!dateTo || paidDate <= dateTo);
});

export const sumReceiptAmounts = (items) => items.reduce(
  (total, item) => total + Number(item.amountPaid ?? item.paymentAmount ?? 0),
  0,
);

export const getRevenueChartSeries = (receipts, interval, referenceDate = new Date()) => {
  const bucketCount = interval === 'monthly' ? 12 : 14;
  const reference = parseDate(referenceDate) || new Date();
  const current = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const first = interval === 'monthly'
    ? new Date(current.getFullYear(), current.getMonth() - bucketCount + 1, 1)
    : new Date(current.getFullYear(), current.getMonth(), current.getDate() - bucketCount + 1);
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const date = interval === 'monthly'
      ? new Date(first.getFullYear(), first.getMonth() + index, 1)
      : new Date(first.getFullYear(), first.getMonth(), first.getDate() + index);
    const key = interval === 'monthly'
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      : localDateKey(date);
    return {
      key,
      label: interval === 'monthly'
        ? date.toLocaleDateString(undefined, { month: 'short' })
        : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      amount: 0,
    };
  });
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  receipts.forEach((item) => {
    const paidDate = getVerifiedPaymentDate(item);
    const dateKey = localDateKey(paidDate);
    const key = interval === 'monthly' ? dateKey.slice(0, 7) : dateKey;
    const bucket = bucketByKey.get(key);
    if (bucket) bucket.amount += Number(item.amountPaid ?? item.paymentAmount ?? 0);
  });

  return buckets;
};
