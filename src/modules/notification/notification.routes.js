const router = require('express').Router();
const controller = require('./notification.controller');
const auth = require('../../middlewares/auth.middleware');

router.get('/notifications', controller.getNotifications);
router.put('/notifications/:id/read', auth, controller.markAsRead);

module.exports = router;

