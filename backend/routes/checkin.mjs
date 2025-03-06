import express from 'express';
import Guard from '../models/guard.mjs';
import { checkInGuard } from '../services/groupme.mjs';
import { emitSocketEvent } from '../src/socket.js'; // Use the safer emitSocketEvent function

const router = express.Router();

router.post('/checkin', async (req, res) => {
  const { groupId, guardName, botId } = req.body;
  
  // Validate required fields
  if (!groupId || !guardName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const guard = await Guard.findOne({ where: { groupId, name: guardName } });
    if (guard) {
      guard.checkInTime = new Date();
      await guard.save();
    } else {
      await Guard.create({ groupId, name: guardName, checkInTime: new Date() });
    }
    
    // Send a notification to the GroupMe group
    if (botId) {
      await checkInGuard(groupId, guardName, botId);
    }
    
    // Emit a WebSocket event for guard check-in using the safer function
    emitSocketEvent('guard-update', { 
      groupId, 
      guardName, 
      checkInTime: new Date(),
      status: 'checked-in'
    });

    res.status(200).json({ message: 'Check-in recorded successfully' });
  } catch (error) {
    console.error('Error during check-in:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;