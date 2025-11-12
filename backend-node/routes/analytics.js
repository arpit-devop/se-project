import express from 'express';
import Medicine from '../models/Medicine.js';
import Prescription from '../models/Prescription.js';
import ReorderRequest from '../models/ReorderRequest.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Get dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    const medicines = await Medicine.find({}).limit(1000);
    const prescriptions = await Prescription.find({}).limit(1000);
    const reorders = await ReorderRequest.find({}).limit(1000);

    const total_medicines = medicines.length;
    const total_value = medicines.reduce((sum, med) => {
      return sum + (med.quantity * med.unit_price);
    }, 0);

    // Low stock items
    const low_stock = medicines.filter(med => med.quantity <= med.reorder_level);

    // Expiring soon (within 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiring_soon = medicines.filter(med => {
      const expiry = new Date(med.expiry_date);
      return expiry >= now && expiry <= thirtyDaysFromNow;
    });

    // Expired items
    const expired = medicines.filter(med => {
      return new Date(med.expiry_date) < now;
    });

    // Category distribution
    const categories = {};
    medicines.forEach(med => {
      const cat = med.category || 'Other';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    // Recent prescriptions
    const recent_prescriptions = prescriptions
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    // Pending reorders
    const pending_reorders = reorders.filter(r => r.status === 'pending');

    res.json({
      total_medicines,
      total_value: Math.round(total_value * 100) / 100,
      low_stock_count: low_stock.length,
      expiring_soon_count: expiring_soon.length,
      expired_count: expired.length,
      low_stock_items: low_stock.slice(0, 10),
      expiring_soon_items: expiring_soon.slice(0, 10),
      expired_items: expired,
      category_distribution: categories,
      recent_prescriptions,
      pending_reorders_count: pending_reorders.length,
      total_prescriptions: prescriptions.length
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ detail: error.message });
  }
});

export default router;

