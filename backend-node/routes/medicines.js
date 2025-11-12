import express from 'express';
import Medicine from '../models/Medicine.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all medicines
router.get('/', async (req, res) => {
  try {
    const medicines = await Medicine.find({}).limit(1000);
    res.json(medicines);
  } catch (error) {
    console.error('Get medicines error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Get single medicine
router.get('/:medicine_id', async (req, res) => {
  try {
    const medicine = await Medicine.findOne({ id: req.params.medicine_id });
    if (!medicine) {
      return res.status(404).json({ detail: 'Medicine not found' });
    }
    res.json(medicine);
  } catch (error) {
    console.error('Get medicine error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Create medicine
router.post('/', async (req, res) => {
  try {
    const {
      name,
      generic_name,
      category,
      manufacturer,
      quantity,
      unit,
      reorder_level,
      unit_price,
      batch_number,
      expiry_date,
      location,
      description
    } = req.body;

    const medicine = new Medicine({
      name,
      generic_name,
      category,
      manufacturer,
      quantity,
      unit,
      reorder_level,
      unit_price,
      batch_number,
      expiry_date: new Date(expiry_date),
      location,
      description
    });

    await medicine.save();
    res.json(medicine);
  } catch (error) {
    console.error('Create medicine error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Update medicine
router.patch('/:medicine_id', async (req, res) => {
  try {
    const medicine = await Medicine.findOne({ id: req.params.medicine_id });
    if (!medicine) {
      return res.status(404).json({ detail: 'Medicine not found' });
    }

    const updates = {};
    if (req.body.quantity !== undefined) updates.quantity = req.body.quantity;
    if (req.body.reorder_level !== undefined) updates.reorder_level = req.body.reorder_level;
    if (req.body.unit_price !== undefined) updates.unit_price = req.body.unit_price;
    if (req.body.location !== undefined) updates.location = req.body.location;
    updates.updated_at = new Date();

    await Medicine.updateOne({ id: req.params.medicine_id }, { $set: updates });
    const updated = await Medicine.findOne({ id: req.params.medicine_id });
    res.json(updated);
  } catch (error) {
    console.error('Update medicine error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Delete medicine
router.delete('/:medicine_id', async (req, res) => {
  try {
    const result = await Medicine.deleteOne({ id: req.params.medicine_id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ detail: 'Medicine not found' });
    }
    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({ detail: error.message });
  }
});

export default router;

