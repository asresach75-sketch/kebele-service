const parseDateOnly = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim());
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    ? date
    : null;
};

const addCalendarMonths = (date, months) => {
  const targetMonth = date.getUTCMonth() + months;
  const firstOfTargetMonth = new Date(Date.UTC(date.getUTCFullYear(), targetMonth, 1));
  const lastDayOfTargetMonth = new Date(Date.UTC(
    firstOfTargetMonth.getUTCFullYear(),
    firstOfTargetMonth.getUTCMonth() + 1,
    0
  )).getUTCDate();
  firstOfTargetMonth.setUTCDate(Math.min(date.getUTCDate(), lastDayOfTargetMonth));
  return firstOfTargetMonth;
};

const getRenewalEligibilityError = ({
  reason,
  providedExpiryDate,
  registeredExpiryDate,
  today = new Date(),
}) => {
  if (!['EXPIRED', 'LOST', 'DAMAGED'].includes(reason)) {
    return 'Select whether your previous ID is expired, lost, or damaged.';
  }
  if (reason !== 'EXPIRED') return '';

  const providedExpiry = parseDateOnly(providedExpiryDate);
  if (!providedExpiry) return 'Enter the expiry date shown on your previous ID.';

  const registeredExpiryValue = registeredExpiryDate instanceof Date
    ? registeredExpiryDate.toISOString().slice(0, 10)
    : String(registeredExpiryDate || '').slice(0, 10);
  const registeredExpiry = registeredExpiryValue
    ? parseDateOnly(registeredExpiryValue)
    : null;
  if (registeredExpiryValue && !registeredExpiry) {
    return 'The existing ID expiry date could not be verified. Contact an officer.';
  }
  if (registeredExpiry && registeredExpiry.getTime() !== providedExpiry.getTime()) {
    return 'The expiry date does not match the existing ID record.';
  }

  const currentDate = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  ));
  if (providedExpiry > addCalendarMonths(currentDate, 6)) {
    return 'Your ID cannot be renewed yet because it has more than six months remaining.';
  }
  if (providedExpiry < addCalendarMonths(currentDate, -12)) {
    return 'Your ID expired more than one year ago and cannot be renewed. Please apply for a new ID.';
  }

  return '';
};

module.exports = { getRenewalEligibilityError };
