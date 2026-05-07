const InspectionDrive = require('../models/InspectionDrive');
const InspectionTask = require('../models/InspectionTask');
const Subsite = require('../models/Subsite');
const Incident = require('../models/Incident');
const Log = require('../models/Log');
const mongoose = require('mongoose');

// @desc    Create inspection drive and tasks
// @route   POST /api/inspections/drive
// @access  Private (Compliance Officer)
exports.createDrive = async (req, res) => {
  try {
    const { title, description, inspectionType, siteId, subsiteIds, assignedInspectors, dueDate, checklist } = req.body;

    // Create Drive
    const drive = await InspectionDrive.create({
      title,
      description,
      inspectionType,
      siteId,
      assignedInspectors,
      dueDate,
      checklist,
      createdBy: req.user._id
    });

    // Create Tasks for each subsite
    const tasks = subsiteIds.map(subsiteId => ({
      inspectionDriveId: drive._id,
      siteId,
      subsiteId,
      assignedTo: assignedInspectors[0], // For simplicity, assign to first selected inspector or distribute
      checklistResults: (checklist || []).map(q => ({ question: q, checked: false })),
      status: 'pending'
    }));

    await InspectionTask.insertMany(tasks);

    // Log action
    await Log.create({
      user: req.user._id,
      action: 'Created Inspection Drive',
      details: `Drive: ${title} for site ${siteId}`
    });

    res.status(201).json(drive);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all drives for compliance officer
// @route   GET /api/inspections/drives
// @access  Private (Compliance Officer)
exports.getDrives = async (req, res) => {
  try {
    const { siteIds } = req.user;
    const userSiteIds = (siteIds || []).map(id => (id?._id || id)?.toString());

    let query = {};
    if (req.user.role !== 'super_admin') {
      query.siteId = { $in: userSiteIds };
    }

    const drives = await InspectionDrive.find(query)
      .populate('siteId', 'name')
      .populate('assignedInspectors', 'name')
      .sort({ createdAt: -1 });

    // Get progress for each drive
    const drivesWithStats = await Promise.all(drives.map(async (drive) => {
      const tasks = await InspectionTask.find({ inspectionDriveId: drive._id });
      const completed = tasks.filter(t => t.status === 'completed').length;
      const issues = tasks.filter(t => t.issueFound).length;
      const safe = tasks.filter(t => t.status === 'completed' && !t.issueFound).length;

      return {
        ...drive._doc,
        totalTasks: tasks.length,
        completedTasks: completed,
        issuesFound: issues,
        safeAreas: safe
      };
    }));

    res.json(drivesWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get tasks for inspector
// @route   GET /api/inspections/tasks
// @access  Private (Flagger)
exports.getInspectorTasks = async (req, res) => {
  try {
    const tasks = await InspectionTask.find({ assignedTo: req.user._id })
      .populate({
        path: 'inspectionDriveId',
        select: 'title inspectionType dueDate description'
      })
      .populate('siteId', 'name')
      .populate('subsiteId', 'name mapImage location description')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit inspection task
// @route   PUT /api/inspections/tasks/:id/submit
// @access  Private (Flagger)
exports.submitTask = async (req, res) => {
  try {
    const { checklistResults, remarks, issueFound, linkedIncidentId } = req.body;
    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    const task = await InspectionTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.checklistResults = JSON.parse(checklistResults || '[]');
    task.remarks = remarks;
    task.issueFound = issueFound === 'true';
    if (linkedIncidentId) task.linkedIncidentId = linkedIncidentId;
    if (images.length > 0) task.uploadedImages = [...task.uploadedImages, ...images];
    task.status = 'completed';
    task.completedAt = Date.now();

    await task.save();

    // Log action
    await Log.create({
      user: req.user._id,
      action: issueFound === 'true' ? 'Incident Raised during Inspection' : 'Safe Area Confirmed',
      details: `Task for subsite ${task.subsiteId} completed.`
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get stats for compliance dashboard
// @route   GET /api/inspections/stats
// @access  Private (Compliance Officer)
exports.getComplianceStats = async (req, res) => {
  try {
    const { siteIds } = req.user;
    const userSiteIds = (siteIds || []).map(id => (id?._id || id)?.toString());

    let query = {};
    if (req.user.role !== 'super_admin') {
      query.siteId = { $in: userSiteIds };
    }

    const drives = await InspectionDrive.find(query);
    const driveIds = drives.map(d => d._id);

    const tasks = await InspectionTask.find({ inspectionDriveId: { $in: driveIds } });

    res.json({
      activeDrives: drives.filter(d => d.status === 'active').length,
      pendingTasks: tasks.filter(t => t.status !== 'completed').length,
      completedInspections: tasks.filter(t => t.status === 'completed').length,
      issuesFound: tasks.filter(t => t.issueFound).length,
      safeAreas: tasks.filter(t => t.status === 'completed' && !t.issueFound).length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get weekly summary
// @route   GET /api/inspections/summary
// @access  Private (Compliance Officer)
exports.getWeeklySummary = async (req, res) => {
  try {
    const { siteIds } = req.user;
    const userSiteIds = (siteIds || []).map(id => (id?._id || id)?.toString());

    let query = {
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    };
    if (req.user.role !== 'super_admin') {
      query.siteId = { $in: userSiteIds };
    }

    const tasks = await InspectionTask.find(query)
      .populate('subsiteId', 'name')
      .populate('assignedTo', 'name')
      .populate('linkedIncidentId', 'title status severity');

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get tasks for a specific drive
// @route   GET /api/inspections/drives/:id/tasks
// @access  Private (Compliance Officer)
exports.getDriveTasks = async (req, res) => {
  try {
    const tasks = await InspectionTask.find({ inspectionDriveId: req.params.id })
      .populate('subsiteId', 'name')
      .populate('assignedTo', 'name')
      .populate('linkedIncidentId', 'title status severity')
      .sort({ createdAt: 1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
