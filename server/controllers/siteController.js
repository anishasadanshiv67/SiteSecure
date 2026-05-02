const Site = require('../models/Site');
const Subsite = require('../models/Subsite');
const Incident = require('../models/Incident');
const User = require('../models/User');
const QRCode = require('qrcode');
const mongoose = require('mongoose');

// @desc    Get all sites
// @route   GET /api/sites
// @access  Private
const getSites = async (req, res) => {
  try {
    let query = {};
    const { role, siteIds } = req.user;
    const userSiteIds = (siteIds || []).map(id => (id?._id || id)?.toString());

    // Restriction Logic:
    // 1. Super Admin sees everything.
    // 2. Site Admin sees their allotted sites IF assigned, otherwise they see all sites.
    // 3. Other roles MUST have at least one site in siteIds to see anything.
    if (role !== 'super_admin') {
      if (role === 'site_admin') {
        if (userSiteIds.length > 0) query._id = { $in: userSiteIds };
      } else {
        if (userSiteIds.length === 0) return res.json([]); 
        query._id = { $in: userSiteIds };
      }
    }
    
    const sites = await Site.find(query).sort({ createdAt: -1 });
    res.json(sites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single site
// @route   GET /api/sites/:id
// @access  Private
const getSiteById = async (req, res) => {
  try {
    const { role, siteIds } = req.user;
    const userSiteIds = (siteIds || []).map(id => (id?._id || id)?.toString());

    // Permission check
    if (role !== 'super_admin') {
      if (role === 'site_admin') {
        if (userSiteIds.length > 0 && !userSiteIds.includes(req.params.id)) {
          return res.status(403).json({ message: 'Unauthorized: Access restricted' });
        }
      } else {
        if (userSiteIds.length === 0 || !userSiteIds.includes(req.params.id)) {
          return res.status(403).json({ message: 'Unauthorized: Access restricted to your allotted sites' });
        }
      }
    }
    
    const site = await Site.findById(req.params.id);
    if (!site) return res.status(404).json({ message: 'Site not found' });
    res.json(site);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a site
// @route   POST /api/sites
// @access  Private/Admin
const createSite = async (req, res) => {
  try {
    const { name, description, location } = req.body;
    const mapImage = req.file ? `/uploads/maps/${req.file.filename}` : '';

    if (!mapImage) {
      return res.status(400).json({ message: 'Please upload a site map image' });
    }

    const site = await Site.create({
      name,
      description,
      location,
      mapImage,
      createdBy: req.user._id
    });

    res.status(201).json(site);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create a subsite
// @route   POST /api/sites/subsites
// @access  Private/Admin
const createSubsite = async (req, res) => {
  try {
    const { siteId, name, description, location, coordinates } = req.body;
    const mapImage = req.file ? `/uploads/maps/${req.file.filename}` : '';

    if (!mapImage) {
      return res.status(400).json({ message: 'Please upload a subsite map image' });
    }

    // Parse coordinates if they come as a string (from FormData)
    let parsedCoordinates = [];
    if (coordinates) {
      try {
        parsedCoordinates = typeof coordinates === 'string' ? JSON.parse(coordinates) : coordinates;
      } catch (err) {
        console.error('Error parsing coordinates:', err);
      }
    }

    // Create initial subsite object to get an ID if needed, 
    // or just use a placeholder and update. 
    // Actually, we can pre-generate the ID using mongoose.Types.ObjectId()
    const subsiteId = new mongoose.Types.ObjectId();

    // Generate QR Code containing the subsite ID
    const qrCodeData = await QRCode.toDataURL(subsiteId.toString());

    const subsite = await Subsite.create({
      _id: subsiteId,
      siteId,
      name,
      description,
      location,
      mapImage,
      qrCode: qrCodeData,
      coordinates: parsedCoordinates
    });

    res.status(201).json(subsite);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get subsites for a site
// @route   GET /api/sites/subsites/:siteId
// @access  Private
const getSubsites = async (req, res) => {
  try {
    const { role, siteIds } = req.user;
    const userSiteIds = (siteIds || []).map(id => (id?._id || id)?.toString());

    // Permission check
    if (role !== 'super_admin') {
      if (role === 'site_admin') {
        if (userSiteIds.length > 0 && !userSiteIds.includes(req.params.siteId)) {
          return res.status(403).json({ message: 'Unauthorized: Access restricted' });
        }
      } else {
        if (userSiteIds.length === 0 || !userSiteIds.includes(req.params.siteId)) {
          return res.status(403).json({ message: 'Unauthorized: Access restricted' });
        }
      }
    }

    const subsites = await Subsite.find({ siteId: req.params.siteId }).sort({ createdAt: -1 });
    res.json(subsites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get system stats
// @route   GET /api/sites/stats
// @access  Private/Admin
const getStats = async (req, res) => {
  try {
    const { role, siteIds } = req.user;
    const userSiteIds = (siteIds || []).map(id => (id?._id || id)?.toString());
    let query = {};
    let userQuery = {};

    if (role !== 'super_admin') {
      if (role === 'site_admin') {
        if (userSiteIds.length > 0) {
          query.siteId = { $in: userSiteIds };
          userQuery.siteIds = { $in: userSiteIds };
        }
      } else {
        if (userSiteIds.length === 0) return res.json({ totalUsers: 0, totalIncidents: 0, activeIncidents: 0 });
        query.siteId = { $in: userSiteIds };
        userQuery.siteIds = { $in: userSiteIds };
      }
    }

    const totalUsers = await User.countDocuments(userQuery);
    const totalIncidents = await Incident.countDocuments(query);
    const activeIncidents = await Incident.countDocuments({ ...query, status: { $ne: 'resolved' } });

    res.json({
      totalUsers,
      totalIncidents,
      activeIncidents
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a site
// @route   PUT /api/sites/:id
// @access  Private/Admin
const updateSite = async (req, res) => {
  try {
    const { name, description, location } = req.body;
    const updateData = { name, description, location };
    
    if (req.file) {
      updateData.mapImage = `/uploads/maps/${req.file.filename}`;
    }

    const site = await Site.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!site) return res.status(404).json({ message: 'Site not found' });
    res.json(site);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a site
// @route   DELETE /api/sites/:id
// @access  Private/Admin
const deleteSite = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) return res.status(404).json({ message: 'Site not found' });
    
    // Also delete all subsites related to this site
    await Subsite.deleteMany({ siteId: site._id });
    await site.deleteOne();
    
    res.json({ message: 'Site and all associated subsites removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a subsite
// @route   PUT /api/sites/subsites/:id
// @access  Private/Admin
const updateSubsite = async (req, res) => {
  try {
    const { name, description, location, coordinates } = req.body;
    const updateData = { name, description, location };
    
    if (coordinates) {
      try {
        updateData.coordinates = typeof coordinates === 'string' ? JSON.parse(coordinates) : coordinates;
      } catch (err) {
        console.error('Error parsing coordinates:', err);
      }
    }

    if (req.file) {
      updateData.mapImage = `/uploads/maps/${req.file.filename}`;
    }

    const subsite = await Subsite.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!subsite) return res.status(404).json({ message: 'Subsite not found' });
    res.json(subsite);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a subsite
// @route   DELETE /api/sites/subsites/:id
// @access  Private/Admin
const deleteSubsite = async (req, res) => {
  try {
    const subsite = await Subsite.findById(req.params.id);
    if (!subsite) return res.status(404).json({ message: 'Subsite not found' });
    
    await subsite.deleteOne();
    res.json({ message: 'Subsite removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single subsite
// @route   GET /api/sites/subsite/single/:id
// @access  Private
const getSubsiteById = async (req, res) => {
  try {
    const subsite = await Subsite.findById(req.params.id);
    if (!subsite) return res.status(404).json({ message: 'Subsite not found' });
    res.json(subsite);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSites,
  getSiteById,
  createSite,
  updateSite,
  deleteSite,
  createSubsite,
  updateSubsite,
  deleteSubsite,
  getSubsites,
  getStats,
  getSubsiteById
};
