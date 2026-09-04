require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Patient = require("./models/Patient");

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("connected");

    const users = await User.find().lean();
    console.log("users", users.length);
    console.log(
      users.map((u) => ({ email: u.email, phone: u.phone, role: u.role })),
    );

    const badUsers = await User.find({
      $or: [{ phone: { $in: ["", null] } }, { email: { $in: ["", null] } }],
    }).lean();
    console.log("badUsers", badUsers.length);
    console.log(
      badUsers.map((u) => ({ email: u.email, phone: u.phone, role: u.role })),
    );

    const patients = await Patient.find().lean();
    console.log("patients", patients.length);
    console.log(
      patients.map((p) => ({
        email: p.email,
        phone: p.phone,
        userId: p.userId,
      })),
    );

    const badPatients = await Patient.find({
      $or: [{ phone: { $in: ["", null] } }, { email: { $in: ["", null] } }],
    }).lean();
    console.log("badPatients", badPatients.length);
    console.log(
      badPatients.map((p) => ({
        email: p.email,
        phone: p.phone,
        userId: p.userId,
      })),
    );

    const tests = [
      { phone: "9999999999", email: "", role: "patient" },
      { phone: "9064527639", email: "newemail@example.com", role: "patient" },
      { phone: "9064527639", email: "", role: "patient" },
      { phone: "9064527639", email: "admin@creadent.com", role: "patient" },
    ];
    for (const t of tests) {
      const normalizedPhone = (t.phone || "").replace(/\D/g, "").slice(-10);
      const normalizedEmail = t.email?.trim().toLowerCase() || undefined;
      const orConditions = [{ phone: normalizedPhone }];
      if (normalizedEmail) {
        const escaped = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        orConditions.push({ email: { $regex: `^${escaped}$`, $options: "i" } });
      }
      const userExists = await User.findOne({
        $and: [{ $or: orConditions }, { role: t.role }],
      });
      console.log(
        "graphQL register test",
        t,
        "query",
        JSON.stringify({ $and: [{ $or: orConditions }, { role: t.role }] }),
        "userExists",
        userExists
          ? {
              email: userExists.email,
              phone: userExists.phone,
              role: userExists.role,
            }
          : null,
      );
    }

    await mongoose.disconnect();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
