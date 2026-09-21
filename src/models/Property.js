const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    unitNumber: { type: String, trim: true, default: '' },
    monthlyRent: { type: Number, default: 0, min: 0 },
    occupancyStatus: {
      type: String,
      enum: ['vacant', 'occupied'],
      default: 'vacant',
    },
    rentalStatus: {
      type: String,
      enum: ['available', 'rented', 'maintenance'],
      default: 'available',
    },
    assignedTenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      default: null,
    },
    tenantStartDate: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Property', propertySchema);
