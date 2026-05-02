const Log = require('../models/Log');

// @desc    Get all logs
// @route   GET /api/logs
// @access  Private
const getLogs = async (req, res) => {
  try {
    const logs = await Log.find()
      .populate('user', 'name')
      .populate('incident', 'title')
      .sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getLogs };
