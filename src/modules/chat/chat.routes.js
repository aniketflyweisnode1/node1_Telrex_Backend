const router = require('express').Router();
const controller = require('./chat.controller');
const auth = require('../../middlewares/auth.middleware');

router.get('/chats', auth, controller.getChats);
router.get('/chats/:id/messages', auth, controller.getChatMessages);
router.post('/chats/:id/messages', auth, controller.sendMessage);
router.post('/chats', auth, controller.createChat);

module.exports = router;

