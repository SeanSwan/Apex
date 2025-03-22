// backend/models/user.mjs
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.mjs';
import bcrypt from 'bcryptjs';

class User extends Model {
  // Instance method to check if password matches
  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }
  
  // Check if user has one of the specified roles
  hasRole(roles) {
    if (!Array.isArray(roles)) {
      roles = [roles];
    }
    return roles.includes(this.role);
  }
  
  // Check if user has admin permissions (any admin level)
  isAdmin() {
    return ['super_admin', 'admin_cto', 'admin_ceo', 'admin_cfo'].includes(this.role);
  }
  
  // Check if user has manager permissions
  isManager() {
    return this.role === 'manager' || this.isAdmin();
  }
  
  // Check if user has guard permissions
  isGuard() {
    return this.role === 'guard';
  }
  
  // Check if user has client permissions
  isClient() {
    return this.role === 'client';
  }
  
  // Format user object (remove sensitive fields)
  toJSON() {
    const values = Object.assign({}, this.get());
    delete values.password;
    delete values.reset_password_token;
    delete values.reset_password_expires;
    return values;
  }
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 50]
    }
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [6, 100]
    }
  },
  // Enhanced role system with hierarchy
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'user', // Default is unapproved/pending
    validate: {
      isIn: [
        [
          'super_admin',    // CTO level - highest privilege
          'admin_cto',      // CTO specific role
          'admin_ceo',      // CEO role
          'admin_cfo',      // CFO role
          'manager',        // Can manage guards and see most data
          'client',         // Property owners/managers
          'guard',          // Security personnel
          'user'            // Unapproved/pending accounts
        ]
      ]
    }
  },
  // Personal information
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  phone_number: {
    type: DataTypes.STRING,
    validate: {
      is: /^(\+\d{1,3})?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/
      // Validates common phone formats: +1 (123) 456-7890, 123-456-7890, 1234567890
    }
  },
  emergency_contact_name: {
    type: DataTypes.STRING
  },
  emergency_contact_phone: {
    type: DataTypes.STRING
  },
  // Profile and system information
  profile_image: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.STRING
  },
  city: {
    type: DataTypes.STRING
  },
  state: {
    type: DataTypes.STRING
  },
  zip_code: {
    type: DataTypes.STRING
  },
  date_of_birth: {
    type: DataTypes.DATEONLY
  },
  hire_date: {
    type: DataTypes.DATEONLY
  },
  employee_id: {
    type: DataTypes.STRING,
    unique: true
  },
  // Security & license information (for guards)
  security_license_number: {
    type: DataTypes.STRING
  },
  security_license_expiry: {
    type: DataTypes.DATEONLY
  },
  // Client-specific information
  company_name: {
    type: DataTypes.STRING
  },
  company_position: {
    type: DataTypes.STRING
  },
  // System access & security
  last_login: {
    type: DataTypes.DATE
  },
  reset_password_token: {
    type: DataTypes.STRING
  },
  reset_password_expires: {
    type: DataTypes.DATE
  },
  failed_login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  account_locked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  account_locked_until: {
    type: DataTypes.DATE
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  email_verification_token: {
    type: DataTypes.STRING
  },
  two_factor_auth_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  two_factor_auth_secret: {
    type: DataTypes.STRING
  },
  // Account status
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'active', 'suspended', 'terminated']]
    }
  },
  // System fields
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  last_active: {
    type: DataTypes.DATE
  },
  // Preferences & settings
  notifications_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  time_zone: {
    type: DataTypes.STRING,
    defaultValue: 'America/New_York'
  },
  language_preference: {
    type: DataTypes.STRING,
    defaultValue: 'en-US'
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  underscored: true,
  hooks: {
    // Hash password before saving
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    // Update timestamps
    beforeUpdate: (user) => {
      user.updated_at = new Date();
    }
  }
});

export default User;