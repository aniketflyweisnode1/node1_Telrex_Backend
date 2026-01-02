const healthRecordService = require('./health-record.service');

exports.getHealthRecords = async (req, res, next) => {
  try {
    const records = await healthRecordService.getHealthRecords(req.user.id, req.query);
    res.status(200).json({ success: true, data: records });
  } catch (err) { next(err); }
};

exports.createHealthRecord = async (req, res, next) => {
  try {
    const record = await healthRecordService.createHealthRecord(req.user.id, req.body);
    res.status(201).json({ success: true, message: 'Health record created successfully', data: record });
  } catch (err) { next(err); }
};

exports.shareHealthRecord = async (req, res, next) => {
  try {
    const record = await healthRecordService.shareHealthRecord(req.user.id, req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Health record shared successfully', data: record });
  } catch (err) { next(err); }
};

