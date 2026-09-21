const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    whatsappNumber: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    passwordHash: { type: String, default: '' },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      default: null,
    },
    unitNumber: { type: String, trim: true, default: '' },
    propertyAddress: { type: String, trim: true, default: '' },
    monthlyRent: { type: Number, required: true, min: 0 },
    securityDeposit: { type: Number, default: 0, min: 0 },
    rentDueDay: { type: Number, default: 1, min: 1, max: 28 },
    tenancyStartDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['active', 'inactive', 'vacated'],
      default: 'active',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

tenantSchema.index({ name: 'text', mobile: 'text', unitNumber: 'text' });
tenantSchema.index({ mobile: 1 });

tenantSchema.methods.comparePassword = async function comparePassword(password) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
};

tenantSchema.statics.hashPassword = async function hashPassword(password) {
  return bcrypt.hash(password, 10);
};

module.exports = mongoose.model('Tenant', tenantSchema);
