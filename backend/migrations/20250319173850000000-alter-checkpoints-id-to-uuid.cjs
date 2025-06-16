// File: defense/backend/migrations/20250319173850000000-alter-checkpoints-id-to-uuid.cjs (RENAME this file)
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('Attempting to alter checkpoints.id to UUID...');

      // 1. Enable uuid-ossp extension if not already enabled
      console.log('Ensuring uuid-ossp extension is enabled...');
      await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', { transaction });
      console.log('uuid-ossp extension enabled.');

      // --- Check if alteration is needed ---
      const columns = await queryInterface.sequelize.query(
        `SELECT data_type FROM information_schema.columns
         WHERE table_name = 'checkpoints' AND column_name = 'id' AND table_schema = 'public'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );

      if (columns.length > 0 && columns[0].data_type.toLowerCase().includes('uuid')) {
        console.log('checkpoints.id is already UUID type. Skipping alteration.');
        await transaction.commit();
        return;
      } else if (columns.length === 0) {
         await transaction.rollback();
         throw new Error('Checkpoints table does not exist or id column not found.');
      }
      console.log('checkpoints.id is currently INTEGER type. Proceeding with alteration.');

      // 2. Drop foreign key constraints referencing checkpoints.id
      //    We know checkpoint_scans.checkpoint_id is one. Add others if they exist.
      console.log('Dropping foreign key constraints referencing checkpoints.id...');
      try {
         // Find the actual constraint name first (names can vary)
         const fkNameResult = await queryInterface.sequelize.query(
           `SELECT conname FROM pg_constraint WHERE confrelid = 'checkpoints'::regclass AND conrelid = 'checkpoint_scans'::regclass AND conname LIKE '%checkpoint_id%';`,
           { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
         );
         if (fkNameResult.length > 0) {
            const fkName = fkNameResult[0].conname;
            console.log(`Found FK constraint name: ${fkName}. Dropping...`);
            await queryInterface.sequelize.query(`ALTER TABLE "checkpoint_scans" DROP CONSTRAINT "${fkName}";`, { transaction });
            console.log('Dropped FK constraint on checkpoint_scans.checkpoint_id.');
         } else {
            console.log('Could not find specific FK constraint on checkpoint_scans referencing checkpoints. Might have been dropped already or named differently.');
            // If the script fails later, manually check constraint names in your DB.
         }
      } catch (err) {
         console.warn(`Warning: Could not drop FK constraint on checkpoint_scans (maybe it doesn't exist?): ${err.message}`);
      }
      // *** Add similar blocks here to drop other FKs referencing checkpoints.id if necessary ***

      // 3. Drop the default value if it's linked to a sequence (common for SERIAL/INTEGER PKs)
      console.log('Dropping default value potentially linked to sequence for checkpoints.id...');
      await queryInterface.sequelize.query(`ALTER TABLE "checkpoints" ALTER COLUMN "id" DROP DEFAULT;`, { transaction }).catch(err => console.warn(`Could not drop default (maybe none exists): ${err.message}`)); // Catch error if no default exists

      // 4. Alter the column type to UUID and set a default value
      //    NOTE: This assumes no existing data needs conversion. If data exists, this is more complex.
      console.log('Altering checkpoints.id column type to UUID...');
      await queryInterface.sequelize.query(`ALTER TABLE "checkpoints" ALTER COLUMN "id" TYPE UUID USING (uuid_generate_v4());`, { transaction });
      console.log('Setting default value for checkpoints.id...');
      await queryInterface.sequelize.query(`ALTER TABLE "checkpoints" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();`, { transaction });
      console.log('checkpoints.id column altered successfully.');

      // 5. Re-add the foreign key constraints with the correct type
      console.log('Re-adding foreign key constraint on checkpoint_scans.checkpoint_id...');
       await queryInterface.sequelize.query(`
         ALTER TABLE "checkpoint_scans" ADD CONSTRAINT "checkpoint_scans_checkpoint_id_fkey"
         FOREIGN KEY ("checkpoint_id") REFERENCES "checkpoints"("id")
         ON UPDATE CASCADE ON DELETE CASCADE;
       `, { transaction });
      console.log('Re-added FK constraint on checkpoint_scans.');
      // *** Add similar blocks here to re-add other FKs referencing checkpoints.id if necessary ***


      await transaction.commit();
      console.log('Successfully altered checkpoints.id to UUID.');

    } catch (error) {
      console.error('Error during checkpoints.id alteration:', error);
      await transaction.rollback();
      throw error; // Re-throw error to fail the migration
    }
  },

  async down(queryInterface, Sequelize) {
    // Reversing this is complex and potentially destructive.
    // It would involve changing UUID back to INTEGER, potentially losing PK values.
    // For development, often you might just reset the DB or manually fix.
    console.warn('!!! Reverting migration alter-checkpoints-id-to-uuid is complex and not automatically implemented.');
    console.warn('!!! It requires changing checkpoints.id back to INTEGER, handling sequences, and adjusting FKs.');
    console.warn('!!! Manual database intervention might be required if you run `db:migrate:undo` on this.');
    // You could attempt a best-effort reversal here, but it's risky.
    // await queryInterface.sequelize.query('ALTER TABLE "checkpoints" ALTER COLUMN "id" TYPE INTEGER USING ?????'); // How to convert existing UUIDs back?
    throw new Error('Automatic down migration for alter-checkpoints-id-to-uuid not implemented due to complexity. Manual reversal may be needed.');
  }
};