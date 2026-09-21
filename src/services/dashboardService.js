const tenantRepository = require('../repositories/tenantRepository');
const rentRepository = require('../repositories/rentRepository');
const { formatRentMonth, toCsv } = require('../utils/dates');

async function getDashboard(rentMonth) {
  const month = rentMonth || formatRentMonth();
  const activeTenants = await tenantRepository.findAll({ status: 'active' }, { limit: 1 });
  const activeCount = activeTenants.total;

  const agg = await rentRepository.aggregateByMonth(month);
  const byStatus = Object.fromEntries(agg.map((a) => [a._id, a]));

  const paid = byStatus.paid || { count: 0, amount: 0 };
  const pending = byStatus.pending || { count: 0, amount: 0 };
  const requested = byStatus.payment_requested || { count: 0, amount: 0 };
  const overdue = byStatus.overdue || { count: 0, amount: 0 };

  const totalExpected =
    (paid.amount || 0) + (pending.amount || 0) + (requested.amount || 0) + (overdue.amount || 0);
  const totalCollected = paid.amount || 0;
  const totalPending =
    (pending.amount || 0) + (requested.amount || 0) + (overdue.amount || 0);
  const pendingTenants =
    (pending.count || 0) + (requested.count || 0) + (overdue.count || 0);
  const collectionPercentage =
    totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 1000) / 10 : 0;

  return {
    rentMonth: month,
    totalActiveTenants: activeCount,
    totalMonthlyRent: totalExpected,
    totalAmountCollected: totalCollected,
    totalAmountPending: totalPending,
    paidTenants: paid.count || 0,
    pendingTenants,
    overdueTenants: overdue.count || 0,
    collectionPercentage,
    breakdown: {
      pending: pending.count || 0,
      payment_requested: requested.count || 0,
      paid: paid.count || 0,
      overdue: overdue.count || 0,
    },
  };
}

async function getReport(query) {
  const filter = {};
  if (query.rentMonth) filter.rentMonth = query.rentMonth;
  if (query.status) filter.status = query.status;
  if (query.tenantId) filter.tenantId = query.tenantId;
  if (query.type === 'pending') {
    filter.status = { $in: ['pending', 'payment_requested'] };
  }
  if (query.type === 'overdue') filter.status = 'overdue';
  if (query.type === 'collected') filter.status = 'paid';

  const { items, total } = await rentRepository.findAll(filter, {
    limit: parseInt(query.limit, 10) || 500,
  });

  const summary = {
    totalRecords: total,
    totalAmount: items.reduce((s, r) => s + (r.amount || 0), 0),
    collected: items.filter((r) => r.status === 'paid').reduce((s, r) => s + r.amount, 0),
    outstanding: items
      .filter((r) => r.status !== 'paid')
      .reduce((s, r) => s + r.amount, 0),
  };

  return { summary, items };
}

async function exportCsv(query) {
  const { items } = await getReport(query);
  const rows = items.map((r) => ({
    tenant: r.tenantId?.name || '',
    mobile: r.tenantId?.mobile || '',
    unit: r.tenantId?.unitNumber || r.propertyId?.unitNumber || '',
    property: r.propertyId?.name || '',
    rentMonth: r.rentMonth,
    amount: r.amount,
    dueDate: r.dueDate ? new Date(r.dueDate).toISOString().slice(0, 10) : '',
    status: r.status,
    paymentDate: r.paymentDate ? new Date(r.paymentDate).toISOString().slice(0, 10) : '',
    paymentReference: r.paymentReference || '',
  }));

  return toCsv(rows, [
    'tenant',
    'mobile',
    'unit',
    'property',
    'rentMonth',
    'amount',
    'dueDate',
    'status',
    'paymentDate',
    'paymentReference',
  ]);
}

module.exports = { getDashboard, getReport, exportCsv };
