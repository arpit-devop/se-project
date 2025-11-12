import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

const medicineSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => randomUUID()
  },
  name: {
    type: String,
    required: true
  },
  generic_name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  manufacturer: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true
  },
  reorder_level: {
    type: Number,
    required: true,
    min: 0
  },
  unit_price: {
    type: Number,
    required: true,
    min: 0
  },
  batch_number: {
    type: String,
    required: true
  },
  expiry_date: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  description: {
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

medicineSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

export default mongoose.model('Medicine', medicineSchema);

