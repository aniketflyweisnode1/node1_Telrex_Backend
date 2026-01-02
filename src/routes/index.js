const express = require('express');
const router = express.Router();

/* =======================
   AUTH ROUTES
======================= */
router.use('/auth', require('../modules/auth/auth.routes'));

/* =======================
   ADMIN ROUTES
======================= */
router.use('/admin', require('../modules/admin/admin.routes'));

/* =======================
   DOCTOR EARNINGS ROUTES (Admin/Sub-Admin Only)
   Must come before doctor routes to avoid route conflicts
======================= */
router.use('/admin', require('../modules/doctor-earnings/doctor-earnings.routes'));

/* =======================
   DOCTOR ROUTES (Admin Only)
======================= */
router.use('/admin/doctors', require('../modules/doctor/doctor.routes'));

/* =======================
   MEDICINE ROUTES (Admin/Sub-Admin Only)
======================= */
router.use('/admin', require('../modules/medicine/medicine.routes'));

/* =======================
   INTAKE FORM FIELD ROUTES (Admin/Sub-Admin Only)
======================= */
router.use('/admin', require('../modules/intake-form-field/intake-form-field.routes'));

/* =======================
   NOTIFICATION CAMPAIGN ROUTES (Admin/Sub-Admin Only)
   Unified API for Email, SMS, and Push Notifications
======================= */
router.use('/admin', require('../modules/notification-campaign/notification-campaign.routes'));

/* =======================
   ADMIN PATIENT MANAGEMENT ROUTES (Admin/Sub-Admin Only)
======================= */
router.use('/admin', require('../modules/admin-patient/admin-patient.routes'));

/* =======================
   FINANCIAL OVERVIEW ROUTES (Admin/Sub-Admin Only)
======================= */
router.use('/admin', require('../modules/financial-overview/financial-overview.routes'));

/* =======================
   REPORTS & EXPORTS ROUTES (Admin/Sub-Admin Only)
======================= */
router.use('/admin', require('../modules/reports/reports.routes'));

/* =======================
   DASHBOARD ROUTES (Admin/Sub-Admin Only)
======================= */
router.use('/admin', require('../modules/dashboard/dashboard.routes'));

/* =======================
   PATIENT ROUTES
======================= */
router.use('/patient', require('../modules/patient/patient.routes'));
router.use('/patient', require('../modules/intake-form/intake-form.routes'));
router.use('/patient', require('../modules/prescription/prescription.routes'));
router.use('/patient', require('../modules/address/address.routes'));
router.use('/patient', require('../modules/notification/notification.routes'));
router.use('/patient', require('../modules/chat/chat.routes'));
router.use('/patient', require('../modules/health-record/health-record.routes'));
router.use('/patient', require('../modules/past-medication/past-medication.routes'));
router.use('/patient', require('../modules/cart/cart.routes'));
router.use('/patient', require('../modules/doctors-note/doctors-note.routes'));
router.use('/patient', require('../modules/checkout/checkout.routes'));

/* =======================
   ORDER ROUTES
======================= */
router.use('/patient', require('../modules/order/order.routes'));

/* =======================
   PAYMENT ROUTES
======================= */
router.use('/patient', require('../modules/payment/payment.routes'));
router.use('/patient', require('../modules/payment-method/payment-method.routes'));

/* =======================
   HEALTH CHECK
======================= */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Telerxs Backend API',
    timestamp: new Date()
  });
});

module.exports = router;
