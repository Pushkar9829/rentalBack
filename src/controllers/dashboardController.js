const dashboardService = require('../services/dashboardService');
const { success } = require('../utils/response');

async function getDashboard(req, res, next) {
  try {
    const data = await dashboardService.getDashboard(req.query.rentMonth);
    return success(res, 200, 'Dashboard', data);
  } catch (err) {
    next(err);
  }
}

async function getReport(req, res, next) {
  try {
    const data = await dashboardService.getReport(req.query);
    return success(res, 200, 'Report', data);
  } catch (err) {
    next(err);
  }
}

async function exportCsv(req, res, next) {
  try {
    const csv = await dashboardService.exportCsv(req.query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="rent-report-${req.query.rentMonth || 'all'}.csv"`
    );
    return res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard, getReport, exportCsv };
