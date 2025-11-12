import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

const prescriptionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => randomUUID()
  },
  patient_name: {
    type: String,
    required: true
  },
  patient_id: {
    type: String,
    required: true
  },
  doctor_name: {
    type: String,
    required: true
  },
  medicines: [{
    type: Object,
    required: true
  }],
  status: {
    type: String,
    enum: ['pending', 'validated', 'dispensed', 'rejected'],
    default: 'pending'
  },
  notes: {
    type: String,
    default: null
  },
  validated_by: {
    type: String,
    default: null
  },
  dispensed_by: {
    type: String,
    default: null
  },
  prescription_image_path: {
    type: String,
    default: null
  },
  ai_validation_result: {
    type: String,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: {
    transform: function(doc, ret) {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

prescriptionSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

export default mongoose.model('Prescription', prescriptionSchema);

