const router = require('express').Router();
const controller = require('./health-record.controller');
const auth = require('../../middlewares/auth.middleware');

router.get('/health-records', auth, controller.getHealthRecords);
router.post('/health-records', auth, controller.createHealthRecord);
router.post('/health-records/:id/share', auth, controller.shareHealthRecord);

module.exports = router;

