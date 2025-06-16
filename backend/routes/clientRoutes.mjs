// File: defense/backend/routes/clientRoutes.mjs
import express from 'express';
import db from '../models/index.mjs'; // Adjust path if necessary based on your setup
import { authenticateToken } from '../middleware/authMiddleware.mjs'; // Adjust path if necessary
// Potentially add role checks from roleMiddleware if needed later

const router = express.Router();

/**
 * @route   GET /api/clients
 * @desc    Get all clients with their associated contacts
 * @access  Private (Requires Authentication)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const clients = await db.Client.findAll({
      include: [{
        model: db.Contact,
        as: 'contacts' // Use the alias defined in the association (models/index.mjs)
      }],
      order: [
        ['name', 'ASC'], // Default order by client name
        // Optionally order contacts as well, though might require separate queries for complex ordering
        // [{ model: db.Contact, as: 'contacts' }, 'isPrimary', 'DESC'],
        // [{ model: db.Contact, as: 'contacts' }, 'name', 'ASC'],
      ],
    });

    res.status(200).json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Internal server error while fetching clients.', error: error.message });
  }
});

// --- Future Routes ---
// GET /api/clients/:id - Get single client
// POST /api/clients - Create new client
// PUT /api/clients/:id - Update client
// DELETE /api/clients/:id - Delete client
// Routes for managing contacts specifically might also be needed

export default router;