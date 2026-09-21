const mongoose = require('mongoose');

const rentRecordSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      default: null,
    },
    rentMonth: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'payment_requested', 'paid', 'overdue'],
      default: 'pending',
    },
    paymentDate: { type: Date, default: null },
    paymentReference: { type: String, default: '' },
    paymentMethod: {
      type: String,
      enum: ['manual', 'razorpay', ''],
      default: '',
    },
    paymentLinkId: { type: String, default: '' },
    paymentLinkUrl: { type: String, default: '' },
    reminderCount: { type: Number, default: 0 },
    lastReminderAt: { type: Date, default: null },
    reminderStatus: {
      type: String,
      enum: ['none', 'requested', 'reminded'],
      default: 'none',
    },
  },
  { timestamps: true }
);

rentRecordSchema.index({ tenantId: 1, rentMonth: 1 }, { unique: true });
rentRecordSchema.index({ rentMonth: 1, status: 1 });

module.exports = mongoose.model('RentRecord', rentRecordSchema);
