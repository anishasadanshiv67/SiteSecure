const express = require('express');
const router = express.Router();
const { 
  createDrive, 
  getDrives, 
  getInspectorTasks, 
  submitTask, 
  getComplianceStats,
  getWeeklySummary,
  getDriveTasks
} = require('../controllers/inspectionController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(verifyToken);

router.post('/drive', authorizeRoles('compliance_officer', 'super_admin'), createDrive);
router.get('/drives', authorizeRoles('compliance_officer', 'super_admin'), getDrives);
router.get('/drives/:id/tasks', authorizeRoles('compliance_officer', 'super_admin'), getDriveTasks);
router.get('/stats', authorizeRoles('compliance_officer', 'super_admin'), getComplianceStats);
router.get('/summary', authorizeRoles('compliance_officer', 'super_admin'), getWeeklySummary);

router.get('/tasks', authorizeRoles('flagger', 'super_admin'), getInspectorTasks);
router.put('/tasks/:id/submit', authorizeRoles('flagger', 'super_admin'), upload.array('images', 5), submitTask);

module.exports = router;
