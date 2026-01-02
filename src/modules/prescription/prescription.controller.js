const prescriptionService = require('./prescription.service');

exports.getPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await prescriptionService.getPrescriptions(req.user.id, req.query);
    res.status(200).json({ success: true, data: prescriptions });
  } catch (err) { next(err); }
};

exports.getPrescriptionById = async (req, res, next) => {
  try {
    const prescription = await prescriptionService.getPrescriptionById(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: prescription });
  } catch (err) { next(err); }
};

exports.getPrescriptionPDF = async (req, res, next) => {
  try {
    const pdfUrl = await prescriptionService.getPrescriptionPDF(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: { pdfUrl } });
  } catch (err) { next(err); }
};

exports.reorderPrescription = async (req, res, next) => {
  try {
    const prescription = await prescriptionService.reorderPrescription(req.user.id, req.params.id);
    // This will redirect to order creation
    res.status(200).json({ 
      success: true, 
      message: 'Prescription ready for reorder',
      data: prescription 
    });
  } catch (err) { next(err); }
};

