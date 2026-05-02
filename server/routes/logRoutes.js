const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/logController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getLogs);

module.exports = router;
