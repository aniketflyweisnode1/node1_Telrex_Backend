# Telerxs Backend API Documentation

## Base URL
All APIs are prefixed with `/api/v1`

---

## Admin APIs

### Admin Registration
**POST** `/admin/register`

Register a new admin account. This endpoint is used for initial admin setup.

**Request Body:**
```json
{
  "firstName": "Admin",
  "lastName": "User",
  "email": "admin@example.com",
  "phoneNumber": "1234567890",
  "countryCode": "+91",
  "password": "Admin@123",
  "adminSecretKey": "your-secret-key-here"
}
```

**Required Fields:**
- `firstName` - First name (2-50 characters)
- `lastName` - Last name (2-50 characters)
- `email` - Valid email address
- `phoneNumber` - Valid phone number

**Optional Fields:**
- `countryCode` - Country code (default: "+91")
- `password` - Password (default: "Admin@123" if not provided)
  - Must be at least 6 characters
  - Must contain at least one uppercase letter, one lowercase letter, and one number
- `adminSecretKey` - Admin secret key (required if `ADMIN_SECRET_KEY` is set in environment variables, or if an admin already exists)

**Security Rules:**
1. **First Admin (No existing admin):**
   - Can register without `adminSecretKey` if no admin exists in database
   - This allows initial setup

2. **Subsequent Admins:**
   - If `ADMIN_SECRET_KEY` is set in `.env`, `adminSecretKey` must match it
   - If an admin already exists and no `ADMIN_SECRET_KEY` is set, registration is blocked
   - This prevents unauthorized admin creation

**Response:**
```json
{
  "success": true,
  "message": "Admin registered successfully",
  "data": {
    "user": {
      "id": "admin_id",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com",
      "phoneNumber": "1234567890",
      "countryCode": "+91",
      "role": "admin",
      "isActive": true,
      "isVerified": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

**Error Responses:**
- `400` - Validation failed
- `403` - Invalid admin secret key or admin registration restricted
- `409` - User with this email or phone number already exists

**Notes:**
- Admin is automatically verified (`isVerified: true`)
- Admin is automatically activated (`isActive: true`)
- Tokens are returned immediately (no OTP verification required)
- Default password is "Admin@123" if not provided
- To secure admin registration, set `ADMIN_SECRET_KEY` in your `.env` file:
  ```env
  ADMIN_SECRET_KEY=your-super-secret-key-here
  ```

**Environment Variable:**
```env
ADMIN_SECRET_KEY=your-super-secret-key-here
```

### Admin Login
**POST** `/admin/login`

Login as admin using email/phone and password.

**Request Body:**
```json
{
  "identifier": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin logged in successfully",
  "data": {
    "user": {
      "id": "admin_id",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com",
      "phoneNumber": "1234567890",
      "role": "admin",
      "isActive": true,
      "isVerified": true,
      "lastLoginAt": "2024-01-15T10:30:00.000Z"
    },
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

**Notes:**
- `identifier` can be either email address or phone number
- Only users with `role: 'admin'` can login through this endpoint
- User's `isActive` status is set to `true` on successful login

### Get Available Modules
**GET** `/admin/modules`

Get list of all available modules for permission management.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "message": "Available modules retrieved successfully",
  "data": [
    { "module": "dashboard", "label": "Dashboard" },
    { "module": "provider-management", "label": "Provider Management" },
    { "module": "medicine-management", "label": "Medicine Management" },
    { "module": "patient-management", "label": "Patient Management" },
    { "module": "prescription-order-management", "label": "Prescription & Order Management" },
    { "module": "financial-overview", "label": "Financial Overview" },
    { "module": "compliance-security", "label": "Compliance & Security" },
    { "module": "marketing-notifications", "label": "Marketing & Notifications" },
    { "module": "reports-exports", "label": "Reports & Exports" }
  ]
}
```

### Create Sub-Admin
**POST** `/admin/sub-admins`

Create a new sub-admin account.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "firstName": "Sarah",
  "lastName": "Jenkins",
  "email": "sarah.j@mediprime.com",
  "phoneNumber": "9876543210",
  "countryCode": "+91",
  "designation": "Medicine Manager",
  "password": "SubAdmin@123",
  "role":"sub-admin"
}
```

**Required Fields:**
- `firstName` - First name (2-50 characters)
- `lastName` - Last name (2-50 characters)
- `email` - Valid email address
- `phoneNumber` - Valid phone number

**Optional Fields:**
- `countryCode` - Country code (default: "+91")
- `designation` - Must be one of: `Medicine Manager`, `Order Manager`, `Sub-Admin`, `Doctor Manager`, `Patient Manager` (default: "Sub-Admin")
- `password` - Password (default: "SubAdmin@123" if not provided)

**Response:**
```json
{
  "success": true,
  "message": "Sub-admin created successfully",
  "data": {
    "_id": "sub_admin_id",
    "user": {
      "_id": "user_id",
      "firstName": "Sarah",
      "lastName": "Jenkins",
      "email": "sarah.j@mediprime.com",
      "phoneNumber": "9876543210",
      "countryCode": "+91",
      "role": "doctor",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "designation": "Medicine Manager",
    "permissions": [],
    "isActive": true,
    "createdBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Notes:**
- Creates a user with `role: 'doctor'` (sub-admin)
- User is automatically verified and activated
- Permissions can be set after creation using the set permissions endpoint
- Default password is "SubAdmin@123" if not provided

### Get All Sub-Admins
**GET** `/admin/sub-admins?search=john&page=1&limit=10&designation=Medicine Manager&isActive=true`

Get list of all sub-admins with search, filter, and pagination.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `search` - Search by name, email, or phone number
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `designation` - Filter by designation
- `isActive` - Filter by active status (true/false)

**Response:**
```json
{
  "success": true,
  "message": "Sub-admins retrieved successfully",
  "data": [
    {
      "_id": "sub_admin_id_1",
      "user": {
        "_id": "user_id_1",
        "firstName": "Floyd",
        "lastName": "Miles",
        "email": "deanna.curtis@example.com",
        "phoneNumber": "1234567890",
        "countryCode": "+91",
        "role": "doctor",
        "isActive": true,
        "createdAt": "2020-07-23T00:00:00.000Z"
      },
      "designation": "Medicine Manager",
      "permissions": [
        {
          "module": "dashboard",
          "canView": true,
          "canCreate": false,
          "canUpdate": false,
          "canDelete": false
        }
      ],
      "isActive": true,
      "createdBy": {
        "_id": "admin_id",
        "firstName": "Admin",
        "lastName": "User"
      },
      "activePermissionsCount": 4,
      "totalModules": 9,
      "createdAt": "2020-07-23T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### Get Sub-Admin by ID
**GET** `/admin/sub-admins/:id`

Get details of a specific sub-admin.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "message": "Sub-admin retrieved successfully",
  "data": {
    "_id": "sub_admin_id",
    "user": {
      "_id": "user_id",
      "firstName": "Sarah",
      "lastName": "Jenkins",
      "email": "sarah.j@mediprime.com",
      "phoneNumber": "9876543210",
      "countryCode": "+91",
      "role": "doctor",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "designation": "Medicine Manager",
    "permissions": [
      {
        "module": "dashboard",
        "canView": true,
        "canCreate": false,
        "canUpdate": false,
        "canDelete": false
      },
      {
        "module": "medications",
        "canView": true,
        "canCreate": true,
        "canUpdate": true,
        "canDelete": false
      }
    ],
    "isActive": true,
    "createdBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com"
    },
    "activePermissionsCount": 2,
    "totalModules": 9,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Update Sub-Admin
**PUT** `/admin/sub-admins/:id`

Update sub-admin information.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "firstName": "Sarah",
  "lastName": "Smith",
  "email": "sarah.smith@mediprime.com",
  "phoneNumber": "9876543211",
  "countryCode": "+91",
  "designation": "Order Manager",
  "isActive": true
}
```

**Optional Fields:**
- `firstName` - First name
- `lastName` - Last name
- `email` - Email address
- `phoneNumber` - Phone number
- `countryCode` - Country code
- `designation` - Designation
- `isActive` - Active status (boolean)

**Response:**
```json
{
  "success": true,
  "message": "Sub-admin updated successfully",
  "data": {
    "_id": "sub_admin_id",
    "user": {
      "firstName": "Sarah",
      "lastName": "Smith",
      "email": "sarah.smith@mediprime.com",
      "phoneNumber": "9876543211"
    },
    "designation": "Order Manager",
    "isActive": true,
    "activePermissionsCount": 2,
    "totalModules": 9
  }
}
```

### Delete Sub-Admin
**DELETE** `/admin/sub-admins/:id`

Delete (deactivate) a sub-admin account. This performs a soft delete - the sub-admin and user account are deactivated but not permanently removed from the database.

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `id` (path, required) - Sub-admin ID (MongoDB ObjectId)

**Request Example:**
```bash
DELETE /api/v1/admin/sub-admins/695546fc60457bdf4e9b98db
Headers: Authorization: Bearer <admin_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Sub-admin deleted successfully",
  "data": {
    "message": "Sub-admin deleted successfully"
  }
}
```

**Error Responses:**
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (user is not an admin)
- `404` - Sub-admin not found

**Example Error Response:**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Sub-admin not found"
}
```

**Notes:**
- **Soft Delete**: Sub-admin is not permanently deleted from the database
- **Deactivation**: Both sub-admin record and associated user account are deactivated (`isActive: false`)
- **Reactivation**: Can be reactivated by updating `isActive: true` using the update sub-admin endpoint
- **Data Preservation**: All sub-admin data, permissions, and history are preserved
- **Access Revoked**: Deactivated sub-admin cannot login or access the system
- **Audit Trail**: Deletion is logged for audit purposes

**To Reactivate a Deleted Sub-Admin:**
```bash
PUT /api/v1/admin/sub-admins/:id
{
  "isActive": true
}
```

### Set Permissions for Sub-Admin
**PUT** `/admin/sub-admins/:id/permissions`

Set permissions for a sub-admin. This endpoint allows you to assign granular permissions (View, Add, Edit, Delete) for each module.

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `id` (path) - Sub-admin ID

**Request Body:**
```json
{
  "permissions": [
    {
      "module": "dashboard",
      "canView": false,
      "canCreate": false,
      "canUpdate": false,
      "canDelete": false
    },
    {
      "module": "provider-management",
      "canView": true,
      "canCreate": true,
      "canUpdate": true,
      "canDelete": true
    },
    {
      "module": "medicine-management",
      "canView": true,
      "canCreate": true,
      "canUpdate": true,
      "canDelete": true
    },
    {
      "module": "patient-management",
      "canView": true,
      "canCreate": false,
      "canUpdate": false,
      "canDelete": false
    },
    {
      "module": "prescription-order-management",
      "canView": true,
      "canCreate": false,
      "canUpdate": false,
      "canDelete": false
    },
    {
      "module": "financial-overview",
      "canView": false,
      "canCreate": false,
      "canUpdate": false,
      "canDelete": false
    },
    {
      "module": "compliance-security",
      "canView": false,
      "canCreate": false,
      "canUpdate": false,
      "canDelete": false
    },
    {
      "module": "marketing-notifications",
      "canView": false,
      "canCreate": false,
      "canUpdate": false,
      "canDelete": false
    },
    {
      "module": "reports-exports",
      "canView": false,
      "canCreate": false,
      "canUpdate": false,
      "canDelete": false
    }
  ]
}
```

**Required Fields:**
- `permissions` - Array of permission objects (can include all 9 modules or only specific ones)
- Each permission object must have:
  - `module` - **Required.** Must be one of the valid module names (see list below)
  - `canView` - Boolean (optional, default: false) - View access
  - `canCreate` - Boolean (optional, default: false) - Add/Create access
  - `canUpdate` - Boolean (optional, default: false) - Edit/Update access
  - `canDelete` - Boolean (optional, default: false) - Delete access

**Valid Module Names:**
1. `dashboard` - Dashboard module
2. `provider-management` - Provider Management (Doctors)
3. `medicine-management` - Medicine Management
4. `patient-management` - Patient Management
5. `prescription-order-management` - Prescription & Order Management (Combined)
6. `financial-overview` - Financial Overview (Payments)
7. `compliance-security` - Compliance & Security (Settings)
8. `marketing-notifications` - Marketing & Notifications
9. `reports-exports` - Reports & Exports

**Example: Full Access to Medicine Management**
```json
{
  "permissions": [
    {
      "module": "medicine-management",
      "canView": true,
      "canCreate": true,
      "canUpdate": true,
      "canDelete": true
    }
  ]
}
```

**Example: View Only Access**
```json
{
  "permissions": [
    {
      "module": "patient-management",
      "canView": true,
      "canCreate": false,
      "canUpdate": false,
      "canDelete": false
    },
    {
      "module": "prescription-order-management",
      "canView": true,
      "canCreate": false,
      "canUpdate": false,
      "canDelete": false
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permissions updated successfully",
  "data": {
    "_id": "sub_admin_id",
    "user": {
      "firstName": "Sarah",
      "lastName": "Jenkins",
      "email": "sarah.j@mediprime.com"
    },
    "designation": "Medicine Manager",
    "permissions": [
      {
        "module": "dashboard",
        "canView": true,
        "canCreate": false,
        "canUpdate": false,
        "canDelete": false
      },
      {
        "module": "medicine-management",
        "canView": true,
        "canCreate": true,
        "canUpdate": true,
        "canDelete": false
      },
      {
        "module": "prescription-order-management",
        "canView": true,
        "canCreate": true,
        "canUpdate": true,
        "canDelete": true
      }
    ],
    "activePermissionsCount": 3,
    "totalModules": 9
  }
}
```

**Error Responses:**
- `400` - Validation failed (invalid module name or missing required fields)
- `404` - Sub-admin not found

**Notes:**
- **Permissions are completely replaced** - When you update permissions, the entire permissions array is replaced (not merged)
- You can include all 9 modules or only the modules you want to set permissions for
- **Active permissions count** is automatically calculated based on modules with at least one permission enabled
- **Total modules** is always 9
- Each module can have independent permissions (View, Add, Edit, Delete)
- If a module is not included in the permissions array, it will have no permissions (all false)

**Quick Reference - Permission Types:**
- **View (`canView`)**: Allows viewing/list reading data in the module
- **Add (`canCreate`)**: Allows creating/adding new records in the module
- **Edit (`canUpdate`)**: Allows updating/modifying existing records in the module
- **Delete (`canDelete`)**: Allows deleting records in the module

**Best Practices:**
1. Always include all modules you want to configure in the permissions array
2. Set `canView: true` as a minimum if you want any access to a module
3. Typically, if `canCreate` or `canUpdate` is true, `canView` should also be true
4. Use the `/admin/modules` endpoint to get the complete list of available modules before setting permissions

---
```json
{
  "success": true,
  "message": "Permissions updated successfully",
  "data": {
    "_id": "sub_admin_id",
    "user": {
      "firstName": "Sarah",
      "lastName": "Jenkins",
      "email": "sarah.j@mediprime.com"
    },
    "designation": "Medicine Manager",
    "permissions": [
      {
        "module": "provider-management",
        "canView": true,
        "canCreate": true,
        "canUpdate": true,
        "canDelete": true
      },
      {
        "module": "medicine-management",
        "canView": true,
        "canCreate": true,
        "canUpdate": true,
        "canDelete": true
      },
      {
        "module": "patient-management",
        "canView": true,
        "canCreate": false,
        "canUpdate": false,
        "canDelete": false
      }
    ],
    "activePermissionsCount": 3,
    "totalModules": 9
  }
}
```

**Error Responses:**
- `400` - Validation failed (invalid module name or missing required fields)
- `404` - Sub-admin not found

**Notes:**
- **Permissions are completely replaced** - When you update permissions, the entire permissions array is replaced (not merged)
- You can include all 9 modules or only the modules you want to set permissions for
- **Active permissions count** is automatically calculated based on modules with at least one permission enabled
- **Total modules** is always 9
- Each module can have independent permissions (View, Add, Edit, Delete)
- If a module is not included in the permissions array, it will have no permissions (all false)

**Quick Reference - Permission Types:**
- **View (`canView`)**: Allows viewing/list reading data in the module
- **Add (`canCreate`)**: Allows creating/adding new records in the module
- **Edit (`canUpdate`)**: Allows updating/modifying existing records in the module
- **Delete (`canDelete`)**: Allows deleting records in the module

**Best Practices:**
1. Always include all modules you want to configure in the permissions array
2. Set `canView: true` as a minimum if you want any access to a module
3. Typically, if `canCreate` or `canUpdate` is true, `canView` should also be true
4. Use the `/admin/modules` endpoint to get the complete list of available modules before setting permissions

---

## Doctor Management APIs (Admin Only)

### Get Statistics
**GET** `/admin/doctors/statistics`

Get overview statistics for the provider management dashboard.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "totalProviders": 1242,
    "pendingVerification": 8,
    "payoutsPending": {
      "amount": 0,
      "providerCount": 0
    },
    "avgProviderRating": 4.8
  }
}
```

**Notes:**
- Returns total active providers count
- Shows pending license verifications
- Calculates average provider rating
- Payouts pending is a placeholder (implement based on your payment system)

### Get Available Specialties
**GET** `/admin/doctors/specialties`

Get list of all available medical specialties.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "message": "Available specialties retrieved successfully",
  "data": [
    "General Practice",
    "Cardiology",
    "Pediatrics",
    "Dermatology",
    "Orthopedics",
    "Neurology",
    "Psychiatry",
    "Oncology",
    "Gynecology",
    "Urology",
    "Ophthalmology",
    "ENT",
    "Pulmonology",
    "Gastroenterology",
    "Endocrinology",
    "Rheumatology",
    "Other"
  ]
}
```

### Create Doctor
**POST** `/admin/doctors`

Create a new doctor/provider account.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "firstName": "Sarah",
  "lastName": "Jenkins",
  "email": "sarah.j@mediprime.com",
  "phoneNumber": "9876543210",
  "countryCode": "+91",
  "password": "Doctor@123",
  "specialty": "General Practice",
  "licenseNumber": "#MD-849201",
  "licenseVerified": true,
  "consultationFee": 150.00,
  "status": "active",
  "experience": 5,
  "education": [
    {
      "degree": "MBBS",
      "institution": "AIIMS Delhi",
      "year": 2018
    },
    {
      "degree": "MD (General Medicine)",
      "institution": "AIIMS Delhi",
      "year": 2021
    }
  ],
  "certifications": [
    {
      "name": "Advanced Cardiac Life Support (ACLS)",
      "issuedBy": "American Heart Association",
      "year": 2022
    }
  ],
  "languages": ["English", "Hindi"],
  "availability": {
    "days": ["Monday", "Tuesday", "Wednesday", "Friday"],
    "timeSlots": [
      { "from": "10:00", "to": "13:00" },
      { "from": "17:00", "to": "20:00" }
    ]
  },
  "address": {
    "clinicName": "MediPrime Clinic",
    "city": "Bhopal",
    "state": "Madhya Pradesh",
    "country": "India",
    "pincode": "462001"
  },
  "bio": "Experienced general practitioner",
  "profilePicture": "https://example.com/profile.jpg"
}
```

**Required Fields:**
- `firstName` - First name (2-50 characters)
- `lastName` - Last name (2-50 characters)
- `email` - Valid email address
- `phoneNumber` - Valid phone number
- `specialty` - Must be one of the available specialties
- `licenseNumber` - License number (3-50 characters, unique)
- `consultationFee` - Consultation fee per hour (positive number)

**Optional Fields:**
- `countryCode` - Country code (default: "+91")
- `password` - Password (default: "Doctor@123" if not provided)
- `licenseVerified` - Boolean (default: false)
- `status` - Must be: `active`, `pending`, or `suspended` (default: "pending")
- `experience` - Years of experience (non-negative integer)
- `education` - Array of education objects with `degree`, `institution`, `year`
- `certifications` - Array of certification objects with `name`, `issuedBy`/`issuingOrganization`, `year`, `issueDate`, `expiryDate`
- `languages` - Array of language strings
- `availability` - Object with `days` array and `timeSlots` array
- `address` - Object with clinic details
- `bio` - Biography (max 1000 characters)
- `profilePicture` - Profile picture URL

**Response:**
```json
{
  "success": true,
  "message": "Doctor created successfully",
  "data": {
    "_id": "doctor_id",
    "user": {
      "_id": "user_id",
      "firstName": "Sarah",
      "lastName": "Jenkins",
      "email": "sarah.j@mediprime.com",
      "phoneNumber": "9876543210",
      "countryCode": "+91",
      "role": "doctor",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "specialty": "General Practice",
    "licenseNumber": "#MD-849201",
    "licenseVerified": true,
    "licenseVerifiedAt": "2024-01-15T10:30:00.000Z",
    "licenseVerifiedBy": "admin_id",
    "consultationFee": 150,
    "status": "active",
    "rating": {
      "average": 0,
      "totalRatings": 0
    },
    "experience": 5,
    "education": [
      {
        "degree": "MBBS",
        "institution": "AIIMS Delhi",
        "year": 2018
      }
    ],
    "certifications": [
      {
        "name": "Advanced Cardiac Life Support (ACLS)",
        "issuedBy": "American Heart Association",
        "year": 2022
      }
    ],
    "languages": ["English", "Hindi"],
    "availability": {
      "days": ["Monday", "Tuesday", "Wednesday", "Friday"],
      "timeSlots": [
        { "from": "10:00", "to": "13:00" },
        { "from": "17:00", "to": "20:00" }
      ]
    },
    "address": {
      "clinicName": "MediPrime Clinic",
      "city": "Bhopal",
      "state": "Madhya Pradesh",
      "country": "India",
      "pincode": "462001"
    },
    "isActive": true,
    "createdBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com"
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed
- `409` - User with this email/phone already exists or License number already exists

### Get All Doctors
**GET** `/admin/doctors?search=Sarah&specialty=General Practice&status=active&licenseVerified=true&isActive=true&page=1&limit=10`

Get list of all doctors with search, filters, and pagination.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `search` - Search by name, email, phone, license number, or specialty (partial match, case-insensitive)
- `specialty` - Filter by specialty (exact match)
- `status` - Filter by status: `active`, `pending`, or `suspended`
- `licenseVerified` - Filter by license verification status (true/false)
- `isActive` - Filter by active status (true/false)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "message": "Doctors retrieved successfully",
  "data": [
    {
      "_id": "doctor_id_1",
      "user": {
        "_id": "user_id_1",
        "firstName": "Sarah",
        "lastName": "Jenkins",
        "email": "sarah.j@mediprime.com",
        "phoneNumber": "9876543210",
        "countryCode": "+91",
        "role": "doctor",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z"
      },
      "specialty": "General Practice",
      "licenseNumber": "#MD-849201",
      "licenseVerified": true,
      "consultationFee": 150,
      "status": "active",
      "rating": {
        "average": 4.9,
        "totalRatings": 128
      },
      "experience": 5,
      "education": [...],
      "certifications": [...],
      "languages": ["English", "Hindi"],
      "availability": {...},
      "address": {...},
      "isActive": true,
      "createdBy": {
        "_id": "admin_id",
        "firstName": "Admin",
        "lastName": "User"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

**Notes:**
- Search works on: firstName, lastName, email, phoneNumber, licenseNumber, specialty
- Partial matching is supported (case-insensitive)
- Results are sorted by creation date (newest first)
- All filters can be combined

### Get Doctor by ID
**GET** `/admin/doctors/:id`

Get details of a specific doctor.

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `id` (path) - Doctor ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Doctor retrieved successfully",
  "data": {
    "_id": "doctor_id",
    "user": {
      "firstName": "Sarah",
      "lastName": "Jenkins",
      "email": "sarah.j@mediprime.com",
      "phoneNumber": "9876543210"
    },
    "specialty": "General Practice",
    "licenseNumber": "#MD-849201",
    "licenseVerified": true,
    "consultationFee": 150,
    "status": "active",
    "rating": {
      "average": 4.9,
      "totalRatings": 128
    },
    "experience": 5,
    "education": [...],
    "certifications": [...],
    "languages": ["English", "Hindi"],
    "availability": {...},
    "address": {...}
  }
}
```

**Error Responses:**
- `404` - Doctor not found

### Update Doctor
**PUT** `/admin/doctors/:id`

Update doctor information.

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `id` (path) - Doctor ID

**Request Body:** (All fields optional)
```json
{
  "firstName": "Sarah",
  "lastName": "Smith",
  "email": "sarah.smith@mediprime.com",
  "phoneNumber": "9876543211",
  "specialty": "Cardiology",
  "licenseNumber": "#MD-849202",
  "licenseVerified": true,
  "consultationFee": 200.00,
  "status": "active",
  "experience": 7,
  "education": [...],
  "certifications": [...],
  "languages": ["English", "Hindi", "Spanish"],
  "availability": {...},
  "address": {...},
  "bio": "Updated bio",
  "profilePicture": "https://example.com/new-profile.jpg",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Doctor updated successfully",
  "data": {
    /* Updated doctor object */
  }
}
```

**Notes:**
- Only provided fields are updated
- License verification automatically sets `licenseVerifiedAt` and `licenseVerifiedBy` when set to true
- Status change to `active` automatically activates the user account
- Status change to `suspended` deactivates the user account

### Reset Doctor Password
**PUT** `/admin/doctors/:id/reset-password`

Reset a doctor's password.

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `id` (path) - Doctor ID

**Request Body:**
```json
{
  "newPassword": "NewSecurePassword123"
}
```

**Required Fields:**
- `newPassword` - New password (minimum 6 characters, must contain uppercase, lowercase, and number)

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "message": "Password reset successfully"
  }
}
```

**Error Responses:**
- `400` - Validation failed (invalid password format)
- `404` - Doctor not found

**Notes:**
- Password is automatically hashed
- Doctor can login with new password immediately
- Password reset is logged for audit purposes

### Delete Doctor
**DELETE** `/admin/doctors/:id`

Delete (deactivate) a doctor account.

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `id` (path) - Doctor ID

**Response:**
```json
{
  "success": true,
  "message": "Doctor deleted successfully",
  "data": {
    "message": "Doctor deleted successfully"
  }
}
```

**Error Responses:**
- `404` - Doctor not found

**Notes:**
- Soft delete - doctor is deactivated, not permanently removed
- Doctor status is set to `suspended`
- User account is also deactivated
- Can be reactivated by updating `isActive: true` and `status: active`

---

## Patient Management APIs (Admin/Sub-Admin Only)

Comprehensive patient management APIs for admins to view, search, filter, and manage all patients with proper relations and statistics.

### Get Patient Statistics
**GET** `/api/v1/admin/patients/statistics`

Get overall statistics for all patients.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPatients": 1250,
    "activePatients": 1180,
    "inactivePatients": 70,
    "totalConsultations": 5420,
    "totalOrders": 3890,
    "totalRevenue": 1250000
  }
}
```

---

### Get All Patients
**GET** `/api/v1/admin/patients`

Get a paginated list of all patients with search, filter, and sorting options.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10, max: 100)
- `search` (optional) - Search in name, email, or phone number
- `status` (optional) - Filter by status: `active` or `inactive`
- `gender` (optional) - Filter by gender: `male`, `female`, or `other`
- `sortBy` (optional) - Sort field: `createdAt`, `updatedAt`, `firstName`, `lastName` (default: `createdAt`)
- `sortOrder` (optional) - Sort order: `asc` or `desc` (default: `desc`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "patient_id",
      "user": {
        "_id": "user_id",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@email.com",
        "phoneNumber": "1234567890",
        "countryCode": "+1",
        "isActive": true,
        "isVerified": true,
        "lastLoginAt": "2025-01-15T10:30:00.000Z"
      },
      "dateOfBirth": "1990-05-15T00:00:00.000Z",
      "gender": "male",
      "bloodGroup": "O+",
      "height": 175,
      "weight": 70,
      "medicalHistory": ["Hypertension"],
      "allergies": ["Penicillin"],
      "emergencyContact": {
        "name": "Jane Doe",
        "phoneNumber": "9876543210",
        "relationship": "Spouse"
      },
      "profilePicture": "https://example.com/profile.jpg",
      "isActive": true,
      "age": 34,
      "ageGender": "34/M",
      "phone": "+1 1234567890",
      "consultationsCount": 12,
      "lastVisit": "2025-01-15T10:30:00.000Z",
      "consent": "Given",
      "createdAt": "2024-01-10T08:00:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1250,
    "pages": 125
  }
}
```

**Response Fields:**
- `age` - Calculated age from date of birth
- `ageGender` - Format: `age/gender` (e.g., "34/M", "45/F")
- `phone` - Formatted phone number with country code
- `consultationsCount` - Total number of prescriptions/consultations
- `lastVisit` - Most recent prescription or order date
- `consent` - Consent status: "Given" or "Not Given" (based on intake form)

**Notes:**
- Search works across patient name, email, and phone number
- Results include calculated statistics (consultations, last visit, consent)
- Patient data includes populated user information

---

### Get Patient by ID
**GET** `/api/v1/admin/patients/:id`

Get detailed information about a specific patient with all relations.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "patient_id",
    "user": {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@email.com",
      "phoneNumber": "1234567890",
      "countryCode": "+1",
      "isActive": true,
      "isVerified": true,
      "lastLoginAt": "2025-01-15T10:30:00.000Z",
      "createdAt": "2024-01-10T08:00:00.000Z"
    },
    "dateOfBirth": "1990-05-15T00:00:00.000Z",
    "gender": "male",
    "bloodGroup": "O+",
    "height": 175,
    "weight": 70,
    "medicalHistory": ["Hypertension"],
    "allergies": ["Penicillin"],
    "emergencyContact": {
      "name": "Jane Doe",
      "phoneNumber": "9876543210",
      "relationship": "Spouse"
    },
    "profilePicture": "https://example.com/profile.jpg",
    "isActive": true,
    "age": 34,
    "consent": "Given",
    "statistics": {
      "consultationsCount": 12,
      "ordersCount": 8,
      "totalSpent": 15000,
      "lastVisit": "2025-01-15T10:30:00.000Z",
      "lastPrescription": "2025-01-15T10:30:00.000Z",
      "lastOrder": "2025-01-10T08:00:00.000Z"
    },
    "relations": {
      "prescriptions": [
        {
          "_id": "prescription_id",
          "prescriptionNumber": "PRES1234567890",
          "doctor": {
            "_id": "doctor_id",
            "firstName": "Dr. Sarah",
            "lastName": "Smith"
          },
          "diagnosis": "Hypertension",
          "medications": [...],
          "status": "active",
          "createdAt": "2025-01-15T10:30:00.000Z"
        }
      ],
      "orders": [
        {
          "_id": "order_id",
          "orderNumber": "ORD-1234567890",
          "prescription": {...},
          "items": [...],
          "totalAmount": 1500,
          "status": "delivered",
          "createdAt": "2025-01-10T08:00:00.000Z"
        }
      ],
      "chats": [
        {
          "_id": "chat_id",
          "doctor": {...},
          "status": "active",
          "lastMessageAt": "2025-01-15T10:30:00.000Z"
        }
      ],
      "intakeForm": {
        "basicInformation": {...},
        "emergencyContact": {...},
        "medicalQuestions": {...}
      },
      "addresses": [
        {
          "_id": "address_id",
          "type": "home",
          "fullName": "John Doe",
          "addressLine1": "123 Main St",
          "city": "New York",
          "state": "NY",
          "postalCode": "10001",
          "isDefault": true
        }
      ],
      "healthRecords": [
        {
          "_id": "health_record_id",
          "title": "Blood Test Report",
          "type": "lab_report",
          "date": "2025-01-10T00:00:00.000Z",
          "files": [...]
        }
      ],
      "payments": [
        {
          "_id": "payment_id",
          "paymentId": "PAY-1234567890",
          "amount": 1500,
          "paymentStatus": "success",
          "createdAt": "2025-01-10T08:00:00.000Z"
        }
      ]
    },
    "createdAt": "2024-01-10T08:00:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Notes:**
- Returns complete patient profile with all related data
- Includes statistics (consultations, orders, total spent, last visit)
- All relations are populated with relevant data
- Useful for detailed patient view in admin dashboard

---

### Update Patient Status
**PUT** `/api/v1/admin/patients/:id/status`

Activate or deactivate a patient account.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Patient activated successfully",
  "data": {
    "_id": "patient_id",
    "user": {...},
    "isActive": true,
    ...
  }
}
```

**Notes:**
- Updates both patient and user `isActive` status
- Deactivated patients cannot log in or access the system
- Use this to temporarily disable patient accounts

**Error Responses:**
- `400` - Invalid request body
- `404` - Patient not found
- `401` - Unauthorized
- `403` - Forbidden (not admin/sub-admin)

---

## Financial Overview APIs (Admin/Sub-Admin Only)

Comprehensive financial overview APIs for admins to view revenue, consultation fees, medicine sales, pending payouts, revenue charts, and recent transactions with proper relations.

### Get Financial Overview Summary
**GET** `/api/v1/admin/financial-overview`

Get financial overview summary with total revenue, consultation fees, medicine sales, and pending payouts with percentage changes from previous period.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `period` (optional) - Time period: `last_7_days`, `last_30_days`, `last_90_days`, `last_365_days`, `this_month`, `last_month`, `this_year` (default: `last_30_days`)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": {
      "amount": 328450,
      "change": 5.62,
      "isIncrease": true
    },
    "consultationFees": {
      "amount": 184520,
      "change": 12.0,
      "isIncrease": true
    },
    "medicineSales": {
      "amount": 143930,
      "change": 6.0,
      "isIncrease": true
    },
    "pendingPayouts": {
      "count": 340,
      "change": -2.0,
      "isIncrease": false
    }
  }
}
```

**Response Fields:**
- `totalRevenue.amount` - Total revenue from all successful payments
- `totalRevenue.change` - Percentage change from previous period
- `totalRevenue.isIncrease` - Boolean indicating if it's an increase
- `consultationFees.amount` - Total consultation fees (sum of doctor consultation fees from prescriptions)
- `consultationFees.change` - Percentage change from previous period
- `medicineSales.amount` - Total medicine sales (from orders with medication items)
- `medicineSales.change` - Percentage change from previous period
- `pendingPayouts.count` - Count of pending payouts (active doctors)
- `pendingPayouts.change` - Percentage change from previous period

**Notes:**
- All amounts are in the base currency (INR by default)
- Percentage changes are calculated compared to the previous equivalent period
- Consultation fees are calculated from prescriptions and doctor consultation fees
- Medicine sales are calculated from orders with `productType: 'medication'`
- Pending payouts is a placeholder - implement based on your payout system

---

### Get Revenue Chart Data
**GET** `/api/v1/admin/financial-overview/revenue-chart`

Get monthly revenue data for a specific year to display in revenue chart.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `year` (optional) - Year (default: current year)

**Response:**
```json
{
  "success": true,
  "data": {
    "year": 2025,
    "total": 328450,
    "data": [
      {
        "month": "Jan",
        "monthNumber": 1,
        "revenue": 25000
      },
      {
        "month": "Feb",
        "monthNumber": 2,
        "revenue": 28000
      },
      {
        "month": "Mar",
        "monthNumber": 3,
        "revenue": 22000
      },
      {
        "month": "Apr",
        "monthNumber": 4,
        "revenue": 35000
      },
      {
        "month": "May",
        "monthNumber": 5,
        "revenue": 30000
      },
      {
        "month": "Jun",
        "monthNumber": 6,
        "revenue": 24000
      },
      {
        "month": "Jul",
        "monthNumber": 7,
        "revenue": 26000
      },
      {
        "month": "Aug",
        "monthNumber": 8,
        "revenue": 38000
      },
      {
        "month": "Sep",
        "monthNumber": 9,
        "revenue": 32000
      },
      {
        "month": "Oct",
        "monthNumber": 10,
        "revenue": 29000
      },
      {
        "month": "Nov",
        "monthNumber": 11,
        "revenue": 31000
      },
      {
        "month": "Dec",
        "monthNumber": 12,
        "revenue": 36000
      }
    ]
  }
}
```

**Response Fields:**
- `year` - The year for which data is returned
- `total` - Total revenue for the year
- `data` - Array of monthly revenue data
  - `month` - Month abbreviation (Jan, Feb, etc.)
  - `monthNumber` - Month number (1-12)
  - `revenue` - Revenue amount for that month

**Notes:**
- Revenue is calculated from successful payments only
- Months with no revenue will show 0
- Data is sorted by month number (1-12)

---

### Get Recent Transactions
**GET** `/api/v1/admin/financial-overview/transactions`

Get recent transactions with filtering by type (All, Consultation, Pharmacy, Payouts).

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10, max: 100)
- `type` (optional) - Filter by type: `all`, `consultation`, `pharmacy`, `payouts` (default: `all`)
- `startDate` (optional) - Filter from date (ISO 8601 format)
- `endDate` (optional) - Filter to date (ISO 8601 format)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "transactionId": "PAY-1234567890",
      "type": "Pharmacy",
      "doctorPharmacy": "John Doe",
      "amount": 150.00,
      "paymentMethod": "card",
      "date": "2025-01-15T10:30:00.000Z",
      "orderNumber": "ORD-1234567890"
    },
    {
      "transactionId": "PRES1234567890",
      "type": "Consultation",
      "doctorPharmacy": "Dr. Sarah Smith",
      "amount": 200.00,
      "paymentMethod": "consultation",
      "date": "2025-01-15T09:00:00.000Z",
      "prescriptionNumber": "PRES1234567890"
    }
  ],
  "counts": {
    "all": 1250,
    "consultation": 450,
    "pharmacy": 800,
    "payouts": 0
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1250,
    "pages": 125
  }
}
```

**Response Fields:**
- `transactionId` - Unique transaction identifier (Payment ID or Prescription Number)
- `type` - Transaction type: `Consultation` or `Pharmacy`
- `doctorPharmacy` - Doctor name (for consultations) or Patient name (for pharmacy)
- `amount` - Transaction amount
- `paymentMethod` - Payment method: `card`, `upi`, `netbanking`, `wallet`, or `consultation`
- `date` - Transaction date
- `orderNumber` - Order number (for pharmacy transactions)
- `prescriptionNumber` - Prescription number (for consultation transactions)
- `counts` - Count of transactions by type
- `pagination` - Pagination information

**Transaction Types:**
- **Consultation** - Transactions from prescriptions (doctor consultation fees)
- **Pharmacy** - Transactions from orders (medicine sales)
- **Payouts** - Placeholder (implement based on your payout system)

**Notes:**
- Results are sorted by date (newest first)
- Consultation transactions show doctor name with "Dr." prefix
- Pharmacy transactions show patient name
- Date filtering can be used to get transactions for a specific period
- Counts show total available transactions for each type

**Error Responses:**
- `400` - Invalid query parameters
- `401` - Unauthorized
- `403` - Forbidden (not admin/sub-admin)

---

## Doctor Earnings Management APIs (Admin/Sub-Admin Only)

Comprehensive doctor earnings management APIs for admins to view doctor earnings, consultations, fees, and process payouts with proper relations.

### Get Doctor Earnings Summary
**GET** `/api/v1/admin/doctors/earnings`

Get a paginated list of all doctors with their earnings summary including consultations, fees per hour, and total earnings.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10, max: 100)
- `search` (optional) - Search in doctor name or email
- `specialty` (optional) - Filter by specialty
- `sortBy` (optional) - Sort field: `totalEarnings`, `consultations`, `feesPerHour`, `availableEarnings` (default: `totalEarnings`)
- `sortOrder` (optional) - Sort order: `asc` or `desc` (default: `desc`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "doctor_id",
      "doctor": {
        "_id": "user_id",
        "firstName": "Sarah",
        "lastName": "Jenkins",
        "fullName": "Dr. Sarah Jenkins",
        "email": "sarah.j@mediprime.com",
        "profilePicture": "https://example.com/profile.jpg"
      },
      "specialty": "Cardiology",
      "consultations": 234,
      "feesPerHour": 150.00,
      "totalEarnings": 45000.00,
      "availableEarnings": 45000.00,
      "paidOut": 0,
      "pendingPayouts": 0
    },
    {
      "_id": "doctor_id_2",
      "doctor": {
        "_id": "user_id_2",
        "firstName": "Mark",
        "lastName": "Lee",
        "fullName": "Dr. Mark Lee",
        "email": "mark.lee@example.com",
        "profilePicture": "https://example.com/profile2.jpg"
      },
      "specialty": "Pharmacy",
      "consultations": 0,
      "feesPerHour": 0,
      "totalEarnings": 38500.00,
      "availableEarnings": 38500.00,
      "paidOut": 0,
      "pendingPayouts": 0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

**Response Fields:**
- `doctor` - Doctor information with name, email, profile picture
- `specialty` - Medical specialty
- `consultations` - Total number of consultations (prescriptions count)
- `feesPerHour` - Consultation fee per hour
- `totalEarnings` - Total earnings from all consultations
- `availableEarnings` - Available earnings (total - paid out - pending)
- `paidOut` - Total amount already paid out
- `pendingPayouts` - Total amount in pending/processing payouts

**Notes:**
- Consultations are counted from prescriptions (excluding cancelled)
- Total earnings = sum of consultation fees from all prescriptions
- Available earnings = total earnings - paid out - pending payouts
- Results are sorted by total earnings by default (descending)

---

### Get Doctor Earnings by ID
**GET** `/api/v1/admin/doctors/:id/earnings`

Get detailed earnings information for a specific doctor including payout history.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "doctor": {
      "_id": "doctor_id",
      "user": {
        "_id": "user_id",
        "firstName": "Sarah",
        "lastName": "Jenkins",
        "email": "sarah.j@mediprime.com",
        "profilePicture": "https://example.com/profile.jpg"
      },
      "specialty": "Cardiology",
      "consultationFee": 150.00,
      "profilePicture": "https://example.com/profile.jpg"
    },
    "statistics": {
      "consultations": 234,
      "feesPerHour": 150.00,
      "totalEarnings": 45000.00,
      "availableEarnings": 45000.00,
      "paidOut": 0,
      "pendingPayouts": 0
    },
    "payouts": [
      {
        "_id": "payout_id",
        "payoutId": "POUT-1234567890",
        "amount": 5000.00,
        "status": "completed",
        "bankAccount": {
          "accountHolder": "Sarah Jenkins",
          "bankName": "Chase Bank",
          "accountNumber": "****5656",
          "routingNumber": "32154544",
          "accountType": "checking"
        },
        "processedBy": {
          "_id": "admin_id",
          "firstName": "Admin",
          "lastName": "User"
        },
        "processedAt": "2025-01-10T10:30:00.000Z",
        "createdAt": "2025-01-10T10:00:00.000Z"
      }
    ]
  }
}
```

**Notes:**
- Returns complete earnings breakdown and payout history
- Payouts are sorted by date (newest first)
- Account numbers are masked for security

---

### Get Doctor Bank Account Information
**GET** `/api/v1/admin/doctors/:id/bank-account`

Get doctor's bank account information and current available earnings for payout processing.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "doctor": {
      "_id": "doctor_id",
      "name": "Mark Lee",
      "email": "mark.lee@example.com"
    },
    "currentEarnings": 4500.00,
    "bankAccount": {
      "accountHolder": "Mark Lee",
      "bankName": "Chase Bank",
      "accountNumber": "****5656",
      "routingNumber": "32154544",
      "accountType": "checking"
    }
  }
}
```

**Response Fields:**
- `currentEarnings` - Available earnings that can be paid out
- `bankAccount` - Bank account information (from latest payout, if exists)
  - `accountNumber` - Masked account number (last 4 digits visible)
  - `bankAccount` will be `null` if no previous payout exists

**Notes:**
- Bank account information is retrieved from the most recent payout
- If no previous payout exists, `bankAccount` will be `null`
- Account numbers are masked for security (only last 4 digits shown)

---

### Process Payout
**POST** `/api/v1/admin/doctors/:id/payouts`

Process a payout for a doctor. Creates a payout record and initiates the payment process.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "amount": 4500.00,
  "currency": "USD",
  "bankAccount": {
    "accountHolder": "Mark Lee",
    "bankName": "Chase Bank",
    "accountNumber": "1234565656",
    "routingNumber": "32154544",
    "accountType": "checking"
  },
  "payoutMethod": "bank_transfer",
  "payoutGateway": "manual",
  "notes": "Monthly payout for January 2025"
}
```

**Required Fields:**
- `amount` - Payout amount (must be positive and not exceed available earnings)
- `bankAccount.accountHolder` - Account holder name
- `bankAccount.bankName` - Bank name
- `bankAccount.accountNumber` - Bank account number
- `bankAccount.routingNumber` - Bank routing number

**Optional Fields:**
- `currency` - Currency code (default: "USD")
- `bankAccount.accountType` - Account type: `checking` or `savings` (default: `checking`)
- `payoutMethod` - Payout method: `bank_transfer`, `wire_transfer`, `ach`, `check` (default: `bank_transfer`)
- `payoutGateway` - Payout gateway: `stripe`, `paypal`, `manual` (default: `manual`)
- `notes` - Additional notes

**Response:**
```json
{
  "success": true,
  "message": "Payout processed successfully",
  "data": {
    "_id": "payout_id",
    "payoutId": "POUT-1234567890",
    "doctor": {
      "_id": "doctor_id",
      "user": {
        "firstName": "Mark",
        "lastName": "Lee",
        "email": "mark.lee@example.com"
      },
      "specialty": "Pharmacy"
    },
    "amount": 4500.00,
    "currency": "USD",
    "bankAccount": {
      "accountHolder": "Mark Lee",
      "bankName": "Chase Bank",
      "accountNumber": "1234565656",
      "routingNumber": "32154544",
      "accountType": "checking"
    },
    "status": "pending",
    "payoutMethod": "bank_transfer",
    "payoutGateway": "manual",
    "processedBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User"
    },
    "notes": "Monthly payout for January 2025",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid amount, insufficient earnings, or missing bank account information
- `404` - Doctor not found
- `401` - Unauthorized
- `403` - Forbidden (not admin/sub-admin)

**Notes:**
- Amount cannot exceed available earnings
- Payout is created with status `pending`
- Bank account information is stored securely
- Use the update payout status endpoint to mark as completed/failed

---

### Update Payout Status
**PUT** `/api/v1/admin/payouts/:payoutId/status`

Update the status of a payout (e.g., mark as completed after processing, or mark as failed).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "status": "completed",
  "transactionId": "TXN-1234567890",
  "failureReason": null
}
```

**For Failed Payout:**
```json
{
  "status": "failed",
  "transactionId": null,
  "failureReason": "Insufficient funds in admin account"
}
```

**Required Fields:**
- `status` - New status: `pending`, `processing`, `completed`, `failed`, `cancelled`

**Optional Fields:**
- `transactionId` - Transaction ID from payment gateway (required for `completed` status)
- `failureReason` - Reason for failure (required for `failed` status)

**Response:**
```json
{
  "success": true,
  "message": "Payout status updated successfully",
  "data": {
    "_id": "payout_id",
    "payoutId": "POUT-1234567890",
    "status": "completed",
    "transactionId": "TXN-1234567890",
    "processedAt": "2025-01-15T11:00:00.000Z",
    ...
  }
}
```

**Notes:**
- Status `completed` automatically sets `processedAt` timestamp
- Status `failed` automatically sets `failedAt` timestamp
- Transaction ID should be provided when marking as completed
- Failure reason should be provided when marking as failed

---

## Reports & Exports APIs (Admin/Sub-Admin Only)

Comprehensive reports and exports APIs for admins to view and export various reports including consultation activity, prescriptions & orders, financial settlement, and pharmacy inventory.

### Get Consultation Activity Report
**GET** `/api/v1/admin/reports/consultation-activity`

Get consultation activity report with prescriptions, doctors, patients, and diagnoses.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10, max: 100)
- `period` (optional) - Time period: `last_7_days`, `last_30_days`, `last_90_days`, `last_365_days`, `this_month`, `last_month`, `this_year` (default: `last_30_days`)
- `startDate` (optional) - Custom start date (ISO 8601 format)
- `endDate` (optional) - Custom end date (ISO 8601 format)
- `doctorId` (optional) - Filter by doctor ID
- `patientId` (optional) - Filter by patient ID
- `search` (optional) - Search in prescription number or diagnosis

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "prescriptionId": "rx1",
      "doctor": {
        "_id": "doctor_id",
        "name": "Dr. Sarah Jenkins",
        "email": "sarah.j@mediprime.com",
        "profilePicture": "https://example.com/profile.jpg",
        "specialty": "Cardiology"
      },
      "patient": {
        "_id": "patient_id",
        "name": "Darrell Steward",
        "email": "darrell@example.com"
      },
      "diagnosis": "Bacterial infection",
      "date": "2025-01-15T10:30:00.000Z",
      "status": "active",
      "medications": [...],
      "followUpDate": "2025-02-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15
  }
}
```

**Notes:**
- Returns prescriptions with doctor and patient information
- Results are sorted by date (newest first)
- Supports filtering by date range, doctor, patient, and search

---

### Export Consultation Activity
**GET** `/api/v1/admin/reports/consultation-activity/export`

Export consultation activity report in Excel, CSV, or PDF format.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- All parameters from Get Consultation Activity
- `format` (optional) - Export format: `excel`, `csv`, `pdf` (default: `excel`)

**Response:**
```json
{
  "success": true,
  "message": "Export functionality for excel format will be implemented",
  "data": [...],
  "format": "excel"
}
```

**Notes:**
- Export functionality is a placeholder - implement using libraries like exceljs, csv-writer, pdfkit
- Returns all data (limit is increased to 10000 for exports)

---

### Get Prescriptions & Orders Report
**GET** `/api/v1/admin/reports/prescriptions-orders`

Get combined report of prescriptions and orders.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10, max: 100)
- `period` (optional) - Time period (default: `last_30_days`)
- `startDate` (optional) - Custom start date (ISO 8601 format)
- `endDate` (optional) - Custom end date (ISO 8601 format)
- `type` (optional) - Filter by type: `prescriptions`, `orders`, `all` (default: `all`)
- `status` (optional) - Filter by status
- `search` (optional) - Search in prescription/order number

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "prescription",
      "id": "rx1",
      "prescriptionId": "rx1",
      "orderId": null,
      "doctor": "Dr. Sarah Jenkins",
      "patient": "Darrell Steward",
      "diagnosis": "Bacterial infection",
      "items": 3,
      "totalAmount": 0,
      "status": "active",
      "date": "2025-01-15T10:30:00.000Z",
      "isOrdered": false
    },
    {
      "type": "order",
      "id": "ORD-1234567890",
      "prescriptionId": "rx1",
      "orderId": "ORD-1234567890",
      "doctor": null,
      "patient": "Darrell Steward",
      "diagnosis": null,
      "items": 5,
      "totalAmount": 150.00,
      "status": "paid",
      "date": "2025-01-15T11:00:00.000Z",
      "isOrdered": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 200,
    "pages": 20
  },
  "summary": {
    "prescriptions": 150,
    "orders": 50,
    "totalAmount": 7500.00
  }
}
```

**Notes:**
- Combines prescriptions and orders in a single list
- Each item has a `type` field to distinguish between prescription and order
- Summary includes counts and total amount

---

### Export Prescriptions & Orders
**GET** `/api/v1/admin/reports/prescriptions-orders/export`

Export prescriptions & orders report in Excel, CSV, or PDF format.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- All parameters from Get Prescriptions & Orders
- `format` (optional) - Export format: `excel`, `csv`, `pdf` (default: `excel`)

---

### Get Financial Settlement Report
**GET** `/api/v1/admin/reports/financial-settlement`

Get financial settlement report with payments and payouts.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10, max: 100)
- `period` (optional) - Time period (default: `last_30_days`)
- `startDate` (optional) - Custom start date (ISO 8601 format)
- `endDate` (optional) - Custom end date (ISO 8601 format)
- `type` (optional) - Filter by type: `payments`, `payouts`, `all` (default: `all`)
- `status` (optional) - Filter by status
- `search` (optional) - Search in transaction ID or payment/payout ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "payment",
      "id": "PAY-1234567890",
      "transactionId": "PAY-1234567890",
      "doctor": null,
      "patient": "Darrell Steward",
      "amount": 150.00,
      "status": "success",
      "paymentMethod": "card",
      "date": "2025-01-15T10:30:00.000Z",
      "orderNumber": "ORD-1234567890"
    },
    {
      "type": "payout",
      "id": "POUT-1234567890",
      "transactionId": "POUT-1234567890",
      "doctor": "Dr. Sarah Jenkins",
      "patient": null,
      "amount": 5000.00,
      "status": "completed",
      "paymentMethod": "bank_transfer",
      "date": "2025-01-15T09:00:00.000Z",
      "orderNumber": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  },
  "summary": {
    "totalPayments": 50000.00,
    "totalPayouts": 20000.00,
    "netAmount": 30000.00
  }
}
```

**Notes:**
- Combines payments and payouts in a single list
- Each item has a `type` field to distinguish between payment and payout
- Summary includes total payments, total payouts, and net amount

---

### Export Financial Settlement
**GET** `/api/v1/admin/reports/financial-settlement/export`

Export financial settlement report in Excel, CSV, or PDF format.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- All parameters from Get Financial Settlement
- `format` (optional) - Export format: `excel`, `csv`, `pdf` (default: `excel`)

---

### Get Pharmacy Inventory Report
**GET** `/api/v1/admin/reports/pharmacy-inventory`

Get pharmacy inventory report with all medicines and stock information.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10, max: 100)
- `search` (optional) - Search in product name or brand
- `brand` (optional) - Filter by brand
- `sortBy` (optional) - Sort field: `productName`, `brand`, `salePrice`, `originalPrice`, `createdAt`, `updatedAt` (default: `createdAt`)
- `sortOrder` (optional) - Sort order: `asc` or `desc` (default: `desc`)
- `lowStock` (optional) - Filter low stock items: `true` or `false`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "medicine_id",
      "productName": "Paracetamol 500mg",
      "brand": "Generic",
      "originalPrice": 50.00,
      "salePrice": 45.00,
      "productImages": [...],
      "stock": 100,
      "status": "active",
      "createdAt": "2025-01-01T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 500,
    "pages": 50
  },
  "brands": ["Generic", "Brand A", "Brand B"],
  "summary": {
    "totalProducts": 500,
    "activeProducts": 450,
    "inactiveProducts": 50
  }
}
```

**Notes:**
- Returns all medicines with pricing and stock information
- Includes list of unique brands for filtering
- Summary includes total, active, and inactive product counts

---

### Export Pharmacy Inventory
**GET** `/api/v1/admin/reports/pharmacy-inventory/export`

Export pharmacy inventory report in Excel, CSV, or PDF format.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- All parameters from Get Pharmacy Inventory
- `format` (optional) - Export format: `excel`, `csv`, `pdf` (default: `excel`)

---

**Error Responses (All Reports):**
- `400` - Invalid query parameters
- `401` - Unauthorized
- `403` - Forbidden (not admin/sub-admin)

**Notes:**
- All reports support date range filtering with predefined periods or custom dates
- Export endpoints return data in JSON format (actual file generation to be implemented)
- Use libraries like `exceljs`, `csv-writer`, or `pdfkit` for actual file generation
- All reports support pagination and search functionality

---

## Dashboard APIs (Admin/Sub-Admin Only)

Comprehensive dashboard APIs for admins to view KPIs, summary statistics, revenue vs payouts chart, and AI insights.

### Get Dashboard Data
**GET** `/api/v1/admin/dashboard`

Get dashboard data including KPI metrics and summary cards.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `period` (optional) - Time period: `last_7_days`, `last_30_days`, `last_90_days`, `last_365_days`, `this_month`, `last_month`, `this_year` (default: `last_30_days`)
- `region` (optional) - Filter by region (placeholder for future implementation)
- `doctorId` (optional) - Filter by specific doctor
- `medicationId` (optional) - Filter by specific medication

**Response:**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "totalUsers": {
        "value": 12450,
        "change": 5.62,
        "isIncrease": true
      },
      "totalRevenue": {
        "value": 450200,
        "change": 12.0,
        "isIncrease": true
      },
      "pharmacySales": {
        "value": 120000,
        "change": 6.0,
        "isIncrease": true
      },
      "consultationsToday": {
        "value": 340,
        "change": -2.0,
        "isIncrease": false
      }
    },
    "summary": {
      "activeConsultations": 45,
      "prescriptionsIssued": 120,
      "ordersProcessing": 85,
      "completedDeliveries": 200
    }
  }
}
```

**Response Fields:**
- `kpis.totalUsers` - Total users (patients + doctors) with percentage change
- `kpis.totalRevenue` - Total revenue from all successful payments
- `kpis.pharmacySales` - Total pharmacy sales from orders
- `kpis.consultationsToday` - Number of consultations (prescriptions) created today
- `summary.activeConsultations` - Number of active consultations/chats
- `summary.prescriptionsIssued` - Number of prescriptions issued in the period
- `summary.ordersProcessing` - Number of orders in processing/pending status
- `summary.completedDeliveries` - Number of completed/delivered orders

**Notes:**
- All KPI values include percentage change from previous period
- `isIncrease` indicates if the value increased or decreased
- Consultations Today compares with the same day in the previous period
- Summary cards show current system status

---

### Get Revenue vs Payouts Chart
**GET** `/api/v1/admin/dashboard/revenue-vs-payouts`

Get monthly revenue vs payouts chart data for a specific year.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `year` (optional) - Year (default: current year)

**Response:**
```json
{
  "success": true,
  "data": {
    "year": 2025,
    "total": 8987858,
    "percentageChange": 40.0,
    "isIncrease": true,
    "data": [
      {
        "month": "Jan",
        "monthNumber": 1,
        "revenue": 250000,
        "payouts": 100000
      },
      {
        "month": "Feb",
        "monthNumber": 2,
        "revenue": 280000,
        "payouts": 110000
      },
      {
        "month": "Mar",
        "monthNumber": 3,
        "revenue": 220000,
        "payouts": 90000
      }
      // ... more months
    ]
  }
}
```

**Response Fields:**
- `year` - The year for which data is returned
- `total` - Net amount (revenue - payouts) for the year
- `percentageChange` - Percentage change from previous year
- `isIncrease` - Boolean indicating if net amount increased
- `data` - Array of monthly data
  - `month` - Month abbreviation (Jan, Feb, etc.)
  - `monthNumber` - Month number (1-12)
  - `revenue` - Revenue amount for that month
  - `payouts` - Payouts amount for that month

**Notes:**
- Revenue is calculated from successful payments
- Payouts are calculated from completed doctor payouts
- Net amount = Revenue - Payouts
- Percentage change compares net amount with previous year

---

### Get AI Insights
**GET** `/api/v1/admin/dashboard/ai-insights`

Get AI-powered insights and recommendations based on system data.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "type": "recommendation",
        "title": "Recommendation",
        "message": "35% of Doctor Payouts are pending approval. Review Batch #402 to avoid delays.",
        "priority": "high"
      },
      {
        "type": "trend_alert",
        "title": "Trend Alerts",
        "message": "Medication demand is up 15% compared to average. Consider restocking popular items.",
        "priority": "medium"
      },
      {
        "type": "trend_alert",
        "title": "Trend Alerts",
        "message": "Revenue has increased by 12.5% compared to last week.",
        "priority": "low"
      }
    ]
  }
}
```

**Response Fields:**
- `insights` - Array of insight objects
  - `type` - Insight type: `recommendation`, `trend_alert`, `info`
  - `title` - Insight title
  - `message` - Insight message/description
  - `priority` - Priority level: `high`, `medium`, `low`

**Insight Types:**
- **Recommendation** - Actionable recommendations (e.g., pending payouts, review batches)
- **Trend Alerts** - Trend notifications (e.g., demand changes, revenue trends)
- **Info** - General information (e.g., system status)

**Notes:**
- Insights are generated based on real-time system data
- Maximum 3 insights are returned
- Priority levels help prioritize actions
- Insights are dynamically generated based on current system state

**Error Responses:**
- `400` - Invalid query parameters
- `401` - Unauthorized
- `403` - Forbidden (not admin/sub-admin)

---

### Get Recent Activity
**GET** `/api/v1/admin/dashboard/recent-activity`

Get recent activity feed showing user actions, consultations, payouts, and other system activities.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `limit` (optional) - Number of activities to return (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "userDoctor": "Dr. Sarah Jenkins",
        "action": "Password Reset Request",
        "status": "completed",
        "time": "2025-01-15T10:28:00.000Z",
        "timeAgo": "2 mins ago"
      },
      {
        "userDoctor": "John Doe (Patient)",
        "action": "New Consultation Booking",
        "status": "pending",
        "time": "2025-01-15T10:15:00.000Z",
        "timeAgo": "15 mins ago"
      },
      {
        "userDoctor": "Dr. Mark Lee",
        "action": "Payout Batch #402",
        "status": "processing",
        "time": "2025-01-15T10:00:00.000Z",
        "timeAgo": "20 mins ago"
      }
    ]
  }
}
```

**Notes:**
- Activities include: Password Reset Requests, Consultation Bookings, Payout Batches, Order Placements
- Status: `completed` (green), `pending` (yellow), `processing` (blue)
- Time formatted as "X mins ago", "X hours ago", etc.

---

### Get Prescriptions By Region
**GET** `/api/v1/admin/dashboard/prescriptions-by-region`

Get prescription data grouped by region/state with activity percentages.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `period` (optional) - Time period (default: `last_30_days`)

**Response:**
```json
{
  "success": true,
  "data": {
    "regions": [
      {
        "region": "New York",
        "state": "New York",
        "count": 425,
        "percentage": 85
      },
      {
        "region": "California",
        "state": "California",
        "count": 325,
        "percentage": 65
      },
      {
        "region": "Texas",
        "state": "Texas",
        "count": 225,
        "percentage": 45
      }
    ],
    "highActivity": {
      "region": "New York",
      "count": 425,
      "percentage": 85
    },
    "total": 500,
    "period": "last_30_days"
  }
}
```

**Notes:**
- Regions determined from patient addresses
- High activity region has the highest prescription count
- Percentages calculated based on total prescriptions

---

## Authentication APIs

### 1. Register
**POST** `/auth/register`

Register a new user.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "1234567890",
  "countryCode": "+91",
  "email": "john@example.com",
  "agreeConfirmation": "true",
  "password": "optional"
}
```

### 2. Login with Password
**POST** `/auth/login` or `/auth/login-password`

Login using email/phone and password.

**Request Body:**
```json
{
  "identifier": "user@example.com",
  "password": "password123",
  "rememberMe": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com",
      "phoneNumber": "1234567890",
      "role": "patient",
      "isActive": true,
      "isVerified": true,
      "lastLoginAt": "2024-01-15T10:30:00.000Z"
    },
    "tokens": {
      "accessToken": "jwt_token_here",
      "refreshToken": "refresh_token_here"
    }
  }
}
```

**Notes:**
- `identifier` can be either email address or phone number
- `rememberMe` is optional - if true, provides a refresh token
- User's `isActive` status is set to `true` on successful login
- Login attempt is tracked in login history

### 3. Login with OTP
**POST** `/auth/login-otp`

Login using email or phone number with OTP. This is a two-step process:

**Step 1: Request OTP**
Send identifier (email or phone) without OTP to receive OTP.

**Request Body:**
```json
{
  "identifier": "user@example.com"
}
```
OR
```json
{
  "identifier": "1234567890",
  "countryCode": "+91"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to user@example.com",
  "data": {
    "identifier": "user@example.com",
    "method": "email"
  }
}
```

**Step 2: Verify OTP and Login**
Send identifier with OTP to complete login.

**Request Body:**
```json
{
  "identifier": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com",
      "phoneNumber": "1234567890",
      "role": "patient",
      "isActive": true,
      "isVerified": true,
      "lastLoginAt": "2024-01-15T10:30:00.000Z"
    },
    "tokens": {
      "accessToken": "jwt_token_here",
      "refreshToken": "refresh_token_here"
    }
  }
}
```

**Notes:**
- `identifier` can be either email address or phone number
- OTP is sent to the registered email or phone number
- OTP expires after 10 minutes (configurable)
- User's `isActive` status is set to `true` on successful login

### 4. Send OTP
**POST** `/auth/send-otp`

Send OTP to phone number.

**Request Body:**
```json
{
  "phoneNumber": "1234567890",
  "countryCode": "+91"
}
```

### 5. Verify OTP
**POST** `/auth/verify-otp`

Verify OTP during registration.

**Request Body:**
```json
{
  "phoneNumber": "1234567890",
  "otp": "123456"
}
```

### 6. Resend OTP
**POST** `/auth/resend-otp`

Resend OTP.

**Request Body:**
```json
{
  "phoneNumber": "1234567890",
  "countryCode": "+91"
}
```

### 7. Refresh Token
**POST** `/auth/refresh-token`

Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

### 8. Logout
**POST** `/auth/logout`

Logout and deactivate user session.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Notes:**
- User's `isActive` status is set to `false` on logout
- Login history is tracked for security purposes

### 9. Forgot Password
**POST** `/auth/forgot-password`

Send OTP for password reset.

**Request Body:**
```json
{
  "phoneNumber": "1234567890",
  "countryCode": "+91"
}
```

### 10. Reset Password
**POST** `/auth/reset-password`

Reset password using OTP.

**Request Body:**
```json
{
  "phoneNumber": "1234567890",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

### 11. Change Password
**PUT** `/auth/change-password`

Change password (requires authentication).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "oldPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### 12. Login History (Internal Tracking)

**Note:** Login history is automatically tracked for all login attempts. The endpoint to retrieve login history may be implemented separately.

All login attempts (successful and failed) are automatically tracked with:
- Login method (password or OTP)
- IP address
- User agent (device, browser, OS)
- Login status (success or failed)
- Login timestamp

This information is stored in the database and can be used for:
- Security monitoring
- Audit trails
- Account activity tracking
- Suspicious login detection

---

## Patient APIs

All patient APIs require authentication: `Authorization: Bearer <token>`

### Profile

#### Get Profile
**GET** `/patient/profile`

#### Update Profile
**PUT** `/patient/profile`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "bloodGroup": "O+",
  "height": 175,
  "weight": 70
}
```

### Intake Form

The intake form is divided into three sections that can be saved independently. Each section has its own save endpoint.

#### Get Intake Form
**GET** `/patient/intake-form`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "basicInformation": {
      "firstName": "John",
      "middleName": "Michael",
      "lastName": "Doe",
      "sex": "male",
      "dateOfBirth": "1990-01-15",
      "email": "john@example.com",
      "phone": "1234567890",
      "address": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zip": "400001",
      "maritalStatus": "single",
      "govtIssuedCertificate": "aadhaar",
      "certificateUpload": "uploads/certificate.pdf",
      "isBasicInfoComplete": true
    },
    "emergencyContact": {
      "relationship": "spouse",
      "firstName": "Jane",
      "lastName": "Doe",
      "phone": "9876543210",
      "isEmergencyContactComplete": true
    },
    "medicalQuestions": {
      "pastMedicalHistory": ["Diabetes"],
      "currentMedications": ["Metformin"],
      "medicationAllergies": ["Penicillin"],
      "isMedicalQuestionsComplete": true
    },
    "status": "draft"
  }
}
```

#### Save Basic Information
**POST** `/patient/intake-form/basic-information`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "firstName": "John",
  "middleName": "Michael",
  "lastName": "Doe",
  "sex": "male",
  "dateOfBirth": "1990-01-15",
  "email": "john@example.com",
  "phone": "1234567890",
  "address": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "zip": "400001",
  "maritalStatus": "single",
  "govtIssuedCertificate": "aadhaar",
  "certificateUpload": "uploads/certificate.pdf"
}
```

**Required Fields:**
- `firstName` - First name
- `lastName` - Last name
- `sex` - Must be one of: `male`, `female`, `other`
- `dateOfBirth` - Date in ISO 8601 format (YYYY-MM-DD)

**Optional Fields:**
- `middleName` - Middle name
- `email` - Email address
- `phone` - Phone number
- `address` - Street address
- `city` - City name
- `state` - State name
- `zip` - Zip/postal code
- `maritalStatus` - Must be one of: `single`, `married`, `divorced`, `widowed`, `separated`
- `govtIssuedCertificate` - Must be one of: `aadhaar`, `pan`, `passport`, `driving_license`, `voter_id`, `other`
- `certificateUpload` - File URL or path for uploaded certificate

**Response:**
```json
{
  "success": true,
  "message": "Basic information saved successfully",
  "data": {
    "basicInformation": {
      "firstName": "John",
      "isBasicInfoComplete": true
    }
  }
}
```

#### Save Emergency Contact
**POST** `/patient/intake-form/emergency-contact`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "relationship": "spouse",
  "firstName": "Jane",
  "middleName": "Marie",
  "lastName": "Doe",
  "email": "jane@example.com",
  "phone": "9876543210",
  "primaryPhone": "9876543210",
  "workPhone": "9876543211",
  "address": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "zip": "400001"
}
```

**Required Fields:**
- `relationship` - Relationship to the contact person
- `firstName` - First name
- `lastName` - Last name
- `phone` - Phone number

**Optional Fields:**
- `middleName` - Middle name
- `email` - Email address
- `primaryPhone` - Primary phone number
- `workPhone` - Work phone number
- `address` - Street address
- `city` - City name
- `state` - State name
- `zip` - Zip/postal code

**Response:**
```json
{
  "success": true,
  "message": "Emergency contact saved successfully",
  "data": {
    "emergencyContact": {
      "relationship": "spouse",
      "isEmergencyContactComplete": true
    }
  }
}
```

#### Save Medical Questions
**POST** `/patient/intake-form/medical-questions`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "pastMedicalHistory": [
    "Diabetes",
    "Hypertension",
    "Asthma"
  ],
  "currentMedications": [
    "Metformin 500mg twice daily",
    "Aspirin 75mg once daily"
  ],
  "medicationAllergies": [
    "Penicillin",
    "Sulfa drugs"
  ],
  "preferredPharmacies": [
    {
      "pharmacyName": "City Pharmacy",
      "address": "456 Market St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zip": "400002"
    },
    {
      "pharmacyName": "Health Plus Pharmacy",
      "address": "789 Health Ave",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zip": "400003"
    }
  ],
  "howDidYouHearAboutUs": "Google Search"
}
```

**Optional Fields:**
- `pastMedicalHistory` - Array of strings listing past medical conditions
- `currentMedications` - Array of strings listing current medications
- `medicationAllergies` - Array of strings listing medication allergies
- `preferredPharmacies` - Array of pharmacy objects with:
  - `pharmacyName` - Name of the pharmacy
  - `address` - Pharmacy address
  - `city` - City name
  - `state` - State name
  - `zip` - Zip/postal code
- `howDidYouHearAboutUs` - String describing how the patient heard about the service

**Response:**
```json
{
  "success": true,
  "message": "Medical questions saved successfully",
  "data": {
    "medicalQuestions": {
      "pastMedicalHistory": ["Diabetes"],
      "isMedicalQuestionsComplete": true
    }
  }
}
```

**Notes:**
- Each section can be saved independently
- Completion status (`isBasicInfoComplete`, `isEmergencyContactComplete`, `isMedicalQuestionsComplete`) is automatically tracked based on required fields
- The form status can be `draft`, `submitted`, or `reviewed`
- All endpoints require authentication
- File uploads for certificates should be handled separately and the URL/path should be provided in `certificateUpload` field

### My Past Medications

View and manage your past prescriptions, diagnoses, allergies, and doctor consultations.

#### Get All Past Medications
**GET** `/patient/past-medications`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "record_id",
      "recordNumber": 1,
      "doctor": "Dr. R. Sharma (MD, Dermatology)",
      "issueDate": "2025-10-12T00:00:00.000Z",
      "prescribedMedications": [
        "Derma Co Niacinamide 10% Serum - 30ml",
        "Clindamycin Gel 1%",
        "Doxycycline 100mg Capsules (10)"
      ],
      "clinic": "SkinGlow Clinic, Delhi",
      "diagnosedCondition": "Acne Vulgaris",
      "note": "Use for 6 weeks. Avoid direct sunlight exposure.",
      "createdAt": "2025-10-12T10:30:00.000Z",
      "updatedAt": "2025-10-12T10:30:00.000Z"
    },
    {
      "_id": "record_id_2",
      "recordNumber": 2,
      "doctor": "Dr. A. Patel (MD, Cardiology)",
      "issueDate": "2025-09-15T00:00:00.000Z",
      "prescribedMedications": [
        "Aspirin 75mg",
        "Atorvastatin 20mg"
      ],
      "clinic": "Heart Care Clinic, Mumbai",
      "diagnosedCondition": "Hypertension",
      "note": "Take with food. Regular follow-up required.",
      "createdAt": "2025-09-15T14:20:00.000Z",
      "updatedAt": "2025-09-15T14:20:00.000Z"
    }
  ]
}
```

**Notes:**
- Records are sorted by issue date (newest first)
- Each record includes a `recordNumber` for easy reference
- Records are automatically numbered starting from 1

#### Get Single Past Medication by ID
**GET** `/patient/past-medications/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "record_id",
    "patient": "patient_id",
    "doctor": "Dr. R. Sharma (MD, Dermatology)",
    "issueDate": "2025-10-12T00:00:00.000Z",
    "prescribedMedications": [
      "Derma Co Niacinamide 10% Serum - 30ml",
      "Clindamycin Gel 1%",
      "Doxycycline 100mg Capsules (10)"
    ],
    "clinic": "SkinGlow Clinic, Delhi",
    "diagnosedCondition": "Acne Vulgaris",
    "note": "Use for 6 weeks. Avoid direct sunlight exposure.",
    "createdAt": "2025-10-12T10:30:00.000Z",
    "updatedAt": "2025-10-12T10:30:00.000Z"
  }
}
```

**Notes:**
- Returns a single record by its ID
- Only returns records belonging to the authenticated user
- Returns 404 if record not found or doesn't belong to the user

#### Add New Past Medication Record
**POST** `/patient/past-medications`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "doctor": "Dr. R. Sharma (MD, Dermatology)",
  "issueDate": "2025-10-12",
  "prescribedMedications": [
    "Derma Co Niacinamide 10% Serum - 30ml",
    "Clindamycin Gel 1%",
    "Doxycycline 100mg Capsules (10)"
  ],
  "clinic": "SkinGlow Clinic, Delhi",
  "diagnosedCondition": "Acne Vulgaris",
  "note": "Use for 6 weeks. Avoid direct sunlight exposure."
}
```

**Required Fields:**
- `doctor` - Doctor's name and credentials (string)
- `issueDate` - Date when the prescription was issued (YYYY-MM-DD format)
- `prescribedMedications` - Array of medication names (at least one required)
- `clinic` - Clinic or hospital name (string)
- `diagnosedCondition` - Condition diagnosed by the doctor (string)

**Optional Fields:**
- `note` - Additional notes or instructions (string)

**Response:**
```json
{
  "success": true,
  "message": "Past medication record added successfully",
  "data": {
    "_id": "record_id",
    "doctor": "Dr. R. Sharma (MD, Dermatology)",
    "issueDate": "2025-10-12T00:00:00.000Z",
    "prescribedMedications": [
      "Derma Co Niacinamide 10% Serum - 30ml",
      "Clindamycin Gel 1%",
      "Doxycycline 100mg Capsules (10)"
    ],
    "clinic": "SkinGlow Clinic, Delhi",
    "diagnosedCondition": "Acne Vulgaris",
    "note": "Use for 6 weeks. Avoid direct sunlight exposure."
  }
}
```

#### Update Past Medication Record
**PUT** `/patient/past-medications/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (Same as Add New Record)

**Response:**
```json
{
  "success": true,
  "message": "Past medication record updated successfully",
  "data": {
    "_id": "record_id",
    "doctor": "Dr. R. Sharma (MD, Dermatology)",
    "issueDate": "2025-10-12T00:00:00.000Z",
    "prescribedMedications": [
      "Derma Co Niacinamide 10% Serum - 30ml",
      "Clindamycin Gel 1%"
    ],
    "clinic": "SkinGlow Clinic, Delhi",
    "diagnosedCondition": "Acne Vulgaris",
    "note": "Updated note"
  }
}
```

#### Remove Past Medication Record
**DELETE** `/patient/past-medications/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Record removed successfully"
}
```

**Notes:**
- Only the record owner can delete their own records
- Deletion is permanent and cannot be undone
- The `:id` parameter is the record ID from the GET response

### Prescriptions

#### Get All Prescriptions
**GET** `/patient/prescriptions?status=active`

#### Get Prescription by ID
**GET** `/patient/prescriptions/:id`

#### Get Prescription PDF
**GET** `/patient/prescriptions/:id/pdf`

#### Reorder Prescription
**POST** `/patient/prescriptions/:id/reorder`

### Shopping Cart

Manage your shopping cart items before checkout.

#### Get Cart
**GET** `/patient/cart`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "item_id",
        "productId": "product_123",
        "productName": "Cetaphil Gentle Skin Cleanser 250ml",
        "productImage": "https://example.com/image.jpg",
        "productType": "medication",
        "quantity": 1,
        "unitPrice": 78.99,
        "totalPrice": 78.99,
        "isSaved": false
      },
      {
        "_id": "item_id_2",
        "productId": "note_id",
        "productName": "Doctor's Note - Excuse Note",
        "productType": "doctors_note",
        "quantity": 1,
        "unitPrice": 39.00,
        "totalPrice": 39.00,
        "isSaved": false
      }
    ],
    "subtotal": 1403.97,
    "discount": 60.00,
    "tax": 42.12,
    "shippingCharges": 10.00,
    "totalAmount": 1395.97,
    "couponCode": "SAVE10"
  }
}
```

#### Add to Cart
**POST** `/patient/cart/items`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "productId": "product_123",
  "productName": "Cetaphil Gentle Skin Cleanser 250ml",
  "productImage": "https://example.com/image.jpg",
  "productType": "medication",
  "quantity": 1,
  "unitPrice": 78.99
}
```

**Required Fields:**
- `productId` - Product identifier (string)
- `productName` - Product name (string)
- `unitPrice` - Price per unit (number)

**Optional Fields:**
- `quantity` - Quantity to add (default: 1)
- `productImage` - Product image URL
- `productType` - Type: `medication`, `doctors_note`, or `other` (default: `medication`)

**Response:**
```json
{
  "success": true,
  "message": "Item added to cart successfully",
  "data": {
    "items": [...],
    "subtotal": 78.99,
    "totalAmount": 91.35
  }
}
```

**Notes:**
- If item already exists, quantity is increased
- Tax is automatically calculated (3% of subtotal)
- Shipping charges default to ₹10.00

#### Update Item Quantity
**PUT** `/patient/cart/items/:itemId/quantity`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "quantity": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quantity updated",
  "data": {
    "items": [...],
    "subtotal": 157.98,
    "totalAmount": 172.72
  }
}
```

#### Remove Item from Cart
**DELETE** `/patient/cart/items/:itemId`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Item removed from cart",
  "data": {
    "items": [...],
    "subtotal": 0,
    "totalAmount": 0
  }
}
```

#### Clear Cart
**DELETE** `/patient/cart`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Cart cleared successfully",
  "data": {
    "items": [],
    "subtotal": 0,
    "totalAmount": 0
  }
}
```

**Notes:**
- Removes all items from cart
- Clears applied coupon
- Saved items are also removed

#### Save Item for Later
**POST** `/patient/cart/items/:itemId/save`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Item saved for later",
  "data": {
    "items": [...]
  }
}
```

**Notes:**
- Saved items are not included in checkout
- Can be moved back to cart later

#### Apply Coupon
**POST** `/patient/cart/coupon`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "couponCode": "SAVE10"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Coupon applied successfully",
  "data": {
    "cart": {
      "subtotal": 1403.97,
      "discount": 60.00,
      "totalAmount": 1395.97,
      "couponCode": "SAVE10"
    },
    "coupon": {
      "code": "SAVE10",
      "discountType": "percentage",
      "discountValue": 10,
      "discount": 60.00
    }
  }
}
```

**Notes:**
- Coupon code is case-insensitive
- Validates minimum purchase amount
- Checks validity dates and usage limits
- Supports percentage and fixed discounts

#### Remove Coupon
**DELETE** `/patient/cart/coupon`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Coupon removed",
  "data": {
    "subtotal": 1403.97,
    "discount": 0,
    "totalAmount": 1443.97
  }
}
```

### Doctor's Note

Request and manage doctor's excuse notes for work or school.

#### Get All Doctor's Notes
**GET** `/patient/doctors-notes`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "note_id",
      "type": "illness",
      "purpose": "work",
      "startDate": "2025-10-12T00:00:00.000Z",
      "endDate": "2025-10-15T00:00:00.000Z",
      "patientName": "John Doe",
      "price": 39.00,
      "status": "pending",
      "order": null
    }
  ]
}
```

#### Get Single Doctor's Note
**GET** `/patient/doctors-notes/:id`

**Headers:** `Authorization: Bearer <token>`

#### Create Doctor's Note
**POST** `/patient/doctors-notes`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "type": "illness",
  "purpose": "work",
  "startDate": "2025-10-12",
  "endDate": "2025-10-15",
  "patientName": "John Doe",
  "price": 39.00
}
```

**Required Fields:**
- `type` - Must be `illness` or `injury`
- `purpose` - Must be `work` or `school`
- `startDate` - Start date (YYYY-MM-DD)
- `endDate` - End date (YYYY-MM-DD, must be after start date)
- `patientName` - Patient's full name

**Optional Fields:**
- `price` - Price (default: 39.00)

**Response:**
```json
{
  "success": true,
  "message": "Doctor's note created successfully",
  "data": {
    "_id": "note_id",
    "type": "illness",
    "purpose": "work",
    "startDate": "2025-10-12T00:00:00.000Z",
    "endDate": "2025-10-15T00:00:00.000Z",
    "patientName": "John Doe",
    "price": 39.00,
    "status": "pending"
  }
}
```

#### Create Doctor's Note and Add to Cart
**POST** `/patient/doctors-notes/add-to-cart`

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (Same as Create Doctor's Note)

**Response:**
```json
{
  "success": true,
  "message": "Doctor's note created and added to cart",
  "data": {
    "note": {
      "_id": "note_id",
      "type": "illness",
      "price": 39.00
    },
    "cart": {
      "items": [
        {
          "productId": "note_id",
          "productName": "Doctor's Note - Excuse Note",
          "productType": "doctors_note",
          "quantity": 1,
          "unitPrice": 39.00
        }
      ]
    }
  }
}
```

**Notes:**
- Creates doctor's note and automatically adds it to cart
- Can be purchased along with medications

#### Update Doctor's Note
**PUT** `/patient/doctors-notes/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (Same as Create Doctor's Note)

**Notes:**
- Can only update notes with `pending` status
- Cannot update if already linked to an order

#### Delete Doctor's Note
**DELETE** `/patient/doctors-notes/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Doctor's note deleted successfully"
}
```

**Notes:**
- Can only delete notes with `pending` status

### Checkout

Complete the purchase process with billing and payment.

#### Get Checkout Summary
**GET** `/patient/checkout`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phoneNumber": "9876543210"
    },
    "cart": {
      "items": [
        {
          "productName": "Cetaphil Gentle Skin Cleanser 250ml",
          "quantity": 1,
          "unitPrice": 78.99,
          "totalPrice": 78.99
        }
      ],
      "subtotal": 1403.97,
      "discount": 60.00,
      "tax": 42.12,
      "shippingCharges": 10.00,
      "totalAmount": 1395.97,
      "couponCode": "SAVE10"
    },
    "addresses": [
      {
        "_id": "address_id",
        "type": "home",
        "fullName": "John Doe",
        "phoneNumber": "9876543210",
        "countryCode": "+91",
        "addressLine1": "123 Main St",
        "addressLine2": "Apt 4B",
        "city": "Pune",
        "state": "Maharashtra",
        "postalCode": "987612",
        "country": "India",
        "isDefault": true
      }
    ],
    "defaultAddress": {
      "_id": "address_id",
      "type": "home",
      "fullName": "John Doe",
      "phoneNumber": "9876543210",
      "countryCode": "+91",
      "addressLine1": "123 Main St",
      "addressLine2": "Apt 4B",
      "city": "Pune",
      "state": "Maharashtra",
      "postalCode": "987612",
      "country": "India"
    }
  }
}
```

**Notes:**
- Returns user details (firstName, lastName, email, phoneNumber)
- Returns cart items (excluding saved items)
- Includes all saved addresses
- Shows complete default address details

#### Process Checkout
**POST** `/patient/checkout`

**Headers:** `Authorization: Bearer <token>`

**Request Body (Billing Address Same as Shipping):**
```json
{
  "shippingAddressId": "address_id",
  "paymentMethod": "card",
  "billingAddressSameAsShipping": true,
  "shippingCharges": 10.00,
  "orderComment": "Please deliver before 5 PM",
  "cardDetails": {
    "cardNumber": "1234567890123456",
    "expiryDate": "12/25",
    "cvv": "123",
    "cardHolderName": "John Doe",
    "cardBrand": "VISA"
  }
}
```

**Request Body (Different Billing Address):**
```json
{
  "shippingAddressId": "address_id",
  "paymentMethod": "card",
  "billingAddressSameAsShipping": false,
  "billingAddress": {
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane.doe@example.com",
    "phoneNumber": "9876543210",
    "streetAddress": "456 Oak Avenue",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001"
  },
  "shippingCharges": 10.00,
  "orderComment": "Please deliver before 5 PM",
  "cardDetails": {
    "cardNumber": "1234567890123456",
    "expiryDate": "12/25",
    "cvv": "123",
    "cardHolderName": "Jane Doe",
    "cardBrand": "VISA"
  }
}
```

**Required Fields:**
- `shippingAddressId` - Address ID for delivery (MongoDB ObjectId)
- `paymentMethod` - Must be: `card`, `upi`, `netbanking`, `wallet`, or `cod`

**Required for Card Payment:**
- `cardDetails.cardNumber` - Card number
- `cardDetails.expiryDate` - Expiry date (MM/YY)
- `cardDetails.cvv` - CVV code
- `cardDetails.cardHolderName` - Card holder name

**Required when `billingAddressSameAsShipping` is `false`:**
- `billingAddress.firstName` - First name
- `billingAddress.lastName` - Last name
- `billingAddress.phoneNumber` - Phone number
- `billingAddress.streetAddress` - Street address
- `billingAddress.city` - City
- `billingAddress.state` - State
- `billingAddress.zipCode` - Zip/Postal code

**Optional Fields:**
- `billingAddressSameAsShipping` - Boolean (default: true)
- `billingAddress.email` - Email address
- `shippingCharges` - Override shipping charges
- `orderComment` - Order comment/notes
- `notes` - Order notes (legacy, use `orderComment`)
- `cardDetails.cardBrand` - Card brand (VISA, Mastercard, etc.)

**Response:**
```json
{
  "success": true,
  "message": "Order placed and payment processed successfully",
  "data": {
    "order": {
      "_id": "order_id",
      "orderNumber": "ORD202501151234567890",
      "items": [
        {
          "medicationName": "Cetaphil Gentle Skin Cleanser 250ml",
          "quantity": 1,
          "unitPrice": 78.99,
          "totalPrice": 78.99
        }
      ],
      "shippingAddress": "address_id",
      "billingAddress": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "phoneNumber": "9876543210",
        "streetAddress": "123 Main St",
        "city": "Pune",
        "state": "Maharashtra",
        "zipCode": "987612"
      },
      "billingAddressSameAsShipping": true,
      "subtotal": 1403.97,
      "discount": 60.00,
      "tax": 42.12,
      "shippingCharges": 10.00,
      "totalAmount": 1395.97,
      "status": "confirmed",
      "paymentStatus": "paid",
      "notes": "Please deliver before 5 PM"
    },
    "payment": {
      "_id": "payment_id",
      "paymentId": "PAY202501151234567890",
      "transactionId": "TXN202501151234567890",
      "amount": 1395.97,
      "paymentMethod": "card",
      "paymentStatus": "success",
      "paidAt": "2025-01-15T10:30:00.000Z"
    }
  }
}
```

**Notes:**
- Creates order from cart items
- Processes payment immediately
- Links doctor's notes to order if present
- Clears cart (keeps saved items)
- Updates coupon usage count
- Order status set to `confirmed`
- Payment status set to `paid`
- Billing address saved with order (same as shipping if checkbox checked)
- Order comment saved in `notes` field

### Orders

#### Get All Orders
**GET** `/patient/orders?status=pending`

#### Get Order by ID
**GET** `/patient/orders/:id`

#### Create Order
**POST** `/patient/orders`

**Headers:** `Authorization: Bearer <token>`

**Option 1: Create Order from Cart**

**Request Body:**
```json
{
  "createFromCart": true,
  "shippingAddressId": "address_id",
  "billingAddressSameAsShipping": true,
  "orderComment": "Please deliver before 5 PM"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "_id": "order_id_123",
    "orderNumber": "ORD202501151234567890",
    "patient": "patient_id_456",
    "items": [
      {
        "_id": "order_item_1",
        "productId": "product_123",
        "productType": "medication",
        "medicationName": "Cetaphil Gentle Skin Cleanser 250ml",
        "quantity": 2,
        "unitPrice": 78.99,
        "totalPrice": 157.98,
        "status": "ordered"
      },
      {
        "_id": "order_item_2",
        "productId": "product_456",
        "productType": "medication",
        "medicationName": "Paracetamol 500mg Tablets",
        "quantity": 1,
        "unitPrice": 25.50,
        "totalPrice": 25.50,
        "status": "ordered"
      }
    ],
    "shippingAddress": {
      "_id": "address_id",
      "type": "home",
      "fullName": "John Doe",
      "addressLine1": "123 Main Street",
      "city": "Pune",
      "state": "Maharashtra",
      "postalCode": "411001"
    },
    "billingAddress": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phoneNumber": "9876543210",
      "streetAddress": "123 Main Street",
      "city": "Pune",
      "state": "Maharashtra",
      "zipCode": "411001"
    },
    "billingAddressSameAsShipping": true,
    "subtotal": 222.48,
    "discount": 22.25,
    "tax": 6.67,
    "shippingCharges": 10.00,
    "totalAmount": 216.90,
    "status": "pending",
    "paymentStatus": "pending",
    "notes": "Please deliver before 5 PM",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Option 2: Create Order from Prescription**

**Request Body:**
```json
{
  "prescriptionId": "prescription_id",
  "shippingAddressId": "address_id",
  "shippingCharges": 50.00,
  "discount": 0,
  "orderComment": "Prescription order"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "_id": "order_id_124",
    "orderNumber": "ORD202501151234567891",
    "patient": "patient_id_456",
    "prescription": {
      "_id": "prescription_id",
      "medications": [...]
    },
    "items": [
      {
        "_id": "order_item_3",
        "prescriptionItem": "prescription_id",
        "medicationName": "Paracetamol",
        "quantity": 2,
        "unitPrice": 100,
        "totalPrice": 200,
        "status": "pending"
      }
    ],
    "shippingAddress": {...},
    "billingAddress": {...},
    "subtotal": 200.00,
    "discount": 0,
    "tax": 36.00,
    "shippingCharges": 50.00,
    "totalAmount": 286.00,
    "status": "pending",
    "notes": "Prescription order"
  }
}
```

**Option 3: Create Order with Custom Items**

**Request Body:**
```json
{
  "shippingAddressId": "address_id",
  "items": [
    {
      "medicationName": "Paracetamol 500mg",
      "quantity": 2,
      "unitPrice": 50,
      "totalPrice": 100
    },
    {
      "medicationName": "Aspirin 100mg",
      "quantity": 1,
      "unitPrice": 30,
      "totalPrice": 30
    }
  ],
  "shippingCharges": 50.00,
  "discount": 10.00,
  "billingAddressSameAsShipping": false,
  "billingAddress": {
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane.doe@example.com",
    "phoneNumber": "9876543211",
    "streetAddress": "456 Oak Avenue",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001"
  },
  "orderComment": "Custom order with different billing address"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "_id": "order_id_125",
    "orderNumber": "ORD202501151234567892",
    "items": [
      {
        "medicationName": "Paracetamol 500mg",
        "quantity": 2,
        "unitPrice": 50,
        "totalPrice": 100,
        "status": "pending"
      },
      {
        "medicationName": "Aspirin 100mg",
        "quantity": 1,
        "unitPrice": 30,
        "totalPrice": 30,
        "status": "pending"
      }
    ],
    "billingAddress": {
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane.doe@example.com",
      "phoneNumber": "9876543211",
      "streetAddress": "456 Oak Avenue",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zipCode": "400001"
    },
    "billingAddressSameAsShipping": false,
    "subtotal": 130.00,
    "discount": 10.00,
    "tax": 23.40,
    "shippingCharges": 50.00,
    "totalAmount": 193.40,
    "status": "pending",
    "notes": "Custom order with different billing address"
  }
}
```

**Required Fields:**
- `shippingAddressId` - Address ID for delivery (MongoDB ObjectId)

**Required for Cart-based Order:**
- `createFromCart` - Must be `true`
- Cart must not be empty

**Required for Prescription-based Order:**
- `prescriptionId` - Prescription ID (MongoDB ObjectId)

**Required for Custom Items Order:**
- `items` - Array of order items with `medicationName`, `quantity`, `unitPrice`, `totalPrice`

**Optional Fields:**
- `billingAddressSameAsShipping` - Boolean (default: true)
- `billingAddress` - Billing address object (required if `billingAddressSameAsShipping` is false)
- `shippingCharges` - Override shipping charges
- `discount` - Discount amount
- `orderComment` - Order notes/comment

**Notes:**
- **Cart-based orders**: When `createFromCart: true`, cart items are converted to order items and cart is automatically cleared (saved items are retained)
- **Prescription orders**: Items are automatically created from prescription medications
- **Custom orders**: Items are created from provided `items` array
- Cart operations (clearing) happen automatically when order is created from cart
- Billing address is auto-filled from shipping address if not provided
- Tax is calculated automatically (3% for cart orders, 18% for prescription/custom orders)

#### Delete Order Item
**DELETE** `/patient/orders/:orderId/items/:itemId`

Delete an item from a pending order.

**Parameters:**
- `orderId` (path) - Order ID
- `itemId` (path) - Order item ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Item removed from order",
  "data": {
    /* Updated order object */
  }
}
```

**Error Responses:**
- `400` - Cannot modify order in current status (order must be 'pending')
- `400` - Cannot delete the last item from order
- `404` - Order not found or Order item not found

#### Save Order Item
**POST** `/patient/orders/:orderId/items/:itemId/save`

Mark an order item as saved for later.

**Parameters:**
- `orderId` (path) - Order ID
- `itemId` (path) - Order item ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Item saved for later",
  "data": {
    /* Updated order object */
  }
}
```

#### Update Order Item Quantity
**PUT** `/patient/orders/:orderId/items/:itemId/quantity`

Update the quantity of an item in a pending order.

**Parameters:**
- `orderId` (path) - Order ID
- `itemId` (path) - Order item ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "quantity": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quantity updated",
  "data": {
    /* Updated order object */
  }
}
```

**Error Responses:**
- `400` - Cannot modify order in current status (order must be 'pending')
- `404` - Order not found or Order item not found

#### Reorder
**POST** `/patient/orders/:orderId/reorder`

Create a new order from an existing order (reorder all items).

**Parameters:**
- `orderId` (path) - Original order ID

**Response:**
```json
{
  "success": true,
  "message": "Order recreated successfully",
  "data": {
    /* New order object */
  }
}
```

#### Get Order Status
**GET** `/patient/orders/:id/status`

Get the current status of an order.

**Parameters:**
- `id` (path) - Order ID

**Response:**
```json
{
  "success": true,
  "data": {
    "orderNumber": "ORD-1234567890-1234",
    "status": "processing",
    "paymentStatus": "paid",
    "trackingNumber": "TRACK123456",
    "estimatedDelivery": "2024-01-20T10:00:00.000Z"
  }
}
```

#### Get Order Tracking
**GET** `/patient/orders/:id/tracking`

Get tracking information for an order.

**Parameters:**
- `id` (path) - Order ID

**Response:**
```json
{
  "success": true,
  "data": {
    "orderNumber": "ORD-1234567890-1234",
    "status": "shipped",
    "trackingNumber": "TRACK123456",
    "estimatedDelivery": "2024-01-20T10:00:00.000Z",
    "deliveredAt": null,
    "currentLocation": "In transit",
    "timeline": [
      { "status": "pending", "date": "2024-01-15T10:30:00.000Z" },
      { "status": "shipped", "date": "2024-01-16T14:20:00.000Z" }
    ]
  }
}
```

### Payments / Invoice

#### Get Invoice
**GET** `/patient/orders/:id/invoice`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "invoiceNumber": "INV-ORD202501151234567890",
    "order": {
      "orderNumber": "ORD202501151234567890",
      "items": [...],
      "subtotal": 1403.97,
      "discount": 60.00,
      "tax": 42.12,
      "shippingCharges": 10.00,
      "totalAmount": 1395.97
    },
    "billingAddress": {...},
    "paymentStatus": "paid"
  }
}
```

**Note:** All payments must go through Stripe. Use `/patient/payments/intent` endpoint to create payment intent.

#### Get Payment History
**GET** `/payments/history?status=success`

#### Create Payment Intent (Stripe)
**POST** `/patient/payments/intent`

Create a Stripe payment intent for an order. This should be called after order creation.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "orderId": "order_id",
  "paymentMethod": "card",
  "currency": "inr"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment intent created successfully",
  "data": {
    "payment": {
      "_id": "payment_id",
      "order": "order_id",
      "amount": 439.6,
      "paymentStatus": "processing",
      "stripePaymentIntentId": "pi_1234567890",
      "paymentGateway": "stripe"
    },
    "clientSecret": "pi_1234567890_secret_xxxxx",
    "paymentIntentId": "pi_1234567890"
  }
}
```

**Notes:**
- Use `clientSecret` on the frontend to confirm payment with Stripe
- Payment status will be updated via webhook or verification endpoint
- Amount is automatically taken from order total

#### Verify Payment
**POST** `/patient/payments/verify`

Verify payment after client-side confirmation. Call this after Stripe confirms payment on frontend.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "paymentIntentId": "pi_1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "_id": "payment_id",
    "paymentStatus": "success",
    "isVerified": true,
    "transactionId": "ch_1234567890",
    "paidAt": "2025-01-15T10:30:00.000Z",
    "order": {
      "paymentStatus": "paid",
      "status": "confirmed"
    }
  }
}
```

**Notes:**
- Payment status and order status are automatically updated
- Order status changes to `confirmed` on successful payment

#### Stripe Webhook
**POST** `/patient/payments/webhook`

Stripe webhook endpoint for payment events. Configure this URL in Stripe dashboard.

**Headers:**
- `stripe-signature` - Stripe webhook signature (automatically sent by Stripe)

**Note:** This endpoint does NOT require authentication. Signature verification is used instead.

**Webhook Events Handled:**
- `payment_intent.succeeded` - Payment successful, order confirmed
- `payment_intent.payment_failed` - Payment failed, order payment status updated
- `payment_intent.processing` - Payment processing
- `charge.refunded` - Refund processed

**Response:**
```json
{
  "received": true,
  "paymentId": "payment_id"
}
```

**Setup Instructions:**
1. Get webhook secret from Stripe Dashboard → Developers → Webhooks
2. Add `STRIPE_WEBHOOK_SECRET` to your `.env` file
3. Configure webhook URL in Stripe: `https://yourdomain.com/api/v1/patient/payments/webhook`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`

#### Refund Payment
**POST** `/patient/payments/refund`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "paymentId": "payment_id",
  "amount": 1000,
  "reason": "Customer request"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "_id": "payment_id",
    "paymentStatus": "refunded",
    "refundAmount": 1000,
    "refundReason": "Customer request",
    "stripeRefundId": "re_1234567890",
    "refundedAt": "2025-01-15T11:00:00.000Z"
  }
}
```

**Notes:**
- For Stripe payments, refund is processed through Stripe API
- Order payment status is automatically updated to `refunded`
- Refund amount can be partial or full

### Payment Options (Saved Payment Methods)

Manage your saved payment methods including credit/debit cards, UPI, wallets, and netbanking.

#### Get All Payment Methods
**GET** `/patient/payment-options`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "payment_method_id_1",
      "type": "card",
      "cardType": "credit",
      "bankName": "SBI",
      "cardNumber": "****283",
      "cardLast4": "283",
      "expiryDate": "12/25",
      "cardHolderName": "John Doe",
      "cardBrand": "visa",
      "isDefault": true,
      "isActive": true,
      "createdAt": "2025-01-15T10:30:00.000Z"
    },
    {
      "_id": "payment_method_id_2",
      "type": "card",
      "cardType": "credit",
      "bankName": "ICICI",
      "cardNumber": "****283",
      "cardLast4": "283",
      "expiryDate": "06/26",
      "cardHolderName": "John Doe",
      "cardBrand": "mastercard",
      "isDefault": false,
      "isActive": true,
      "createdAt": "2025-01-14T14:20:00.000Z"
    }
  ]
}
```

**Notes:**
- Payment methods are sorted by default status (default first) and creation date
- Only active payment methods are returned
- Sensitive data (securityCode, gatewayToken) is never returned

#### Get Single Payment Method
**GET** `/patient/payment-options/:id`

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `id` (path) - Payment method ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "payment_method_id",
    "type": "card",
    "cardType": "credit",
    "bankName": "SBI",
    "cardNumber": "****283",
    "cardLast4": "283",
    "expiryDate": "12/25",
    "cardHolderName": "John Doe",
    "cardBrand": "visa",
    "isDefault": true,
    "isActive": true
  }
}
```

#### Add New Payment Method (Card)
**POST** `/patient/payment-options`

**Headers:** `Authorization: Bearer <token>`

**Request Body (Card):**
```json
{
  "type": "card",
  "cardType": "credit",
  "bankName": "SBI",
  "cardNumber": "1234567890123456",
  "expiryDate": "12/25",
  "cardHolderName": "John Doe",
  "securityCode": "123",
  "isDefault": true
}
```

**Request Body (UPI):**
```json
{
  "type": "upi",
  "upiId": "john@paytm"
}
```

**Request Body (Wallet):**
```json
{
  "type": "wallet",
  "walletType": "paytm",
  "walletId": "9876543210"
}
```

**Request Body (Netbanking):**
```json
{
  "type": "netbanking",
  "bankAccountNumber": "1234567890123456",
  "ifscCode": "SBIN0001234"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment method added successfully",
  "data": {
    "_id": "payment_method_id",
    "type": "card",
    "cardType": "credit",
    "bankName": "SBI",
    "cardNumber": "****3456",
    "cardLast4": "3456",
    "expiryDate": "12/25",
    "cardHolderName": "John Doe",
    "cardBrand": "visa",
    "isDefault": true,
    "isActive": true,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Validation Rules:**
- **Card**: `cardNumber` (13-19 digits), `expiryDate` (MM/YY format), `cardType` (credit/debit)
- **UPI**: `upiId` (valid email format like `user@paytm`)
- **Wallet**: `walletType` (paytm/phonepe/googlepay/amazonpay/other), `walletId` (required)
- **Netbanking**: `bankAccountNumber` (required), `ifscCode` (valid IFSC format: AAAA0XXXXXX)

**Notes:**
- Card number is automatically masked (only last 4 digits stored)
- Card brand (Visa, Mastercard, etc.) is auto-detected
- If `isDefault: true`, previous default is automatically unset
- Security code is stored securely and never returned in responses

#### Update Payment Method
**PUT** `/patient/payment-options/:id`

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `id` (path) - Payment method ID

**Request Body:**
```json
{
  "expiryDate": "12/26",
  "cardHolderName": "John Smith",
  "bankName": "HDFC",
  "isDefault": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment method updated successfully",
  "data": {
    /* Updated payment method object */
  }
}
```

**Notes:**
- Only provided fields are updated
- Setting `isDefault: true` automatically unsets other defaults

#### Remove Payment Method
**DELETE** `/patient/payment-options/:id`

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `id` (path) - Payment method ID

**Response:**
```json
{
  "success": true,
  "message": "Payment method removed successfully"
}
```

**Notes:**
- Payment method is soft-deleted (isActive set to false)
- If removed payment method was default, another active method is set as default (if available)

#### Set Default Payment Method
**PUT** `/patient/payment-options/:id/default`

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `id` (path) - Payment method ID

**Response:**
```json
{
  "success": true,
  "message": "Default payment method updated",
  "data": {
    /* Updated payment method object with isDefault: true */
  }
}
```

**Notes:**
- Automatically unsets all other payment methods as default
- Only active payment methods can be set as default

### Address Book

Manage your saved addresses for deliveries and orders.

#### Get All Addresses
**GET** `/patient/addresses`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "address_id_1",
      "type": "home",
      "fullName": "John Doe",
      "phoneNumber": "1234567890",
      "countryCode": "+91",
      "addressLine1": "Jardin Society, Baner",
      "addressLine2": "",
      "city": "Pune",
      "state": "Maharashtra",
      "postalCode": "987612",
      "country": "India",
      "isDefault": true,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    },
    {
      "_id": "address_id_2",
      "type": "work",
      "fullName": "John Doe",
      "phoneNumber": "1234567890",
      "countryCode": "+91",
      "addressLine1": "Jardin Society, Baner",
      "addressLine2": "",
      "city": "Pune",
      "state": "Maharashtra",
      "postalCode": "987612",
      "country": "India",
      "isDefault": false,
      "createdAt": "2025-01-14T14:20:00.000Z",
      "updatedAt": "2025-01-14T14:20:00.000Z"
    }
  ]
}
```

**Notes:**
- Addresses are sorted by default status (default first) and creation date
- Each address has a type: `home`, `work`, or `other`

#### Get Single Address by ID
**GET** `/patient/addresses/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "address_id",
    "type": "home",
    "fullName": "John Doe",
    "phoneNumber": "1234567890",
    "countryCode": "+91",
    "addressLine1": "Jardin Society, Baner",
    "addressLine2": "",
    "city": "Pune",
    "state": "Maharashtra",
    "postalCode": "987612",
    "country": "India",
    "isDefault": true
  }
}
```

#### Create Address
**POST** `/patient/addresses`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "type": "home",
  "fullName": "John Doe",
  "phoneNumber": "1234567890",
  "countryCode": "+91",
  "addressLine1": "Jardin Society, Baner, Pune",
  "addressLine2": "",
  "city": "Pune",
  "state": "Maharashtra",
  "postalCode": "987612",
  "country": "India",
  "isDefault": true
}
```

**Required Fields:**
- `type` - Address type: `home`, `work`, or `other`
- `fullName` - Full name for the address
- `phoneNumber` - Phone number
- `countryCode` - Country code (e.g., "+91")
- `addressLine1` - Primary address line
- `city` - City name
- `state` - State name
- `postalCode` - Zip/postal code
- `country` - Country name (default: "India")

**Optional Fields:**
- `addressLine2` - Secondary address line (apartment, building, etc.)
- `isDefault` - Set as default address (boolean)

**Response:**
```json
{
  "success": true,
  "message": "Address added successfully",
  "data": {
    "_id": "address_id",
    "type": "home",
    "fullName": "John Doe",
    "phoneNumber": "1234567890",
    "countryCode": "+91",
    "addressLine1": "Jardin Society, Baner, Pune",
    "city": "Pune",
    "state": "Maharashtra",
    "postalCode": "987612",
    "country": "India",
    "isDefault": true
  }
}
```

**Notes:**
- If `isDefault` is set to `true`, all other addresses for the user will be set to `false`
- Only one address can be default at a time

#### Update Address
**PUT** `/patient/addresses/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (Same as Create Address)

**Response:**
```json
{
  "success": true,
  "message": "Address updated successfully",
  "data": {
    "_id": "address_id",
    "type": "home",
    "fullName": "John Doe",
    "phoneNumber": "1234567890",
    "countryCode": "+91",
    "addressLine1": "Updated Address",
    "city": "Pune",
    "state": "Maharashtra",
    "postalCode": "987612",
    "country": "India",
    "isDefault": true
  }
}
```

#### Delete Address
**DELETE** `/patient/addresses/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

**Notes:**
- Only the address owner can delete their own addresses
- Deletion is permanent and cannot be undone
- The `:id` parameter is the address ID from the GET response

### Notifications

#### Get Notifications
**GET** `/patient/notifications?isRead=false&limit=20`

#### Mark Notification as Read
**PUT** `/patient/notifications/:id/read`

### Chat

#### Get All Chats
**GET** `/patient/chats?status=active`

#### Get Chat Messages
**GET** `/patient/chats/:id/messages`

#### Send Message
**POST** `/patient/chats/:id/messages`

**Request Body:**
```json
{
  "message": "Hello doctor",
  "messageType": "text",
  "attachments": []
}
```

#### Create Chat
**POST** `/patient/chats`

**Request Body:**
```json
{
  "doctorId": "doctor_id",
  "prescriptionId": "prescription_id",
  "orderId": "order_id",
  "message": "Initial message"
}
```

### Health Records

#### Get Health Records
**GET** `/patient/health-records?type=lab_report`

#### Create Health Record
**POST** `/patient/health-records`

**Request Body:**
```json
{
  "title": "Blood Test Report",
  "type": "lab_report",
  "date": "2024-01-15",
  "doctor": "doctor_id",
  "hospital": "City Hospital",
  "description": "Annual checkup",
  "files": [
    {
      "fileName": "report.pdf",
      "fileUrl": "https://example.com/report.pdf",
      "fileType": "application/pdf"
    }
  ],
  "tags": ["blood", "annual"]
}
```

#### Share Health Record
**POST** `/patient/health-records/:id/share`

**Request Body:**
```json
{
  "doctorIds": ["doctor_id_1", "doctor_id_2"]
}
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message"
}
```

---

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## User Roles

The system supports the following user roles:
- `admin` - Administrator with full access
- `doctor` - Healthcare provider
- `patient` - Regular user (default)
- `guest` - Guest user with limited access

## User Status

Users have the following status fields:
- `isActive` - Boolean flag indicating if user is currently logged in
  - Set to `true` on successful login
  - Set to `false` on logout
- `isVerified` - Boolean flag indicating if user's email/phone is verified
- `lastLoginAt` - Timestamp of the last successful login

## Login Tracking

All login attempts are tracked in the database with the following information:
- User ID
- Login method (password or OTP)
- IP address
- User agent (device, browser, OS)
- Login status (success or failed)
- Login timestamp

This helps with security monitoring and audit trails.

---

## Complete E-commerce Flow

### Step-by-Step Shopping Flow

**1. Add Products to Cart**
```
POST /api/v1/patient/cart/items
{
  "productId": "product_123",
  "productName": "Cetaphil Gentle Skin Cleanser 250ml",
  "unitPrice": 78.99,
  "quantity": 1,
  "productType": "medication"
}
```

**2. (Optional) Add Doctor's Note**
```
POST /api/v1/patient/doctors-notes/add-to-cart
{
  "type": "illness",
  "purpose": "work",
  "startDate": "2025-10-12",
  "endDate": "2025-10-15",
  "patientName": "John Doe"
}
```

**3. Apply Coupon Code**
```
POST /api/v1/patient/cart/coupon
{
  "couponCode": "SAVE10"
}
```

**4. View Cart**
```
GET /api/v1/patient/cart
```

**5. Get Checkout Summary**
```
GET /api/v1/patient/checkout
```

**6. Process Checkout & Payment**
```
POST /api/v1/patient/checkout
{
  "shippingAddressId": "address_id",
  "paymentMethod": "card",
  "cardDetails": {
    "cardNumber": "1234567890123456",
    "expiryDate": "12/25",
    "cvv": "123",
    "cardHolderName": "John Doe"
  }
}
```

**7. Order Confirmed**
- Order created with status `confirmed`
- Payment processed with status `paid`
- Cart cleared (saved items retained)
- Doctor's notes linked to order

### Cart Management Features

- **Add Items**: Products are added to cart with product details
- **Update Quantity**: Change quantity of items in cart
- **Remove Items**: Remove individual items or clear entire cart
- **Save for Later**: Mark items to save (excluded from checkout)
- **Coupon Codes**: Apply discount codes with validation
- **Auto Calculations**: Subtotal, tax (3%), shipping (₹10), discount, total

### Order Processing

- **Cart to Order**: Cart items converted to order items
- **Doctor's Notes**: Automatically linked to order when present
- **Address Validation**: Shipping address verified before order creation
- **Payment Processing**: Payment created and processed immediately
- **Cart Cleanup**: Cart cleared after successful order (saved items kept)

### Payment Methods

1. **Card Payment**: Requires card number, expiry, CVV, holder name
2. **UPI**: UPI ID or QR code payment
3. **Net Banking**: Bank selection and payment
4. **Wallet**: Digital wallet payment
5. **COD**: Cash on delivery (no payment processing)

---

## Medicine Management APIs (Admin/Sub-Admin Only)

### Add Medicine
**POST** `/api/v1/admin/medicines`

Add a new medicine to the inventory with all required information including multiple product images.

**Headers:** `Authorization: Bearer <admin_token>`

**Content-Type:** `multipart/form-data` (for file uploads)

**Request Body (Form Data):**
```
productName: "Amoxicillin"
brand: "Cetaphill"
originalPrice: 20.99
salePrice: 15.99
description: "Antibiotic medication used to treat various bacterial infections"
howItWorks: "Amoxicillin works by inhibiting the synthesis of bacterial cell walls, leading to bacterial cell death"
category: "Antibiotics"
stock: 450

// Usage (JSON array string)
usage: [{"title": "For Bacterial Infections", "description": "Take as prescribed by your doctor"}, {"title": "Dosage Instructions", "description": "Usually taken 2-3 times daily"}]

// Generics (JSON array string)
generics: ["Amoxicillin Trihydrate", "Amoxicillin Sodium"]

// Dosage Options (JSON array string)
dosageOptions: [{"name": "0.05% Cream", "priceAdjustment": 2}, {"name": "0.1% Cream", "priceAdjustment": 7}]

// Quantity Options (JSON array string)
quantityOptions: [{"name": "20 Grams (1 Tube)", "priceAdjustment": 2}, {"name": "40 Grams (2 Tubes)", "priceAdjustment": 3.5}]

// Precautions (Paragraph text)
precautions: "Do not use if allergic to penicillin. Consult doctor before use during pregnancy. Complete the full course of medication."

// Side Effects (Paragraph text)
sideEffects: "Common side effects include nausea, diarrhea, skin rash, and headache. If you experience severe side effects, contact your doctor immediately."

// Drug Interactions (Paragraph text)
drugInteractions: "May interact with oral contraceptives and reduce their effectiveness. Avoid with blood thinners. Consult your doctor before taking with other medications."

// Indications (Paragraph text)
indications: "Used for treating bacterial infections, respiratory tract infections, urinary tract infections, and skin infections."

// Images (multiple files)
images: [file1, file2, file3...] (max 10 images, 5MB each)

visibility: true
status: "in_stock"
```

**Request Body (JSON alternative - without file uploads):**
```json
{
  "productName": "Amoxicillin",
  "brand": "Cetaphill",
  "originalPrice": 20.99,
  "salePrice": 15.99,
  "description": "Antibiotic medication used to treat various bacterial infections",
  "howItWorks": "Amoxicillin works by inhibiting the synthesis of bacterial cell walls",
  "category": "Antibiotics",
  "stock": 450,
  "usage": [
    {
      "title": "For Bacterial Infections",
      "description": "Take as prescribed by your doctor"
    },
    {
      "title": "Dosage Instructions",
      "description": "Usually taken 2-3 times daily"
    }
  ],
  "generics": [
    "Amoxicillin Trihydrate",
    "Amoxicillin Sodium"
  ],
  "dosageOptions": [
    {
      "name": "Capsule - 500mg",
      "priceAdjustment": 0
    },
    {
      "name": "Capsule - 250mg",
      "priceAdjustment": -2
    }
  ],
  "quantityOptions": [
    {
      "name": "20 Tablets",
      "priceAdjustment": 0
    },
    {
      "name": "40 Tablets",
      "priceAdjustment": 5
    }
  ],
  "precautions": "Do not use if allergic to penicillin. Consult doctor before use during pregnancy. Complete the full course of medication as prescribed by your doctor.",
  "sideEffects": "Common side effects include nausea, diarrhea, skin rash, and headache. If you experience severe side effects such as difficulty breathing or severe allergic reactions, contact your doctor immediately.",
  "drugInteractions": "May interact with oral contraceptives and reduce their effectiveness. Avoid with blood thinners such as warfarin. Consult your doctor before taking with other medications to avoid potential interactions.",
  "indications": "Used for treating bacterial infections including respiratory tract infections, urinary tract infections, skin infections, and other bacterial conditions as prescribed by a healthcare professional.",
  "visibility": true,
  "status": "in_stock"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Medicine added successfully",
  "data": {
    "_id": "medicine_id",
    "productName": "Amoxicillin",
    "brand": "Cetaphill",
    "originalPrice": 20.99,
    "salePrice": 15.99,
    "productImages": [
      {
        "fileName": "images-1234567890-123456789.jpg",
        "fileUrl": "/uploads/images-1234567890-123456789.jpg",
        "fileType": "image/jpeg",
        "uploadedAt": "2026-01-02T10:30:00.000Z"
      }
    ],
    "usage": [
      {
        "title": "For Bacterial Infections",
        "description": "Take as prescribed by your doctor"
      }
    ],
    "description": "Antibiotic medication used to treat various bacterial infections",
    "howItWorks": "Amoxicillin works by inhibiting the synthesis of bacterial cell walls",
    "generics": ["Amoxicillin Trihydrate", "Amoxicillin Sodium"],
    "dosageOptions": [
      {
        "_id": "dosage_id",
        "name": "Capsule - 500mg",
        "priceAdjustment": 0
      }
    ],
    "quantityOptions": [
      {
        "_id": "quantity_id",
        "name": "20 Tablets",
        "priceAdjustment": 0
      }
    ],
    "precautions": "Do not use if allergic to penicillin. Consult doctor before use during pregnancy.",
    "sideEffects": "Common side effects include nausea, diarrhea, skin rash, and headache.",
    "drugInteractions": "May interact with oral contraceptives and reduce their effectiveness.",
    "indications": "Used for treating bacterial infections, respiratory tract infections, and urinary tract infections.",
    "category": "Antibiotics",
    "stock": 450,
    "status": "in_stock",
    "visibility": true,
    "isActive": true,
    "createdAt": "2026-01-02T10:30:00.000Z",
    "updatedAt": "2026-01-02T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed
- `401` - Unauthorized
- `403` - Forbidden (not admin/sub-admin)
- `500` - Server error

**Notes:**
- Images must be uploaded as `multipart/form-data` with field name `images`
- Maximum 10 images per request, 5MB per image
- Supported image formats: jpeg, jpg, png, gif, webp
- If `status` is not provided, it's automatically determined based on stock:
  - `out_of_stock` if stock = 0
  - `low_stock` if stock < 20
  - `in_stock` if stock >= 20
- All array fields (usage, generics, dosageOptions, quantityOptions) are optional but recommended
- Medical information fields (precautions, sideEffects, drugInteractions, indications) are paragraph text fields, not arrays
- Dosage and quantity options allow price adjustments (can be positive or negative)

---

### Get All Medicines
**GET** `/api/v1/admin/medicines`

Get a paginated list of all medicines with optional filtering.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)
- `search` (optional) - Search by product name or brand
- `category` (optional) - Filter by category
- `status` (optional) - Filter by status (`in_stock`, `low_stock`, `out_of_stock`)
- `visibility` (optional) - Filter by visibility (true/false)

**Example:**
```
GET /api/v1/admin/medicines?page=1&limit=10&search=amoxicillin&category=Antibiotics&status=in_stock
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "medicine_id",
      "productName": "Amoxicillin",
      "brand": "Cetaphill",
      "originalPrice": 20.99,
      "salePrice": 15.99,
      "productImages": [...],
      "category": "Antibiotics",
      "stock": 450,
      "status": "in_stock",
      "visibility": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

---

### Get Medicine by ID
**GET** `/api/v1/admin/medicines/:id`

Get detailed information about a specific medicine.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "medicine_id",
    "productName": "Amoxicillin",
    "brand": "Cetaphill",
    "originalPrice": 20.99,
    "salePrice": 15.99,
    "productImages": [...],
    "usage": [...],
    "description": "...",
    "howItWorks": "...",
    "generics": [...],
    "dosageOptions": [...],
    "quantityOptions": [...],
    "precautions": [...],
    "sideEffects": [...],
    "drugInteractions": [...],
    "indications": [...],
    "category": "Antibiotics",
    "stock": 450,
    "status": "in_stock",
    "visibility": true,
    "isActive": true,
    "createdAt": "2026-01-02T10:30:00.000Z",
    "updatedAt": "2026-01-02T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `404` - Medicine not found
- `401` - Unauthorized
- `403` - Forbidden

---

### Update Medicine
**PUT** `/api/v1/admin/medicines/:id`

Update an existing medicine. All fields are optional. You can add new images by uploading them.

**Headers:** `Authorization: Bearer <admin_token>`

**Content-Type:** `multipart/form-data` (if uploading images) or `application/json`

**Request Body:** Same structure as Add Medicine, but all fields are optional.

**Response:**
```json
{
  "success": true,
  "message": "Medicine updated successfully",
  "data": {
    "_id": "medicine_id",
    "productName": "Amoxicillin",
    ...
  }
}
```

**Error Responses:**
- `400` - Validation failed
- `404` - Medicine not found
- `401` - Unauthorized
- `403` - Forbidden

**Notes:**
- Only provided fields will be updated
- New images will be added to existing images (not replaced)
- Stock updates automatically adjust status if not explicitly provided

---

### Delete Medicine
**DELETE** `/api/v1/admin/medicines/:id`

Soft delete a medicine (sets `isActive` to false).

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "message": "Medicine deleted successfully"
}
```

**Error Responses:**
- `404` - Medicine not found
- `401` - Unauthorized
- `403` - Forbidden

**Notes:**
- This is a soft delete - the medicine is marked as inactive but not removed from the database
- Inactive medicines won't appear in regular queries

---

## Intake Form Field Management APIs (Admin/Sub-Admin Only)

These APIs allow administrators to customize the intake form by adding, editing, and managing form fields dynamically.

### Add Intake Form Field
**POST** `/api/v1/admin/intake-form-fields`

Add a new custom field to the intake form.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "fieldLabel": "Allergies",
  "fieldType": "textarea",
  "isRequired": true,
  "placeholder": "Enter any known allergies",
  "helpText": "Please list all known allergies including medications, foods, and environmental factors",
  "order": 1,
  "section": "medical_questions",
  "validation": {
    "minLength": 10,
    "maxLength": 500,
    "customMessage": "Please provide at least 10 characters"
  }
}
```

**Field Types Available:**
- `text` - Single line text input
- `textarea` - Multi-line text input
- `email` - Email input with validation
- `number` - Numeric input
- `tel` - Telephone number input
- `date` - Date picker
- `time` - Time picker
- `datetime` - Date and time picker
- `select` - Dropdown select (requires options)
- `multiselect` - Multiple selection dropdown (requires options)
- `radio` - Radio buttons (requires options)
- `checkbox` - Checkbox input
- `file` - File upload
- `url` - URL input

**For Select/Radio/Multiselect Fields (with options):**
```json
{
  "fieldLabel": "Preferred Contact Method",
  "fieldType": "radio",
  "isRequired": true,
  "options": [
    {
      "label": "Email",
      "value": "email"
    },
    {
      "label": "Phone",
      "value": "phone"
    },
    {
      "label": "SMS",
      "value": "sms"
    }
  ],
  "order": 2,
  "section": "basic_information"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Intake form field added successfully",
  "data": {
    "_id": "field_id",
    "fieldLabel": "Allergies",
    "fieldType": "textarea",
    "isRequired": true,
    "placeholder": "Enter any known allergies",
    "helpText": "Please list all known allergies",
    "order": 1,
    "section": "medical_questions",
    "validation": {
      "minLength": 10,
      "maxLength": 500
    },
    "isActive": true,
    "createdAt": "2026-01-02T10:30:00.000Z",
    "updatedAt": "2026-01-02T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed or options missing for select/radio/multiselect
- `401` - Unauthorized
- `403` - Forbidden (not admin/sub-admin)

**Notes:**
- `fieldLabel` and `fieldType` are required
- For `select`, `multiselect`, and `radio` field types, `options` array is required
- `order` is automatically set to next available if not provided
- `section` can be: `basic_information`, `emergency_contact`, `medical_questions`, or `custom`

---

### Get All Intake Form Fields
**GET** `/api/v1/admin/intake-form-fields`

Get all intake form fields, ordered by their display order.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `section` (optional) - Filter by section (`basic_information`, `emergency_contact`, `medical_questions`, `custom`)
- `isActive` (optional) - Filter by active status (true/false, default: true)

**Example:**
```
GET /api/v1/admin/intake-form-fields?section=medical_questions&isActive=true
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "field_id_1",
      "fieldLabel": "Allergies",
      "fieldType": "textarea",
      "isRequired": true,
      "order": 1,
      "section": "medical_questions",
      "isActive": true
    },
    {
      "_id": "field_id_2",
      "fieldLabel": "Preferred Contact Method",
      "fieldType": "radio",
      "isRequired": true,
      "options": [
        { "label": "Email", "value": "email" },
        { "label": "Phone", "value": "phone" }
      ],
      "order": 2,
      "section": "basic_information",
      "isActive": true
    }
  ]
}
```

---

### Get Fields by Section
**GET** `/api/v1/admin/intake-form-fields/section/:section`

Get all active fields for a specific section.

**Headers:** `Authorization: Bearer <admin_token>`

**Path Parameters:**
- `section` - Section name (`basic_information`, `emergency_contact`, `medical_questions`, `custom`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "field_id",
      "fieldLabel": "Allergies",
      "fieldType": "textarea",
      "isRequired": true,
      "order": 1,
      "section": "medical_questions"
    }
  ]
}
```

---

### Get Intake Form Field by ID
**GET** `/api/v1/admin/intake-form-fields/:id`

Get detailed information about a specific intake form field.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "field_id",
    "fieldLabel": "Allergies",
    "fieldType": "textarea",
    "isRequired": true,
    "placeholder": "Enter any known allergies",
    "helpText": "Please list all known allergies",
    "options": [],
    "validation": {
      "minLength": 10,
      "maxLength": 500
    },
    "order": 1,
    "section": "medical_questions",
    "isActive": true,
    "createdAt": "2026-01-02T10:30:00.000Z",
    "updatedAt": "2026-01-02T10:30:00.000Z"
  }
}
```

---

### Update Intake Form Field
**PUT** `/api/v1/admin/intake-form-fields/:id`

Update an existing intake form field. All fields are optional.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "fieldLabel": "Known Allergies",
  "isRequired": false,
  "helpText": "Updated help text",
  "order": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Intake form field updated successfully",
  "data": {
    "_id": "field_id",
    "fieldLabel": "Known Allergies",
    "fieldType": "textarea",
    "isRequired": false,
    "order": 3,
    ...
  }
}
```

---

### Delete Intake Form Field
**DELETE** `/api/v1/admin/intake-form-fields/:id`

Soft delete an intake form field (sets `isActive` to false).

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "message": "Intake form field deleted successfully"
}
```

**Notes:**
- This is a soft delete - the field is marked as inactive but not removed
- Inactive fields won't appear in regular queries

---

### Reorder Fields
**POST** `/api/v1/admin/intake-form-fields/reorder`

Reorder multiple fields at once by updating their order values.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "fieldOrders": [
    {
      "fieldId": "field_id_1",
      "order": 0
    },
    {
      "fieldId": "field_id_2",
      "order": 1
    },
    {
      "fieldId": "field_id_3",
      "order": 2
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Fields reordered successfully"
}
```

**Notes:**
- Useful for drag-and-drop reordering in the UI
- All field IDs must exist
- Order values should be sequential (0, 1, 2, ...)

---

### Preview Form
**GET** `/api/v1/admin/intake-form-fields/preview`

Get all active intake form fields organized by sections. This endpoint is designed for previewing the complete form structure as it will appear to patients.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "message": "Form preview retrieved successfully",
  "data": {
    "totalFields": 8,
    "sections": [
      {
        "sectionName": "Basic Information",
        "sectionKey": "basic_information",
        "fields": [
          {
            "_id": "field_id_1",
            "fieldLabel": "First Name",
            "fieldType": "text",
            "isRequired": true,
            "placeholder": "Enter your first name",
            "helpText": "",
            "options": [],
            "validation": {
              "minLength": 2,
              "maxLength": 50
            },
            "order": 0,
            "section": "basic_information",
            "isActive": true,
            "createdAt": "2026-01-02T10:30:00.000Z",
            "updatedAt": "2026-01-02T10:30:00.000Z"
          },
          {
            "_id": "field_id_2",
            "fieldLabel": "Email",
            "fieldType": "email",
            "isRequired": true,
            "placeholder": "Enter your email address",
            "helpText": "We'll never share your email",
            "options": [],
            "validation": {},
            "order": 1,
            "section": "basic_information",
            "isActive": true,
            "createdAt": "2026-01-02T10:30:00.000Z",
            "updatedAt": "2026-01-02T10:30:00.000Z"
          }
        ]
      },
      {
        "sectionName": "Medical Questions",
        "sectionKey": "medical_questions",
        "fields": [
          {
            "_id": "field_id_3",
            "fieldLabel": "Allergies",
            "fieldType": "textarea",
            "isRequired": true,
            "placeholder": "Enter any known allergies",
            "helpText": "Please list all known allergies",
            "options": [],
            "validation": {
              "minLength": 10,
              "maxLength": 500
            },
            "order": 0,
            "section": "medical_questions",
            "isActive": true,
            "createdAt": "2026-01-02T10:30:00.000Z",
            "updatedAt": "2026-01-02T10:30:00.000Z"
          },
          {
            "_id": "field_id_4",
            "fieldLabel": "Preferred Contact Method",
            "fieldType": "radio",
            "isRequired": true,
            "placeholder": "",
            "helpText": "How would you like us to contact you?",
            "options": [
              {
                "label": "Email",
                "value": "email"
              },
              {
                "label": "Phone",
                "value": "phone"
              },
              {
                "label": "SMS",
                "value": "sms"
              }
            ],
            "validation": {},
            "order": 1,
            "section": "medical_questions",
            "isActive": true,
            "createdAt": "2026-01-02T10:30:00.000Z",
            "updatedAt": "2026-01-02T10:30:00.000Z"
          }
        ]
      },
      {
        "sectionName": "Additional Information",
        "sectionKey": "custom",
        "fields": [
          {
            "_id": "field_id_5",
            "fieldLabel": "Additional Notes",
            "fieldType": "textarea",
            "isRequired": false,
            "placeholder": "Any additional information",
            "helpText": "",
            "options": [],
            "validation": {},
            "order": 0,
            "section": "custom",
            "isActive": true,
            "createdAt": "2026-01-02T10:30:00.000Z",
            "updatedAt": "2026-01-02T10:30:00.000Z"
          }
        ]
      }
    ],
    "fields": [
      // Flat list of all fields (same as above, but not grouped)
    ]
  }
}
```

**Response Structure:**
- `totalFields`: Total number of active fields
- `sections`: Array of sections, each containing:
  - `sectionName`: Human-readable section name
  - `sectionKey`: Section identifier
  - `fields`: Array of fields in that section, ordered by `order` field
- `fields`: Flat list of all fields (for convenience)

**Section Names:**
- `basic_information` → "Basic Information"
- `emergency_contact` → "Emergency Contact"
- `medical_questions` → "Medical Questions"
- `custom` → "Additional Information"

**Notes:**
- Only returns active fields (`isActive: true`)
- Fields are sorted by section, then by order, then by creation date
- Empty sections are excluded from the response
- This endpoint is perfect for rendering the form preview in the admin panel
- The response structure makes it easy to render sections and fields in order

---

## Notification Campaign Management APIs (Admin/Sub-Admin Only)

Unified API for managing Email, SMS, and Push Notification campaigns. All three types are managed through a single model with a `campaignType` field.

**Base Endpoints:**
- **Email Campaigns:** `/api/v1/admin/email-campaigns`
- **SMS Campaigns:** `/api/v1/admin/sms-campaigns`
- **Push Notification Campaigns:** `/api/v1/admin/push-notification-campaigns`
- **Unified Endpoint (Alternative):** `/api/v1/admin/notification-campaigns` (use with `campaignType` query parameter)

**Common Features:**
- All campaigns require `campaignName` field
- All campaigns support audience selection and scheduling
- All campaigns track sending statistics (sent, failed, opened, clicked)
- Dashboard statistics endpoint available for all types

**Note:** While each campaign type has its own base URL for clarity, they all use the unified notification campaigns API internally. You can also use the unified endpoint `/api/v1/admin/notification-campaigns` with the appropriate `campaignType` field or query parameter.

---

## Email Campaign APIs

**Base URL:** `/api/v1/admin/email-campaigns`

**Note:** All email campaign endpoints use the unified notification campaigns API. The base URL `/api/v1/admin/email-campaigns` is an alias that internally uses `/api/v1/admin/notification-campaigns` with `campaignType: "email"`.

### Create Email Campaign
**POST** `/api/v1/admin/email-campaigns`

Create a new email campaign with images, subject, message, audience selection, and scheduling options.

**Headers:** `Authorization: Bearer <admin_token>`

**Content-Type:** `multipart/form-data` (for images) or `application/json`

**Request Body (JSON):**
```json
{
  "campaignName": "New Year Health Checkup Promo",
  "campaignType": "email",
  "subject": "Important Health Update",
  "message": "Dear patients, we have an important update regarding your health services...",
  "audience": "all_patients",
  "scheduleType": "send_now"
}
```

**Request Body (Form Data - with images):**
```
campaignName: "New Year Health Checkup Promo"
campaignType: "email"
subject: "Important Health Update"
message: "Dear patients..."
audience: "all_patients"
scheduleType: "send_now"
images: [file1, file2, file3...] (max 10 images, 5MB each)
```

**For Scheduled Email Campaign:**
```json
{
  "campaignName": "Prescription Refill Reminder",
  "campaignType": "email",
  "subject": "Monthly Health Newsletter",
  "message": "This is your monthly health newsletter...",
  "audience": "all_patients",
  "scheduleType": "scheduled",
  "scheduledAt": "2026-01-15T10:00:00.000Z"
}
```

**Required Fields:**
- `campaignName` - Name of the campaign
- `campaignType` - Must be `"email"`
- `subject` - Email subject line
- `message` - Email message content

**Optional Fields:**
- `images` - Multiple images (upload via form data)
- `audience` - Default: `"all_patients"`
- `customRecipients` - Array of patient IDs (if audience is `"custom"`)
- `scheduleType` - Default: `"send_now"`
- `scheduledAt` - Required if scheduleType is `"scheduled"`

**Response:**
```json
{
  "success": true,
  "message": "Notification campaign created successfully",
  "data": {
    "_id": "campaign_id",
    "campaignName": "New Year Health Checkup Promo",
    "campaignType": "email",
    "subject": "Important Health Update",
    "message": "Dear patients...",
    "images": [
      {
        "fileName": "images-1234567890.jpg",
        "fileUrl": "http://localhost:5000/uploads/images-1234567890.jpg",
        "fileType": "image/jpeg",
        "uploadedAt": "2026-01-02T10:30:00.000Z"
      }
    ],
    "audience": "all_patients",
    "scheduleType": "send_now",
    "status": "draft",
    "totalRecipients": 150,
    "sentCount": 0,
    "failedCount": 0,
    "openedCount": 0,
    "openedRate": 0,
    "clickedCount": 0,
    "clickedRate": 0,
    "createdBy": "admin_user_id",
    "createdAt": "2026-01-02T10:30:00.000Z"
  }
}
```

**Notes:**
- Images must be uploaded as `multipart/form-data` with field name `images`
- Maximum 10 images per campaign, 5MB per image
- Supported image formats: jpeg, jpg, png, gif, webp
- For `send_now`, campaign is created with status `draft` - you need to call the send endpoint
- For `scheduled`, campaign is created with status `scheduled`
- Email campaigns support open and click tracking

---

### Get All Email Campaigns
**GET** `/api/v1/admin/email-campaigns`

Get a paginated list of all email campaigns.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)
- `status` (optional) - Filter by status
- `audience` (optional) - Filter by audience type

**Note:** When using the type-specific base URL `/api/v1/admin/email-campaigns`, the `campaignType` parameter is not needed as it's automatically set to `email`.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "campaign_id",
      "campaignName": "New Year Health Checkup Promo",
      "campaignType": "email",
      "subject": "Important Health Update",
      "audience": "all_patients",
      "status": "sent",
      "sentCount": 1250,
      "openedCount": 875,
      "openedRate": 70,
      "clickedCount": 234,
      "clickedRate": 19,
      "sentAt": "2025-12-20T10:35:00.000Z",
      "createdAt": "2025-12-20T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

**Note:** For Get by ID, Update, Send, Cancel, and Delete operations, use the unified routes:
- `GET /api/v1/admin/notification-campaigns/:id` - Get campaign by ID
- `PUT /api/v1/admin/notification-campaigns/:id` - Update campaign
- `POST /api/v1/admin/notification-campaigns/:id/send` - Send campaign
- `POST /api/v1/admin/notification-campaigns/:id/cancel` - Cancel scheduled campaign
- `DELETE /api/v1/admin/notification-campaigns/:id` - Delete campaign

These unified routes work for all campaign types (email, SMS, push notification).

---

## SMS Campaign APIs

**Base URL:** `/api/v1/admin/sms-campaigns`

**Note:** All SMS campaign endpoints use the unified notification campaigns API. The base URL `/api/v1/admin/sms-campaigns` is an alias that internally uses `/api/v1/admin/notification-campaigns` with `campaignType: "sms"`.

### Create SMS Campaign
**POST** `/api/v1/admin/sms-campaigns`

Create a new SMS campaign with message, audience selection, and scheduling options.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "campaignName": "Flu Season Reminder",
  "campaignType": "sms",
  "message": "Reminder: Your appointment is scheduled for tomorrow at 10 AM. Please arrive 15 minutes early.",
  "audience": "all_patients",
  "scheduleType": "send_now"
}
```

**For Scheduled SMS Campaign:**
```json
{
  "campaignName": "Monthly Health Reminder",
  "campaignType": "sms",
  "message": "Don't forget your monthly health checkup.",
  "audience": "all_patients",
  "scheduleType": "scheduled",
  "scheduledAt": "2026-01-15T10:00:00.000Z"
}
```

**Required Fields:**
- `campaignName` - Name of the campaign
- `campaignType` - Must be `"sms"`
- `message` - SMS message (max 160 characters)

**Response:**
```json
{
  "success": true,
  "message": "Notification campaign created successfully",
  "data": {
    "_id": "campaign_id",
    "campaignName": "Flu Season Reminder",
    "campaignType": "sms",
    "message": "Reminder: Your appointment is scheduled...",
    "audience": "all_patients",
    "scheduleType": "send_now",
    "status": "draft",
    "totalRecipients": 150,
    "sentCount": 0,
    "failedCount": 0,
    "createdBy": "admin_user_id",
    "createdAt": "2026-01-02T10:30:00.000Z"
  }
}
```

**Notes:**
- Message must be 160 characters or less (SMS standard)
- SMS campaigns do not support images
- SMS campaigns do not support open/click tracking
- For `send_now`, campaign is created with status `draft` - you need to call the send endpoint

---

### Get All SMS Campaigns
**GET** `/api/v1/admin/sms-campaigns`

Get a paginated list of all SMS campaigns.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)
- `status` (optional) - Filter by status
- `audience` (optional) - Filter by audience type

**Note:** When using the type-specific base URL `/api/v1/admin/sms-campaigns`, the `campaignType` parameter is not needed as it's automatically set to `sms`.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "campaign_id",
      "campaignName": "Flu Season Reminder",
      "campaignType": "sms",
      "message": "Reminder: Your appointment...",
      "audience": "all_patients",
      "status": "sent",
      "sentCount": 1250,
      "failedCount": 0,
      "sentAt": "2025-12-18T10:35:00.000Z",
      "createdAt": "2025-12-18T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 10,
    "pages": 1
  }
}
```

---

**Note:** For Get by ID, Update, Send, Cancel, and Delete operations, use the unified routes:
- `GET /api/v1/admin/notification-campaigns/:id` - Get campaign by ID
- `PUT /api/v1/admin/notification-campaigns/:id` - Update campaign
- `POST /api/v1/admin/notification-campaigns/:id/send` - Send campaign
- `POST /api/v1/admin/notification-campaigns/:id/cancel` - Cancel scheduled campaign
- `DELETE /api/v1/admin/notification-campaigns/:id` - Delete campaign

These unified routes work for all campaign types (email, SMS, push notification).

---

## Push Notification Campaign APIs

**Base URL:** `/api/v1/admin/push-notification-campaigns`

**Note:** All push notification campaign endpoints use the unified notification campaigns API. The base URL `/api/v1/admin/push-notification-campaigns` is an alias that internally uses `/api/v1/admin/notification-campaigns` with `campaignType: "push_notification"`.

### Create Push Notification Campaign
**POST** `/api/v1/admin/push-notification-campaigns`

Create a new push notification campaign with title, message, audience selection, and scheduling options.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "campaignName": "Special Holiday Hours",
  "campaignType": "push_notification",
  "title": "New Health Update",
  "message": "Your prescription is ready for pickup. Please visit our pharmacy.",
  "audience": "all_mobile_users",
  "scheduleType": "send_now"
}
```

**For Scheduled Push Notification Campaign:**
```json
{
  "campaignName": "Appointment Reminder",
  "campaignType": "push_notification",
  "title": "Appointment Reminder",
  "message": "Don't forget your appointment tomorrow at 10 AM",
  "audience": "all_mobile_users",
  "scheduleType": "scheduled",
  "scheduledAt": "2026-01-15T10:00:00.000Z"
}
```

**Required Fields:**
- `campaignName` - Name of the campaign
- `campaignType` - Must be `"push_notification"`
- `title` - Push notification title
- `message` - Push notification message

**Response:**
```json
{
  "success": true,
  "message": "Notification campaign created successfully",
  "data": {
    "_id": "campaign_id",
    "campaignName": "Special Holiday Hours",
    "campaignType": "push_notification",
    "title": "New Health Update",
    "message": "Your prescription is ready...",
    "audience": "all_mobile_users",
    "scheduleType": "send_now",
    "status": "draft",
    "totalRecipients": 150,
    "sentCount": 0,
    "failedCount": 0,
    "openedCount": 0,
    "openedRate": 0,
    "clickedCount": 0,
    "clickedRate": 0,
    "createdBy": "admin_user_id",
    "createdAt": "2026-01-02T10:30:00.000Z"
  }
}
```

**Notes:**
- Push notifications require title and message
- Default audience is `all_mobile_users`
- Push notifications support open and click tracking
- Creates notification records in the database for each recipient

---

### Get All Push Notification Campaigns
**GET** `/api/v1/admin/push-notification-campaigns`

Get a paginated list of all push notification campaigns.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)
- `status` (optional) - Filter by status
- `audience` (optional) - Filter by audience type

**Note:** When using the type-specific base URL `/api/v1/admin/push-notification-campaigns`, the `campaignType` parameter is not needed as it's automatically set to `push_notification`.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "campaign_id",
      "campaignName": "Special Holiday Hours",
      "campaignType": "push_notification",
      "title": "New Health Update",
      "message": "Your prescription is ready...",
      "audience": "all_mobile_users",
      "status": "sent",
      "sentCount": 890,
      "openedCount": 650,
      "openedRate": 73,
      "clickedCount": 120,
      "clickedRate": 13,
      "sentAt": "2025-12-15T10:35:00.000Z",
      "createdAt": "2025-12-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 8,
    "pages": 1
  }
}
```

---

**Note:** For Get by ID, Update, Send, Cancel, and Delete operations, use the unified routes:
- `GET /api/v1/admin/notification-campaigns/:id` - Get campaign by ID
- `PUT /api/v1/admin/notification-campaigns/:id` - Update campaign
- `POST /api/v1/admin/notification-campaigns/:id/send` - Send campaign
- `POST /api/v1/admin/notification-campaigns/:id/cancel` - Cancel scheduled campaign
- `DELETE /api/v1/admin/notification-campaigns/:id` - Delete campaign

These unified routes work for all campaign types (email, SMS, push notification).

---

## Common Campaign Endpoints

These endpoints and features are shared across all campaign types (Email, SMS, and Push Notification).

### Common Audience Options

All campaign types support the following audience options:

- `all_patients` - All active patients (default for email/SMS)
- `active_patients` - Only active patients
- `inactive_patients` - Only inactive patients
- `all_mobile_users` - All mobile app users (default for push notifications)
- `custom` - Custom list of patient IDs (requires `customRecipients` array)

**Note:** When using `custom` audience, you must provide an array of patient IDs in the `customRecipients` field.

### Common Schedule Options

All campaign types support the following scheduling:

- `send_now` - Create campaign with status `draft` (requires manual send via send endpoint)
- `scheduled` - Schedule for later (requires `scheduledAt` date in the future)

**Note:** Scheduled campaigns automatically send at the specified time. Use the cancel endpoint to cancel scheduled campaigns.

---

### Track Campaign Open
**POST** `/api/v1/admin/notification-campaigns/:id/track/open`

Track when a campaign is opened (for email and push notifications). This endpoint is public and can be called from tracking pixels in emails or push notification opens.

**No Authentication Required** (Public endpoint)

**Response:**
```json
{
  "success": true,
  "message": "Campaign open tracked successfully",
  "data": {
    "_id": "campaign_id",
    "openedCount": 876,
    "openedRate": 70.08
  }
}
```

**Notes:**
- Automatically increments `openedCount` and calculates `openedRate`
- Only works for email and push notification campaigns
- Open rate is calculated as: (openedCount / sentCount) * 100
- This endpoint should be called from email tracking pixels or push notification open events

---

### Track Campaign Click
**POST** `/api/v1/admin/notification-campaigns/:id/track/click`

Track when a link in a campaign is clicked (for email and push notifications). This endpoint is public and can be called from tracked links.

**No Authentication Required** (Public endpoint)

**Response:**
```json
{
  "success": true,
  "message": "Campaign click tracked successfully",
  "data": {
    "_id": "campaign_id",
    "clickedCount": 235,
    "clickedRate": 18.8
  }
}
```

**Notes:**
- Automatically increments `clickedCount` and calculates `clickedRate`
- Only works for email and push notification campaigns
- Click rate is calculated as: (clickedCount / sentCount) * 100
- This endpoint should be called from tracked links in emails or push notifications

---

### Get Campaign Dashboard Statistics
**GET** `/api/v1/admin/notification-campaigns/statistics`

Get overall statistics for all notification campaigns (Email, SMS, and Push Notification).

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCampaigns": 45,
    "activeSubscribers": 1250,
    "avgOpenRate": 68.5,
    "scheduled": 3
  }
}
```

**Response Fields:**
- `totalCampaigns` - Total number of campaigns (all types)
- `activeSubscribers` - Total number of active patients/subscribers
- `avgOpenRate` - Average open rate across all email and push notification campaigns (percentage)
- `scheduled` - Number of scheduled campaigns (not yet sent)

**Notes:**
- Statistics are calculated across all campaign types
- Average open rate is only calculated for email and push notification campaigns (SMS doesn't support open tracking)
- Only campaigns with status `sent` and `sentCount > 0` are included in open rate calculations

---

## Legacy SMS Campaign APIs (Deprecated)

**Note:** Use the unified `/notification-campaigns` API with `campaignType: "sms"` instead.

### Create SMS Campaign (Deprecated)
**POST** `/api/v1/admin/sms-campaigns`

Create a new SMS campaign with message, audience selection, and scheduling options.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "message": "Reminder: Your appointment is scheduled for tomorrow at 10 AM. Please arrive 15 minutes early.",
  "audience": "all_patients",
  "scheduleType": "send_now"
}
```

**For Scheduled Campaign:**
```json
{
  "message": "Monthly health checkup reminder",
  "audience": "all_patients",
  "scheduleType": "scheduled",
  "scheduledAt": "2026-01-15T10:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "SMS campaign created successfully",
  "data": {
    "_id": "campaign_id",
    "message": "Reminder: Your appointment is scheduled...",
    "audience": "all_patients",
    "scheduleType": "send_now",
    "status": "draft",
    "totalRecipients": 150,
    "sentCount": 0,
    "failedCount": 0,
    "createdBy": "admin_user_id",
    "createdAt": "2026-01-02T10:30:00.000Z"
  }
}
```

**Notes:**
- Message must be 160 characters or less (SMS limit)
- For `send_now`, campaign is created with status `draft` - you need to call the send endpoint
- For `scheduled`, campaign is created with status `scheduled`
- Scheduled date must be in the future

---

### Get All SMS Campaigns
**GET** `/api/v1/admin/sms-campaigns`

Get a paginated list of all SMS campaigns.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)
- `status` (optional) - Filter by status
- `audience` (optional) - Filter by audience type

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "campaign_id",
      "message": "Reminder: Your appointment...",
      "audience": "all_patients",
      "status": "sent",
      "totalRecipients": 150,
      "sentCount": 148,
      "failedCount": 2,
      "sentAt": "2026-01-02T10:35:00.000Z",
      "createdBy": {...},
      "createdAt": "2026-01-02T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

### Send SMS Campaign
**POST** `/api/v1/admin/sms-campaigns/:id/send`

Send an SMS campaign to all recipients.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "message": "SMS campaign sent successfully",
  "data": {
    "success": true,
    "totalRecipients": 150,
    "sentCount": 148,
    "failedCount": 2
  }
}
```

**Notes:**
- SMS sending requires integration with SMS service provider (Twilio, AWS SNS, etc.)
- Currently logs to console for development
- Only campaigns with status `draft` or `scheduled` can be sent

---

## Legacy Push Notification Campaign APIs (Deprecated)

**Note:** Use the unified `/notification-campaigns` API with `campaignType: "push_notification"` instead.

### Create Push Notification Campaign (Deprecated)
**POST** `/api/v1/admin/push-notification-campaigns`

Create a new push notification campaign with title, message, audience selection, and scheduling options.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "title": "New Health Update",
  "message": "Your prescription is ready for pickup. Please visit our pharmacy.",
  "audience": "all_mobile_users",
  "scheduleType": "send_now"
}
```

**For Scheduled Campaign:**
```json
{
  "title": "Appointment Reminder",
  "message": "Don't forget your appointment tomorrow at 10 AM",
  "audience": "all_mobile_users",
  "scheduleType": "scheduled",
  "scheduledAt": "2026-01-15T10:00:00.000Z"
}
```

**Audience Options:**
- `all_mobile_users` - All active patients with mobile app
- `active_patients` - Only active patients
- `inactive_patients` - Only inactive patients
- `custom` - Custom list of patient IDs (requires `customRecipients` array)

**Response:**
```json
{
  "success": true,
  "message": "Push notification campaign created successfully",
  "data": {
    "_id": "campaign_id",
    "title": "New Health Update",
    "message": "Your prescription is ready...",
    "audience": "all_mobile_users",
    "scheduleType": "send_now",
    "status": "draft",
    "totalRecipients": 150,
    "sentCount": 0,
    "failedCount": 0,
    "createdBy": "admin_user_id",
    "createdAt": "2026-01-02T10:30:00.000Z"
  }
}
```

---

### Get All Push Notification Campaigns
**GET** `/api/v1/admin/push-notification-campaigns`

Get a paginated list of all push notification campaigns.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)
- `status` (optional) - Filter by status
- `audience` (optional) - Filter by audience type

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "campaign_id",
      "title": "New Health Update",
      "message": "Your prescription is ready...",
      "audience": "all_mobile_users",
      "status": "sent",
      "totalRecipients": 150,
      "sentCount": 148,
      "failedCount": 2,
      "sentAt": "2026-01-02T10:35:00.000Z",
      "createdBy": {...},
      "createdAt": "2026-01-02T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---


## Notes

1. All dates should be in ISO 8601 format (YYYY-MM-DD)
2. File uploads should be handled via multipart/form-data
3. OTPs expire after 10 minutes (configurable via `OTP_EXPIRE_MINUTES` env variable)
4. Access tokens expire after 7 days (configurable via `JWT_EXPIRES_IN` env variable)
5. Refresh tokens expire after 30 days (configurable via `JWT_REFRESH_EXPIRES_IN` env variable)
6. Login with OTP supports both email and phone number
7. OTP is sent via email if identifier is an email address
8. OTP is logged to console if identifier is a phone number (SMS integration pending)
9. All login attempts (successful and failed) are tracked for security
10. Cart tax is automatically calculated at 3% of subtotal
11. Default shipping charges are ₹10.00 (can be overridden)
12. Coupon codes are case-insensitive and validated before application
13. Doctor's notes can only be updated/deleted when status is `pending`
14. Orders created from cart automatically link doctor's notes
15. Payment processing is immediate (gateway integration pending)

