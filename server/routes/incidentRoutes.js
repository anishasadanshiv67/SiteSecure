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
  escalateIncident
} = require('../controllers/incidentController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

const multer = require('multer');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

router.use(verifyToken); // All incident routes are protected

// General routes
router.post('/', upload.single('image'), createIncident);
router.get('/my', getMyIncidents);
router.get('/all', getAllIncidents);
router.get('/subsite/:subsiteId', getSubsiteIncidents);
router.put('/:id', upload.single('image'), updateIncident);
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
router.put('/:id/resolve', authorizeRoles('resolver'), upload.single('image'), resolveIncident);

module.exports = router;
