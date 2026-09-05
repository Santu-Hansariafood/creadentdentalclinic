const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { sendForgotPasswordOtpWhatsApp, normalizePhoneNumber } = require("../utils/whatsappNotifications");

const login = async (req, res) => {
  const { phone, password } = req.body;

  const user = await User.findOne({ phone });

  if (user && (await user.matchPassword(password))) {
    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } else {
    res.status(401).json({ message: "Invalid phone or password" });
  }
};

const register = async (req, res) => {
  const {
    name,
    phone,
    email: rawEmail,
    password,
    role,
    specialization,
    license,
  } = req.body;
  const email = rawEmail?.trim().toLowerCase() || undefined;
  const normalizedPhone = (phone || "").replace(/\D/g, "").slice(-10);

  if (normalizedPhone.length !== 10) {
    res.status(400).json({ message: "Phone number must contain 10 digits" });
    return;
  }

  const orConditions = [{ phone: normalizedPhone }];
  if (email) {
    const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    orConditions.push({
      email: { $regex: `^${escapedEmail}$`, $options: "i" },
    });
  }

  const userExists = await User.findOne({ $or: orConditions });

  if (userExists) {
    res
      .status(400)
      .json({ message: "User with this email or phone already exists" });
    return;
  }

  const emailToStore =
    email ||
    (role === "patient"
      ? `${normalizedPhone}@patient.creadent.local`
      : undefined);

  if (!emailToStore) {
    res
      .status(400)
      .json({ message: "Email is required for staff registration" });
    return;
  }

  const user = await User.create({
    name,
    phone: normalizedPhone,
    email: emailToStore,
    password,
    role,
    specialization,
    license,
    verified: true,
  });

  if (user) {
    res.status(201).json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
};

const forgotPassword = async (req, res) => {
  const { phone } = req.body;
  const normalizedPhone = normalizePhoneNumber(phone);

  const user = await User.findOne({ phone: normalizedPhone.slice(-10) });
  if (!user) {
    res.status(404).json({ message: "User not found with this mobile number" });
    return;
  }

  const now = Date.now();
  const windowStartedAt = user.passwordResetRequestWindowStartedAt?.getTime() || 0;
  if (now - windowStartedAt >= 60 * 60 * 1000) {
    user.passwordResetRequestCount = 0;
    user.passwordResetRequestWindowStartedAt = new Date(now);
  }
  if ((user.passwordResetRequestCount || 0) >= 3) {
    res.status(429).json({ message: "Too many password reset requests. Try again after one hour." });
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.resetPasswordOTP = otp;
  user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000;
  user.passwordResetRequestCount = (user.passwordResetRequestCount || 0) + 1;
  if (!user.passwordResetRequestWindowStartedAt) {
    user.passwordResetRequestWindowStartedAt = new Date(now);
  }
  await user.save();

  try {
    await sendForgotPasswordOtpWhatsApp({ phone: normalizedPhone, otp });
  } catch (error) {
    console.warn("Forgot password OTP WhatsApp send failed:", error.message);
  }

  res.json({ success: true });
};

const resetPassword = async (req, res) => {
  const { phone, otp, newPassword } = req.body;

  const user = await User.findOne({
    phone,
    resetPasswordOTP: otp,
    resetPasswordOTPExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400).json({ message: "Invalid or expired OTP" });
    return;
  }

  user.password = newPassword;
  user.resetPasswordOTP = undefined;
  user.resetPasswordOTPExpires = undefined;
  user.passwordResetRequestCount = 0;
  user.passwordResetRequestWindowStartedAt = undefined;
  await user.save();

  res.json({ success: true });
};

const getMe = async (req, res) => {
  if (req.user) {
    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

module.exports = {
  login,
  register,
  forgotPassword,
  resetPassword,
  getMe,
};
