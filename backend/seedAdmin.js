const User = require('./models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'Admin User';
    const adminPhone = process.env.ADMIN_PHONE || '+1112223333';

    if (!adminEmail || !adminPassword) {
      console.log('Admin credentials not found in .env file');
      return;
    }

    const adminExists = await User.findOne({
      $and: [
        { $or: [{ email: adminEmail }, { phone: adminPhone }] },
        { role: 'admin' }
      ]
    });

    if (adminExists) {
      console.log('Admin user already exists');
      // Update password if needed
      adminExists.password = adminPassword;
      adminExists.name = adminName;
      adminExists.phone = adminPhone;
      adminExists.email = adminEmail;
      adminExists.role = 'admin';
      adminExists.verified = true;
      await adminExists.save();
      console.log('Admin user updated with .env credentials');
    } else {
      await User.create({
        name: adminName,
        email: adminEmail,
        phone: adminPhone,
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
