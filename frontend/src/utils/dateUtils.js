import {
  format,
  isValid,
  parseISO,
  isToday,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
  getDate,
} from "date-fns";

const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

const getOrdinalSuffix = (day) => {
  const j = day % 10;
  const k = day % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
};

export const parseDate = (date) => {
  if (!date) return null;

  if (date instanceof Date) {
    return isValid(date) ? date : null;
  }

  if (typeof date === "string") {
    const trimmedDate = date.trim();
    const dateOnlyMatch = trimmedDate.match(DATE_ONLY_REGEX);

    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      const d = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        0,
        0,
        0,
        0,
      );
      return isValid(d) ? d : null;
    }

    const isoParsed = parseISO(trimmedDate);
    if (isValid(isoParsed)) {
      return isoParsed;
    }
  }

  const d = new Date(date);
  return isValid(d) ? d : null;
};

export const formatDate = (date, formatStr = "dd MMM yyyy") => {
  const d = parseDate(date);
  if (!d) return "N/A";
  if (formatStr.includes("do")) {
    const day = getDate(d);
    const suffix = getOrdinalSuffix(day);
    const baseFormat = formatStr.replace("do", `d'${suffix}'`);
    return format(d, baseFormat);
  }
  return format(d, formatStr);
};

export const formatDateTime = (date, formatStr = "dd MMM yyyy, hh:mm a") => {
  const d = parseDate(date);
  if (!d) return "N/A";
  return format(d, formatStr);
};

export const isAppointmentPast = (date) => {
  const d = parseDate(date);
  if (!d) return false;
  return isBefore(endOfDay(d), startOfDay(new Date()));
};

export const isAppointmentToday = (date) => {
  const d = parseDate(date);
  return d ? isToday(d) : false;
};

export const isAppointmentUpcoming = (date) => {
  const d = parseDate(date);
  if (!d) return false;
  return isAfter(startOfDay(d), endOfDay(new Date()));
};
