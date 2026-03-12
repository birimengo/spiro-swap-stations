import express from "express";
import {
  registerAdmin,
  loginAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  changePassword,
  deleteAdmin,
  verifyAdminToken
} from "../controllers/adminController.js";
import { authenticate, requireSuperAdmin } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

// Protected routes (require authentication)
router.get("/verify", authenticate, (req, res) => {
  res.json({ 
    valid: true, 
    admin: {
      _id: req.admin._id,
      username: req.admin.username,
      email: req.admin.email,
      fullName: req.admin.fullName,
      role: req.admin.role,
      permissions: req.admin.permissions
    }
  });
});

// Routes that require authentication
router.use(authenticate);

// Get all admins (superadmin only)
router.get("/", requireSuperAdmin, getAllAdmins);

// Get admin by ID
router.get("/:id", getAdminById);

// Update admin
router.put("/:id", updateAdmin);

// Change password
router.post("/:id/change-password", changePassword);

// Delete admin (superadmin only)
router.delete("/:id", requireSuperAdmin, deleteAdmin);

export default router;
