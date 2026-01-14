import User from "../models/user.js";
import { ROLES } from "../models/user.js";

// Get ADMIN_EMAIL directly from env with trim
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim() || "admin@company.com";

const initializeSingleAdmin = async () => {
  try {
    // Check if admin exists (also trim for comparison)
    const existingAdmin = await User.findOne({ 
      email: { $regex: new RegExp(`^${ADMIN_EMAIL}$`, 'i') } 
    });
    
    if (existingAdmin) {
      console.log("✅ Admin already exists");
      return;
    }

    const adminPassword = process.env.ADMIN_PASSWORD?.trim();
    if (!adminPassword) {
      console.error("❌ ADMIN_PASSWORD not set in .env");
      return;
    }

    // Create admin (email is already trimmed)
    await User.create({
      name: (process.env.ADMIN_NAME || "Admin").trim(),
      email: ADMIN_EMAIL,
      password: adminPassword,
      role: ROLES.ADMIN
    });

    console.log("✅ Admin created successfully");
    console.log(`📧 Email: ${ADMIN_EMAIL}`);
    console.log(`👤 Name: ${process.env.ADMIN_NAME || "Admin"}`);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
  }
};

export { ADMIN_EMAIL };
export default initializeSingleAdmin;