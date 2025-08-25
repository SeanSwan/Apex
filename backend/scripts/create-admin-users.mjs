/**
 * APEX AI ADMIN USER CREATION SCRIPT
 * ==================================
 * Creates admin users for accessing the desktop app and AdminDashboard
 */

import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

class AdminUserCreator {
  constructor() {
    this.sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT) || 5432,
      database: process.env.PG_DB || 'apex',
      username: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || '',
      logging: false
    });
  }

  async createAdminUsers() {
    console.log('🔐 Creating APEX AI Admin Users...\n');
    
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('Admin123!', saltRounds);
    
    const adminUsers = [
      {
        username: 'cto_admin',
        email: 'cto@apexai.com',
        password: hashedPassword,
        role: 'super_admin',
        first_name: 'John',
        last_name: 'Smith',
        is_active: true,
        status: 'active'
      },
      {
        username: 'admin_user',
        email: 'admin@apexai.com', 
        password: hashedPassword,
        role: 'admin_cto',
        first_name: 'Sarah',
        last_name: 'Davis',
        is_active: true,
        status: 'active'
      },
      {
        username: 'manager_user',
        email: 'manager@apexai.com',
        password: hashedPassword,
        role: 'manager',
        first_name: 'Mike',
        last_name: 'Johnson',
        is_active: true,
        status: 'active'
      },
      {
        username: 'guard_user',
        email: 'guard@apexai.com',
        password: hashedPassword,
        role: 'guard',
        first_name: 'David',
        last_name: 'Wilson',
        is_active: true,
        status: 'active'
      }
    ];

    for (const userData of adminUsers) {
      try {
        const [user] = await this.sequelize.query(`
          INSERT INTO users (username, email, password, role, first_name, last_name, is_active, status, created_at, updated_at)
          VALUES (:username, :email, :password, :role, :first_name, :last_name, :is_active, :status, NOW(), NOW())
          ON CONFLICT (username) DO UPDATE SET 
            email = EXCLUDED.email,
            role = EXCLUDED.role,
            updated_at = NOW()
          RETURNING *
        `, {
          replacements: userData,
          type: this.sequelize.QueryTypes.INSERT
        });
        
        console.log(`✅ Created admin user: ${userData.username} (${userData.role})`);
      } catch (error) {
        console.error(`❌ Error creating user ${userData.username}:`, error.message);
      }
    }
  }

  async printAdminCredentials() {
    console.log('\n🔑 ADMIN LOGIN CREDENTIALS');
    console.log('=' .repeat(80));
    console.log('Use these credentials to access the AdminDashboard:');
    console.log('');
    
    console.log('🎖️  CTO/SUPER ADMIN ACCESS:');
    console.log('   Username: cto_admin');
    console.log('   Email: cto@apexai.com');
    console.log('   Password: Admin123!');
    console.log('   Role: super_admin (highest privileges)');
    console.log('');
    
    console.log('👨‍💼 ADMIN ACCESS:');
    console.log('   Username: admin_user');
    console.log('   Email: admin@apexai.com');
    console.log('   Password: Admin123!');
    console.log('   Role: admin_cto');
    console.log('');
    
    console.log('📊 MANAGER ACCESS:');
    console.log('   Username: manager_user');
    console.log('   Email: manager@apexai.com');
    console.log('   Password: Admin123!');
    console.log('   Role: manager');
    console.log('');
    
    console.log('🛡️  GUARD ACCESS:');
    console.log('   Username: guard_user');
    console.log('   Email: guard@apexai.com');
    console.log('   Password: Admin123!');
    console.log('   Role: guard');
    console.log('');
    
    console.log('=' .repeat(80));
    console.log('');
    console.log('🚀 USAGE INSTRUCTIONS:');
    console.log('1. Navigate to: http://localhost:5173');
    console.log('2. Click "Enter Defense Site"');
    console.log('3. Login with any admin credentials above');
    console.log('4. Access the AdminDashboard tab to see the completed dashboard!');
    console.log('');
  }

  async execute() {
    try {
      await this.sequelize.authenticate();
      console.log('✅ Database connection successful\n');
      
      await this.createAdminUsers();
      await this.printAdminCredentials();
      
      await this.sequelize.close();
      
    } catch (error) {
      console.error('❌ Error creating admin users:', error);
      await this.sequelize.close();
      process.exit(1);
    }
  }
}

// Execute admin user creation
const creator = new AdminUserCreator();
creator.execute().catch(console.error);
