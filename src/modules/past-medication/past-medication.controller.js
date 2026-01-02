const pastMedicationService = require('./past-medication.service');

// Get all past medications
exports.getAllPastMedications = async (req, res, next) => {
  try {
    const medications = await pastMedicationService.getAllPastMedications(req.user.id);
    res.status(200).json({ success: true, data: medications });
  } catch (err) { next(err); }
};

// Get single past medication by ID
exports.getPastMedicationById = async (req, res, next) => {
  try {
    const medication = await pastMedicationService.getPastMedicationById(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: medication });
  } catch (err) { next(err); }
};

// Add new past medication record
exports.addPastMedication = async (req, res, next) => {
  try {
    const medication = await pastMedicationService.addPastMedication(req.user.id, req.body);
    res.status(201).json({ 
      success: true, 
      message: 'Past medication record added successfully', 
      data: medication 
    });
  } catch (err) { next(err); }
};

// Remove past medication record
exports.removePastMedication = async (req, res, next) => {
  try {
    const result = await pastMedicationService.removePastMedication(req.user.id, req.params.id);
    res.status(200).json({ 
      success: true, 
      message: result.message 
    });
  } catch (err) { next(err); }
};

// Update past medication record
exports.updatePastMedication = async (req, res, next) => {
  try {
    const medication = await pastMedicationService.updatePastMedication(req.user.id, req.params.id, req.body);
    res.status(200).json({ 
      success: true, 
      message: 'Past medication record updated successfully', 
      data: medication 
    });
  } catch (err) { next(err); }
};

