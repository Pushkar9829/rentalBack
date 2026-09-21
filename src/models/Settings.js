const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    reminderDays: { type: [Number], default: [1, 3, 5, 7] },
    whatsappTemplates: {
      rentRequest: { type: String, default: 'rent_payment_request' },
      reminder: { type: String, default: 'rent_payment_reminder' },
      paymentConfirmation: { type: String, default: 'rent_payment_confirmation' },
    },
    paymentInstructions: {
      type: String,
      default: 'Please pay using the payment link or UPI shared by the landlord.',
    },
    supportContact: { type: String, default: '' },
    timezone: { type: String, default: 'Asia/Kolkata' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
