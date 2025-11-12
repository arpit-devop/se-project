import express from 'express';
import ReorderRequest from '../models/ReorderRequest.js';
import Medicine from '../models/Medicine.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Get all reorders
router.get('/', async (req, res) => {
  try {
    const reorders = await ReorderRequest.find({}).limit(1000);
    res.json(reorders);
  } catch (error) {
    console.error('Get reorders error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Create reorder request
router.post('/', async (req, res) => {
  try {
    const { medicine_id } = req.body;
    
    const medicine = await Medicine.findOne({ id: medicine_id });
    if (!medicine) {
      return res.status(404).json({ detail: 'Medicine not found' });
    }

    const requested_quantity = medicine.reorder_level * 2;
    const reorder = new ReorderRequest({
      medicine_id,
      medicine_name: medicine.name,
      current_quantity: medicine.quantity,
      requested_quantity,
      status: 'pending',
      requested_by: req.user.email
    });

    await reorder.save();
    res.json({
      message: 'Reorder request created successfully',
      reorder_id: reorder.id
    });
  } catch (error) {
    console.error('Create reorder error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Update reorder status
router.patch('/:reorder_id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await ReorderRequest.updateOne(
      { id: req.params.reorder_id },
      { $set: { status } }
    );
    res.json({ message: 'Reorder status updated successfully' });
  } catch (error) {
    console.error('Update reorder error:', error);
    res.status(500).json({ detail: error.message });
  }
});

export default router;

