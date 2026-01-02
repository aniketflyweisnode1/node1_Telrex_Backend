const Chat = require('../../models/Chat.model');
const Patient = require('../../models/Patient.model');
const AppError = require('../../utils/AppError');

// Get patient from userId
const getPatient = async (userId) => {
  const patient = await Patient.findOne({ user: userId });
  if (!patient) throw new AppError('Patient profile not found', 404);
  return patient;
};

// Get all chats
exports.getChats = async (userId, query = {}) => {
  const patient = await getPatient(userId);
  
  const filter = { patient: patient._id };
  if (query.status) filter.status = query.status;
  
  const chats = await Chat.find(filter)
    .populate('doctor', 'firstName lastName')
    .populate('prescription')
    .populate('order')
    .sort({ lastMessageAt: -1, createdAt: -1 });
  
  return chats;
};

// Get chat messages
exports.getChatMessages = async (userId, chatId) => {
  const patient = await getPatient(userId);
  
  const chat = await Chat.findOne({
    _id: chatId,
    patient: patient._id
  })
    .populate('doctor', 'firstName lastName')
    .populate('messages.sender', 'firstName lastName role');
  
  if (!chat) throw new AppError('Chat not found', 404);
  
  // Mark messages as read
  chat.messages.forEach(msg => {
    if (msg.sender._id.toString() !== userId && !msg.isRead) {
      msg.isRead = true;
      msg.readAt = new Date();
    }
  });
  await chat.save();
  
  return chat;
};

// Send message
exports.sendMessage = async (userId, chatId, data) => {
  const patient = await getPatient(userId);
  
  let chat = await Chat.findOne({
    _id: chatId,
    patient: patient._id
  });
  
  if (!chat) throw new AppError('Chat not found', 404);
  
  // Add message
  chat.messages.push({
    sender: userId,
    message: data.message,
    messageType: data.messageType || 'text',
    attachments: data.attachments || []
  });
  
  chat.lastMessageAt = new Date();
  await chat.save();
  
  chat = await Chat.findById(chat._id)
    .populate('messages.sender', 'firstName lastName role')
    .populate('doctor', 'firstName lastName');
  
  return chat;
};

// Create new chat
exports.createChat = async (userId, data) => {
  const patient = await getPatient(userId);
  
  const chat = await Chat.create({
    patient: patient._id,
    doctor: data.doctorId,
    prescription: data.prescriptionId,
    order: data.orderId,
    messages: data.message ? [{
      sender: userId,
      message: data.message,
      messageType: data.messageType || 'text'
    }] : []
  });
  
  return await Chat.findById(chat._id)
    .populate('doctor', 'firstName lastName')
    .populate('prescription')
    .populate('order');
};

