const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    rentRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RentRecord',
      default: null,
    },
    type: {
      type: String,
      enum: ['rent_request', 'reminder', 'payment_confirmation'],
      required: true,
    },
    channel: { type: String, enum: ['whatsapp'], default: 'whatsapp' },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed'],
      default: 'pending',
    },
    providerMessageId: { type: String, default: '' },
    toNumber: { type: String, default: '' },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    response: { type: mongoose.Schema.Types.Mixed, default: {} },
    error: { type: String, default: '' },
  },
  { timestamps: true }
);

notificationLogSchema.index({ createdAt: -1 });
notificationLogSchema.index({ tenantId: 1, type: 1 });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
