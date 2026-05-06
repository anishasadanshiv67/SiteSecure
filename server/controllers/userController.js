const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('siteIds', 'name location') // Populate site details
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get users by site
// @route   GET /api/users/site/:siteId
// @access  Private/Admin
const getUsersBySite = async (req, res) => {
  try {
    const users = await User.find({ siteIds: req.params.siteId }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign user to a site
// @route   PUT /api/users/:id/assign-site
// @access  Private/Admin
const assignUserToSite = async (req, res) => {
  try {
    const { siteId, role, unassign } = req.body;
    let update = {};
    
    if (unassign) {
      update = { $pull: { siteIds: siteId } };
    } else {
      update = { $addToSet: { siteIds: siteId } };
    }
    
    if (role) update.$set = { role };

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Bulk assign users to a site
// @route   PUT /api/users/bulk-assign-site
// @access  Private/Admin
const bulkAssignUsersToSite = async (req, res) => {
  try {
    const { userIds, siteId } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ message: 'User IDs array is required' });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $addToSet: { siteIds: siteId } }
    );

    res.json({ message: `${result.modifiedCount} personnel assigned successfully`, result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create a user
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, siteIds } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // RBAC: Only super_admin can create site_admin
    if (role === 'site_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Only super admins can create site admins' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      status: 'active',
      siteIds: siteIds || []
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    // RBAC: Only super_admin can promote to site_admin
    if (role === 'site_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Only super admins can promote to site admin' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update user status (activate/deactivate)
// @route   PUT /api/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    await user.deleteOne();
    res.json({ message: 'User removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUsersBySite,
  assignUserToSite,
  bulkAssignUsersToSite,
  createUser,
  updateUserRole,
  updateUserStatus,
  deleteUser
};
