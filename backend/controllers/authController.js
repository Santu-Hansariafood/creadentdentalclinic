const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Login user
// @route   POST /api/login
// @access  Public
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
    res.status(401).json({ message: 'Invalid phone or password' });
  }
};

// @desc    Register user
// @route   POST /api/register
// @access  Public
const register = async (req, res) => {
  const { name, phone, email, password, role, specialization, license } = req.body;

  const userExists = await User.findOne({ $or: [{ email }, { phone }] });

  if (userExists) {
    res.status(400).json({ message: 'User with this email or phone already exists' });
    return;
  }

  const user = await User.create({
    name,
    phone,
    email,
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
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Forgot password
// @route   POST /api/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { phone } = req.body;

  const user = await User.findOne({ phone });
  if (!user) {
    res.status(404).json({ message: 'User not found with this mobile number' });
    return;
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP and expiry (10 minutes)
  user.resetPasswordOTP = otp;
  user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000;
  await user.save();

  console.log('====================================================');
  console.log(`WHATSAPP OTP SENT TO ${phone}: ${otp}`);
  console.log('====================================================');

  res.json({ success: true });
};

// @desc    Reset password
// @route   POST /api/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const { phone, otp, newPassword } = req.body;

  const user = await User.findOne({
    phone,
    resetPasswordOTP: otp,
    resetPasswordOTPExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400).json({ message: 'Invalid or expired OTP' });
    return;
  }

  user.password = newPassword;
  user.resetPasswordOTP = undefined;
  user.resetPasswordOTPExpires = undefined;
  await user.save();

  res.json({ success: true });
};

// @desc    Get current user
// @route   GET /api/me
// @access  Private
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
    res.status(404).json({ message: 'User not found' });
  }
};

module.exports = {
  login,
  register,
  forgotPassword,
  resetPassword,
  getMe,
};
