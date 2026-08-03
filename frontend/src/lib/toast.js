import { Slide, toast as toastifyToast } from "react-toastify";

const DEFAULT_OPTIONS = {
  position: "top-right",
  autoClose: 3000,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "light",
  transition: Slide,
};

const normalizeOptions = (options = {}) => {
  const { duration, iconTheme, ...rest } = options || {};

  return {
    ...DEFAULT_OPTIONS,
    ...rest,
    ...(typeof duration === "number" ? { autoClose: duration } : {}),
    ...(iconTheme?.primary
      ? {
          progressStyle: {
            background: iconTheme.primary,
          },
        }
      : {}),
  };
};

const createToast = (method) => (content, options) =>
  toastifyToast[method](content, normalizeOptions(options));

const baseToast = (content, options) =>
  toastifyToast(content, normalizeOptions(options));

const toast = Object.assign(baseToast, {
  success: createToast("success"),
  error: createToast("error"),
  info: createToast("info"),
  warning: createToast("warning"),
  warn: createToast("warning"),
  dark: createToast("dark"),
  loading: (content, options) =>
    toastifyToast.loading(content, {
      ...normalizeOptions(options),
      autoClose: false,
      closeOnClick: false,
    }),
  promise: (promise, messages, options) =>
    toastifyToast.promise(
      promise,
      {
        pending: messages?.loading,
        success: messages?.success,
        error: messages?.error,
      },
      normalizeOptions(options),
    ),
  dismiss: (id) => toastifyToast.dismiss(id),
  remove: (id) => toastifyToast.dismiss(id),
  update: (id, options) => toastifyToast.update(id, normalizeOptions(options)),
  done: (id) => toastifyToast.done(id),
  isActive: (id) => toastifyToast.isActive(id),
  clearWaitingQueue: () => toastifyToast.clearWaitingQueue(),
  custom: (content, options) => toastifyToast(content, normalizeOptions(options)),
});

export { toast };
export default toast;
