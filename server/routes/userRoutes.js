const express = require('express');
const router = express.Router();
const { 
  getAllUsers, 
  getUsersBySite,
  assignUserToSite,
  bulkAssignUsersToSite,
  createUser, 
  updateUserRole, 
  updateUserStatus,
  deleteUser
} = require('../controllers/userController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(verifyToken);
// Global protection for most user management routes, but we'll specificy for individual ones if needed or loosen global


router.get('/', authorizeRoles('site_admin', 'super_admin'), getAllUsers);
router.get('/site/:siteId', authorizeRoles('site_admin', 'super_admin', 'compliance_officer'), getUsersBySite);
router.post('/', authorizeRoles('site_admin', 'super_admin'), createUser);
router.put('/bulk-assign-site', authorizeRoles('site_admin', 'super_admin'), bulkAssignUsersToSite);
router.put('/:id/role', authorizeRoles('site_admin', 'super_admin'), updateUserRole);
router.put('/:id/status', authorizeRoles('site_admin', 'super_admin'), updateUserStatus);
router.put('/:id/assign-site', authorizeRoles('site_admin', 'super_admin'), assignUserToSite);
router.delete('/:id', authorizeRoles('site_admin', 'super_admin'), deleteUser);

module.exports = router;
