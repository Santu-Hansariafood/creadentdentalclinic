import { format, isValid } from 'date-fns';

export const parseDate = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  return isValid(d) ? d : null;
};

export const formatDate = (date, formatStr = 'dd MMM yyyy') => {
  const d = parseDate(date);
  if (!d) return 'N/A';
  return format(d, formatStr);
};

export const formatDateTime = (date, formatStr = 'dd MMM yyyy, hh:mm a') => {
  const d = parseDate(date);
  if (!d) return 'N/A';
  return format(d, formatStr);
};
