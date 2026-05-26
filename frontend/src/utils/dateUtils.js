import { format, isValid } from 'date-fns';

export const formatDate = (date, formatStr = 'dd MMM yyyy') => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (!isValid(d)) return 'Invalid Date';
  return format(d, formatStr);
};

export const formatDateTime = (date, formatStr = 'dd MMM yyyy, hh:mm a') => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (!isValid(d)) return 'Invalid Date';
  return format(d, formatStr);
};
