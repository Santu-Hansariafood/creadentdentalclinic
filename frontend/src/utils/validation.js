export const validateMobileNumber = (number) => {
  const mobileRegex = /^\d{10}$/;
  return mobileRegex.test(number);
};

export const validatePin = (pin) => {
  const pinRegex = /^\d{6}$/;
  return pinRegex.test(pin);
};

export const formatName = (name) => {
  if (!name) {
    return name;
  }
  return name
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const toCamelCase = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => toCamelCase(item));
  }
  if (typeof obj === "object") {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key
        .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
        .replace(/^([A-Z])/, (_, letter) => letter.toLowerCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {});
  }
  return obj;
};
