const express = require('express');
const router = express.Router();
const { 
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
} = require('../controllers/siteController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'maps');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for maps
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `map-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

router.use(verifyToken);

// Site Routes
router.get('/', getSites);
router.get('/:id', getSiteById);
router.post('/', authorizeRoles('site_admin', 'super_admin'), upload.single('mapImage'), createSite);
router.put('/:id', authorizeRoles('site_admin', 'super_admin'), upload.single('mapImage'), updateSite);
router.delete('/:id', authorizeRoles('site_admin', 'super_admin'), deleteSite);
router.get('/stats', authorizeRoles('site_admin', 'super_admin'), getStats);

// Subsite Routes
router.get('/subsites/:siteId', getSubsites);
router.post('/subsites', authorizeRoles('site_admin', 'super_admin'), upload.single('mapImage'), createSubsite);
router.put('/subsites/:id', authorizeRoles('site_admin', 'super_admin'), upload.single('mapImage'), updateSubsite);
router.delete('/subsites/:id', authorizeRoles('site_admin', 'super_admin'), deleteSubsite);
router.get('/subsite/single/:id', getSubsiteById);

module.exports = router;
