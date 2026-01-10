import User from "../models/User.js";

// Get engineer dashboard
export const getEngineerDashboard = (req, res) => {
  res.json({ 
    message: "Engineer Dashboard",
    user: req.user
  });
};

// Get engineer profile
export const getEngineerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// update engineer profile 
export const updateEngineerProfile = async (req, res) => {
  try {
    const { name, email, password, currentPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const updateData = {};
    let hasUpdates = false;
    let requiresCurrentPassword = false;
    
    // 1. Update name
    if (name !== undefined) {
      const trimmedName = name.toString().trim();
      if (trimmedName.length === 0) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      if (trimmedName.length > 100) {
        return res.status(400).json({ 
          message: "Name is too long (max 100 characters)" 
        });
      }
      updateData.name = trimmedName;
      hasUpdates = true;
    }
    
    // 2. Update email (with validation)
    if (email !== undefined) {
      const trimmedEmail = email.toString().trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      
      // Check if email exists (excluding current user)
      const existingUser = await User.findOne({ 
        email: trimmedEmail,
        _id: { $ne: user._id }
      });
      
      if (existingUser) {
        return res.status(409).json({ message: "Email already exists" });
      }
      
      updateData.email = trimmedEmail;
      hasUpdates = true;
    }
    
    // 3. Update password (requires current password for security)
    if (password !== undefined) {
      requiresCurrentPassword = true;
      
      if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ 
          message: "New password must be at least 6 characters" 
        });
      }
      
      updateData.password = password; // Will be hashed automatically
      hasUpdates = true;
    }
    
    // Verify current password if required
    if (requiresCurrentPassword) {
      if (!currentPassword) {
        return res.status(400).json({ 
          message: "Current password is required to change password or email" 
        });
      }
      
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ 
          message: "Current password is incorrect" 
        });
      }
    }
    
    if (!hasUpdates) {
      return res.status(400).json({ 
        message: "No fields provided for update" 
      });
    }
    
    // Apply updates
    Object.assign(user, updateData);
    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(user._id).select('-password');
    res.json(updatedUser);
    
  } catch (error) {
    console.error("Update profile error:", error);
    
    // Handle MongoDB duplicate key error for email
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(409).json({ message: "Email already exists" });
    }
    
    res.status(500).json({ 
      message: "Failed to update profile",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};