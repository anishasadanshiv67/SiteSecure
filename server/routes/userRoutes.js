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
router.use(authorizeRoles('site_admin', 'super_admin'));

router.get('/', getAllUsers);
router.get('/site/:siteId', getUsersBySite);
router.post('/', createUser);
router.put('/bulk-assign-site', bulkAssignUsersToSite);
router.put('/:id/role', updateUserRole);
router.put('/:id/status', updateUserStatus);
router.put('/:id/assign-site', assignUserToSite);
router.delete('/:id', deleteUser);

module.exports = router;
