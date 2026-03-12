import { ObjectId } from "mongodb";

export class Admin {
  constructor(data) {
    this.username = data.username;
    this.password = data.password; // Will be hashed
    this.email = data.email || "";
    this.fullName = data.fullName || "";
    this.phone = data.phone || "";
    this.role = data.role || "admin"; // 'superadmin' or 'admin'
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.lastLogin = data.lastLogin || null;
    this.stationsAdded = data.stationsAdded || 0;
    this.permissions = data.permissions || {
      canAddStations: true,
      canEditStations: true,
      canDeleteStations: false,
      canManageAdmins: false
    };
  }

  validate() {
    const errors = [];
    
    if (!this.username || this.username.length < 3) {
      errors.push("Username must be at least 3 characters");
    }
    if (!this.password || this.password.length < 6) {
      errors.push("Password must be at least 6 characters");
    }
    if (this.email && !this.email.includes("@")) {
      errors.push("Valid email is required");
    }
    
    return errors;
  }

  toJSON() {
    return {
      username: this.username,
      password: this.password, // Will be hashed before storing
      email: this.email,
      fullName: this.fullName,
      phone: this.phone,
      role: this.role,
      isActive: this.isActive,
      createdAt: this.createdAt,
      lastLogin: this.lastLogin,
      stationsAdded: this.stationsAdded,
      permissions: this.permissions
    };
  }

  // Remove sensitive data when sending to client
  toSafeJSON() {
    return {
      _id: this._id,
      username: this.username,
      email: this.email,
      fullName: this.fullName,
      phone: this.phone,
      role: this.role,
      isActive: this.isActive,
      createdAt: this.createdAt,
      lastLogin: this.lastLogin,
      stationsAdded: this.stationsAdded,
      permissions: this.permissions
    };
  }
}
