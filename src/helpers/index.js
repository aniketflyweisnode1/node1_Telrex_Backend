/**
 * Helpers Index - Export all helper modules
 */

const patientHelper = require('./patient.helper');
const productHelper = require('./product.helper');
const paginationHelper = require('./pagination.helper');
const doctorHelper = require('./doctor.helper');
const authHelper = require('./auth.helper');
const medicineHelper = require('./medicine.helper');
const healthHelper = require('./health.helper');
const footerHelper = require('./footer.helper');

module.exports = {
  // Patient helpers
  ...patientHelper,
  
  // Product helpers
  ...productHelper,
  
  // Pagination helpers
  ...paginationHelper,
  
  // Doctor helpers
  ...doctorHelper,
  
  // Auth helpers
  ...authHelper,
  
  // Medicine helpers
  ...medicineHelper,
  
  // Health helpers
  ...healthHelper,
  
  // Footer helpers
  ...footerHelper,
  
  // Namespaced exports for clarity
  patient: patientHelper,
  product: productHelper,
  pagination: paginationHelper,
  doctor: doctorHelper,
  auth: authHelper,
  medicine: medicineHelper,
  health: healthHelper,
  footer: footerHelper
};

