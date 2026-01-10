import User, { ROLES, ADMIN_EMAIL } from "../models/User.js";


// Get admin dashboard
export const getAdminDashboard = (req, res) => {
  res.json({ message: "Admin Dashboard", user: req.user });
};

// Get all engineers
export const getEngineers = async (req, res) => {
  try {
    const engineers = await User.find({ role: ROLES.MAINTENANCE_ENGINEER }).select('-password');
    res.json(engineers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create engineer
export const createEngineer = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });
    if (email === ADMIN_EMAIL) return res.status(403).json({ message: "Cannot use admin email" });
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: "User already exists" });
    
    const engineer = await User.create({ name, email, password, role: ROLES.MAINTENANCE_ENGINEER });
    res.status(201).json({
      id: engineer._id,
      name: engineer.name,
      email: engineer.email,
      role: engineer.role,
      isActive: engineer.isActive
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update engineer
export const updateEngineer = async (req, res) => {
  try {
    const { name, email, isActive, password } = req.body;
    const engineer = await User.findOne({ _id: req.params.id, role: ROLES.MAINTENANCE_ENGINEER });
    if (!engineer) return res.status(404).json({ message: "Engineer not found" });
    
    const updateData = {};
    if (name !== undefined) {
      const trimmedName = name.toString().trim();
      if (trimmedName.length === 0) return res.status(400).json({ message: "Name cannot be empty" });
      updateData.name = trimmedName;
    }
    if (email !== undefined) {
      const trimmedEmail = email.toString().trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) return res.status(400).json({ message: "Invalid email format" });
      if (trimmedEmail === ADMIN_EMAIL.toLowerCase()) return res.status(403).json({ message: "Cannot use admin email" });
      const existingUser = await User.findOne({ email: trimmedEmail, _id: { $ne: engineer._id } });
      if (existingUser) return res.status(409).json({ message: "Email already exists" });
      updateData.email = trimmedEmail;
    }
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') return res.status(400).json({ message: "isActive must be true or false" });
      updateData.isActive = isActive;
    }
    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
      updateData.password = password;
    }
    if (Object.keys(updateData).length === 0) return res.status(400).json({ message: "No fields provided for update" });
    
    Object.assign(engineer, updateData);
    await engineer.save();
    const updatedEngineer = await User.findById(engineer._id).select('-password');
    res.json(updatedEngineer);
  } catch (error) {
    console.error("Update engineer error:", error);
    if (error.code === 11000) return res.status(409).json({ message: "Email already exists" });
    res.status(500).json({ message: "Failed to update engineer" });
  }
};

// Delete engineer
export const deleteEngineer = async (req, res) => {
  try {
    const engineer = await User.findOne({ _id: req.params.id, role: ROLES.MAINTENANCE_ENGINEER });
    if (!engineer) return res.status(404).json({ message: "Engineer not found" });
    await User.findByIdAndDelete(req.params.id);
    res.json({
      message: "Engineer deleted successfully",
      deletedEngineer: { id: engineer._id, name: engineer.name, email: engineer.email }
    });
  } catch (error) {
    console.error("Delete engineer error:", error);
    if (error.name === 'CastError') return res.status(400).json({ message: "Invalid engineer ID format" });
    res.status(500).json({ message: "Failed to delete engineer" });
  }
};
