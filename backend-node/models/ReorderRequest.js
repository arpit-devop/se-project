import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

const reorderRequestSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => randomUUID()
  },
  medicine_id: {
    type: String,
    required: true
  },
  medicine_name: {
    type: String,
    required: true
  },
  current_quantity: {
    type: Number,
    required: true
  },
  requested_quantity: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'ordered', 'received'],
    default: 'pending'
  },
  requested_by: {
    type: String,
    required: true
  },
  created_at: {
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

export default mongoose.model('ReorderRequest', reorderRequestSchema);

