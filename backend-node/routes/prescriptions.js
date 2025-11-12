import express from 'express';
import Prescription from '../models/Prescription.js';
import Medicine from '../models/Medicine.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all prescriptions
router.get('/', async (req, res) => {
  try {
    const prescriptions = await Prescription.find({}).limit(1000);
    res.json(prescriptions);
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Create prescription
router.post('/', async (req, res) => {
  try {
    const {
      patient_name,
      patient_id,
      doctor_name,
      medicines,
      notes,
      prescription_image_path,
      ai_validation_result
    } = req.body;

    const prescription = new Prescription({
      patient_name,
      patient_id,
      doctor_name,
      medicines,
      status: 'pending',
      notes,
      prescription_image_path,
      ai_validation_result
    });

    await prescription.save();
    res.json(prescription);
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Validate prescription
router.patch('/:prescription_id/validate', async (req, res) => {
  try {
    const prescription = await Prescription.findOne({ id: req.params.prescription_id });
    if (!prescription) {
      return res.status(404).json({ detail: 'Prescription not found' });
    }

    const updates = {
      status: req.body.status,
      validated_by: req.user.email,
      updated_at: new Date()
    };
    if (req.body.notes) updates.notes = req.body.notes;

    await Prescription.updateOne({ id: req.params.prescription_id }, { $set: updates });
    res.json({ message: 'Prescription validated successfully' });
  } catch (error) {
    console.error('Validate prescription error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Dispense prescription
router.post('/:prescription_id/dispense', async (req, res) => {
  try {
    const prescription = await Prescription.findOne({ id: req.params.prescription_id });
    if (!prescription) {
      return res.status(404).json({ detail: 'Prescription not found' });
    }

    if (prescription.status !== 'validated') {
      return res.status(400).json({ detail: 'Prescription must be validated first' });
    }

    // Update medicine quantities
    for (const medItem of prescription.medicines) {
      const medicine = await Medicine.findOne({ id: medItem.medicine_id });
      if (medicine) {
        const newQuantity = medicine.quantity - medItem.quantity;
        await Medicine.updateOne(
          { id: medItem.medicine_id },
          { $set: { quantity: newQuantity, updated_at: new Date() } }
        );
      }
    }

    // Update prescription status
    await Prescription.updateOne(
      { id: req.params.prescription_id },
      {
        $set: {
          status: 'dispensed',
          dispensed_by: req.user.email,
          updated_at: new Date()
        }
      }
    );

    res.json({ message: 'Prescription dispensed successfully' });
  } catch (error) {
    console.error('Dispense prescription error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Validate prescription image (placeholder - AI integration can be added later)
router.post('/validate-image', async (req, res) => {
  try {
    // This is a placeholder - file upload handling would go here
    res.json({
      success: true,
      validation_result: 'AI validation is not configured for this environment.',
      image_analyzed: false
    });
  } catch (error) {
    console.error('Validate image error:', error);
    res.status(500).json({ detail: error.message });
  }
});

export default router;

