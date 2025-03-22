'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const managerPassword = await bcrypt.hash('manager123', salt);
    const clientPassword = await bcrypt.hash('client123', salt);
    const guardPassword = await bcrypt.hash('guard123', salt);
    const userPassword = await bcrypt.hash('user123', salt);
    
    const now = new Date();
    
    // Insert seed users with different roles
    return queryInterface.bulkInsert('users', [
      {
        // Super Admin (CTO)
        username: 'admin_cto',
        email: 'cto@defensesecurity.com',
        password: adminPassword,
        role: 'admin_cto',
        first_name: 'Admin',
        last_name: 'CTO',
        phone_number: '555-123-4567',
        is_active: true,
        status: 'active',
        email_verified: true,
        created_at: now,
        updated_at: now
      },
      {
        // CEO Admin
        username: 'admin_ceo',
        email: 'ceo@defensesecurity.com',
        password: adminPassword,
        role: 'admin_ceo',
        first_name: 'Admin',
        last_name: 'CEO',
        phone_number: '555-123-4568',
        is_active: true,
        status: 'active',
        email_verified: true,
        created_at: now,
        updated_at: now
      },
      {
        // CFO Admin
        username: 'admin_cfo',
        email: 'cfo@defensesecurity.com',
        password: adminPassword,
        role: 'admin_cfo',
        first_name: 'Admin',
        last_name: 'CFO',
        phone_number: '555-123-4569',
        is_active: true,
        status: 'active',
        email_verified: true,
        created_at: now,
        updated_at: now
      },
      {
        // Manager
        username: 'manager1',
        email: 'manager@defensesecurity.com',
        password: managerPassword,
        role: 'manager',
        first_name: 'Security',
        last_name: 'Manager',
        phone_number: '555-123-4570',
        is_active: true,
        status: 'active',
        email_verified: true,
        created_at: now,
        updated_at: now
      },
      {
        // Client (Property Owner)
        username: 'client1',
        email: 'client@example.com',
        password: clientPassword,
        role: 'client',
        first_name: 'Property',
        last_name: 'Owner',
        phone_number: '555-123-4571',
        company_name: 'Luxury Properties Inc.',
        company_position: 'Property Manager',
        is_active: true,
        status: 'active',
        email_verified: true,
        created_at: now,
        updated_at: now
      },
      {
        // Guard
        username: 'guard1',
        email: 'guard@defensesecurity.com',
        password: guardPassword,
        role: 'guard',
        first_name: 'Security',
        last_name: 'Guard',
        phone_number: '555-123-4572',
        employee_id: 'G-10001',
        hire_date: new Date('2023-01-15'),
        security_license_number: 'SL12345',
        security_license_expiry: new Date('2025-01-15'),
        is_active: true,
        status: 'active',
        email_verified: true,
        created_at: now,
        updated_at: now
      },
      {
        // Regular User (Pending)
        username: 'newuser',
        email: 'newuser@example.com',
        password: userPassword,
        role: 'user',
        first_name: 'New',
        last_name: 'User',
        phone_number: '555-123-4573',
        is_active: true,
        status: 'pending',
        email_verified: false,
        created_at: now,
        updated_at: now
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    // Remove the seed users
    return queryInterface.bulkDelete('users', {
      username: {
        [Sequelize.Op.in]: ['admin_cto', 'admin_ceo', 'admin_cfo', 'manager1', 'client1', 'guard1', 'newuser']
      }
    }, {});
  }
};