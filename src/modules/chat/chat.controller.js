const chatService = require('./chat.service');

exports.getChats = async (req, res, next) => {
  try {
    const chats = await chatService.getChats(req.user.id, req.query);
    res.status(200).json({ success: true, data: chats });
  } catch (err) { next(err); }
};

exports.getChatMessages = async (req, res, next) => {
  try {
    const chat = await chatService.getChatMessages(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: chat });
  } catch (err) { next(err); }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const chat = await chatService.sendMessage(req.user.id, req.params.id, req.body);
    res.status(201).json({ success: true, message: 'Message sent successfully', data: chat });
  } catch (err) { next(err); }
};

exports.createChat = async (req, res, next) => {
  try {
    const chat = await chatService.createChat(req.user.id, req.body);
    res.status(201).json({ success: true, message: 'Chat created successfully', data: chat });
  } catch (err) { next(err); }
};

