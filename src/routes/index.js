const express = require('express');
const router = express.Router();

/* =======================
   AUTH ROUTES
======================= */
router.use('/auth', require('../modules/auth/auth.routes'));

/* =======================
   HEALTH ROUTES (Public)
   Health categories, types (chronic conditions), medications, trendy, best offers
======================= */
router.use('/health', require('../modules/health/health.routes'));

/* =======================
   NEWSLETTER ROUTES (Public)
   Newsletter subscription and unsubscription
======================= */
router.use('/newsletter', require('../modules/newsletter/newsletter.routes'));

/* =======================
   FOOTER MANAGEMENT ROUTES (Must come before /admin to avoid route conflicts)
   Public: GET routes (view published sections)
   Admin/Sub-Admin: POST, PUT, DELETE routes (full CRUD)
======================= */
router.use('/admin/footer', require('../modules/footer/footer.routes'));

/* =======================
   BLOG CATEGORY MANAGEMENT ROUTES (Must come before /admin to avoid route conflicts)
   Public: GET routes (view active categories)
   Admin/Sub-Admin: POST, PUT, DELETE routes (full CRUD)
======================= */
router.use('/admin/blog-categories', require('../modules/blog-category/blog-category.routes'));

/* =======================
   BLOG MANAGEMENT ROUTES (Must come before /admin to avoid route conflicts)
   Public: GET routes (view published blogs)
   Admin/Sub-Admin: POST, PUT, DELETE routes (full CRUD)
======================= */
router.use('/admin/blogs', require('../modules/blog/blog.routes'));

/* =======================
   CONTACT FORM QUERY ROUTES (Must come before /admin to avoid route conflicts)
   Public: POST route (submit contact form query)
   Admin/Sub-Admin: GET, PUT, DELETE routes (full CRUD)
======================= */
router.use('/admin/contact-form-queries', require('../modules/contact-form-query/contact-form-query.routes'));

/* =======================
   MEDICINE ROUTES (Must come FIRST - All routes are PUBLIC, no authentication)
   Public: All routes (GET, POST, PUT, DELETE) - No authentication required
======================= */
router.use('/admin', require('../modules/medicine/medicine.routes'));

/* =======================
   ADMIN ROUTES (Contains public login endpoint)
   MUST come FIRST before other /admin routes to ensure public endpoints are accessible
   Public: POST /admin/login, POST /admin/register
   Protected: All other routes require admin authentication
======================= */
router.use('/admin/help', require('../modules/help-desk/help-desk.routes'));

/* =======================
   DOCTOR'S NOTE TEMPLATE ROUTES (Public GET, Admin/Sub-Admin for POST/PUT/DELETE)
   MUST come BEFORE generic /admin route to avoid middleware conflicts
   GET routes are public, POST/PUT/DELETE require authentication
======================= */
router.use('/admin/doctors-note-templates', require('../modules/doctors-note/doctors-note-admin.routes'));

router.use('/admin', require('../modules/admin/admin.routes'));

/* =======================
   SPECIALIZATION ROUTES (Public GET routes - Must come before /admin to avoid middleware conflicts)
   Public: GET routes (view specializations)
   Admin/Sub-Admin: POST, PUT, DELETE routes require authentication
======================= */
router.use('/admin/specializations', require('../modules/specialization/specialization.routes'));

/* =======================
   DOCTOR EARNINGS ROUTES (Admin/Sub-Admin Only)
   MUST come BEFORE doctor routes to avoid route conflicts
   This ensures /admin/doctors/earnings matches before /admin/doctors/:id
======================= */
router.use('/admin', require('../modules/doctor-earnings/doctor-earnings.routes'));

/* =======================
   DOCTOR ROUTES (Public GET routes - Must come after doctor-earnings to avoid route conflicts)
   Public: GET routes (view doctors, statistics, specialties, doctor by ID)
   Admin: POST, PUT, DELETE routes require admin authentication
======================= */
router.use('/admin/doctors', require('../modules/doctor/doctor.routes'));

/* =======================
   SUPPORT SYSTEM ADMIN ROUTES
   Admin/Sub-Admin: Full CRUD and chat management for support system
======================= */
router.use('/admin', require('../modules/support-system/support-system-admin.routes'));

/* =======================
   HELP DESK ROUTES
   Public: POST route (submit help desk query)
   Admin/Sub-Admin: GET, PUT, DELETE routes (full CRUD)
======================= */

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
   COMPLIANCE & SECURITY ROUTES (Admin/Sub-Admin Only)
======================= */
router.use('/admin/compliance-security', require('../modules/compliance-security/compliance-security.routes'));

/* =======================
   DOCTOR DASHBOARD ROUTES (Doctor Only)
======================= */
router.use('/doctor/dashboard', require('../modules/doctor-dashboard/doctor-dashboard.routes'));

/* =======================
   DOCTOR CONSULTATIONS ROUTES (Doctor Only)
======================= */
router.use('/doctor/consultations', require('../modules/doctor-consultations/doctor-consultations.routes'));

/* =======================
   DOCTOR EARNINGS ROUTES (Doctor Only)
======================= */
router.use('/doctor/earnings', require('../modules/doctor-earnings-doctor/doctor-earnings-doctor.routes'));

/* =======================
   SUPPORT SYSTEM ROUTES (Patient)
   Support system with Firebase integration for real-time messaging
======================= */
router.use('/patient', require('../modules/support-system/support-system.routes'));

/* =======================
   PATIENT ROUTES
======================= */
router.use('/patient', require('../modules/patient/patient.routes'));
router.use('/patient', require('../modules/intake-form/intake-form.routes'));
router.use('/patient', require('../modules/prescription/prescription.routes'));
router.use('/patient', require('../modules/refill/refill.routes'));
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
