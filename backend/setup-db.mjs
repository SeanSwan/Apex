// backend/setup-db.mjs
import sequelize from './config/database.mjs';
import User from './models/user.mjs';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const setupDatabase = async () => {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('Database connection successful!');

    // Sync all models with the database
    console.log('Syncing database models...');
    await sequelize.sync({ alter: true });
    console.log('Database synchronization complete!');

    // Check if an admin user exists
    const adminExists = await User.findOne({
      where: {
        role: 'super_admin'
      }
    });

    // Create a default admin user if none exists
    if (!adminExists) {
      console.log('Creating default admin user...');
      
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      await User.create({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@example.com',
        role: 'super_admin',
        first_name: 'System',
        last_name: 'Administrator',
        is_active: true,
        status: 'active',
        email_verified: true
      });
      
      console.log('Default admin user created successfully!');
      console.log('Username: admin');
      console.log(`Password: ${adminPassword}`);
      console.log('IMPORTANT: Please change this password immediately after logging in.');
    } else {
      console.log('Admin user already exists.');
    }

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
};

// Run the setup
setupDatabase();