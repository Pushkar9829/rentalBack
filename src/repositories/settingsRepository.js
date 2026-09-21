const Settings = require('../models/Settings');

async function getSettings() {
  let settings = await Settings.findOne({ key: 'default' });
  if (!settings) {
    settings = await Settings.create({ key: 'default' });
  }
  return settings;
}

async function updateSettings(data) {
  return Settings.findOneAndUpdate({ key: 'default' }, data, {
    new: true,
    upsert: true,
  });
}

module.exports = { getSettings, updateSettings };
