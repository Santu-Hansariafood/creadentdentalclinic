const User = require('./models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'Admin User';

    if (!adminEmail || !adminPassword) {
      console.log('Admin credentials not found in .env file');
      return;
    }

    const adminExists = await User.findOne({ email: adminEmail });

    if (adminExists) {
      console.log('Admin user already exists');
      // Update password if needed
      adminExists.password = adminPassword;
      adminExists.name = adminName;
      adminExists.role = 'admin';
      adminExists.verified = true;
      await adminExists.save();
      console.log('Admin user updated with .env credentials');
    } else {
      await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        verified: true
      });
      console.log('Admin user created successfully from .env credentials');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error.message);
  }
};

module.exports = seedAdmin;
