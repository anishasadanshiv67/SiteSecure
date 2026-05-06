const mongoose = require('mongoose');
const Incident = require('../models/Incident');
const Log = require('../models/Log');
const Subsite = require('../models/Subsite');

// @desc    Create new incident
// @route   POST /api/incidents
// @access  Private
const createIncident = async (req, res) => {
  try {
    const { title, description, severity, location, lat, lng, x, y, siteId, subsiteId } = req.body;
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    const { role, siteIds } = req.user;
    const userSiteIds = (siteIds || []).map(id => (id?._id || id)?.toString());

    // Enforce site assignment for non-super-admins
    if (role !== 'super_admin' && userSiteIds.length > 0 && !userSiteIds.includes(siteId)) {
      return res.status(403).json({ message: 'Unauthorized: You can only report incidents for your allotted sites' });
    }

    const incident = await Incident.create({
      title,
      description,
      severity,
      siteId,
      subsiteId,
      images,
      location: {
        address: location,
        lat: Number(lat),
        lng: Number(lng),
        x: Number(x),
        y: Number(y)
      },
      createdBy: req.user._id
    });

    // Log the action
    await Log.create({
      user: req.user._id,
      action: 'Reported Incident',
      incident: incident._id
    });

    res.status(201).json(incident);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get incidents by subsite
// @route   GET /api/incidents/subsite/:subsiteId
// @access  Private
const getSubsiteIncidents = async (req, res) => {
  try {
    const { subsiteId } = req.params;
    const { role, siteIds } = req.user;
    const userSiteIds = (siteIds || []).map(id => (id?._id || id)?.toString());

    if (!mongoose.Types.ObjectId.isValid(subsiteId)) {
      return res.status(400).json({ message: 'Invalid subsite ID' });
    }

    const subsite = await Subsite.findById(subsiteId);
    
    if (!subsite) {
      return res.status(404).json({ message: 'Subsite not found' });
    }

    if (role !== 'super_admin' && userSiteIds.length > 0 && !userSiteIds.includes(subsite.siteId.toString())) {
      return res.status(403).json({ message: 'Unauthorized access to this sub-zone' });
    }

    const incidents = await Incident.find({ subsiteId: new mongoose.Types.ObjectId(subsiteId) }).sort({ createdAt: -1 });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user's incidents
// @route   GET /api/incidents/my
// @access  Private
const getMyIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get reported incidents (for Online Verifier)
// @route   GET /api/incidents/reported
// @access  Private
const getReportedIncidents = async (req, res) => {
  try {
    const { role, siteIds } = req.user;
    const userSiteIds = (siteIds || []).map(id => (id?._id || id)?.toString());
    let query = { status: 'reported' };
    
    if (role !== 'super_admin') {
      if (userSiteIds.length === 0) return res.json([]);
      query.siteId = { $in: userSiteIds };
    }

    const incidents = await Incident.find(query)
      .populate('siteId', 'name')
      .populate('subsiteId', 'name mapImage')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    // Transform to include flat site/subsite names for easier frontend filtering
    const transformed = incidents.map(inc => ({
      ...inc._doc,
      siteName: inc.siteId?.name,
      subsiteName: inc.subsiteId?.name,
      subsiteMapImage: inc.subsiteId?.mapImage
    }));
    
    res.json(transformed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve incident
// @route   PUT /api/incidents/:id/approve
// @access  Private
const approveIncident = async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    // Log the action
    await Log.create({
      user: req.user._id,
      action: 'Approved Incident',
      incident: incident._id
    });

    res.json(incident);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Reject incident
// @route   PUT /api/incidents/:id/reject
// @access  Private
const rejectIncident = async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    // Log the action
    await Log.create({
      user: req.user._id,
      action: 'Rejected Incident',
      incident: incident._id
    });

    res.json(incident);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Escalate incident (Online Verifier -> Resolver)
// @route   PUT /api/incidents/:id/escalate
// @access  Private
const escalateIncident = async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { status: 'verified' },
      { new: true }
    );
    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    // Log the action
    await Log.create({
      user: req.user._id,
      action: 'Escalated to Resolver',
      incident: incident._id
    });

    res.json(incident);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get approved incidents (for Ground Verifier)
// @route   GET /api/incidents/approved
// @access  Private
const getApprovedIncidents = async (req, res) => {
  try {
    const { role, siteIds } = req.user;
    const userSiteIds = (siteIds || []).map(id => (id?._id || id)?.toString());
    let query = { status: 'approved' };
    
    if (role !== 'super_admin') {
      if (userSiteIds.length === 0) return res.json([]);
      query.siteId = { $in: userSiteIds };
    }

    const incidents = await Incident.find(query)
      .populate('siteId', 'name')
      .populate('subsiteId', 'name mapImage')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    const transformed = incidents.map(inc => ({
      ...inc._doc,
      siteName: inc.siteId?.name,
      subsiteName: inc.subsiteId?.name,
      subsiteMapImage: inc.subsiteId?.mapImage
    }));

    res.json(transformed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify incident (for Ground Team)
// @route   PUT /api/incidents/:id/verify
// @access  Private
const verifyIncident = async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { status: 'verified' },
      { new: true }
    );
    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    // Log the action
    await Log.create({
      user: req.user._id,
      action: 'Verified Incident',
      incident: incident._id
    });

    res.json(incident);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all incidents (History)
// @route   GET /api/incidents/all
// @access  Private
const getAllIncidents = async (req, res) => {
  try {
    const { siteId: querySiteId, status } = req.query;
    const { role, siteIds } = req.user;
    const userSiteIds = (siteIds || []).map(id => (id?._id || id)?.toString());
    let filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (role !== 'super_admin') {
      if (userSiteIds.length === 0) return res.json([]);
      
      if (querySiteId) {
        if (!userSiteIds.includes(querySiteId)) {
          return res.status(403).json({ message: 'Unauthorized: You do not have access to this site' });
        }
        filter.siteId = querySiteId;
      } else {
        filter.siteId = { $in: userSiteIds };
      }
    } else if (querySiteId) {
      filter.siteId = querySiteId;
    }

    // Ensure siteId is treated as ObjectId if it's a string
    if (filter.siteId && typeof filter.siteId === 'string' && mongoose.Types.ObjectId.isValid(filter.siteId)) {
      filter.siteId = new mongoose.Types.ObjectId(filter.siteId);
    } else if (filter.siteId && filter.siteId.$in) {
      filter.siteId.$in = filter.siteId.$in.map(id => 
        (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) ? new mongoose.Types.ObjectId(id) : id
      );
    }

    const incidents = await Incident.find(filter)
      .populate('siteId', 'name')
      .populate('subsiteId', 'name mapImage')
      .populate('createdBy', 'name email')
      .populate('complianceReview.reviewedBy', 'name')
      .sort({ createdAt: -1 });

    const transformed = incidents.map(inc => ({
      ...inc._doc,
      siteName: inc.siteId?.name,
      subsiteName: inc.subsiteId?.name,
      subsiteMapImage: inc.subsiteId?.mapImage
    }));

    res.json(transformed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get verified incidents (for Resolver Team)
// @route   GET /api/incidents/verified
// @access  Private
const getVerifiedIncidents = async (req, res) => {
  try {
    const { role, siteIds } = req.user;
    const userSiteIds = (siteIds || []).map(id => (id?._id || id)?.toString());
    let query = { status: 'verified' };
    
    if (role !== 'super_admin') {
      if (userSiteIds.length === 0) return res.json([]);
      query.siteId = { $in: userSiteIds };
    }

    const incidents = await Incident.find(query)
      .populate('siteId', 'name')
      .populate('subsiteId', 'name mapImage')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    const transformed = incidents.map(inc => ({
      ...inc._doc,
      siteName: inc.siteId?.name,
      subsiteName: inc.subsiteId?.name,
      subsiteMapImage: inc.subsiteId?.mapImage
    }));

    res.json(transformed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resolve incident
// @route   PUT /api/incidents/:id/resolve
// @access  Private
const resolveIncident = async (req, res) => {
  try {
    const { notes } = req.body;
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'compliance_review',
        resolution: {
          notes,
          images,
          resolvedAt: new Date()
        }
      },
      { new: true }
    );

    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    // Log the action
    await Log.create({
      user: req.user._id,
      action: 'Resolved - Sent for Compliance Review',
      incident: incident._id
    });

    res.json(incident);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update incident
// @route   PUT /api/incidents/:id
// @access  Private
const updateIncident = async (req, res) => {
  try {
    const { title, description, severity, locationName } = req.body;
    const updateData = { title, description, severity, 'location.address': locationName };
    
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => `/uploads/${file.filename}`);
    }

    const incident = await Incident.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      updateData,
      { new: true }
    );

    if (!incident) return res.status(404).json({ message: 'Incident not found or unauthorized' });
    res.json(incident);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete incident
// @route   DELETE /api/incidents/:id
// @access  Private
const deleteIncident = async (req, res) => {
  try {
    const incident = await Incident.findOneAndDelete({ 
      _id: req.params.id, 
      createdBy: req.user._id 
    });

    if (!incident) return res.status(404).json({ message: 'Incident not found or unauthorized' });

    // Log the action
    await Log.create({
      user: req.user._id,
      action: 'Deleted Incident',
      incident: incident._id
    });

    res.json({ message: 'Incident deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get incidents for compliance review
// @route   GET /api/incidents/compliance
// @access  Private
const getComplianceIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find({ status: 'compliance_review' })
      .populate('siteId', 'name')
      .populate('subsiteId', 'name mapImage')
      .populate('createdBy', 'name')
      .sort({ updatedAt: -1 });

    const transformed = incidents.map(inc => ({
      ...inc._doc,
      siteName: inc.siteId?.name,
      subsiteName: inc.subsiteId?.name,
      subsiteMapImage: inc.subsiteId?.mapImage
    }));

    res.json(transformed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve incident closure (Compliance Officer)
// @route   PUT /api/incidents/:id/compliance-approve
// @access  Private
const approveClosure = async (req, res) => {
  try {
    const { notes } = req.body;
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'closed',
        complianceReview: {
          notes,
          reviewedBy: req.user._id,
          reviewedAt: new Date()
        },
        closedAt: new Date()
      },
      { new: true }
    );

    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    await Log.create({
      user: req.user._id,
      action: 'Closed - Compliance Approved',
      incident: incident._id
    });

    res.json(incident);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Request re-inspection (Compliance Officer)
// @route   PUT /api/incidents/:id/reinspect
// @access  Private
const reinspectIncident = async (req, res) => {
  try {
    const { notes } = req.body;
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'verified',
        complianceReview: {
          notes,
          reviewedBy: req.user._id,
          reviewedAt: new Date()
        }
      },
      { new: true }
    );

    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    await Log.create({
      user: req.user._id,
      action: 'Re-inspection Required',
      incident: incident._id
    });

    res.json(incident);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createIncident,
  getMyIncidents,
  getReportedIncidents,
  approveIncident,
  rejectIncident,
  getApprovedIncidents,
  verifyIncident,
  getAllIncidents,
  getVerifiedIncidents,
  resolveIncident,
  updateIncident,
  deleteIncident,
  getComplianceIncidents,
  approveClosure,
  reinspectIncident,
  getSubsiteIncidents,
  escalateIncident
};
