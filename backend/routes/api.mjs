// File: defense/backend/routes/api.mjs
import { Router } from 'express';
import { getUsers } from '../controllers/userController.mjs'; // Keep existing user route import

// Import the new client routes
import clientRoutes from './clientRoutes.mjs';

const router = Router();

// Keep existing /users route
router.get('/users', getUsers);

// Mount the new client routes
router.use('/clients', clientRoutes); // Mounts client routes under /api/clients

// Note: If you also need the other routes (auth, reports, etc.) mentioned
// in the file tree, they should be imported and mounted here as well.
// Example:
// import authRoutes from './authRoutes.mjs';
// router.use('/auth', authRoutes);

export default router;