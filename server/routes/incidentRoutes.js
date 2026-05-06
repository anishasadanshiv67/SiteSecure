const express = require('express');
const router = express.Router();
const { 
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
  getSubsiteIncidents,
  updateIncident,
  deleteIncident,
  escalateIncident,
  getComplianceIncidents,
  approveClosure,
  reinspectIncident
} = require('../controllers/incidentController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

router.use(verifyToken); // All incident routes are protected

// General routes
router.post('/', upload.array('images', 5), createIncident);
router.get('/my', getMyIncidents);
router.get('/all', getAllIncidents);
router.get('/subsite/:subsiteId', getSubsiteIncidents);
router.put('/:id', upload.array('images', 5), updateIncident);
router.delete('/:id', deleteIncident);

// Online Verifier routes
router.get('/reported', authorizeRoles('online_verifier'), getReportedIncidents);
router.put('/:id/approve', authorizeRoles('online_verifier'), approveIncident);
router.put('/:id/reject', authorizeRoles('online_verifier'), rejectIncident);
router.put('/:id/escalate', authorizeRoles('online_verifier'), escalateIncident);

// Ground Verifier routes
router.get('/approved', authorizeRoles('ground_verifier'), getApprovedIncidents);
router.put('/:id/verify', authorizeRoles('ground_verifier'), verifyIncident);

// Resolver routes
router.get('/verified', authorizeRoles('resolver'), getVerifiedIncidents);
router.put('/:id/resolve', authorizeRoles('resolver'), upload.array('images', 5), resolveIncident);

// Compliance Officer routes
router.get('/compliance', authorizeRoles('compliance_officer'), getComplianceIncidents);
router.put('/:id/compliance-approve', authorizeRoles('compliance_officer'), approveClosure);
router.put('/:id/reinspect', authorizeRoles('compliance_officer'), reinspectIncident);

module.exports = router;
