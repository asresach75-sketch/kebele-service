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

export const getRenewalExpiryIssue = (expiryDate, today = new Date()) => {
  const expiry = parseDateOnly(expiryDate);
  if (!expiry) return expiryDate ? 'invalid' : 'missing';

  const currentDate = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  ));
  const addCalendarMonths = (date, months) => {
    const firstOfTargetMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
    const lastDayOfTargetMonth = new Date(Date.UTC(
      firstOfTargetMonth.getUTCFullYear(),
      firstOfTargetMonth.getUTCMonth() + 1,
      0
    )).getUTCDate();
    firstOfTargetMonth.setUTCDate(Math.min(date.getUTCDate(), lastDayOfTargetMonth));
    return firstOfTargetMonth;
  };

  if (expiry > addCalendarMonths(currentDate, 6)) return 'too_early';
  if (expiry < addCalendarMonths(currentDate, -12)) return 'too_late';
  return '';
};
