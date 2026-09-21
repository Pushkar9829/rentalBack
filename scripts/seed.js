require('dotenv').config();
const { connectDB } = require('../src/config/db');
const env = require('../src/config/env');
const Admin = require('../src/models/Admin');
const Property = require('../src/models/Property');
const Tenant = require('../src/models/Tenant');
const RentRecord = require('../src/models/RentRecord');
const NotificationLog = require('../src/models/NotificationLog');
const ActivityLog = require('../src/models/ActivityLog');
const Settings = require('../src/models/Settings');
const { formatRentMonth, getDueDate } = require('../src/utils/dates');

async function seed() {
  await connectDB();

  // --- Admin (all fields) ---
  let admin = await Admin.findOne({ email: env.seed.email.toLowerCase() });
  if (!admin) {
    admin = await Admin.create({
      name: env.seed.name,
      email: env.seed.email,
      passwordHash: await Admin.hashPassword(env.seed.password),
      role: 'admin',
      isActive: true,
    });
    console.log('Admin created');
  } else {
    admin.name = env.seed.name;
    admin.role = 'admin';
    admin.isActive = true;
    admin.passwordHash = await Admin.hashPassword(env.seed.password);
    await admin.save();
    console.log('Admin upserted');
  }

  // --- Settings (all fields) ---
  const settings = await Settings.findOneAndUpdate(
    { key: 'default' },
    {
      key: 'default',
      reminderDays: [1, 3, 5, 7],
      whatsappTemplates: {
        rentRequest: 'rent_payment_request',
        reminder: 'rent_payment_reminder',
        paymentConfirmation: 'rent_payment_confirmation',
      },
      paymentInstructions:
        'Please pay using the payment link or UPI shared by the landlord.',
      supportContact: '+91-9876543210',
      timezone: 'Asia/Kolkata',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log('Settings seeded:', settings.key);

  // --- Properties + Tenants ---
  let properties = await Property.find().sort({ unitNumber: 1 });
  let tenants = await Tenant.find().sort({ name: 1 });

  if (properties.length === 0) {
    const start1 = new Date('2025-04-01');
    const start2 = new Date('2025-06-15');

    const p1 = await Property.create({
      name: 'Sunrise Apartments',
      address: '12 MG Road, Bengaluru',
      unitNumber: 'A-101',
      monthlyRent: 15000,
      occupancyStatus: 'occupied',
      rentalStatus: 'rented',
      assignedTenantId: null,
      tenantStartDate: start1,
      notes: 'Corner unit with balcony',
    });
    const p2 = await Property.create({
      name: 'Sunrise Apartments',
      address: '12 MG Road, Bengaluru',
      unitNumber: 'A-102',
      monthlyRent: 18000,
      occupancyStatus: 'occupied',
      rentalStatus: 'rented',
      assignedTenantId: null,
      tenantStartDate: start2,
      notes: 'Fully furnished 2BHK',
    });
    const p3 = await Property.create({
      name: 'Green Villa',
      address: '45 Park Street, Bengaluru',
      unitNumber: 'B-201',
      monthlyRent: 25000,
      occupancyStatus: 'vacant',
      rentalStatus: 'available',
      assignedTenantId: null,
      tenantStartDate: null,
      notes: 'Available for new tenancy',
    });

    const tenantPasswordHash = await Tenant.hashPassword(
      process.env.SEED_TENANT_PASSWORD || 'Tenant@123'
    );

    const t1 = await Tenant.create({
      name: 'Rahul Sharma',
      mobile: '9876543210',
      whatsappNumber: '919876543210',
      email: 'rahul@example.com',
      passwordHash: tenantPasswordHash,
      propertyId: p1._id,
      unitNumber: 'A-101',
      propertyAddress: p1.address,
      monthlyRent: 15000,
      securityDeposit: 30000,
      rentDueDay: 1,
      tenancyStartDate: start1,
      status: 'active',
      notes: 'Pays on time; prefers UPI',
    });
    const t2 = await Tenant.create({
      name: 'Priya Patel',
      mobile: '9876543211',
      whatsappNumber: '919876543211',
      email: 'priya@example.com',
      passwordHash: tenantPasswordHash,
      propertyId: p2._id,
      unitNumber: 'A-102',
      propertyAddress: p2.address,
      monthlyRent: 18000,
      securityDeposit: 36000,
      rentDueDay: 1,
      tenancyStartDate: start2,
      status: 'active',
      notes: 'WhatsApp reminders preferred',
    });

    await Property.findByIdAndUpdate(p1._id, {
      assignedTenantId: t1._id,
      occupancyStatus: 'occupied',
      rentalStatus: 'rented',
      tenantStartDate: start1,
    });
    await Property.findByIdAndUpdate(p2._id, {
      assignedTenantId: t2._id,
      occupancyStatus: 'occupied',
      rentalStatus: 'rented',
      tenantStartDate: start2,
    });

    properties = [p1, p2, p3];
    tenants = [t1, t2];
    console.log('Properties + tenants created with all fields');
  } else {
    // Backfill missing optional fields on existing docs
    for (const p of properties) {
      const patch = {};
      if (!p.notes) patch.notes = `Unit ${p.unitNumber || ''} — seeded notes`.trim();
      if (p.monthlyRent == null) patch.monthlyRent = 0;
      if (!p.occupancyStatus) patch.occupancyStatus = p.assignedTenantId ? 'occupied' : 'vacant';
      if (!p.rentalStatus) patch.rentalStatus = p.assignedTenantId ? 'rented' : 'available';
      if (Object.keys(patch).length) await Property.findByIdAndUpdate(p._id, patch);
    }
    for (const t of tenants) {
      const patch = {};
      if (!t.notes) patch.notes = 'Seeded tenant notes';
      if (!t.tenancyStartDate) patch.tenancyStartDate = new Date();
      if (!t.whatsappNumber && t.mobile) patch.whatsappNumber = t.mobile;
      if (t.securityDeposit == null) patch.securityDeposit = 0;
      if (!t.rentDueDay) patch.rentDueDay = 1;
      if (!t.status) patch.status = 'active';
      if (Object.keys(patch).length) await Tenant.findByIdAndUpdate(t._id, patch);
    }
    console.log(`Using existing properties (${properties.length}) and tenants (${tenants.length})`);
  }

  const activeTenants = tenants.filter((t) => t.status === 'active');
  const rentMonth = formatRentMonth();

  // --- RentRecord (all fields) ---
  let rentCount = await RentRecord.countDocuments();
  if (rentCount === 0 && activeTenants.length >= 1) {
    const t1 = activeTenants[0];
    const t2 = activeTenants[1] || activeTenants[0];
    const prop1 = t1.propertyId;
    const prop2 = t2.propertyId;

    const paidRent = await RentRecord.create({
      tenantId: t1._id,
      propertyId: prop1,
      rentMonth,
      amount: t1.monthlyRent,
      dueDate: getDueDate(rentMonth, t1.rentDueDay || 1),
      status: 'paid',
      paymentDate: new Date(),
      paymentReference: 'SEED-MANUAL-001',
      paymentMethod: 'manual',
      paymentLinkId: '',
      paymentLinkUrl: '',
      reminderCount: 0,
      lastReminderAt: null,
      reminderStatus: 'none',
    });

    const pendingRent = await RentRecord.create({
      tenantId: t2._id,
      propertyId: prop2,
      rentMonth,
      amount: t2.monthlyRent,
      dueDate: getDueDate(rentMonth, t2.rentDueDay || 1),
      status: 'payment_requested',
      paymentDate: null,
      paymentReference: '',
      paymentMethod: '',
      paymentLinkId: 'plink_seed_demo',
      paymentLinkUrl: 'https://rzp.io/seed-demo-link',
      reminderCount: 1,
      lastReminderAt: new Date(),
      reminderStatus: 'reminded',
    });

    console.log('Rent records seeded:', paidRent.rentMonth, pendingRent.status);

    // --- NotificationLog (all fields) ---
    await NotificationLog.create([
      {
        tenantId: t1._id,
        rentRecordId: paidRent._id,
        type: 'rent_request',
        channel: 'whatsapp',
        status: 'sent',
        providerMessageId: 'seed_msg_request_1',
        toNumber: t1.whatsappNumber,
        payload: {
          bodyText: `Hello ${t1.name}, rent request for ${rentMonth}`,
          templateName: 'rent_payment_request',
        },
        response: { mock: true, seeded: true },
        error: '',
      },
      {
        tenantId: t1._id,
        rentRecordId: paidRent._id,
        type: 'payment_confirmation',
        channel: 'whatsapp',
        status: 'delivered',
        providerMessageId: 'seed_msg_confirm_1',
        toNumber: t1.whatsappNumber,
        payload: {
          bodyText: `Payment received for ${rentMonth}`,
          templateName: 'rent_payment_confirmation',
        },
        response: { mock: true, seeded: true },
        error: '',
      },
      {
        tenantId: t2._id,
        rentRecordId: pendingRent._id,
        type: 'reminder',
        channel: 'whatsapp',
        status: 'sent',
        providerMessageId: 'seed_msg_reminder_1',
        toNumber: t2.whatsappNumber,
        payload: {
          bodyText: `Reminder: rent pending for ${rentMonth}`,
          templateName: 'rent_payment_reminder',
        },
        response: { mock: true, seeded: true },
        error: '',
      },
      {
        tenantId: t2._id,
        rentRecordId: pendingRent._id,
        type: 'rent_request',
        channel: 'whatsapp',
        status: 'failed',
        providerMessageId: '',
        toNumber: t2.whatsappNumber,
        payload: { bodyText: 'Failed sample for UI', templateName: 'rent_payment_request' },
        response: {},
        error: 'Seeded failed notification example',
      },
    ]);
    console.log('Notification logs seeded (4)');
  } else {
    console.log(`Rent records already present (${rentCount}), skipping rent/notification seed`);
  }

  // --- ActivityLog (all fields) ---
  const activityCount = await ActivityLog.countDocuments();
  if (activityCount === 0) {
    await ActivityLog.create([
      {
        adminId: admin._id,
        action: 'seed.completed',
        entityType: 'System',
        entityId: 'seed',
        meta: { source: 'scripts/seed.js', database: 'rent_management' },
      },
      {
        adminId: admin._id,
        action: 'admin.login',
        entityType: 'Admin',
        entityId: String(admin._id),
        meta: { note: 'Seeded sample activity' },
      },
    ]);
    console.log('Activity logs seeded (2)');
  } else {
    console.log(`Activity logs already present (${activityCount})`);
  }

  // Ensure all tenants have portal passwords
  const tenantPwd = process.env.SEED_TENANT_PASSWORD || 'Tenant@123';
  const hash = await Tenant.hashPassword(tenantPwd);
  const withoutPwd = await Tenant.find({
    $or: [{ passwordHash: { $exists: false } }, { passwordHash: '' }, { passwordHash: null }],
  });
  for (const t of withoutPwd) {
    t.passwordHash = hash;
    await t.save();
  }
  if (withoutPwd.length) {
    console.log(`Tenant portal passwords set for ${withoutPwd.length} tenant(s)`);
  }

  const summary = {
    admins: await Admin.countDocuments(),
    properties: await Property.countDocuments(),
    tenants: await Tenant.countDocuments(),
    rents: await RentRecord.countDocuments(),
    notifications: await NotificationLog.countDocuments(),
    activities: await ActivityLog.countDocuments(),
    settings: await Settings.countDocuments(),
  };
  console.log('Seed summary:', summary);
  console.log(`Admin login: ${env.seed.email} / ${env.seed.password}`);
  console.log(`Tenant portal login: mobile (e.g. 9876543210) / ${tenantPwd}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
