# Telerxs Backend API Documentation

## Base URL
All APIs are prefixed with `/api/v1`

---

## Admin APIs

### Blog Category Management APIs (Admin/Sub-Admin Only)

APIs for managing blog categories before creating blogs.

#### Get All Blog Categories
**GET** `/api/v1/admin/blog-categories?search=health&isActive=true&page=1&limit=10&sortBy=order&sortOrder=asc`

Get list of all blog categories with search, filter, and pagination.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `search` (optional) - Search by name, slug, or description
- `isActive` (optional) - Filter by active status: `true` or `false`
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10, max: 100)
- `sortBy` (optional) - Sort field: `name`, `slug`, `order`, `createdAt`, `updatedAt` (default: `order`)
- `sortOrder` (optional) - Sort order: `asc` or `desc` (default: `asc`)

**Response:**
```json
{
  "success": true,
  "message": "Blog categories retrieved successfully",
  "data": [
    {
      "_id": "category_id",
      "name": "Health & Wellness",
      "slug": "health-wellness",
      "description": "Articles about health and wellness",
      "isActive": true,
      "order": 0,
      "createdBy": {
        "_id": "admin_id",
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@example.com"
      },
      "updatedBy": {
        "_id": "admin_id",
        "firstName": "Admin",
        "lastName": "User"
      },
      "createdAt": "2025-01-01T10:00:00.000Z",
      "updatedAt": "2025-01-03T12:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "pages": 2
  }
}
```

---

#### Get Blog Category by ID
**GET** `/api/v1/admin/blog-categories/:id`

Get a specific blog category by its ID.

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `id` (path) - Blog category ID

**Response:**
```json
{
  "success": true,
  "message": "Blog category retrieved successfully",
  "data": {
    "_id": "category_id",
    "name": "Health & Wellness",
    "slug": "health-wellness",
    "description": "Articles about health and wellness",
    "isActive": true,
    "order": 0,
    "createdBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User"
    },
    "updatedBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User"
    },
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-03T12:30:00.000Z"
  }
}
```

---

#### Get Blog Category by Slug
**GET** `/api/v1/admin/blog-categories/slug/:slug`

Get a specific blog category by its slug.

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `slug` (path) - Blog category slug (e.g., `health-wellness`)

**Response:** Same as Get by ID

---

#### Create Blog Category
**POST** `/api/v1/admin/blog-categories`

Create a new blog category.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "name": "Health & Wellness",
  "slug": "health-wellness",
  "description": "Articles about health and wellness topics",
  "order": 0,
  "isActive": true
}
```

**Required Fields:**
- `name` - Category name (2-100 characters)

**Optional Fields:**
- `slug` - URL-friendly slug (auto-generated from name if not provided)
- `description` - Category description (max 500 characters)
- `order` - Display order (default: 0)
- `isActive` - Active status (default: true)

**Response:**
```json
{
  "success": true,
  "message": "Blog category created successfully",
  "data": {
    "_id": "category_id",
    "name": "Health & Wellness",
    "slug": "health-wellness",
    "description": "Articles about health and wellness topics",
    "isActive": true,
    "order": 0,
    "createdBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User"
    },
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-01T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed
- `409` - Blog category with this name or slug already exists

---

#### Update Blog Category
**PUT** `/api/v1/admin/blog-categories/:id`

Update an existing blog category.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:** (All fields optional)
```json
{
  "name": "Health & Wellness Updated",
  "slug": "health-wellness-updated",
  "description": "Updated description",
  "order": 1,
  "isActive": true
}
```

**Response:** Same as Get by ID

**Error Responses:**
- `400` - Validation failed
- `404` - Blog category not found
- `409` - Blog category with this name or slug already exists

---

#### Activate Blog Category
**PUT** `/api/v1/admin/blog-categories/:id/activate`

Activate a blog category (set `isActive: true`).

**Headers:** `Authorization: Bearer <admin_token>`

**Response:** Same as Get by ID

---

#### Deactivate Blog Category
**PUT** `/api/v1/admin/blog-categories/:id/deactivate`

Deactivate a blog category (set `isActive: false`).

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "message": "Blog category deactivated successfully",
  "data": {
    "_id": "category_id",
    "name": "Health & Wellness",
    "slug": "health-wellness",
    "isActive": false,
    "updatedBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User"
    },
    "updatedAt": "2025-01-03T12:30:00.000Z"
  }
}
```

**Error Responses:**
- `404` - Blog category not found

---

#### Delete Blog Category
**DELETE** `/api/v1/admin/blog-categories/:id`

Delete (deactivate) a blog category. This performs a soft delete - the category is deactivated but not permanently removed.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "message": "Blog category deleted successfully",
  "data": {
    "message": "Blog category deleted successfully"
  }
}
```

**Error Responses:**
- `404` - Blog category not found

**Notes:**
- **Soft Delete**: Category is not permanently deleted, only deactivated
- **Slug Auto-generation**: If slug is not provided, it's automatically generated from the name
- **Unique Constraints**: Name and slug must be unique across all categories
- **Order Field**: Use `order` field to control display order of categories

---

### Blog Management APIs

APIs for managing blog posts with category relation and proper population.

**Access Control:**
- **Public (Authenticated)**: View published blogs
- **Admin/Sub-Admin**: Full CRUD operations

#### Get All Blogs
**GET** `/api/v1/admin/blogs?search=health&categoryId=xxx&categorySlug=health-wellness&status=published&isFeatured=true&page=1&limit=10&sortBy=createdAt&sortOrder=desc`

Get list of all blogs with search, filter, and pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `search` (optional) - Search by title, excerpt, content, or tags
- `categoryId` (optional) - Filter by category ID
- `categorySlug` (optional) - Filter by category slug
- `authorId` (optional) - Filter by author ID
- `status` (optional) - Filter by status: `draft`, `published`, or `archived` (default: `published` for non-admin users)
- `isFeatured` (optional) - Filter by featured status: `true` or `false`
- `tags` (optional) - Filter by tags (comma-separated or array)
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10, max: 100)
- `sortBy` (optional) - Sort field: `createdAt`, `updatedAt`, `publishedAt`, `title`, `views` (default: `createdAt`)
- `sortOrder` (optional) - Sort order: `asc` or `desc` (default: `desc`)

**Response:**
```json
{
  "success": true,
  "message": "Blogs retrieved successfully",
  "data": [
    {
      "_id": "blog_id",
      "title": "10 Tips for Better Health",
      "slug": "10-tips-for-better-health",
      "category": {
        "_id": "category_id",
        "name": "Health & Wellness",
        "slug": "health-wellness",
        "description": "Articles about health and wellness",
        "isActive": true
      },
      "author": {
        "_id": "user_id",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "featuredImage": {
        "url": "https://example.com/images/blog-featured.jpg",
        "alt": "Health Tips"
      },
      "excerpt": "Discover 10 simple tips to improve your health...",
      "content": "Full blog content here...",
      "media": [
        {
          "type": "image",
          "url": "https://example.com/images/blog-1.jpg",
          "alt": "Image 1",
          "caption": "Caption here"
        }
      ],
      "tags": ["health", "wellness", "tips"],
      "metaTitle": "10 Tips for Better Health",
      "metaDescription": "Discover 10 simple tips to improve your health and wellness",
      "status": "published",
      "publishedAt": "2025-01-03T10:00:00.000Z",
      "views": 150,
      "isFeatured": true,
      "seoKeywords": ["health", "wellness", "tips"],
      "readingTime": 5,
      "createdAt": "2025-01-01T10:00:00.000Z",
      "updatedAt": "2025-01-03T12:30:00.000Z"
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
- Non-admin users can only see published blogs
- Category and author are automatically populated

---

#### Get Blog by ID
**GET** `/api/v1/admin/blogs/:id?incrementViews=true`

Get a specific blog by its ID.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `incrementViews` (optional) - Increment view count: `true` or `false` (default: `false`)

**Response:**
```json
{
  "success": true,
  "message": "Blog retrieved successfully",
  "data": {
    "_id": "blog_id",
    "title": "10 Tips for Better Health",
    "slug": "10-tips-for-better-health",
    "category": {
      "_id": "category_id",
      "name": "Health & Wellness",
      "slug": "health-wellness",
      "description": "Articles about health and wellness",
      "isActive": true
    },
    "author": {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "featuredImage": {
      "url": "https://example.com/images/blog-featured.jpg",
      "alt": "Health Tips"
    },
    "excerpt": "Discover 10 simple tips to improve your health...",
    "content": "Full blog content here...",
    "media": [],
    "tags": ["health", "wellness", "tips"],
    "metaTitle": "10 Tips for Better Health",
    "metaDescription": "Discover 10 simple tips to improve your health and wellness",
    "status": "published",
    "publishedAt": "2025-01-03T10:00:00.000Z",
    "views": 151,
    "isFeatured": true,
    "seoKeywords": ["health", "wellness", "tips"],
    "readingTime": 5,
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-03T12:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid blog ID
- `404` - Blog not found

---

#### Get Blog by Slug
**GET** `/api/v1/admin/blogs/slug/:slug?incrementViews=true`

Get a specific blog by its slug (for public URLs).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `incrementViews` (optional) - Increment view count: `true` or `false` (default: `false`)

**Response:** Same as Get Blog by ID

**Error Responses:**
- `404` - Blog not found (only published blogs are accessible via slug)

---

#### Create Blog (Admin/Sub-Admin Only)
**POST** `/api/v1/admin/blogs`

Create a new blog post.

**Headers:** `Authorization: Bearer <admin_token>`

**Content-Type:** `multipart/form-data` (for file uploads) or `application/json`

**Request Body:**
```json
{
  "title": "10 Tips for Better Health",
  "categoryId": "category_id",
  "excerpt": "Discover 10 simple tips to improve your health and wellness",
  "content": "Full blog content here... (minimum 100 characters)",
  "featuredImage": "{\"url\": \"https://example.com/images/blog-featured.jpg\", \"alt\": \"Health Tips\"}",
  "media": "[{\"type\": \"image\", \"url\": \"https://example.com/images/blog-1.jpg\", \"alt\": \"Image 1\"}]",
  "tags": "[\"health\", \"wellness\", \"tips\"]",
  "metaTitle": "10 Tips for Better Health",
  "metaDescription": "Discover 10 simple tips to improve your health and wellness",
  "status": "draft",
  "isFeatured": false,
  "seoKeywords": "[\"health\", \"wellness\", \"tips\"]"
}
```

**File Uploads (multipart/form-data):**
- `images` - Multiple image files (max 10)
- First image or image with `featuredImage` fieldname will be used as featured image
- Other images will be added to media array

**Required Fields:**
- `title` - Blog title (5-200 characters)
- `categoryId` - Valid MongoDB ObjectId of blog category
- `content` - Blog content (minimum 100 characters)

**Optional Fields:**
- `excerpt` - Short excerpt (max 500 characters)
- `featuredImage` - JSON object with `url` and `alt` properties
- `media` - Array of media objects
- `tags` - Array of tags or comma-separated string
- `metaTitle` - SEO meta title (max 60 characters, defaults to title)
- `metaDescription` - SEO meta description (max 160 characters, defaults to excerpt)
- `status` - `draft`, `published`, or `archived` (default: `draft`)
- `isFeatured` - Boolean (default: `false`)
- `seoKeywords` - Array of keywords or comma-separated string

**Response:**
```json
{
  "success": true,
  "message": "Blog created successfully",
  "data": {
    "_id": "blog_id",
    "title": "10 Tips for Better Health",
    "slug": "10-tips-for-better-health",
    "category": {
      "_id": "category_id",
      "name": "Health & Wellness",
      "slug": "health-wellness",
      "description": "Articles about health and wellness",
      "isActive": true
    },
    "author": {
      "_id": "user_id",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com"
    },
    "featuredImage": {
      "url": "https://example.com/images/blog-featured.jpg",
      "alt": "Health Tips"
    },
    "excerpt": "Discover 10 simple tips to improve your health...",
    "content": "Full blog content here...",
    "media": [],
    "tags": ["health", "wellness", "tips"],
    "metaTitle": "10 Tips for Better Health",
    "metaDescription": "Discover 10 simple tips to improve your health and wellness",
    "status": "draft",
    "publishedAt": null,
    "views": 0,
    "isFeatured": false,
    "seoKeywords": ["health", "wellness", "tips"],
    "readingTime": 5,
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-01T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed or category not found/inactive
- `401` - Unauthorized
- `403` - Forbidden (admin/sub-admin only)

**Notes:**
- Category is automatically validated and must be active
- Author is automatically set to the logged-in user
- Slug is automatically generated from title
- Reading time is automatically calculated (200 words per minute)
- `publishedAt` is automatically set when status changes to `published`

---

#### Update Blog (Admin/Sub-Admin Only)
**PUT** `/api/v1/admin/blogs/:id`

Update an existing blog post.

**Headers:** `Authorization: Bearer <admin_token>`

**Content-Type:** `multipart/form-data` (for file uploads) or `application/json`

**Request Body:** Same as Create Blog (all fields optional)

**Response:** Same as Create Blog

**Error Responses:**
- `400` - Validation failed or category not found/inactive
- `404` - Blog not found
- `401` - Unauthorized
- `403` - Forbidden (admin/sub-admin only)

---

#### Publish Blog (Admin/Sub-Admin Only)
**PUT** `/api/v1/admin/blogs/:id/publish`

Publish a blog (change status to `published`).

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "message": "Blog published successfully",
  "data": {
    /* Blog object with status: "published" and publishedAt set */
  }
}
```

**Error Responses:**
- `404` - Blog not found

---

#### Unpublish Blog (Admin/Sub-Admin Only)
**PUT** `/api/v1/admin/blogs/:id/unpublish`

Unpublish a blog (change status to `draft`).

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "message": "Blog unpublished successfully",
  "data": {
    /* Blog object with status: "draft" */
  }
}
```

**Error Responses:**
- `404` - Blog not found

---

#### Save Blog as Draft (Admin/Sub-Admin Only)
**PUT** `/api/v1/admin/blogs/:id/draft`

Save a blog as draft. This explicitly sets the blog status to `draft` and clears the `publishedAt` date if it exists.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "message": "Blog saved as draft successfully",
  "data": {
    "_id": "blog_id",
    "title": "Blog Title",
    "status": "draft",
    "publishedAt": null,
    "category": {
      "_id": "category_id",
      "name": "Health & Wellness",
      "slug": "health-wellness"
    },
    "author": {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe"
    },
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-03T12:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid blog ID
- `404` - Blog not found

**Notes:**
- Sets blog status to `draft`
- Clears `publishedAt` date if it exists
- Blog will not be visible to public users (only published blogs are visible)
- Useful for saving work in progress or temporarily hiding a published blog

---

#### Delete Blog (Soft Delete - Admin/Sub-Admin Only)
**DELETE** `/api/v1/admin/blogs/:id`

Delete (archive) a blog. This performs a soft delete - the blog is archived but not permanently removed.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "message": "Blog archived successfully"
}
```

**Error Responses:**
- `400` - Invalid blog ID
- `404` - Blog not found

**Notes:**
- **Soft Delete**: Blog is not permanently deleted, only archived (status set to `archived`)
- Blog can be restored by changing status back to `draft` or `published`

---

#### Permanently Delete Blog (Hard Delete - Admin/Sub-Admin Only)
**DELETE** `/api/v1/admin/blogs/:id/permanent`

Permanently delete a blog from the database. This action cannot be undone.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "message": "Blog permanently deleted successfully"
}
```

**Error Responses:**
- `400` - Invalid blog ID
- `404` - Blog not found

**Notes:**
- **Hard Delete**: Blog is permanently removed from the database
- **⚠️ Warning**: This action cannot be undone. Use with caution.
- All blog data including content, images, and metadata will be permanently deleted
- Consider using soft delete (`DELETE /api/v1/admin/blogs/:id`) instead for safer deletion

---

#### Get Related Blogs
**GET** `/api/v1/admin/blogs/:id/related?limit=5`

Get related blogs from the same category (excluding current blog).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (optional) - Number of related blogs to return (default: 5, max: 20)

**Response:**
```json
{
  "success": true,
  "message": "Related blogs retrieved successfully",
  "data": [
    {
      "_id": "related_blog_id",
      "title": "Related Blog Title",
      "slug": "related-blog-title",
      "category": {
        "_id": "category_id",
        "name": "Health & Wellness",
        "slug": "health-wellness"
      },
      "author": {
        "_id": "user_id",
        "firstName": "John",
        "lastName": "Doe"
      },
      "featuredImage": {
        "url": "https://example.com/images/related-blog.jpg",
        "alt": "Related Blog"
      },
      "excerpt": "Related blog excerpt...",
      "status": "published",
      "views": 50,
      "createdAt": "2025-01-02T10:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `404` - Blog not found

**Notes:**
- Only returns published blogs from the same category
- Excludes the current blog
- Sorted by creation date (newest first)

---

### Footer Management APIs (Admin/Sub-Admin Only)

Comprehensive footer management APIs for admins to manage all footer sections including logo, links, contact information, address, and social media.

#### Get All Footer Sections
**GET** `/api/v1/admin/footer?status=published&sortBy=order&sortOrder=asc`

Get list of all footer sections with optional filtering and sorting.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `status` (optional) - Filter by status: `draft` or `published`
- `sortBy` (optional) - Sort field: `order`, `title`, `section`, `createdAt`, `updatedAt` (default: `order`)
- `sortOrder` (optional) - Sort order: `asc` or `desc` (default: `asc`)

**Response:**
```json
{
  "success": true,
  "message": "Footer sections retrieved successfully",
  "data": [
    {
      "_id": "footer_id_1",
      "section": "logo",
      "title": "Logo",
      "logo": {
        "url": "https://example.com/logo.png",
        "alt": "Company Logo"
      },
      "companyDescription": "Experience personalized medical care from the comfort of your home.",
      "status": "published",
      "order": 0,
      "lastEditedBy": {
        "_id": "admin_id",
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@example.com"
      },
      "createdAt": "2025-01-01T10:00:00.000Z",
      "updatedAt": "2025-01-03T12:30:00.000Z"
    },
    {
      "_id": "footer_id_2",
      "section": "about-us",
      "title": "About Us",
      "content": "We are a leading telemedicine platform...",
      "url": "/about-us",
      "status": "published",
      "order": 1,
      "lastEditedBy": {
        "_id": "admin_id",
        "firstName": "Admin",
        "lastName": "User"
      },
      "createdAt": "2025-01-01T10:00:00.000Z",
      "updatedAt": "2025-01-03T12:30:00.000Z"
    }
  ]
}
```

**Available Sections:**
- `logo` - Company logo and description
- `about-us` - About Us page
- `how-works` - How It Works page
- `leadership` - Leadership team
- `faq` - Frequently Asked Questions
- `careers` - Careers page
- `support` - Support page
- `blogs` - Blog section
- `shipping-returns` - Shipping & Returns policy
- `privacy-policy` - Privacy Policy
- `terms-conditions` - Terms & Conditions
- `consent-telehealth` - Consent to Telehealth
- `contact` - Contact information
- `address` - Physical address
- `social-media` - Social media links

---

#### Get Footer Section by Section Name
**GET** `/api/v1/admin/footer/section/:section`

Get a specific footer section by its section name (e.g., `logo`, `about-us`, `contact`).

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `section` (path) - Section name (must be one of the available sections)

**Alternative Direct Routes (Full CRUD):**
You can also use direct routes for each section with full CRUD operations:

**Logo Section:**
- `GET /api/v1/admin/footer/logo` - Get logo section
- `PUT /api/v1/admin/footer/logo` - Update logo section
- `PUT /api/v1/admin/footer/logo/publish` - Publish logo section
- `PUT /api/v1/admin/footer/logo/draft` - Save logo section as draft
- `DELETE /api/v1/admin/footer/logo` - Delete logo section

**About Us Section:**
- `GET /api/v1/admin/footer/about` - Get about-us section
- `PUT /api/v1/admin/footer/about` - Update about-us section
- `PUT /api/v1/admin/footer/about/publish` - Publish about-us section
- `PUT /api/v1/admin/footer/about/draft` - Save about-us section as draft
- `DELETE /api/v1/admin/footer/about` - Delete about-us section

**How Works Section:**
- `GET /api/v1/admin/footer/how-works` - Get how-works section
- `PUT /api/v1/admin/footer/how-works` - Update how-works section
- `PUT /api/v1/admin/footer/how-works/publish` - Publish how-works section
- `PUT /api/v1/admin/footer/how-works/draft` - Save how-works section as draft
- `DELETE /api/v1/admin/footer/how-works` - Delete how-works section

**Leadership Section:**
- `GET /api/v1/admin/footer/leadership` - Get leadership section
- `PUT /api/v1/admin/footer/leadership` - Update leadership section
- `PUT /api/v1/admin/footer/leadership/publish` - Publish leadership section
- `PUT /api/v1/admin/footer/leadership/draft` - Save leadership section as draft
- `DELETE /api/v1/admin/footer/leadership` - Delete leadership section

**FAQ Section:**
- `GET /api/v1/admin/footer/faq` - Get FAQ section
- `PUT /api/v1/admin/footer/faq` - Update FAQ section
- `PUT /api/v1/admin/footer/faq/publish` - Publish FAQ section
- `PUT /api/v1/admin/footer/faq/draft` - Save FAQ section as draft
- `DELETE /api/v1/admin/footer/faq` - Delete FAQ section

**Careers Section:**
- `GET /api/v1/admin/footer/careers` - Get careers section
- `PUT /api/v1/admin/footer/careers` - Update careers section
- `PUT /api/v1/admin/footer/careers/publish` - Publish careers section
- `PUT /api/v1/admin/footer/careers/draft` - Save careers section as draft
- `DELETE /api/v1/admin/footer/careers` - Delete careers section

**Support Section:**
- `GET /api/v1/admin/footer/support` - Get support section
- `PUT /api/v1/admin/footer/support` - Update support section
- `PUT /api/v1/admin/footer/support/publish` - Publish support section
- `PUT /api/v1/admin/footer/support/draft` - Save support section as draft
- `DELETE /api/v1/admin/footer/support` - Delete support section

**Blogs Section:**
- `GET /api/v1/admin/footer/blogs` - Get blogs section
- `PUT /api/v1/admin/footer/blogs` - Update blogs section
- `PUT /api/v1/admin/footer/blogs/publish` - Publish blogs section
- `PUT /api/v1/admin/footer/blogs/draft` - Save blogs section as draft
- `DELETE /api/v1/admin/footer/blogs` - Delete blogs section

**Shipping & Returns Section:**
- `GET /api/v1/admin/footer/shipping-returns` - Get shipping-returns section
- `PUT /api/v1/admin/footer/shipping-returns` - Update shipping-returns section
- `PUT /api/v1/admin/footer/shipping-returns/publish` - Publish shipping-returns section
- `PUT /api/v1/admin/footer/shipping-returns/draft` - Save shipping-returns section as draft
- `DELETE /api/v1/admin/footer/shipping-returns` - Delete shipping-returns section

**Privacy Policy Section:**
- `GET /api/v1/admin/footer/privacy-policy` - Get privacy-policy section
- `PUT /api/v1/admin/footer/privacy-policy` - Update privacy-policy section
- `PUT /api/v1/admin/footer/privacy-policy/publish` - Publish privacy-policy section
- `PUT /api/v1/admin/footer/privacy-policy/draft` - Save privacy-policy section as draft
- `DELETE /api/v1/admin/footer/privacy-policy` - Delete privacy-policy section

**Terms & Conditions Section:**
- `GET /api/v1/admin/footer/terms-conditions` - Get terms-conditions section
- `PUT /api/v1/admin/footer/terms-conditions` - Update terms-conditions section
- `PUT /api/v1/admin/footer/terms-conditions/publish` - Publish terms-conditions section
- `PUT /api/v1/admin/footer/terms-conditions/draft` - Save terms-conditions section as draft
- `DELETE /api/v1/admin/footer/terms-conditions` - Delete terms-conditions section

**Consent to Telehealth Section:**
- `GET /api/v1/admin/footer/consent-telehealth` - Get consent-telehealth section
- `PUT /api/v1/admin/footer/consent-telehealth` - Update consent-telehealth section
- `PUT /api/v1/admin/footer/consent-telehealth/publish` - Publish consent-telehealth section
- `PUT /api/v1/admin/footer/consent-telehealth/draft` - Save consent-telehealth section as draft
- `DELETE /api/v1/admin/footer/consent-telehealth` - Delete consent-telehealth section

**Contact Section:**
- `GET /api/v1/admin/footer/contact` - Get contact section
- `POST /api/v1/admin/footer/contact` - Create contact section
- `PUT /api/v1/admin/footer/contact` - Update contact section
- `PUT /api/v1/admin/footer/contact/publish` - Publish contact section
- `PUT /api/v1/admin/footer/contact/draft` - Save contact section as draft
- `DELETE /api/v1/admin/footer/contact` - Delete contact section

**Contact Section JSON Examples:**

**GET Response:**
```json
{
  "success": true,
  "message": "Footer section retrieved successfully",
  "data": {
    "_id": "footer_contact_id",
    "section": "contact",
    "title": "Contact Us",
    "contact": {
      "primaryMobile": "9876543210",
      "primaryMobileCountryCode": "+91",
      "secondaryMobile": "9876123456",
      "secondaryMobileCountryCode": "+91",
      "email": "support@example.com",
      "supportHours": "Mon-Fri 9AM-5PM EST"
    },
    "status": "published",
    "order": 2,
    "lastEditedBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User"
    },
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-03T12:30:00.000Z"
  }
}
```

**POST/PUT Request Body:**
```json
{
  "title": "Contact Us",
  "contact": {
    "primaryMobile": "9876543210",
    "primaryMobileCountryCode": "+91",
    "secondaryMobile": "9876123456",
    "secondaryMobileCountryCode": "+91",
    "email": "support@example.com",
    "supportHours": "Mon-Fri 9AM-5PM EST"
  },
  "status": "draft",
  "order": 2
}
```

**PUT Response (Update):**
```json
{
  "success": true,
  "message": "Footer section updated successfully",
  "data": {
    "_id": "footer_contact_id",
    "section": "contact",
    "title": "Contact Us",
    "contact": {
      "primaryMobile": "9876543210",
      "primaryMobileCountryCode": "+91",
      "secondaryMobile": "9876123456",
      "secondaryMobileCountryCode": "+91",
      "email": "support@example.com",
      "supportHours": "Mon-Fri 9AM-5PM EST"
    },
    "status": "draft",
    "order": 2,
    "lastEditedBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User"
    },
    "updatedAt": "2025-01-03T12:30:00.000Z"
  }
}
```

**PUT /publish Response:**
```json
{
  "success": true,
  "message": "Footer section published successfully",
  "data": {
    "_id": "footer_contact_id",
    "section": "contact",
    "title": "Contact Us",
    "contact": {
      "primaryMobile": "9876543210",
      "primaryMobileCountryCode": "+91",
      "secondaryMobile": "9876123456",
      "secondaryMobileCountryCode": "+91",
      "email": "support@example.com",
      "supportHours": "Mon-Fri 9AM-5PM EST"
    },
    "status": "published",
    "order": 2,
    "updatedAt": "2025-01-03T12:30:00.000Z"
  }
}
```

**PUT /draft Response:**
```json
{
  "success": true,
  "message": "Footer section saved as draft successfully",
  "data": {
    "_id": "footer_contact_id",
    "section": "contact",
    "title": "Contact Us",
    "contact": {
      "primaryMobile": "9876543210",
      "primaryMobileCountryCode": "+91",
      "secondaryMobile": "9876123456",
      "secondaryMobileCountryCode": "+91",
      "email": "support@example.com",
      "supportHours": "Mon-Fri 9AM-5PM EST"
    },
    "status": "draft",
    "order": 2,
    "updatedAt": "2025-01-03T12:30:00.000Z"
  }
}
```

**DELETE Response:**
```json
{
  "success": true,
  "message": "Footer section deleted successfully",
  "data": {
    "message": "Footer section deleted successfully"
  }
}
```

**Field Descriptions:**
- `title` - Section title (required)
- `contact.primaryMobile` - Primary phone number (optional)
- `contact.primaryMobileCountryCode` - Primary phone country code (default: "+91")
- `contact.secondaryMobile` - Secondary phone number (optional)
- `contact.secondaryMobileCountryCode` - Secondary phone country code (optional, default: "+91")
- `contact.email` - Contact email address (optional)
- `contact.supportHours` - Support hours text (optional, e.g., "Mon-Fri 9AM-5PM EST")
- `status` - Section status: "draft" or "published" (optional, default: "draft")
- `order` - Display order (optional, default: 0)

---

**Address Section:**
- `GET /api/v1/admin/footer/address` - Get address section
- `POST /api/v1/admin/footer/address` - Create address section
- `PUT /api/v1/admin/footer/address` - Update address section
- `PUT /api/v1/admin/footer/address/publish` - Publish address section
- `PUT /api/v1/admin/footer/address/draft` - Save address section as draft
- `DELETE /api/v1/admin/footer/address` - Delete address section

**Address Section JSON Examples:**

**GET Response:**
```json
{
  "success": true,
  "message": "Footer section retrieved successfully",
  "data": {
    "_id": "footer_address_id",
    "section": "address",
    "title": "Our Address",
    "address": {
      "location": "24761 US Hwy 19 N | Clearwater, Florida 33763",
      "street": "24761 US Hwy 19 N",
      "city": "Clearwater",
      "state": "Florida",
      "zipCode": "33763",
      "country": "United States"
    },
    "status": "published",
    "order": 3,
    "lastEditedBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User"
    },
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-03T12:30:00.000Z"
  }
}
```

**POST/PUT Request Body (Simple Format):**
```json
{
  "title": "Our Address",
  "address": {
    "location": "24761 US Hwy 19 N | Clearwater, Florida 33763"
  },
  "status": "draft",
  "order": 3
}
```

**POST/PUT Request Body (Structured Format):**
```json
{
  "title": "Our Address",
  "address": {
    "location": "24761 US Hwy 19 N | Clearwater, Florida 33763",
    "street": "24761 US Hwy 19 N",
    "city": "Clearwater",
    "state": "Florida",
    "zipCode": "33763",
    "country": "United States"
  },
  "status": "draft",
  "order": 3
}
```

**POST Response (Create):**
```json
{
  "success": true,
  "message": "Footer section created successfully",
  "data": {
    "_id": "footer_address_id",
    "section": "address",
    "title": "Our Address",
    "address": {
      "location": "24761 US Hwy 19 N | Clearwater, Florida 33763",
      "street": "24761 US Hwy 19 N",
      "city": "Clearwater",
      "state": "Florida",
      "zipCode": "33763",
      "country": "United States"
    },
    "status": "draft",
    "order": 3,
    "lastEditedBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User"
    },
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-01T10:00:00.000Z"
  }
}
```

**PUT Response (Update):**
```json
{
  "success": true,
  "message": "Footer section updated successfully",
  "data": {
    "_id": "footer_address_id",
    "section": "address",
    "title": "Our Address",
    "address": {
      "location": "24761 US Hwy 19 N | Clearwater, Florida 33763",
      "street": "24761 US Hwy 19 N",
      "city": "Clearwater",
      "state": "Florida",
      "zipCode": "33763",
      "country": "United States"
    },
    "status": "draft",
    "order": 3,
    "lastEditedBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User"
    },
    "updatedAt": "2025-01-03T12:30:00.000Z"
  }
}
```

**PUT /publish Response:**
```json
{
  "success": true,
  "message": "Footer section published successfully",
  "data": {
    "_id": "footer_address_id",
    "section": "address",
    "title": "Our Address",
    "address": {
      "location": "24761 US Hwy 19 N | Clearwater, Florida 33763",
      "street": "24761 US Hwy 19 N",
      "city": "Clearwater",
      "state": "Florida",
      "zipCode": "33763",
      "country": "United States"
    },
    "status": "published",
    "order": 3,
    "updatedAt": "2025-01-03T12:30:00.000Z"
  }
}
```

**PUT /draft Response:**
```json
{
  "success": true,
  "message": "Footer section saved as draft successfully",
  "data": {
    "_id": "footer_address_id",
    "section": "address",
    "title": "Our Address",
    "address": {
      "location": "24761 US Hwy 19 N | Clearwater, Florida 33763",
      "street": "24761 US Hwy 19 N",
      "city": "Clearwater",
      "state": "Florida",
      "zipCode": "33763",
      "country": "United States"
    },
    "status": "draft",
    "order": 3,
    "updatedAt": "2025-01-03T12:30:00.000Z"
  }
}
```

**DELETE Response:**
```json
{
  "success": true,
  "message": "Footer section deleted successfully",
  "data": {
    "message": "Footer section deleted successfully"
  }
}
```

**Field Descriptions:**
- `title` - Section title (required)
- `address.location` - Full address string (optional, e.g., "24761 US Hwy 19 N | Clearwater, Florida 33763")
- `address.street` - Street address (optional)
- `address.city` - City name (optional)
- `address.state` - State/Province (optional)
- `address.zipCode` - ZIP/Postal code (optional)
- `address.country` - Country name (optional, default: "United States")
- `status` - Section status: "draft" or "published" (optional, default: "draft")
- `order` - Display order (optional, default: 0)

**Validation Messages:**
- `title` is required
- `title` must be a string
- `address.location` must be a string (if provided)
- `address.street` must be a string (if provided)
- `address.city` must be a string (if provided)
- `address.state` must be a string (if provided)
- `address.zipCode` must be a string (if provided)
- `address.country` must be a string (if provided)
- `status` must be either "draft" or "published"
- `order` must be a number

---

**Social Media Section:**
- `GET /api/v1/admin/footer/social-media` - Get social-media section
- `POST /api/v1/admin/footer/social-media` - Create social-media section
- `PUT /api/v1/admin/footer/social-media` - Update social-media section
- `PUT /api/v1/admin/footer/social-media/publish` - Publish social-media section
- `PUT /api/v1/admin/footer/social-media/draft` - Save social-media section as draft
- `DELETE /api/v1/admin/footer/social-media` - Delete social-media section

**Social Media Section JSON Examples:**

**GET Response:**
```json
{
  "success": true,
  "message": "Footer section retrieved successfully",
  "data": {
    "_id": "footer_social_media_id",
    "section": "social-media",
    "title": "Follow Us",
    "socialMedia": {
      "facebook": "https://www.facebook.com/yourpage",
      "instagram": "https://www.instagram.com/yourpage",
      "linkedin": "https://www.linkedin.com/company/yourcompany",
      "youtube": "https://www.youtube.com/@yourchannel",
      "twitter": "https://www.twitter.com/yourhandle",
      "tiktok": "https://www.tiktok.com/@yourhandle"
    },
    "status": "published",
    "order": 4,
    "lastEditedBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User"
    },
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-03T12:30:00.000Z"
  }
}
```

**POST/PUT Request Body:**
```json
{
  "title": "Follow Us",
  "socialMedia": {
    "facebook": "https://www.facebook.com/yourpage",
    "instagram": "https://www.instagram.com/yourpage",
    "linkedin": "https://www.linkedin.com/company/yourcompany",
    "youtube": "https://www.youtube.com/@yourchannel",
    "twitter": "https://www.twitter.com/yourhandle",
    "tiktok": "https://www.tiktok.com/@yourhandle"
  },
  "status": "draft",
  "order": 4
}
```

**POST Response (Create):**
```json
{
  "success": true,
  "message": "Footer section created successfully",
  "data": {
    "_id": "footer_social_media_id",
    "section": "social-media",
    "title": "Follow Us",
    "socialMedia": {
      "facebook": "https://www.facebook.com/yourpage",
      "instagram": "https://www.instagram.com/yourpage",
      "linkedin": "https://www.linkedin.com/company/yourcompany",
      "youtube": "https://www.youtube.com/@yourchannel",
      "twitter": "https://www.twitter.com/yourhandle",
      "tiktok": "https://www.tiktok.com/@yourhandle"
    },
    "status": "draft",
    "order": 4,
    "lastEditedBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User"
    },
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-01T10:00:00.000Z"
  }
}
```

**PUT Response (Update):**
```json
{
  "success": true,
  "message": "Footer section updated successfully",
  "data": {
    "_id": "footer_social_media_id",
    "section": "social-media",
    "title": "Follow Us",
    "socialMedia": {
      "facebook": "https://www.facebook.com/yourpage",
      "instagram": "https://www.instagram.com/yourpage",
      "linkedin": "https://www.linkedin.com/company/yourcompany",
      "youtube": "https://www.youtube.com/@yourchannel",
      "twitter": "https://www.twitter.com/yourhandle",
      "tiktok": "https://www.tiktok.com/@yourhandle"
    },
    "status": "draft",
    "order": 4,
    "lastEditedBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User"
    },
    "updatedAt": "2025-01-03T12:30:00.000Z"
  }
}
```

**PUT /publish Response:**
```json
{
  "success": true,
  "message": "Footer section published successfully",
  "data": {
    "_id": "footer_social_media_id",
    "section": "social-media",
    "title": "Follow Us",
    "socialMedia": {
      "facebook": "https://www.facebook.com/yourpage",
      "instagram": "https://www.instagram.com/yourpage",
      "linkedin": "https://www.linkedin.com/company/yourcompany",
      "youtube": "https://www.youtube.com/@yourchannel",
      "twitter": "https://www.twitter.com/yourhandle",
      "tiktok": "https://www.tiktok.com/@yourhandle"
    },
    "status": "published",
    "order": 4,
    "updatedAt": "2025-01-03T12:30:00.000Z"
  }
}
```

**PUT /draft Response:**
```json
{
  "success": true,
  "message": "Footer section saved as draft successfully",
  "data": {
    "_id": "footer_social_media_id",
    "section": "social-media",
    "title": "Follow Us",
    "socialMedia": {
      "facebook": "https://www.facebook.com/yourpage",
      "instagram": "https://www.instagram.com/yourpage",
      "linkedin": "https://www.linkedin.com/company/yourcompany",
      "youtube": "https://www.youtube.com/@yourchannel",
      "twitter": "https://www.twitter.com/yourhandle",
      "tiktok": "https://www.tiktok.com/@yourhandle"
    },
    "status": "draft",
    "order": 4,
    "updatedAt": "2025-01-03T12:30:00.000Z"
  }
}
```

**DELETE Response:**
```json
{
  "success": true,
  "message": "Footer section deleted successfully",
  "data": {
    "message": "Footer section deleted successfully"
  }
}
```

**Field Descriptions:**
- `title` - Section title (required)
- `socialMedia.facebook` - Facebook page URL (optional)
- `socialMedia.instagram` - Instagram profile URL (optional)
- `socialMedia.linkedin` - LinkedIn company/profile URL (optional)
- `socialMedia.youtube` - YouTube channel URL (optional)
- `socialMedia.twitter` - Twitter/X profile URL (optional)
- `socialMedia.tiktok` - TikTok profile URL (optional)
- `status` - Section status: "draft" or "published" (optional, default: "draft")
- `order` - Display order (optional, default: 0)

**Validation Messages:**
- `title` is required
- `title` must be a string
- `socialMedia.facebook` must be a valid URL string (if provided)
- `socialMedia.instagram` must be a valid URL string (if provided)
- `socialMedia.linkedin` must be a valid URL string (if provided)
- `socialMedia.youtube` must be a valid URL string (if provided)
- `socialMedia.twitter` must be a valid URL string (if provided)
- `socialMedia.tiktok` must be a valid URL string (if provided)
- `status` must be either "draft" or "published"
- `order` must be a number

**Error Responses:**
- `400` - Validation failed (check validation messages above)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (admin/sub-admin access required)
- `404` - Footer section not found (for GET, PUT, DELETE operations)
- `409` - Footer section already exists (for POST operation)

**Response:**
```json
{
  "success": true,
  "message": "Footer section retrieved successfully",
  "data": {
    "_id": "footer_id",
    "section": "logo",
    "title": "Logo",
    "logo": {
      "url": "https://example.com/logo.png",
      "alt": "Company Logo"
    },
    "companyDescription": "Experience personalized medical care from the comfort of your home.",
    "status": "published",
    "order": 0,
    "lastEditedBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User"
    },
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-03T12:30:00.000Z"
  }
}
```

---

#### Get Footer Section by ID
**GET** `/api/v1/admin/footer/:id`

Get a specific footer section by its ID.

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `id` (path) - Footer section ID

**Response:** Same as above

---

#### Create Footer Section
**POST** `/api/v1/admin/footer`

Create a new footer section.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body Examples:**

**Logo Section:**
```json
{
  "section": "logo",
  "title": "Logo",
  "logo": {
    "url": "https://example.com/logo.png",
    "alt": "Company Logo"
  },
  "companyDescription": "Experience personalized medical care from the comfort of your home.",
  "status": "draft",
  "order": 0
}
```

**Rich Text Content Section (About Us, How Works, Leadership, Careers, Support, etc.):**
```json
{
  "section": "about-us",
  "title": "About Us",
  "content": "<h2>Who We Are</h2><p>(Company Name) is a modern, technology-enabled telehealth and online pharmacy service dedicated to making prescription medications accessible, affordable, and hassle-free.</p>",
  "media": [
    {
      "type": "image",
      "url": "https://example.com/about-image.jpg",
      "alt": "Our Team",
      "caption": "Our leadership team"
    }
  ],
  "status": "draft",
  "order": 1
}
```

**FAQ Section (Multiple FAQs):**
```json
{
  "section": "faq",
  "title": "FAQs",
  "faqs": [
    {
      "question": "How does the service work?",
      "answer": "Our service allows you to consult with licensed doctors online and receive prescriptions delivered to your door.",
      "order": 0
    },
    {
      "question": "What are the shipping options?",
      "answer": "We offer next-day shipping for most orders. Shipping times may vary based on your location.",
      "order": 1
    }
  ],
  "status": "draft",
  "order": 2
}
```

**Contact Section:**
```json
{
  "section": "contact",
  "title": "Contact",
  "contact": {
    "primaryMobile": "987654321",
    "primaryMobileCountryCode": "+91",
    "secondaryMobile": "9876123456",
    "secondaryMobileCountryCode": "+91",
    "email": "xyz@mail.com",
    "supportHours": "Mon-Fri 9AM-5PM EST"
  },
  "status": "draft",
  "order": 2
}
```

**Address Section:**
```json
{
  "section": "address",
  "title": "Address",
  "address": {
    "location": "24761 US Hwy 19 N | Clearwater, Florida 33763"
  },
  "status": "draft",
  "order": 3
}
```

**OR Structured Address:**
```json
{
  "section": "address",
  "title": "Address",
  "address": {
    "location": "24761 US Hwy 19 N | Clearwater, Florida 33763",
    "street": "24761 US Hwy 19 N",
    "city": "Clearwater",
    "state": "Florida",
    "zipCode": "33763",
    "country": "United States"
  },
  "status": "draft",
  "order": 3
}
```

**Social Media Section:**
```json
{
  "section": "social-media",
  "title": "Social Media",
  "socialMedia": {
    "facebook": "www.facebook-link.com",
    "instagram": "www.instagram-link.com",
    "linkedin": "www.linkedin-link.com",
    "youtube": "www.youtube-link.com"
  },
  "status": "draft",
  "order": 4
}
```

**Blog Section (Footer Links):**
```json
{
  "section": "blogs",
  "title": "Blogs",
  "blogLinks": [
    {
      "title": "Blog Post 1",
      "url": "/blog/post-1",
      "category": "Health",
      "tags": ["wellness", "health"]
    }
  ],
  "status": "draft",
  "order": 5
}
```

**Required Fields:**
- `section` - Section name (must be one of the available sections)
- `title` - Section title (2-100 characters)

**Optional Fields:**
- `logo` - Logo object with `url` and `alt`
- `companyDescription` - Company description (max 500 characters)
- `content` - Section content (max 5000 characters)
- `url` - Link URL (for link sections)
- `contact` - Contact object with `email`, `phone`, `phoneCountryCode`, `supportHours`
- `address` - Address object with `street`, `city`, `state`, `zipCode`, `country`
- `socialMedia` - Social media object with platform URLs
- `status` - Status: `draft` or `published` (default: `draft`)
- `order` - Display order (default: 0)

**Response:**
```json
{
  "success": true,
  "message": "Footer section created successfully",
  "data": {
    "_id": "footer_id",
    "section": "logo",
    "title": "Logo",
    "logo": {
      "url": "https://example.com/logo.png",
      "alt": "Company Logo"
    },
    "companyDescription": "Experience personalized medical care from the comfort of your home.",
    "status": "draft",
    "order": 0,
    "lastEditedBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User"
    },
    "createdAt": "2025-01-03T12:30:00.000Z",
    "updatedAt": "2025-01-03T12:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed
- `409` - Footer section already exists
- `401` - Unauthorized
- `403` - Forbidden (not admin/sub-admin)

---

#### Update Footer Section
**PUT** `/api/v1/admin/footer/:id`

Update an existing footer section by ID.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:** (All fields optional, same structure as create)

**Response:**
```json
{
  "success": true,
  "message": "Footer section updated successfully",
  "data": {
    /* Updated footer section */
  }
}
```

---

#### Update Footer Section by Section Name
**PUT** `/api/v1/admin/footer/section/:section`

Update an existing footer section by section name (e.g., `logo`, `contact`).

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `section` (path) - Section name

**Note:** All direct section routes support full CRUD operations. See the "Get Footer Section by Section Name" section above for the complete list of available routes for each section.

**Request Body:** (All fields optional except cannot change `section` field)

**Response:** Same as update by ID

---

#### Publish Footer Section
**PUT** `/api/v1/admin/footer/:id/publish`

Publish a footer section (change status to `published`).

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "message": "Footer section published successfully",
  "data": {
    /* Footer section with status: "published" */
  }
}
```

---

#### Save as Draft
**PUT** `/api/v1/admin/footer/:id/draft`

Save a footer section as draft (change status to `draft`).

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "message": "Footer section saved as draft successfully",
  "data": {
    /* Footer section with status: "draft" */
  }
}
```

---

#### Delete Footer Section
**DELETE** `/api/v1/admin/footer/:id`

Delete a footer section.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "message": "Footer section deleted successfully",
  "data": {
    "message": "Footer section deleted successfully"
  }
}
```

**Error Responses:**
- `404` - Footer section not found
- `401` - Unauthorized
- `403` - Forbidden

**Notes:**
- **Last Edited By**: Automatically tracks which admin last edited each section
- **Status Management**: Use `publish` and `draft` endpoints or update `status` field directly
- **Order Field**: Use `order` field to control display order of footer sections
- **Section Uniqueness**: Each section name can only exist once
- **Partial Updates**: Only provided fields are updated (partial updates supported)

---

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
  "profilePicture": "https://example.com/profile.jpg",
  "profileImage": {
    "url": "https://example.com/profile.jpg",
    "verified": false
  },
  "medicalLicense": {
    "licenseNumber": "#MD-849201",
    "documentUrl": "https://example.com/license.pdf",
    "verified": true
  },
  "bankAccount": {
    "accountHolderName": "Sarah Jenkins",
    "bankName": "Chase Bank",
    "accountNumber": "1234567890",
    "routingNumber": "123456789",
    "accountType": "checking",
    "ifscCode": "CHAS0US1234",
    "swiftCode": "CHASUS33",
    "verified": false
  }
}
```

**Required Fields:**
- `firstName` - First name (2-50 characters)
- `lastName` - Last name (2-50 characters)
- `email` - Valid email address (must be unique)
- `phoneNumber` - Valid phone number (must be unique)
- `specialty` - Medical specialty (from predefined list)
- `licenseNumber` - Medical license number (3-50 characters, must be unique)
- `consultationFee` - Consultation fee (positive number)

**Optional Fields:**
- `countryCode` - Country code (default: "+91")
- `password` - Password (default: "Doctor@123" if not provided)
- `licenseVerified` - License verification status (default: false)
- `status` - Doctor status: `active`, `pending`, or `suspended` (default: "pending")
- `experience` - Years of experience
- `education` - Array of education objects
- `certifications` - Array of certification objects
- `languages` - Array of languages
- `availability` - Availability object with days and time slots
- `address` - Address/clinic information
- `bio` - Professional biography (max 1000 characters)
- `profilePicture` - Profile picture URL (legacy field)
- `profileImage` - Profile image object with `url` and `verified`
- `medicalLicense` - Medical license object with `licenseNumber`, `documentUrl`, and `verified`
- `bankAccount` - Bank account details for payouts (see Update Doctor section for field details)
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
  "countryCode": "+91",
  "specialty": "Cardiology",
  "licenseNumber": "#MD-849202",
  "licenseVerified": true,
  "consultationFee": 200.00,
  "status": "active",
  "experience": 7,
  "education": [
    { "degree": "MSC", "institution": "AIIMS Delhi", "year": 2018 },
    { "degree": "MD (General Medicine)", "institution": "AIIMS Delhi", "year": 2021 }
  ],
  "certifications": [
    {
      "name": "Advanced Cardiac Life Support (ACLS)",
      "issuedBy": "American Heart Association",
      "year": 2022
    }
  ],
  "languages": ["English", "Hindi", "Spanish"],
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
  "bio": "Updated bio",
  "profilePicture": "https://example.com/new-profile.jpg",
  "profileImage": {
    "url": "https://example.com/profile.jpg",
    "verified": true
  },
  "medicalLicense": {
    "licenseNumber": "#MD-849205",
    "documentUrl": "https://example.com/license.pdf",
    "verified": true
  },
  "bankAccount": {
    "accountHolderName": "John Smith",
    "bankName": "Chase Bank",
    "accountNumber": "1234567890",
    "routingNumber": "123456789",
    "accountType": "checking",
    "ifscCode": "CHAS0US1234",
    "swiftCode": "CHASUS33",
    "verified": false
  },
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

**Optional Fields:**

**Basic Information:**
- `firstName` - First name (2-50 characters)
- `lastName` - Last name (2-50 characters)
- `email` - Email address (must be valid email)
- `phoneNumber` - Phone number (must be valid mobile number)
- `countryCode` - Country code (default: "+91")

**Professional Information:**
- `specialty` - Medical specialty (must be from predefined list)
- `licenseNumber` - Medical license number (3-50 characters, must be unique)
- `licenseVerified` - License verification status (boolean)
- `consultationFee` - Consultation fee (positive number)
- `status` - Doctor status: `active`, `pending`, or `suspended`
- `experience` - Years of experience (non-negative integer)
- `bio` - Professional biography (max 1000 characters)

**Profile & License:**
- `profilePicture` - Profile picture URL (legacy field, string)
- `profileImage` - Profile image object:
  - `url` (string) - Profile image URL
  - `verified` (boolean) - Verification status
- `medicalLicense` - Medical license object:
  - `licenseNumber` (string, 3-50 chars) - License number
  - `documentUrl` (string) - License document URL
  - `verified` (boolean) - Verification status

**Education & Certifications:**
- `education` - Array of education objects:
  - `degree` (string) - Degree name
  - `institution` (string) - Institution name
  - `year` (integer, 1900-2100) - Graduation year
- `certifications` - Array of certification objects:
  - `name` (string) - Certification name
  - `issuedBy` or `issuingOrganization` (string) - Issuing organization
  - `year` (integer, 1900-2100) - Year obtained

**Availability & Location:**
- `languages` - Array of languages (strings)
- `availability` - Availability object:
  - `days` (array) - Days of week: Monday, Tuesday, etc.
  - `timeSlots` (array) - Time slots:
    - `from` (string) - Start time (HH:MM format)
    - `to` (string) - End time (HH:MM format)
- `address` - Address object:
  - `clinicName` (string) - Clinic name
  - `city` (string) - City
  - `state` (string) - State
  - `country` (string) - Country (default: "India")
  - `pincode` (string) - Pincode/Postal code

**Bank Account Details:**
- `bankAccount` - Bank account object for payouts:
  - `accountHolderName` (string, 2-100 chars) - Full name as on bank account
  - `bankName` (string, 2-100 chars) - Bank name
  - `accountNumber` (string, 8-20 chars) - Bank account number
  - `routingNumber` (string) - Routing number (9 digits for US or IFSC format)
  - `accountType` (enum) - Account type: `checking`, `savings`, or `current`
  - `ifscCode` (string) - IFSC code for Indian banks (format: AAAA0XXXXXX)
  - `swiftCode` (string, 8-11 chars) - SWIFT code for international transfers
  - `verified` (boolean) - Bank account verification status

**Account Status:**
- `isActive` - Active status (boolean)

**Response:**
```json
{
  "success": true,
  "message": "Doctor updated successfully",
  "data": {
    "_id": "doctor_id",
    "user": {
      "firstName": "Sarah",
      "lastName": "Smith",
      "email": "sarah.smith@mediprime.com",
      "phoneNumber": "9876543211"
    },
    "specialty": "Cardiology",
    "licenseNumber": "#MD-849202",
    "licenseVerified": true,
    "consultationFee": 200.00,
    "status": "active",
    "profileImage": {
      "url": "https://example.com/profile.jpg",
      "verified": true
    },
    "medicalLicense": {
      "licenseNumber": "#MD-849205",
      "documentUrl": "https://example.com/license.pdf",
      "verified": true
    },
    "bankAccount": {
      "accountHolderName": "John Smith",
      "bankName": "Chase Bank",
      "accountNumber": "1234567890",
      "routingNumber": "123456789",
      "accountType": "checking",
      "ifscCode": "CHAS0US1234",
      "swiftCode": "CHASUS33",
      "verified": false,
      "verifiedAt": null,
      "verifiedBy": null
    },
    "experience": 7,
    "education": [...],
    "certifications": [...],
    "languages": ["English", "Hindi", "Spanish"],
    "availability": {...},
    "address": {...},
    "bio": "Updated bio",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-03T20:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed (invalid field format or value)
- `404` - Doctor not found
- `409` - License number already exists for another doctor

**Notes:**
- Only provided fields are updated (partial updates supported)
- License verification automatically sets `licenseVerifiedAt` and `licenseVerifiedBy` when `licenseVerified` or `medicalLicense.verified` is set to true
- Bank account verification automatically sets `bankAccount.verifiedAt` and `bankAccount.verifiedBy` when `bankAccount.verified` is set to true
- Status change to `active` automatically activates the user account
- Status change to `suspended` deactivates the user account
- Profile image URL automatically updates legacy `profilePicture` field for backward compatibility
- Medical license number automatically updates legacy `licenseNumber` field for backward compatibility
- Routing number supports both US format (9 digits) and IFSC format (for Indian banks)
- Bank account details are required for doctor payouts

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

### 3. Login with Google OAuth

**POST** `/api/v1/auth/login-google`

Login or register using Google OAuth. This endpoint accepts a Google ID token from the client and verifies it with Google's servers. If the user doesn't exist, a new account will be created automatically.

**Headers:** No authentication required (Public API)

**Request Body:**
```json
{
  "googleToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2MzQ1Njc4OTAiLCJ0eXAiOiJKV1QifQ...",
  "rememberMe": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Google login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@gmail.com",
      "googleId": "123456789012345678901",
      "authProvider": "google",
      "role": "patient",
      "isVerified": true,
      "isActive": true,
      "lastLoginAt": "2026-01-05T20:00:00.000Z",
      "createdAt": "2026-01-05T20:00:00.000Z",
      "updatedAt": "2026-01-05T20:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Error Responses:**
- `400` - Google token is required or invalid
- `401` - Invalid Google token or authentication failed
- `409` - Email already associated with another Google account
- `500` - Server error

**Notes:**
- The `googleToken` should be obtained from Google Sign-In on the client side
- If a user with the same email exists but uses a different auth provider, the Google account will be linked
- New users are automatically verified and activated
- Phone number is not required for Google OAuth users
- Password is not required for Google OAuth users
- Login attempt is tracked in login history

**Environment Variables Required:**
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000
GOOGLE_REDIRECT_URI_PRODUCTION=https://node1-telrex-backend.onrender.com
```

**Note:** The credentials are already configured in the `.env` file. The API is ready to use.

**Authorized JavaScript Origins:**
- `http://localhost:5000`
- `https://node1-telrex-backend.onrender.com`

**Authorized Redirect URIs:**
- `http://localhost:5000`
- `https://node1-telrex-backend.onrender.com`

---

### 4. Login with Facebook OAuth

**POST** `/api/v1/auth/login-facebook`

Login or register using Facebook OAuth. This endpoint accepts a Facebook access token from the client and verifies it with Facebook's Graph API. If the user doesn't exist, a new account will be created automatically.

**Headers:** No authentication required (Public API)

**Request Body:**
```json
{
  "facebookToken": "EAAxxxxxxxxxxxxx",
  "rememberMe": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Facebook login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@facebook.com",
      "facebookId": "12345678901234567",
      "authProvider": "facebook",
      "role": "patient",
      "isVerified": true,
      "isActive": true,
      "lastLoginAt": "2026-01-06T20:00:00.000Z",
      "createdAt": "2026-01-06T20:00:00.000Z",
      "updatedAt": "2026-01-06T20:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Error Responses:**
- `400` - Facebook token is required or invalid
- `401` - Invalid Facebook token or authentication failed
- `409` - Email already associated with another Facebook account
- `500` - Server error

**Notes:**
- The `facebookToken` should be obtained from Facebook Login SDK on the client side
- If a user with the same email exists but uses a different auth provider, the Facebook account will be linked
- New users are automatically verified and activated
- Phone number is not required for Facebook OAuth users
- Password is not required for Facebook OAuth users
- Login attempt is tracked in login history

**Environment Variables Required:**
```env
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

**How to Get Facebook App ID and Secret:**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select an existing one
3. Go to "Settings" → "Basic"
4. Copy the App ID and App Secret
5. Add them to your `.env` file

---

### 5. Login with OTP
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

### 5. Send OTP
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

## Doctor APIs

All doctor APIs require authentication: `Authorization: Bearer <doctor_token>`

Only users with `role: 'doctor'` can access these endpoints.

### Doctor Dashboard

#### Get Dashboard Overview
**GET** `/api/v1/doctor/dashboard/overview?period=last_30_days`

Get dashboard metrics including total consultations, prescriptions issued, and patient rating with percentage changes.

**Headers:** `Authorization: Bearer <doctor_token>`

**Query Parameters:**
- `period` (optional) - Time period for filtering metrics. Must be one of:
  - `all` - All time (default)
  - `today` - Today only
  - `last_7_days` - Last 7 days
  - `last_30_days` - Last 30 days
  - `this_month` - Current month
  - `last_month` - Previous month

**Response:**
```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "metrics": {
      "totalConsultations": {
        "value": 248,
        "change": "+12.0%",
        "trend": "up"
      },
      "prescriptionsIssued": {
        "value": 189,
        "change": "+12.0%",
        "trend": "up"
      },
      "patientRating": {
        "value": 4.8,
        "totalRatings": 156
      }
    }
  }
}
```

**Error Responses:**
- `400` - Validation failed (invalid period parameter)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (user is not a doctor)
- `404` - Doctor profile not found

**Notes:**
- Total Consultations counts all prescriptions created by the doctor
- Prescriptions Issued is the same as Total Consultations
- Patient Rating is retrieved from the doctor's profile rating
- Percentage change compares current period with the previous equivalent period
- Trend indicates whether the metric is increasing (`up`) or decreasing (`down`)

---

#### Get Recent Consultations
**GET** `/api/v1/doctor/dashboard/recent-consultations?page=1&limit=10`

Get list of recent consultations with patient information, consultation reasons, times, and status.

**Headers:** `Authorization: Bearer <doctor_token>`

**Query Parameters:**
- `page` (optional) - Page number (default: 1, minimum: 1)
- `limit` (optional) - Items per page (default: 10, maximum: 100)

**Response:**
```json
{
  "success": true,
  "message": "Recent consultations retrieved successfully",
  "data": {
    "consultations": [
      {
        "id": "prescription_id_1",
        "patientName": "Michael Chen",
        "reason": "Chest pain, shortness of breath",
        "time": "10:30 AM",
        "date": "Jan 15, 2024",
        "status": "Urgent",
        "statusType": "error",
        "prescriptionNumber": "PRES202401151234567890"
      },
      {
        "id": "prescription_id_2",
        "patientName": "Michael Chen",
        "reason": "Skin Allergy",
        "time": "11:00 AM",
        "date": "Jan 15, 2024",
        "status": "Completed",
        "statusType": "success",
        "prescriptionNumber": "PRES202401151234567891"
      },
      {
        "id": "prescription_id_3",
        "patientName": "Sarah Johnson",
        "reason": "Follow-up consultation",
        "time": "2:30 PM",
        "date": "Jan 14, 2024",
        "status": "Active",
        "statusType": "info",
        "prescriptionNumber": "PRES202401141234567890"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 248
    }
  }
}
```

**Status Types:**
- `error` - Urgent consultations (red indicator)
- `success` - Completed consultations (green indicator)
- `info` - Active consultations (blue indicator)

**Error Responses:**
- `400` - Validation failed (invalid page or limit)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (user is not a doctor)
- `404` - Doctor profile not found

**Notes:**
- Consultations are sorted by creation date (most recent first)
- Status is determined based on prescription status and diagnosis keywords
- Urgent status is automatically assigned if diagnosis contains keywords like "urgent", "emergency", "chest pain", or "shortness of breath"
- Patient names are retrieved from linked user profiles

---

#### Get Today's Schedule
**GET** `/api/v1/doctor/dashboard/todays-schedule`

Get today's scheduled appointments and consultations, including follow-up appointments and new consultations.

**Headers:** `Authorization: Bearer <doctor_token>`

**Response:**
```json
{
  "success": true,
  "message": "Today's schedule retrieved successfully",
  "data": {
    "schedule": [
      {
        "id": "prescription_id_1",
        "patientName": "Robert Williams",
        "reason": "Follow-up",
        "consultationType": "Follow-up",
        "time": "3:00 PM",
        "prescriptionNumber": "PRES202401151234567890"
      },
      {
        "id": "prescription_id_2",
        "patientName": "Lisa Anderson",
        "reason": "New Consultation",
        "consultationType": "New Consultation",
        "time": "4:30 PM",
        "prescriptionNumber": "PRES202401151234567891"
      },
      {
        "id": "prescription_id_3",
        "patientName": "David Martinez",
        "reason": "Routine checkup",
        "consultationType": "Consultation",
        "time": "5:00 PM",
        "prescriptionNumber": "PRES202401151234567892"
      }
    ],
    "date": "Monday, January 15, 2024"
  }
}
```

**Consultation Types:**
- `Follow-up` - Prescription with a follow-up date scheduled for today
- `New Consultation` - New consultation created today
- `Consultation` - General consultation

**Error Responses:**
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (user is not a doctor)
- `404` - Doctor profile not found

**Notes:**
- Includes prescriptions with `followUpDate` set to today
- Also includes prescriptions created today (as new consultations)
- Schedule items are sorted by time (earliest first)
- Duplicate prescriptions are automatically removed
- Only includes non-cancelled prescriptions

---

### Patient Consultations

#### Get All Consultations
**GET** `/api/v1/doctor/consultations?page=1&limit=10&status=pending&search=Sarah`

Get list of patient consultations (intake forms) that were submitted to the logged-in doctor. Only consultations where patients have specifically selected and submitted the form to this doctor will be shown.

**Headers:** `Authorization: Bearer <doctor_token>`

**Important Notes:**
- **Doctor Identification**: Doctor is automatically identified from the authentication token
- **Filtered by Doctor**: Only consultations assigned to the logged-in doctor are returned
- **Relation**: Each consultation must have `doctor` field set to the logged-in doctor's ID (set when patient submits consultation with `doctorId`)
- **Patient Selection**: Patients select a doctor when submitting the intake form, and only that doctor can see those consultations

**Query Parameters:**
- `page` (optional) - Page number (default: 1, minimum: 1)
- `limit` (optional) - Items per page (default: 10, maximum: 100)
- `status` (optional) - Filter by status. Must be one of:
  - `pending` - Submitted but not reviewed (default) - Shows consultations with status `submitted`
  - `submitted` - Submitted consultations
  - `reviewed` - Reviewed consultations
  - `draft` - Draft consultations
- `search` (optional) - Search by patient name, email, or condition/symptoms (searches only within this doctor's consultations)

**Response:**
```json
{
  "success": true,
  "message": "Consultations retrieved successfully",
  "data": {
    "consultations": [
      {
        "id": "intake_form_id_1",
        "patient": {
          "id": "patient_id_1",
          "name": "Sarah Johnson",
          "age": 34,
          "gender": "female",
          "email": "sarah.johnson@example.com",
          "phone": "9876543210",
          "countryCode": "+91",
          "profilePicture": "https://example.com/profile.jpg"
        },
        "condition": "Respiratory Issues, Chronic cough",
        "symptoms": "Persistent cough, shortness of breath",
        "status": "pending",
        "submittedAt": "2025-12-08 09:30 AM",
        "submittedDate": "2025-12-08T09:30:00.000Z",
        "intakeForm": {
          "basicInfoComplete": true,
          "emergencyContactComplete": true,
          "medicalQuestionsComplete": true
        }
      },
      {
        "id": "intake_form_id_2",
        "patient": {
          "id": "patient_id_2",
          "name": "Michael Chen",
          "age": 28,
          "gender": "male",
          "email": "michael.chen@example.com",
          "phone": "9876543211",
          "countryCode": "+91",
          "profilePicture": null
        },
        "condition": "Skin Allergy",
        "symptoms": "Rash, Itching",
        "status": "pending",
        "submittedAt": "2025-12-08 10:15 AM",
        "submittedDate": "2025-12-08T10:15:00.000Z",
        "intakeForm": {
          "basicInfoComplete": true,
          "emergencyContactComplete": false,
          "medicalQuestionsComplete": true
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

**Error Responses:**
- `400` - Validation failed (invalid query parameters)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (user is not a doctor)
- `404` - Doctor profile not found

**Notes:**
- **Doctor-Specific**: Only consultations assigned to the logged-in doctor are returned
- **Relation**: The `doctor` field in IntakeForm must match the logged-in doctor's ID
- **Patient Submission**: When a patient submits a consultation (`POST /patient/intake-form/submit`), they must provide `doctorId`, which creates the relation
- Default status filter is `pending` (submitted but not reviewed)
- Search works across patient name, email, and medical conditions/symptoms (only within this doctor's consultations)
- Age is automatically calculated from patient's date of birth
- Condition and symptoms are extracted from medical questions in the intake form
- Patient information is populated from both User and Patient models
- Doctor information is also populated in the response
- Consultations are sorted by creation date (most recent first)

**How Consultation Assignment Works:**
1. Patient fills intake form sections
2. Patient selects a doctor and submits: `POST /patient/intake-form/submit` with `{ "doctorId": "doctor_id" }`
3. IntakeForm's `doctor` field is set to the selected doctor's ID
4. Only that specific doctor can see this consultation in their list
5. Other doctors will not see consultations assigned to different doctors

---

#### Get Consultation by ID
**GET** `/api/v1/doctor/consultations/:id`

Get detailed consultation (intake form) information including complete patient details, basic information, emergency contact, and medical questions.

**Headers:** `Authorization: Bearer <doctor_token>`

**Response:**
```json
{
  "success": true,
  "message": "Consultation retrieved successfully",
  "data": {
    "id": "intake_form_id",
    "patient": {
      "id": "patient_id",
      "name": "Sarah Johnson",
      "firstName": "Sarah",
      "lastName": "Johnson",
      "age": 34,
      "gender": "female",
      "dateOfBirth": "1990-05-15T00:00:00.000Z",
      "email": "sarah.johnson@example.com",
      "phone": "9876543210",
      "countryCode": "+91",
      "profilePicture": "https://example.com/profile.jpg",
      "bloodGroup": "O+",
      "height": 165,
      "weight": 60,
      "medicalHistory": ["Hypertension", "Diabetes"],
      "allergies": ["Penicillin"],
      "emergencyContact": {
        "name": "John Johnson",
        "phoneNumber": "9876543211",
        "relationship": "Spouse"
      }
    },
    "basicInformation": {
      "firstName": "Sarah",
      "middleName": "Marie",
      "lastName": "Johnson",
      "sex": "female",
      "dateOfBirth": "1990-05-15T00:00:00.000Z",
      "email": "sarah.johnson@example.com",
      "phone": "9876543210",
      "address": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zip": "400001",
      "maritalStatus": "married",
      "govtIssuedCertificate": "aadhaar",
      "certificateUpload": "https://example.com/certificate.pdf",
      "isBasicInfoComplete": true
    },
    "emergencyContact": {
      "relationship": "Spouse",
      "firstName": "John",
      "lastName": "Johnson",
      "email": "john.johnson@example.com",
      "phone": "9876543211",
      "primaryPhone": "9876543211",
      "address": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zip": "400001",
      "isEmergencyContactComplete": true
    },
    "medicalQuestions": {
      "pastMedicalHistory": ["Respiratory Issues", "Chronic cough"],
      "currentMedications": ["Inhaler", "Antibiotics"],
      "medicationAllergies": ["Penicillin"],
      "preferredPharmacies": [
        {
          "pharmacyName": "City Pharmacy",
          "address": "456 Market Street",
          "city": "Mumbai",
          "state": "Maharashtra",
          "zip": "400002"
        }
      ],
      "howDidYouHearAboutUs": "Online search",
      "isMedicalQuestionsComplete": true
    },
    "status": "pending",
    "submittedAt": "2025-12-08 09:30 AM",
    "submittedDate": "2025-12-08T09:30:00.000Z",
    "updatedAt": "2025-12-08T09:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed (invalid consultation ID)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (user is not a doctor)
- `404` - Consultation not found or Doctor profile not found

**Notes:**
- Returns complete intake form with all sections populated
- Patient information is merged from Patient model and User model
- Includes all medical history, allergies, and emergency contact details
- Age is calculated from date of birth
- All form completion statuses are included

---

#### Update Consultation Status
**PUT** `/api/v1/doctor/consultations/:id/status`

Update the status of a consultation (intake form). Used to mark consultations as reviewed.

**Headers:** `Authorization: Bearer <doctor_token>`

**Request Body:**
```json
{
  "status": "reviewed"
}
```

**Required Fields:**
- `status` - Must be one of: `draft`, `submitted`, `reviewed`

**Response:**
```json
{
  "success": true,
  "message": "Consultation status updated successfully",
  "data": {
    "id": "intake_form_id",
    "status": "reviewed",
    "updatedAt": "2025-12-08T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed (invalid status or consultation ID)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (user is not a doctor)
- `404` - Consultation not found or Doctor profile not found

**Status Values:**
- `draft` - Consultation is still in draft (not submitted)
- `submitted` - Consultation has been submitted by patient (appears as "pending" in list)
- `reviewed` - Consultation has been reviewed by doctor

**Notes:**
- Status `submitted` appears as `pending` in the consultations list
- Use this endpoint to mark consultations as reviewed after doctor review
- Status update is tracked with `updatedAt` timestamp

---

### Doctor Earnings & Payouts

#### Get Earnings Summary
**GET** `/api/v1/doctor/earnings/summary?period=last_30_days`

Get earnings summary for the logged-in doctor including total earnings, available earnings, paid out amount, and pending payouts.

**Headers:** `Authorization: Bearer <doctor_token>`

**Query Parameters:**
- `period` (optional) - Time period for earnings calculation. Must be one of:
  - `today` - Today's earnings
  - `last_7_days` - Last 7 days
  - `last_30_days` - Last 30 days (default)
  - `this_month` - Current month
  - `last_month` - Previous month
  - `all` - All time earnings

**Response:**
```json
{
  "success": true,
  "message": "Earnings summary retrieved successfully",
  "data": {
    "summary": {
      "totalEarnings": {
        "value": 15000,
        "change": "+12.5%",
        "trend": "up"
      },
      "availableEarnings": {
        "value": 8500
      },
      "paidOut": {
        "value": 5000,
        "count": 3
      },
      "pendingPayouts": {
        "value": 1500,
        "count": 1
      },
      "consultations": {
        "count": 100
      },
      "consultationFee": 150
    },
    "period": "last_30_days",
    "doctor": {
      "id": "doctor_id",
      "name": "Dr. Sarah Jenkins",
      "specialty": "General Practice",
      "bankAccount": {
        "accountHolderName": "Sarah Jenkins",
        "bankName": "Chase Bank",
        "accountNumber": "1234567890",
        "routingNumber": "123456789",
        "accountType": "checking",
        "verified": true
      }
    }
  }
}
```

**Notes:**
- **Total Earnings**: Calculated as (consultations count × consultation fee)
- **Available Earnings**: Total earnings - paid out - pending payouts
- **Percentage Change**: Compares current period with previous period
- **Bank Account**: Shows doctor's bank account details if set
- Earnings are calculated based on completed consultations (prescriptions with status not 'cancelled')

---

#### Get Payout Requests
**GET** `/api/v1/doctor/earnings/payouts?page=1&limit=10&status=pending`

Get list of payout requests for the logged-in doctor.

**Headers:** `Authorization: Bearer <doctor_token>`

**Query Parameters:**
- `page` (optional) - Page number (default: 1, minimum: 1)
- `limit` (optional) - Items per page (default: 10, maximum: 100)
- `status` (optional) - Filter by status. Must be one of:
  - `pending` - Pending payout requests
  - `processing` - Processing payout requests
  - `completed` - Completed payouts
  - `failed` - Failed payouts
  - `cancelled` - Cancelled payouts

**Response:**
```json
{
  "success": true,
  "message": "Payout requests retrieved successfully",
  "data": {
    "payouts": [
      {
        "id": "payout_id_1",
        "amount": 1500,
        "currency": "USD",
        "status": "pending",
        "payoutMethod": "bank_transfer",
        "bankAccount": {
          "accountHolderName": "Sarah Jenkins",
          "bankName": "Chase Bank",
          "accountNumber": "****7890",
          "routingNumber": "****6789",
          "accountType": "checking"
        },
        "transactionId": null,
        "notes": "Monthly payout request",
        "failureReason": null,
        "processedBy": null,
        "requestedAt": "2025-01-03T10:30:00.000Z",
        "processedAt": null,
        "failedAt": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

---

#### Get Payout Request by ID
**GET** `/api/v1/doctor/earnings/payouts/:id`

Get detailed information about a specific payout request.

**Headers:** `Authorization: Bearer <doctor_token>`

**Response:**
```json
{
  "success": true,
  "message": "Payout request retrieved successfully",
  "data": {
    "id": "payout_id",
    "amount": 1500,
    "currency": "USD",
    "status": "pending",
    "payoutMethod": "bank_transfer",
    "bankAccount": {
      "accountHolder": "Sarah Jenkins",
      "bankName": "Chase Bank",
      "accountNumber": "1234567890",
      "routingNumber": "123456789",
      "accountType": "checking"
    },
    "transactionId": null,
    "notes": "Monthly payout request",
    "failureReason": null,
    "processedBy": null,
    "requestedAt": "2025-01-03T10:30:00.000Z"
  }
}
```

---

#### Create Payout Request
**POST** `/api/v1/doctor/earnings/payouts`

Create a new payout request. The amount must not exceed available earnings.

**Headers:** `Authorization: Bearer <doctor_token>`

**Request Body:**
```json
{
  "amount": 1500,
  "notes": "Monthly payout request"
}
```

**Required Fields:**
- `amount` - Payout amount (must be greater than 0, cannot exceed available earnings)

**Optional Fields:**
- `notes` - Additional notes (max 500 characters)

**Response:**
```json
{
  "success": true,
  "message": "Payout request created successfully",
  "data": {
    "_id": "payout_id",
    "payoutId": "POUT-1704286800000-1234",
    "doctor": "doctor_id",
    "amount": 1500,
    "currency": "USD",
    "status": "pending",
    "payoutMethod": "bank_transfer",
    "bankAccount": {
      "accountHolder": "Sarah Jenkins",
      "bankName": "Chase Bank",
      "accountNumber": "1234567890",
      "routingNumber": "123456789",
      "accountType": "checking"
    },
    "notes": "Monthly payout request",
    "createdAt": "2025-01-03T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed or insufficient earnings or bank account not set
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (user is not a doctor)

**Notes:**
- **Bank Account Required**: Doctor must have bank account details set in profile before requesting payout
- **Available Earnings Check**: Amount cannot exceed available earnings
- Bank account details are automatically taken from doctor's profile

---

#### Get Reports & Analytics
**GET** `/api/v1/doctor/earnings/reports?period=last_30_days`

Get comprehensive reports and analytics for the logged-in doctor.

**Headers:** `Authorization: Bearer <doctor_token>`

**Query Parameters:**
- `period` (optional) - Time period for reports. Must be one of:
  - `today`, `last_7_days`, `last_30_days` (default), `this_month`, `last_month`, `this_year`

**Response:**
```json
{
  "success": true,
  "message": "Reports and analytics retrieved successfully",
  "data": {
    "period": "last_30_days",
    "summary": {
      "totalConsultations": 100,
      "totalRequests": 120,
      "totalEarnings": 15000,
      "averageEarningsPerConsultation": 150
    },
    "consultations": {
      "byStatus": {
        "active": 45,
        "completed": 50,
        "cancelled": 5
      },
      "byDate": [
        { "date": "2025-01-01", "count": 5 }
      ]
    },
    "insights": {
      "topDiagnoses": [
        { "diagnosis": "Hypertension", "count": 25 }
      ],
      "patientDemographics": {
        "gender": { "male": 55, "female": 45 },
        "ageGroups": { "0-18": 10, "19-35": 30 }
      }
    },
    "recentConsultations": []
  }
}
```

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

### Saved Medicines

APIs for patients to save and manage their favorite medicines for quick access later.

#### Get All Saved Medicines
**GET** `/api/v1/patient/saved-medicines?page=1&limit=20`

Get list of all medicines saved by the logged-in patient.

**Headers:** `Authorization: Bearer <patient_token>`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "message": "Saved medicines retrieved successfully",
  "data": [
    {
      "_id": "saved_medicine_id",
      "patient": "patient_id",
      "medicine": {
        "_id": "medicine_id",
        "productName": "Amoxicillin",
        "brand": "Cetaphill",
        "originalPrice": 20.99,
        "salePrice": 15.99,
        "images": {
          "thumbnail": "https://example.com/images/amoxicillin-thumb.jpg",
          "gallery": ["https://example.com/images/amoxicillin-1.jpg"]
        },
        "description": "Antibiotic medication used to treat various bacterial infections",
        "category": "Antibiotics",
        "healthCategory": {
          "_id": "health_category_id",
          "name": "Respiratory Health",
          "slug": "respiratory-health",
          "description": "Medications and treatments for respiratory conditions",
          "icon": "https://example.com/icons/respiratory.svg",
          "types": [
            {
              "name": "Asthma",
              "slug": "asthma",
              "description": "Medications for asthma management",
              "icon": "https://example.com/icons/asthma.svg",
              "order": 0,
              "isActive": true
            }
          ]
        },
        "healthTypeSlug": "asthma",
        "generics": ["Amoxicillin Trihydrate", "Amoxicillin Sodium"],
        "dosageOptions": [
          {
            "name": "Capsule - 500mg",
            "priceAdjustment": 0
          }
        ],
        "quantityOptions": [
          {
            "name": "20 Tablets",
            "priceAdjustment": 0
          }
        ],
        "stock": 450,
        "status": "in_stock",
        "visibility": true,
        "isActive": true,
        "isTrendy": true,
        "isBestOffer": false,
        "discountPercentage": 0,
        "views": 0
      },
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - Patient profile not found

**Notes:**
- Only returns active and visible medicines
- Results are sorted by saved date (most recent first)
- Medicines that are deleted or made inactive are automatically filtered out

---

#### Check if Medicine is Saved
**GET** `/api/v1/patient/saved-medicines/:medicineId/check`

Check if a specific medicine is saved by the logged-in patient.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `medicineId` (path) - Medicine ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "data": {
    "isSaved": true
  }
}
```

**Error Responses:**
- `400` - Invalid medicine ID
- `401` - Unauthorized
- `404` - Patient profile not found

---

#### Save Medicine
**POST** `/api/v1/patient/saved-medicines/:medicineId`

Save a medicine to the patient's saved list for quick access later.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `medicineId` (path) - Medicine ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Medicine saved successfully",
  "data": {
    "_id": "saved_medicine_id",
    "patient": "patient_id",
    "medicine": {
      "_id": "medicine_id",
      "productName": "Amoxicillin",
      "brand": "Cetaphill",
      "originalPrice": 20.99,
      "salePrice": 15.99,
      "images": {
        "thumbnail": "https://example.com/images/amoxicillin-thumb.jpg",
        "gallery": ["https://example.com/images/amoxicillin-1.jpg"]
      },
      "description": "Antibiotic medication used to treat various bacterial infections",
      "category": "Antibiotics",
      "healthCategory": {
        "_id": "health_category_id",
        "name": "Respiratory Health",
        "slug": "respiratory-health",
        "description": "Medications and treatments for respiratory conditions",
        "icon": "https://example.com/icons/respiratory.svg",
        "types": [
          {
            "name": "Asthma",
            "slug": "asthma",
            "description": "Medications for asthma management",
            "icon": "https://example.com/icons/asthma.svg",
            "order": 0,
            "isActive": true
          }
        ]
      },
      "healthTypeSlug": "asthma",
      "generics": ["Amoxicillin Trihydrate", "Amoxicillin Sodium"],
      "dosageOptions": [
        {
          "name": "Capsule - 500mg",
          "priceAdjustment": 0
        }
      ],
      "quantityOptions": [
        {
          "name": "20 Tablets",
          "priceAdjustment": 0
        }
      ],
      "stock": 450,
      "status": "in_stock",
      "visibility": true,
      "isActive": true,
      "isTrendy": true,
      "isBestOffer": false,
      "discountPercentage": 0,
      "views": 0
    },
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid medicine ID
- `401` - Unauthorized
- `404` - Medicine not found or not available / Patient profile not found
- `409` - Medicine is already saved

**Notes:**
- Medicine must be active and visible to be saved
- A patient cannot save the same medicine twice (duplicate prevention)
- Saved medicine includes full medicine details with populated health category

---

#### Unsave Medicine
**DELETE** `/api/v1/patient/saved-medicines/:medicineId`

Remove a medicine from the patient's saved list.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `medicineId` (path) - Medicine ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Medicine removed from saved list successfully"
}
```

**Error Responses:**
- `400` - Invalid medicine ID
- `401` - Unauthorized
- `404` - Saved medicine not found / Patient profile not found

**Notes:**
- If the medicine is not in the saved list, returns 404
- Operation is idempotent (safe to call multiple times)

---

### Refill Medications APIs

APIs for patients to manage medication refills. Patients can refill medicines they have previously purchased.

#### Get Previously Purchased Medicines
**GET** `/api/v1/patient/refills/previously-purchased-medicines?startDate=2025-01-01&endDate=2025-01-31&page=1&limit=20`

Get list of all medicines previously purchased by the patient from delivered/shipped orders. This helps patients identify medicines they can request for refill.

**Headers:** `Authorization: Bearer <patient_token>`

**Query Parameters:**
- `startDate` (optional) - Filter orders from this date (ISO 8601 format, e.g., `2025-01-01`)
- `endDate` (optional) - Filter orders until this date (ISO 8601 format, e.g., `2025-01-31`)
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "message": "Previously purchased medicines retrieved successfully",
  "data": [
    {
      "productId": "65a1b2c3d4e5f6789012345h",
      "medicationName": "Cetaphil Gentle Skin Cleanser 250ml",
      "brand": "Cetaphil",
      "images": {
        "thumbnail": "https://example.com/images/cetaphil-thumb.jpg",
        "gallery": []
      },
      "totalQuantity": 2,
      "totalOrders": 1,
      "lastPurchasedDate": "2025-01-15T10:00:00.000Z",
      "lastOrderNumber": "ORD-1737123456789-1234",
      "lastOrderId": "65a1b2c3d4e5f6789012345e",
      "lastUnitPrice": 78.99,
      "lastQuantity": 1,
      "orders": [
        {
          "orderId": "65a1b2c3d4e5f6789012345e",
          "orderNumber": "ORD-1737123456789-1234",
          "quantity": 1,
          "unitPrice": 78.99,
          "totalPrice": 78.99,
          "purchasedDate": "2025-01-15T10:00:00.000Z",
          "status": "delivered"
        }
      ],
      "product": {
        "_id": "65a1b2c3d4e5f6789012345h",
        "productName": "Cetaphil Gentle Skin Cleanser 250ml",
        "brand": "Cetaphil",
        "originalPrice": 150.00,
        "salePrice": 122.89,
        "images": {
          "thumbnail": "https://example.com/images/cetaphil-thumb.jpg",
          "gallery": []
        },
        "description": "Gentle skin cleanser for sensitive skin",
        "generics": ["Cetaphil"],
        "dosageOptions": [
          {
            "name": "250ml",
            "priceAdjustment": 0
          }
        ],
        "quantityOptions": [
          {
            "name": "1 Bottle",
            "priceAdjustment": 0
          }
        ],
        "category": "Skincare",
        "stock": 100,
        "status": "in_stock",
        "visibility": true,
        "isActive": true,
        "healthCategory": {
          "_id": "health_category_id",
          "name": "Eye Care",
          "slug": "eye-care"
        },
        "healthTypeSlug": "dry-eye"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - Patient profile not found

**Notes:**
- Only considers orders with status `delivered` or `shipped` and payment status `paid`
- Only includes items with `productType: 'medication'`
- Medicines are grouped by productId
- Results are sorted by `lastPurchasedDate` (most recent first)
- Each medicine entry includes complete product details and order history

---

#### Create Refill Request
**POST** `/api/v1/patient/refills`

Create a refill request for one or multiple previously purchased medicines. Supports both single medicine and bulk refill requests.

**Headers:** `Authorization: Bearer <patient_token>`

**Option 1: Single Medicine Refill**

**Request Body:**
```json
{
  "medicineId": "65a1b2c3d4e5f6789012345h",
  "quantity": 1,
  "dosage": "250ml",
  "frequency": "Twice daily",
  "instructions": "Apply as needed",
  "maxRefills": 3,
  "notes": "Need refill for next month",
  "autoRefill": true,
  "autoRefillFrequency": "monthly"
}
```

**Option 2: Multiple Medicines Refill (Bulk)**

**Request Body:**
```json
{
  "refillType": "medicine",
  "medicines": [
    {
      "medicineId": "695c0c2c18b23580c989fbe8",
      "productName": "Paracetamol",
      "brand": "Cipla",
      "dosageOption": {
        "name": "500mg",
        "priceAdjustment": 0
      },
      "quantityOption": {
        "name": "Strip of 10",
        "priceAdjustment": 0
      },
      "quantity": 2,
      "unitPrice": 25,
      "totalPrice": 50,
      "instructions": "Take after meals",
      "frequency": "Twice daily"
    },
    {
      "medicineId": "695c0c2c18b23580c989fbe9",
      "productName": "Cetirizine",
      "brand": "Sun Pharma",
      "dosageOption": {
        "name": "10mg",
        "priceAdjustment": 5
      },
      "quantityOption": {
        "name": "Strip of 15",
        "priceAdjustment": 10
      },
      "quantity": 1,
      "unitPrice": 40,
      "totalPrice": 40,
      "instructions": "Take before sleep",
      "frequency": "Once daily"
    }
  ],
  "notes": "Monthly medicine refill",
  "maxRefills": 3,
  "autoRefill": true,
  "autoRefillFrequency": "monthly"
}
```

**Required Fields (Single Medicine):**
- `medicineId` - **Medicine ID from Medicine collection** (MongoDB ObjectId, NOT Order ID). 
  - This is the ID of the medicine/product itself (e.g., `"695d4976ef76b57ece8fb8e1"`)
  - Medicine must be active, visible, and in stock
  - Patient must have previously ordered this medicine (system automatically checks order history)
  - Example: If you ordered medicine with ID `"695d4976ef76b57ece8fb8e1"`, use that same ID here

**Required Fields (Multiple Medicines):**
- `medicines` - Array of medicine objects. Each medicine object must have:
  - `medicineId` - **Medicine ID from Medicine collection** (MongoDB ObjectId, required, NOT Order ID)
    - This is the ID of the medicine/product itself
    - Must match the `productId` from a previous order's items
  - `quantity` - Quantity to refill (required, positive integer)
  - `unitPrice` - Unit price (optional, will use current medicine price if not provided)
  - `totalPrice` - Total price (optional, will be calculated if not provided)

**Optional Fields (Single Medicine):**
- `quantity` - Quantity to refill (default: uses last order quantity, or 1)
- `dosage` - Dosage information (default: uses last order dosage, or medicine's first dosage option)
- `frequency` - Frequency of use (optional)
- `instructions` - Usage instructions (default: uses last order instructions, or medicine description)
- `maxRefills` - Maximum refills allowed (default: 3, max: 10)
- `notes` - Additional notes (max 500 characters)
- `autoRefill` - Enable automatic refills (default: false)
- `autoRefillFrequency` - Auto refill frequency: `monthly`, `quarterly`, `biannual`, `annual` (default: `monthly`)

**Optional Fields (Multiple Medicines - per medicine):**
- `productName` - Product name (optional, will use medicine's productName if not provided)
- `brand` - Brand name (optional, will use medicine's brand if not provided)
- `dosageOption` - Dosage option object with `name` and `priceAdjustment` (optional)
- `quantityOption` - Quantity option object with `name` and `priceAdjustment` (optional)
- `instructions` - Usage instructions (optional)
- `frequency` - Frequency of use (optional)

**Optional Fields (Multiple Medicines - common):**
- `refillType` - Set to `"medicine"` (optional)
- `notes` - Common notes for all refills (max 500 characters)
- `maxRefills` - Maximum refills allowed for all medicines (default: 3, max: 10)
- `autoRefill` - Enable automatic refills for all medicines (default: false)
- `autoRefillFrequency` - Auto refill frequency for all medicines: `monthly`, `quarterly`, `biannual`, `annual` (default: `monthly`)

**Response (Single Medicine):**
```json
{
  "success": true,
  "message": "Refill request created successfully",
  "data": {
    "_id": "refill_id",
    "refillNumber": "REF-1737123456789-0001",
    "patient": "patient_id",
    "medicine": {
      "_id": "65a1b2c3d4e5f6789012345h",
      "productName": "Cetaphil Gentle Skin Cleanser 250ml",
      "brand": "Cetaphil",
      "originalPrice": 150.00,
      "salePrice": 122.89,
      "images": {
        "thumbnail": "https://example.com/images/cetaphil-thumb.jpg",
        "gallery": []
      },
      "description": "Gentle skin cleanser for sensitive skin",
      "generics": ["Cetaphil"],
      "dosageOptions": [
        {
          "name": "250ml",
          "priceAdjustment": 0
        }
      ],
      "quantityOptions": [
        {
          "name": "1 Bottle",
          "priceAdjustment": 0
        }
      ],
      "category": "Skincare",
      "stock": 100,
      "status": "in_stock",
      "visibility": true,
      "isActive": true,
      "healthCategory": {
        "_id": "health_category_id",
        "name": "Eye Care",
        "slug": "eye-care"
      },
      "healthTypeSlug": "dry-eye"
    },
    "status": "pending",
    "requestedDate": "2025-01-15T10:00:00.000Z",
    "medicationName": "Cetaphil Gentle Skin Cleanser 250ml",
    "quantity": 1,
    "dosage": "250ml",
    "frequency": "Twice daily",
    "instructions": "Apply as needed",
    "unitPrice": 122.89,
    "totalPrice": 122.89,
    "refillCount": 1,
    "maxRefills": 3,
    "notes": "Need refill for next month",
    "autoRefill": true,
    "autoRefillFrequency": "monthly",
    "order": null,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

**Response (Multiple Medicines):**
```json
{
  "success": true,
  "message": "Successfully created 2 refill(s)",
  "data": [
    {
      "_id": "refill_id_1",
      "refillNumber": "REF-1737123456789-0001",
      "patient": "patient_id",
      "medicine": {
        "_id": "695c0c2c18b23580c989fbe8",
        "productName": "Paracetamol",
        "brand": "Cipla",
        "salePrice": 25
      },
      "status": "pending",
      "medicationName": "Paracetamol",
      "quantity": 2,
      "dosage": "500mg",
      "frequency": "Twice daily",
      "instructions": "Take after meals",
      "unitPrice": 25,
      "totalPrice": 50,
      "createdAt": "2025-01-15T10:00:00.000Z"
    },
    {
      "_id": "refill_id_2",
      "refillNumber": "REF-1737123456789-0002",
      "patient": "patient_id",
      "medicine": {
        "_id": "695c0c2c18b23580c989fbe9",
        "productName": "Cetirizine",
        "brand": "Sun Pharma",
        "salePrice": 40
      },
      "status": "pending",
      "medicationName": "Cetirizine",
      "quantity": 1,
      "dosage": "10mg",
      "frequency": "Once daily",
      "instructions": "Take before sleep",
      "unitPrice": 40,
      "totalPrice": 40,
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "errors": null
}
```

**Response (Partial Success - Some Failed):**
```json
{
  "success": false,
  "message": "Created 1 refill(s) successfully. 1 error(s) occurred.",
  "data": [
    {
      "_id": "refill_id_1",
      "refillNumber": "REF-1737123456789-0001",
      "medicine": {
        "_id": "695c0c2c18b23580c989fbe8",
        "productName": "Paracetamol"
      },
      "status": "pending",
      "quantity": 2,
      "totalPrice": 50
    }
  ],
  "errors": [
    "Failed to create refill for medicine 695c0c2c18b23580c989fbe9: This medicine cannot be refilled. You must have previously ordered this medicine to request a refill."
  ]
}
```

**Error Responses:**
- `400` - Validation failed, maximum refills reached, medicine not previously ordered, or medicine not available
- `401` - Unauthorized
- `404` - Medicine not found or not active
- `409` - A pending refill already exists for this medicine

**Notes:**
- **IMPORTANT**: `medicineId` is the **Medicine collection ID**, NOT the Order ID
  - Use the medicine's `_id` from the Medicine collection (e.g., `"695d4976ef76b57ece8fb8e1"`)
  - This is the same ID that appears as `productId` in order items
  - The system automatically checks if the patient has previously ordered this medicine by searching order history
- **Single Medicine**: Use `medicineId` field for backward compatibility
- **Multiple Medicines**: Use `medicines` array to create multiple refills in one request
- Cannot use both `medicineId` and `medicines` array in the same request
- Each medicine in the array must have been previously ordered by the patient (delivered/shipped and paid)
- Each medicine must be `active`, `visible`, and have status `in_stock` or `low_stock`
- Cannot create a new refill if a pending refill already exists for the same medicine
- Refill count is tracked per medicine
- For multiple medicines, if some fail, the successful ones are still created (partial success)
- Common fields (`notes`, `maxRefills`, `autoRefill`, `autoRefillFrequency`) apply to all medicines in the array
- Medicine-specific fields (`quantity`, `dosage`, `frequency`, `instructions`, `unitPrice`, `totalPrice`) can be specified per medicine

**How to find the correct Medicine ID:**
1. Check your previous orders - look at the `items` array, each item has a `productId` field
2. Use the `productId` value (this is the Medicine ID)
3. Or use the `/api/v1/patient/refills/previously-purchased-medicines` API to get a list of medicines you can refill with their IDs

---

#### Get All Refills (Fresh/Active Only)
**GET** `/api/v1/patient/refills?status=pending&medicineId=medicine_id&page=1&limit=10`

Get list of all fresh/active refills for the logged-in patient. Only shows `pending` and `approved` refills by default.

**Headers:** `Authorization: Bearer <patient_token>`

**Query Parameters:**
- `status` (optional) - Filter by status: `pending`, `approved`, `rejected`, `completed`, `cancelled`, `skipped`, `all` (default: shows only `pending` and `approved`)
- `medicineId` (optional) - Filter by medicine ID (MongoDB ObjectId)
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10, max: 100)

**Response:**
```json
{
  "success": true,
  "message": "Refills retrieved successfully",
  "data": [
    {
      "_id": "refill_id",
      "refillNumber": "REF-1737123456789-0001",
      "patient": "patient_id",
      "medicine": {
        "_id": "65a1b2c3d4e5f6789012345h",
        "productName": "Cetaphil Gentle Skin Cleanser 250ml",
        "brand": "Cetaphil",
        "originalPrice": 150.00,
        "salePrice": 122.89,
        "images": {
          "thumbnail": "https://example.com/images/cetaphil-thumb.jpg",
          "gallery": []
        },
        "description": "Gentle skin cleanser for sensitive skin",
        "generics": ["Cetaphil"],
        "dosageOptions": [
          {
            "name": "250ml",
            "priceAdjustment": 0
          }
        ],
        "quantityOptions": [
          {
            "name": "1 Bottle",
            "priceAdjustment": 0
          }
        ],
        "category": "Skincare",
        "stock": 100,
        "status": "in_stock",
        "visibility": true,
        "isActive": true
      },
      "status": "pending",
      "requestedDate": "2025-01-15T10:00:00.000Z",
      "medicationName": "Cetaphil Gentle Skin Cleanser 250ml",
      "quantity": 1,
      "dosage": "250ml",
      "frequency": "Twice daily",
      "instructions": "Apply as needed",
      "unitPrice": 122.89,
      "totalPrice": 122.89,
      "refillCount": 1,
      "maxRefills": 3,
      "notes": "Need refill for next month",
      "autoRefill": true,
      "autoRefillFrequency": "monthly",
      "order": null,
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - Patient profile not found

**Notes:**
- By default, only shows fresh/active refills with status `pending` or `approved`
- Use `status=all` to see all refills including completed, cancelled, rejected, and skipped
- Results are sorted by creation date (most recent first)

---

#### Get Refill by ID
**GET** `/api/v1/patient/refills/:id`

Get complete details of a specific refill.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `id` (path) - Refill ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Refill retrieved successfully",
  "data": {
    "_id": "refill_id",
    "refillNumber": "REF-1737123456789-0001",
    "patient": "patient_id",
    "medicine": {
      "_id": "65a1b2c3d4e5f6789012345h",
      "productName": "Cetaphil Gentle Skin Cleanser 250ml",
      "brand": "Cetaphil",
      "originalPrice": 150.00,
      "salePrice": 122.89,
      "images": {
        "thumbnail": "https://example.com/images/cetaphil-thumb.jpg",
        "gallery": []
      },
      "description": "Gentle skin cleanser for sensitive skin",
      "generics": ["Cetaphil"],
      "dosageOptions": [
        {
          "name": "250ml",
          "priceAdjustment": 0
        }
      ],
      "quantityOptions": [
        {
          "name": "1 Bottle",
          "priceAdjustment": 0
        }
      ],
      "category": "Skincare",
      "stock": 100,
      "status": "in_stock",
      "visibility": true,
      "isActive": true
    },
    "status": "pending",
    "requestedDate": "2025-01-15T10:00:00.000Z",
    "medicationName": "Cetaphil Gentle Skin Cleanser 250ml",
    "quantity": 1,
    "dosage": "250ml",
    "frequency": "Twice daily",
    "instructions": "Apply as needed",
    "unitPrice": 122.89,
    "totalPrice": 122.89,
    "refillCount": 1,
    "maxRefills": 3,
    "notes": "Need refill for next month",
    "autoRefill": true,
    "autoRefillFrequency": "monthly",
    "order": null,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid refill ID
- `401` - Unauthorized
- `404` - Refill not found

---

#### Update Refill
**PUT** `/api/v1/patient/refills/:id`

Update a pending refill request (quantity, dosage, frequency, instructions, etc.).

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `id` (path) - Refill ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "quantity": 2,
  "dosage": "500ml",
  "frequency": "Once daily",
  "instructions": "Take with food",
  "notes": "Updated refill request",
  "autoRefill": false,
  "autoRefillFrequency": "quarterly"
}
```

**Optional Fields:**
- `quantity` - Quantity to refill (must be positive integer)
- `dosage` - Dosage information (max 255 characters)
- `frequency` - Frequency of use (max 255 characters)
- `instructions` - Usage instructions (max 500 characters)
- `notes` - Additional notes (max 500 characters)
- `autoRefill` - Enable/disable automatic refills (boolean)
- `autoRefillFrequency` - Auto refill frequency: `monthly`, `quarterly`, `biannual`, `annual`

**Response:**
```json
{
  "success": true,
  "message": "Refill updated successfully",
  "data": {
    "_id": "refill_id",
    "refillNumber": "REF-1737123456789-0001",
    "status": "pending",
    "quantity": 2,
    "dosage": "500ml",
    "frequency": "Once daily",
    "instructions": "Take with food",
    "unitPrice": 122.89,
    "totalPrice": 245.78,
    "notes": "Updated refill request",
    "autoRefill": false,
    "autoRefillFrequency": "quarterly",
    "medicine": {
      "_id": "65a1b2c3d4e5f6789012345h",
      "productName": "Cetaphil Gentle Skin Cleanser 250ml",
      "brand": "Cetaphil",
      "salePrice": 122.89
    },
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed or refill not in pending status
- `401` - Unauthorized
- `404` - Refill not found

**Notes:**
- Only pending refills can be updated
- When quantity is updated, total price is automatically recalculated
- Unit price is locked at the time of refill creation

---

#### Skip Refill
**PUT** `/api/v1/patient/refills/:id/skip`

Skip a pending refill request. This marks the refill as skipped and records the skip reason.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `id` (path) - Refill ID (MongoDB ObjectId)

**Request Body (optional):**
```json
{
  "skipReason": "Not needed at this time",
  "notes": "Will request later if needed"
}
```

**Optional Fields:**
- `skipReason` - Reason for skipping the refill (max 500 characters)
- `notes` - Additional notes about skipping (max 500 characters)

**Response:**
```json
{
  "success": true,
  "message": "Refill skipped successfully",
  "data": {
    "_id": "refill_id",
    "refillNumber": "REF-1737123456789-0001",
    "status": "skipped",
    "skippedDate": "2025-01-15T11:00:00.000Z",
    "skipReason": "Not needed at this time",
    "medicine": {
      "_id": "65a1b2c3d4e5f6789012345h",
      "productName": "Cetaphil Gentle Skin Cleanser 250ml",
      "brand": "Cetaphil",
      "salePrice": 122.89
    },
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Cannot skip refill (not in pending status)
- `401` - Unauthorized
- `404` - Refill not found

**Notes:**
- Only refills with status `pending` can be skipped
- Skipped refills are marked with status `skipped` and `skippedDate` is automatically set
- Once a refill is skipped, it cannot be reactivated - patient must create a new refill request if needed

---

#### Cancel Refill
**PUT** `/api/v1/patient/refills/:id/cancel`

Cancel a pending refill request. Only pending refills can be cancelled.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `id` (path) - Refill ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Refill cancelled successfully",
  "data": {
    "_id": "refill_id",
    "refillNumber": "REF-1737123456789-0001",
    "status": "cancelled",
    "cancelledDate": "2025-01-15T11:00:00.000Z",
    "medicine": {
      "_id": "65a1b2c3d4e5f6789012345h",
      "productName": "Cetaphil Gentle Skin Cleanser 250ml",
      "brand": "Cetaphil",
      "salePrice": 122.89
    },
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Cannot cancel refill (not in pending status)
- `401` - Unauthorized
- `404` - Refill not found

**Notes:**
- Only refills with status `pending` can be cancelled
- Once approved, rejected, completed, or skipped, refills cannot be cancelled by patient
- `cancelledDate` is automatically set when refill is cancelled

---

#### Create Order from Refills (Checkout)
**POST** `/api/v1/patient/refills/checkout`

Create an order from multiple approved refill requests. This is the checkout process for refills. Only approved refills can be converted to orders. Frontend can show checkboxes for multiple approved refills, and only checked/selected refills will be ordered.

**Headers:** `Authorization: Bearer <patient_token>`

**Request Body (Frontend JSON - According to Address Form):**
```json
{
  "selectedRefillIds": [
    "65a1b2c3d4e5f6789012345a",
    "65a1b2c3d4e5f6789012345b",
    "65a1b2c3d4e5f6789012345c"
  ],
  "shippingAddress": {
    "firstName": "Alex",
    "lastName": "Driver",
    "email": "username@gmail.com",
    "emailAddress": "username@gmail.com",
    "streetAddress1": "123 Main Street",
    "streetAddress2": "Apt 4B",
    "state": "California",
    "stateProvince": "California",
    "city": "San Diego",
    "zipCode": "22434",
    "postalCode": "22434",
    "phone": "+ 123 987654321",
    "phoneNumber": "+123987654321",
    "countryCode": "+1",
    "country": "USA"
  },
  "billingAddressSameAsShipping": true,
  "shippingCharges": 10.00,
  "tax": 0.98,
  "discount": 0,
  "notes": "Please deliver before 5 PM",
  "orderComment": "Type here...",
  "createAccount": false
}
```

**Required Fields:**
- `selectedRefillIds` - Array of refill IDs (MongoDB ObjectIds) that are checked/selected by user (required, at least one)
  - These are the refill IDs from approved refills that user has checked/selected via checkboxes
  - Example: `["65a1b2c3d4e5f6789012345a", "65a1b2c3d4e5f6789012345b"]`
- `shippingAddress` - Shipping address object (required)
  - `firstName` - First Name (required)
  - `lastName` - Last Name (required)
  - `city` - City (required)
  - `email` or `emailAddress` - Email Address (optional)
  - `phone` or `phoneNumber` - Phone Number (optional)
  - `streetAddress1` or `addressLine1` - Street Address Line 1 (optional)
  - `streetAddress2` or `addressLine2` - Street Address Line 2 (optional)
  - `state` or `stateProvince` - State/Province (optional)
  - `zipCode` or `postalCode` or `zip` - Zip/Postal Code (optional)
  - `countryCode` - Country Code (optional, auto-extracted from phone if starts with +)
  - `country` - Country (optional, default: "USA")

**Optional Fields:**
- `billingAddressSameAsShipping` - Boolean (default: true) - "My billing and shipping address are the same" checkbox
  - If `true` (checked): Billing address is automatically set to shipping address internally
  - If `false` (unchecked): Billing address is still set to shipping address (only shipping address is accepted in request)
- `shippingCharges` - Shipping charges (default: 10.00)
- `tax` - Tax amount (default: 2% of subtotal)
- `discount` - Discount amount (default: 0)
- `notes` or `orderComment` - Order notes/comment (optional)
- `createAccount` - Boolean (default: false) - "Create an account for later use" checkbox

**Response:**
```json
{
  "success": true,
  "message": "Order created from refill successfully",
  "data": {
    "_id": "order_id",
    "orderNumber": "ORD-1737123456789-1234",
    "patient": "patient_id",
    "items": [
      {
        "_id": "item_id",
        "productId": "65a1b2c3d4e5f6789012345h",
        "productType": "medication",
        "medicationName": "Cetaphil Gentle Skin Cleanser 250ml",
        "brand": "Cetaphil",
        "originalPrice": 150.00,
        "salePrice": 122.89,
        "images": {
          "thumbnail": "https://example.com/images/cetaphil-thumb.jpg",
          "gallery": []
        },
        "description": "Gentle skin cleanser for sensitive skin",
        "dosage": "250ml",
        "quantity": 1,
        "unitPrice": 122.89,
        "totalPrice": 122.89,
        "status": "ordered",
        "isSaved": false,
        "product": {
          "_id": "65a1b2c3d4e5f6789012345h",
          "productName": "Cetaphil Gentle Skin Cleanser 250ml",
          "brand": "Cetaphil",
          "salePrice": 122.89,
          "stock": 100,
          "status": "in_stock"
        }
      }
    ],
    "shippingAddress": {
      "_id": "address_id",
      "firstName": "Alex",
      "lastName": "Driver",
      "email": "username@gmail.com",
      "phoneNumber": "+123 987654321",
      "addressLine1": "123 Main Street",
      "addressLine2": "Apt 4B",
      "city": "San Diego",
      "state": "California",
      "postalCode": "22434",
      "country": "USA"
    },
    "billingAddress": {
      "firstName": "Alex",
      "lastName": "Driver",
      "email": "username@gmail.com",
      "phoneNumber": "+123 987654321",
      "streetAddress": "123 Main Street",
      "city": "San Diego",
      "state": "California",
      "zipCode": "22434"
    },
    "billingAddressSameAsShipping": true,
    "subtotal": 122.89,
    "shippingCharges": 10.00,
    "tax": 2.45,
    "discount": 0,
    "totalAmount": 135.34,
    "status": "pending",
    "paymentStatus": "pending",
    "notes": "Refill order for multiple medications. Please deliver before 5 PM",
    "refills": [
      {
        "refillNumber": "REF-1737123456789-0001",
        "refillId": "65a1b2c3d4e5f6789012345a",
        "medicationName": "Cetaphil Gentle Skin Cleanser 250ml"
      },
      {
        "refillNumber": "REF-1737123456789-0002",
        "refillId": "65a1b2c3d4e5f6789012345b",
        "medicationName": "Paracetamol 500mg"
      }
    ],
    "createdAt": "2025-01-15T12:00:00.000Z",
    "updatedAt": "2025-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed, no refills selected, refill not approved, or medicine no longer available
- `401` - Unauthorized
- `404` - No approved refills found

**Notes:**
- **Multiple Selected Refills**: Frontend shows checkboxes for all approved refills. User selects which refills to order. Only checked refill IDs should be sent in `selectedRefillIds` array.
- **Only approved refills** can be converted to orders (refill status must be `approved`)
- All selected refills must belong to the logged-in patient
- Medicine must still be available (active, visible, in stock) for all selected refills
- Order is created with current medicine prices (not refill prices)
- All selected refill statuses are automatically updated to `completed` and linked to the order
- **Only Shipping Address Required**: Only `shippingAddress` is required in the request. Billing address is handled internally.
- **Billing Address Checkbox**: 
  - `billingAddressSameAsShipping: true` (default) - "My billing and shipping address are the same" checkbox checked
  - If checked, billing address is automatically set to shipping address internally
  - If unchecked, billing address is still set to shipping address (only shipping address is accepted)
- **Address Form Fields**: API accepts exact field names from the address form:
  - `firstName`, `lastName` (required)
  - `email` or `emailAddress`
  - `streetAddress1` or `addressLine1` (for street address line 1)
  - `streetAddress2` or `addressLine2` (for street address line 2)
  - `state` or `stateProvince` (for State/Province dropdown)
  - `city` (required)
  - `zipCode` or `postalCode` or `zip`
  - `phone` or `phoneNumber`
- **Checkbox Fields**:
  - `billingAddressSameAsShipping: true` - "My billing and shipping address are the same" (default: true, checked)
  - `createAccount: false` - "Create an account for later use" (default: false, unchecked)
- Phone number is automatically cleaned (spaces removed)
- Country code is auto-extracted from phone if it starts with +
- Tax is calculated as 2% of subtotal by default
- Shipping charges default to $10.00
- **Frontend Flow**:
  1. Get all approved refills for patient: `GET /api/v1/patient/refills?status=approved`
  2. Show checkboxes for each approved refill
  3. User selects which refills to order (checks checkboxes)
  4. Send selected refill IDs in `selectedRefillIds` array along with shipping address and checkbox values

---

#### Get All Refill Orders
**GET** `/api/v1/patient/refills/orders?status=delivered&paymentStatus=paid&page=1&limit=10&startDate=2025-01-01&endDate=2025-01-31`

Get all orders that were created from refills. Only returns orders that have refills linked to them.

**Headers:** `Authorization: Bearer <patient_token>`

**Query Parameters:**
- `status` (optional) - Filter by order status: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `returned`
- `paymentStatus` (optional) - Filter by payment status: `pending`, `paid`, `failed`, `refunded`
- `startDate` (optional) - Filter orders from this date (ISO 8601 format: `YYYY-MM-DD`)
- `endDate` (optional) - Filter orders until this date (ISO 8601 format: `YYYY-MM-DD`)
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10, max: 100)

**Response:**
```json
{
  "success": true,
  "message": "Refill orders retrieved successfully",
  "data": [
    {
      "_id": "order_id",
      "orderNumber": "ORD-1737123456789-1234",
      "patient": "patient_id",
      "items": [
        {
          "_id": "item_id",
          "productId": "65a1b2c3d4e5f6789012345h",
          "productType": "medication",
          "medicationName": "Cetaphil Gentle Skin Cleanser 250ml",
          "brand": "Cetaphil",
          "originalPrice": 150.00,
          "salePrice": 122.89,
          "images": {
            "thumbnail": "https://example.com/images/cetaphil-thumb.jpg",
            "gallery": []
          },
          "description": "Gentle skin cleanser for sensitive skin",
          "quantity": 1,
          "unitPrice": 122.89,
          "totalPrice": 122.89,
          "status": "ordered",
          "isSaved": false,
          "product": {
            "_id": "65a1b2c3d4e5f6789012345h",
            "productName": "Cetaphil Gentle Skin Cleanser 250ml",
            "brand": "Cetaphil",
            "salePrice": 122.89,
            "stock": 100,
            "status": "in_stock"
          }
        }
      ],
      "shippingAddress": {
        "_id": "address_id",
        "firstName": "Alex",
        "lastName": "Driver",
        "email": "username@gmail.com",
        "phoneNumber": "+123 987654321",
        "addressLine1": "123 Main Street",
        "addressLine2": "Apt 4B",
        "city": "San Diego",
        "state": "California",
        "postalCode": "22434",
        "country": "USA"
      },
      "billingAddress": {
        "firstName": "Alex",
        "lastName": "Driver",
        "email": "username@gmail.com",
        "phoneNumber": "+123 987654321",
        "streetAddress": "123 Main Street",
        "city": "San Diego",
        "state": "California",
        "zipCode": "22434"
      },
      "billingAddressSameAsShipping": true,
      "subtotal": 122.89,
      "shippingCharges": 10.00,
      "tax": 2.45,
      "discount": 0,
      "totalAmount": 135.34,
      "status": "delivered",
      "paymentStatus": "paid",
      "notes": "Refill order for multiple medications",
      "refills": [
        {
          "_id": "refill_id_1",
          "refillNumber": "REF-1737123456789-0001",
          "medicationName": "Cetaphil Gentle Skin Cleanser 250ml",
          "quantity": 1,
          "dosage": "250ml",
          "frequency": "Once daily",
          "instructions": "Apply to face and rinse",
          "status": "completed",
          "requestedDate": "2025-01-10T10:00:00.000Z",
          "completedDate": "2025-01-15T12:00:00.000Z",
          "medicine": {
            "_id": "65a1b2c3d4e5f6789012345h",
            "productName": "Cetaphil Gentle Skin Cleanser 250ml",
            "brand": "Cetaphil",
            "salePrice": 122.89,
            "stock": 100,
            "status": "in_stock"
          }
        },
        {
          "_id": "refill_id_2",
          "refillNumber": "REF-1737123456789-0002",
          "medicationName": "Paracetamol 500mg",
          "quantity": 2,
          "dosage": "500mg",
          "frequency": "Twice daily",
          "instructions": "Take with water",
          "status": "completed",
          "requestedDate": "2025-01-10T10:00:00.000Z",
          "completedDate": "2025-01-15T12:00:00.000Z",
          "medicine": {
            "_id": "65a1b2c3d4e5f6789012345i",
            "productName": "Paracetamol 500mg",
            "brand": "Generic",
            "salePrice": 25.00,
            "stock": 200,
            "status": "in_stock"
          }
        }
      ],
      "createdAt": "2025-01-15T12:00:00.000Z",
      "updatedAt": "2025-01-20T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

**Error Responses:**
- `401` - Unauthorized

**Notes:**
- Only returns orders that have refills linked to them (orders created from refills)
- Each order includes all linked refills with full details
- Order items are populated with current product details
- Supports filtering by order status, payment status, and date range
- Supports pagination

---

#### Get Refill Order by ID
**GET** `/api/v1/patient/refills/orders/:id`

Get a specific refill order by its ID. Only returns orders that have refills linked to them.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `id` (path) - Order ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Refill order retrieved successfully",
  "data": {
    "_id": "order_id",
    "orderNumber": "ORD-1737123456789-1234",
    "patient": "patient_id",
    "items": [
      {
        "_id": "item_id",
        "productId": "65a1b2c3d4e5f6789012345h",
        "productType": "medication",
        "medicationName": "Cetaphil Gentle Skin Cleanser 250ml",
        "brand": "Cetaphil",
        "originalPrice": 150.00,
        "salePrice": 122.89,
        "images": {
          "thumbnail": "https://example.com/images/cetaphil-thumb.jpg",
          "gallery": []
        },
        "description": "Gentle skin cleanser for sensitive skin",
        "quantity": 1,
        "unitPrice": 122.89,
        "totalPrice": 122.89,
        "status": "ordered",
        "isSaved": false,
        "product": {
          "_id": "65a1b2c3d4e5f6789012345h",
          "productName": "Cetaphil Gentle Skin Cleanser 250ml",
          "brand": "Cetaphil",
          "salePrice": 122.89,
          "stock": 100,
          "status": "in_stock"
        }
      }
    ],
    "shippingAddress": {
      "_id": "address_id",
      "firstName": "Alex",
      "lastName": "Driver",
      "email": "username@gmail.com",
      "phoneNumber": "+123 987654321",
      "addressLine1": "123 Main Street",
      "addressLine2": "Apt 4B",
      "city": "San Diego",
      "state": "California",
      "postalCode": "22434",
      "country": "USA"
    },
    "billingAddress": {
      "firstName": "Alex",
      "lastName": "Driver",
      "email": "username@gmail.com",
      "phoneNumber": "+123 987654321",
      "streetAddress": "123 Main Street",
      "city": "San Diego",
      "state": "California",
      "zipCode": "22434"
    },
    "billingAddressSameAsShipping": true,
    "subtotal": 122.89,
    "shippingCharges": 10.00,
    "tax": 2.45,
    "discount": 0,
    "totalAmount": 135.34,
    "status": "delivered",
    "paymentStatus": "paid",
    "notes": "Refill order for multiple medications",
    "refills": [
      {
        "_id": "refill_id_1",
        "refillNumber": "REF-1737123456789-0001",
        "medicationName": "Cetaphil Gentle Skin Cleanser 250ml",
        "quantity": 1,
        "dosage": "250ml",
        "frequency": "Once daily",
        "instructions": "Apply to face and rinse",
        "status": "completed",
        "requestedDate": "2025-01-10T10:00:00.000Z",
        "approvedDate": "2025-01-12T10:00:00.000Z",
        "completedDate": "2025-01-15T12:00:00.000Z",
        "notes": "Monthly refill",
        "autoRefill": true,
        "autoRefillFrequency": "monthly",
        "medicine": {
          "_id": "65a1b2c3d4e5f6789012345h",
          "productName": "Cetaphil Gentle Skin Cleanser 250ml",
          "brand": "Cetaphil",
          "salePrice": 122.89,
          "stock": 100,
          "status": "in_stock",
          "healthCategory": {
            "_id": "category_id",
            "name": "Skincare",
            "slug": "skincare"
          },
          "healthTypeSlug": "sensitive-skin"
        }
      }
    ],
    "createdAt": "2025-01-15T12:00:00.000Z",
    "updatedAt": "2025-01-20T14:30:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - Order not found or order is not a refill order

**Notes:**
- Only returns orders that have refills linked to them
- Returns 404 if the order exists but has no linked refills (not a refill order)
- Includes all refill details with full medicine information
- Order items are populated with current product details

---

### Support System (Patient)

Support system with Firebase integration for real-time messaging between patients and support team.

#### Create Support Query
**POST** `/api/v1/patient/support-queries`

Create a new support query. This will create a MongoDB record and a Firebase chat for real-time messaging.

**Headers:** `Authorization: Bearer <patient_token>`

**Request Body:**
```json
{
  "message": "I need help with my recent order. The delivery was delayed.",
  "subject": "Order Delivery Issue",
  "priority": "high",
  "category": "order",
  "tags": ["delivery", "order-12345"]
}
```

**Required Fields:**
- `message` - Support message (1-5000 characters)

**Optional Fields:**
- `subject` - Query subject (max 200 characters, default: "General Inquiry")
- `priority` - Priority level: `low`, `medium`, `high`, `urgent` (default: `medium`)
- `category` - Category: `general`, `order`, `payment`, `refund`, `technical`, `medication`, `prescription`, `other` (default: `general`)
- `tags` - Array of tags for categorization

**Response:**
```json
{
  "success": true,
  "message": "Support query created successfully",
  "data": {
    "_id": "query_id",
    "queryNumber": "Q-2025-1047",
    "patient": {
      "_id": "patient_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "subject": "Order Delivery Issue",
    "message": "I need help with my recent order. The delivery was delayed.",
    "status": "open",
    "priority": "high",
    "category": "order",
    "tags": ["delivery", "order-12345"],
    "firebaseChatId": "query_id",
    "messageCount": 1,
    "lastMessage": {
      "text": "I need help with my recent order. The delivery was delayed.",
      "sender": "patient",
      "timestamp": "2025-01-15T10:30:00.000Z"
    },
    "isReadByPatient": true,
    "isReadBySupport": false,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed
- `401` - Unauthorized
- `404` - Patient profile not found

**Notes:**
- Creates a unique query number (format: `Q-YYYY-XXXX`)
- Automatically creates a Firebase chat for real-time messaging
- Query status is set to `open` by default
- First message is automatically added to the chat

---

#### Get All Support Queries
**GET** `/api/v1/patient/support-queries?status=open&category=order&priority=high&page=1&limit=10`

Get all support queries for the logged-in patient.

**Headers:** `Authorization: Bearer <patient_token>`

**Query Parameters:**
- `status` (optional) - Filter by status: `open`, `in_progress`, `resolved`, `closed`
- `category` (optional) - Filter by category: `general`, `order`, `payment`, `refund`, `technical`, `medication`, `prescription`, `other`
- `priority` (optional) - Filter by priority: `low`, `medium`, `high`, `urgent`
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10, max: 100)

**Response:**
```json
{
  "success": true,
  "message": "Support queries retrieved successfully",
  "data": [
    {
      "_id": "query_id",
      "queryNumber": "Q-2025-1047",
      "patient": {
        "_id": "patient_id",
        "firstName": "John",
        "lastName": "Doe"
      },
      "subject": "Order Delivery Issue",
      "message": "I need help with my recent order...",
      "status": "open",
      "priority": "high",
      "category": "order",
      "tags": ["delivery"],
      "firebaseChatId": "query_id",
      "messageCount": 5,
      "lastMessage": {
        "text": "Thank you for your response.",
        "sender": "patient",
        "timestamp": "2025-01-15T11:00:00.000Z"
      },
      "isReadByPatient": true,
      "isReadBySupport": false,
      "assignedTo": null,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T11:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

**Error Responses:**
- `401` - Unauthorized

---

#### Get Support Query by ID
**GET** `/api/v1/patient/support-queries/:id`

Get a specific support query with all messages from Firebase.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `id` (path) - Support query ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Support query retrieved successfully",
  "data": {
    "_id": "query_id",
    "queryNumber": "Q-2025-1047",
    "patient": {
      "_id": "patient_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "subject": "Order Delivery Issue",
    "message": "I need help with my recent order. The delivery was delayed.",
    "status": "open",
    "priority": "high",
    "category": "order",
    "tags": ["delivery", "order-12345"],
    "firebaseChatId": "query_id",
    "messageCount": 5,
    "lastMessage": {
      "text": "Thank you for your response.",
      "sender": "patient",
      "timestamp": "2025-01-15T11:00:00.000Z"
    },
    "isReadByPatient": true,
    "isReadBySupport": false,
    "assignedTo": null,
    "messages": [
      {
        "id": "1737123456789",
        "text": "I need help with my recent order. The delivery was delayed.",
        "sender": "patient",
        "senderId": "user_id",
        "senderName": "John Doe",
        "timestamp": "2025-01-15T10:30:00.000Z",
        "read": true
      },
      {
        "id": "1737123500000",
        "text": "Hello John! I'd be happy to help you with that. Can you tell me more about the intended use and any specific requirements?",
        "sender": "support",
        "senderId": "admin_id",
        "senderName": "Support System",
        "timestamp": "2025-01-15T10:35:00.000Z",
        "read": true
      },
      {
        "id": "1737123600000",
        "text": "It will be used for Wedding Event. I need overhead chairs and good tablecloths.",
        "sender": "patient",
        "senderId": "user_id",
        "senderName": "John Doe",
        "timestamp": "2025-01-15T10:40:00.000Z",
        "read": true
      },
      {
        "id": "1737123700000",
        "text": "Perfect! I've prepared a detailed proposal for you. Please review the attached document.",
        "sender": "support",
        "senderId": "admin_id",
        "senderName": "Support System",
        "timestamp": "2025-01-15T10:45:00.000Z",
        "read": true
      },
      {
        "id": "1737123800000",
        "text": "Thank you for your response.",
        "sender": "patient",
        "senderId": "user_id",
        "senderName": "John Doe",
        "timestamp": "2025-01-15T11:00:00.000Z",
        "read": true
      }
    ],
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - Support query not found

**Notes:**
- Returns all messages from Firebase chat
- Messages are sorted by timestamp (oldest first)
- Each message includes sender information and read status

---

#### Send Message to Support Query
**POST** `/api/v1/patient/support-queries/:id/messages`

Send a message to an existing support query. Message is stored in Firebase for real-time updates.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `id` (path) - Support query ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "message": "Thank you for your response. I have reviewed the proposal."
}
```

**Required Fields:**
- `message` - Message text (1-5000 characters)

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "messageId": "1737123900000",
    "text": "Thank you for your response. I have reviewed the proposal.",
    "sender": "patient",
    "senderId": "user_id",
    "senderName": "John Doe",
    "timestamp": "2025-01-15T11:15:00.000Z",
    "read": false
  }
}
```

**Error Responses:**
- `400` - Validation failed or query is closed
- `401` - Unauthorized
- `404` - Support query not found
- `500` - Firebase chat not available

**Notes:**
- Message is stored in Firebase Realtime Database
- If query status is `resolved`, it will be automatically reopened
- Message count is incremented in MongoDB
- Last message is updated in both MongoDB and Firebase

---

#### Mark Messages as Read
**PUT** `/api/v1/patient/support-queries/:id/read`

Mark all support team messages as read for the patient.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `id` (path) - Support query ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Messages marked as read",
  "data": {
    "message": "Messages marked as read"
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - Support query not found

**Notes:**
- Marks all support team messages as read in Firebase
- Updates `isReadByPatient` status in MongoDB

---

#### Close Support Query
**PUT** `/api/v1/patient/support-queries/:id/close`

Close a support query. Once closed, no new messages can be sent.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `id` (path) - Support query ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Support query closed successfully",
  "data": {
    "_id": "query_id",
    "queryNumber": "Q-2025-1047",
    "status": "closed",
    "closedAt": "2025-01-15T12:00:00.000Z",
    "closedBy": {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe"
    },
    "updatedAt": "2025-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Query is already closed
- `401` - Unauthorized
- `404` - Support query not found

**Notes:**
- Updates query status to `closed` in MongoDB
- Updates Firebase chat status to `closed`
- Sets `closedAt` timestamp and `closedBy` user
- Once closed, no new messages can be sent

---

**Firebase Configuration:**

To enable Firebase integration, add the following environment variables to your `.env` file:

```env
# Firebase Configuration (Option 1: Environment Variables)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com

# OR

# Firebase Configuration (Option 2: Service Account File Path)
FIREBASE_SERVICE_ACCOUNT_PATH=./path/to/serviceAccountKey.json
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
```

**Firebase Database Structure:**
```
support-chats/
  {queryId}/
    queryId: "query_id"
    queryNumber: "Q-2025-1047"
    patientId: "patient_id"
    patientName: "John Doe"
    status: "open"
    createdAt: "2025-01-15T10:30:00.000Z"
    updatedAt: "2025-01-15T11:00:00.000Z"
    lastMessage: { ... }
    messages/
      {timestamp1}: { text, sender, senderId, senderName, timestamp, read }
      {timestamp2}: { text, sender, senderId, senderName, timestamp, read }
      ...
```

**Notes:**
- If Firebase is not configured, the system will work with MongoDB only (messages won't be stored in Firebase)
- Firebase enables real-time messaging and updates
- All queries are stored in MongoDB for persistence and querying
- Firebase chat ID is the same as the MongoDB query ID for easy reference

---

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

---

#### Submit Consultation (Book Consultation)
**POST** `/api/v1/patient/intake-form/submit`

Submit the completed intake form to book a consultation with a specific doctor. This changes the form status from `draft` to `submitted` and assigns it to the selected doctor, making it visible to that doctor as a pending consultation.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "doctorId": "doctor_id_here"
}
```

**Required Fields:**
- `doctorId` - MongoDB ObjectId of the doctor to book consultation with

**Prerequisites:**
- All three sections must be completed:
  - Basic Information (`isBasicInfoComplete: true`)
  - Emergency Contact (`isEmergencyContactComplete: true`)
  - Medical Questions (`isMedicalQuestionsComplete: true`)
- Doctor must exist and be active

**Response:**
```json
{
  "success": true,
  "message": "Consultation submitted successfully. Your consultation request has been sent to the doctor.",
  "data": {
    "_id": "intake_form_id",
    "patient": "patient_id",
    "basicInformation": {
      "firstName": "John",
      "lastName": "Doe",
      "isBasicInfoComplete": true
    },
    "emergencyContact": {
      "isEmergencyContactComplete": true
    },
    "medicalQuestions": {
      "isMedicalQuestionsComplete": true
    },
    "status": "submitted",
    "doctor": "doctor_id",
    "createdAt": "2025-12-30T10:46:43.794Z",
    "updatedAt": "2026-01-03T11:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed:
  - `"Doctor ID is required to submit consultation."` - doctorId is missing
  - `"Please complete all sections of the intake form before submitting."` - One or more sections are incomplete
  - `"Consultation has already been submitted."` - Form is already submitted
  - `"Selected doctor is not available for consultations."` - Doctor is inactive or suspended
- `401` - Unauthorized (missing or invalid token)
- `404` - Intake form not found or Doctor not found

**Notes:**
- Once submitted, the consultation appears in the selected doctor's consultation list with status `pending`
- Status changes from `draft` to `submitted`
- Doctor is assigned to the consultation when submitted
- Cannot submit if any section is incomplete
- Cannot submit the same form twice (will return error if already submitted)
- Doctor must be active and available (status: `active`, `isActive: true`)
- After submission, only the assigned doctor can view and review the consultation
- Patient can still view their submitted form but cannot edit it (status is `submitted`)

**Consultation Booking Flow:**
1. Patient fills Basic Information → `POST /patient/intake-form/basic-information`
2. Patient fills Emergency Contact → `POST /patient/intake-form/emergency-contact`
3. Patient fills Medical Questions → `POST /patient/intake-form/medical-questions`
4. Patient submits consultation → `POST /patient/intake-form/submit`
5. Consultation appears in doctor's list → `GET /doctor/consultations?status=pending`

---

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

### Shopping Cart APIs

Complete CRUD operations for managing shopping cart items before checkout.

#### Get Cart
**GET** `/api/v1/patient/cart`

Get the current user's shopping cart with all items, totals, and applied coupons.

**Headers:** `Authorization: Bearer <patient_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "cart_id",
    "patient": "patient_id",
    "items": [
      {
        "_id": "cart_item_id_1",
        "productId": "65a1b2c3d4e5f6789012345c",
        "productName": "Amoxicillin",
        "productImage": "https://example.com/images/amoxicillin-thumb.jpg",
        "productType": "medication",
        "quantity": 2,
        "unitPrice": 15.99,
        "totalPrice": 31.98,
        "isSaved": false
      },
      {
        "_id": "cart_item_id_2",
        "productId": "65a1b2c3d4e5f6789012345d",
        "productName": "Paracetamol",
        "productImage": "https://example.com/images/paracetamol-thumb.jpg",
        "productType": "medication",
        "quantity": 1,
        "unitPrice": 25.50,
        "totalPrice": 25.50,
        "isSaved": false
      }
    ],
    "subtotal": 57.48,
    "discount": 5.75,
    "tax": 1.72,
    "shippingCharges": 10.00,
    "totalAmount": 63.45,
    "couponCode": "SAVE10",
    "createdAt": "2025-01-10T10:00:00.000Z",
    "updatedAt": "2025-01-15T14:30:00.000Z"
  }
}
```

**Notes:**
- Cart is automatically created if it doesn't exist
- Items array is always returned (empty array if cart is empty)
- Tax is automatically calculated (3% of subtotal)
- Shipping charges default to ₹10.00
- Saved items (`isSaved: true`) are included in the response but not in checkout calculations

---

#### Add to Cart
**POST** `/api/v1/patient/cart/items`

Add a product/medicine to the shopping cart. If the item already exists, the quantity will be increased.

**Headers:** `Authorization: Bearer <patient_token>`

**Request Body:**
```json
{
  "productId": "65a1b2c3d4e5f6789012345c",
  "productName": "Amoxicillin",
  "productImage": "https://example.com/images/amoxicillin-thumb.jpg",
  "productType": "medication",
  "quantity": 2,
  "unitPrice": 15.99
}
```

**Required Fields:**
- `productId` - **Medicine ID from Medicine collection** (MongoDB ObjectId) - This must be the actual `_id` from the Medicine model
- `productName` - Product/Medicine name (string)
- `unitPrice` - Price per unit (number, min: 0)

**Optional Fields:**
- `quantity` - Quantity to add (default: 1, min: 1)
- `productImage` - Product image URL (string)
- `productType` - Type: `medication`, `doctors_note`, or `other` (default: `medication`)

**Response:**
```json
{
  "success": true,
  "message": "Item added to cart successfully",
  "data": {
    "_id": "cart_id",
    "patient": "patient_id",
    "items": [
      {
        "_id": "cart_item_id_1",
        "productId": "65a1b2c3d4e5f6789012345c",
        "productName": "Amoxicillin",
        "productImage": "https://example.com/images/amoxicillin-thumb.jpg",
        "productType": "medication",
        "quantity": 2,
        "unitPrice": 15.99,
        "totalPrice": 31.98,
        "isSaved": false
      }
    ],
    "subtotal": 31.98,
    "discount": 0,
    "tax": 0.96,
    "shippingCharges": 10.00,
    "totalAmount": 42.94,
    "couponCode": null,
    "createdAt": "2025-01-10T10:00:00.000Z",
    "updatedAt": "2025-01-15T14:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed (missing required fields, invalid productId, invalid price, etc.)
- `401` - Unauthorized
- `404` - Patient profile not found

**Notes:**
- **Product ID**: Must be a valid MongoDB ObjectId from the Medicine collection
- **Duplicate Items**: If the same `productId` and `productType` already exists in cart, quantity is increased instead of adding a new item
- **Auto Calculations**: Tax (3%) and shipping charges (₹10.00) are automatically calculated
- **Cart Creation**: Cart is automatically created if it doesn't exist for the patient

---

#### Update Item Quantity
**PUT** `/api/v1/patient/cart/items/:itemId/quantity`

Update the quantity of a specific item in the cart. If quantity is set to 0 or less, the item is removed from cart.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `itemId` (path) - Cart item ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "quantity": 3
}
```

**Required Fields:**
- `quantity` - New quantity (integer, min: 1). If set to 0 or less, item will be removed.

**Response:**
```json
{
  "success": true,
  "message": "Quantity updated",
  "data": {
    "_id": "cart_id",
    "patient": "patient_id",
    "items": [
      {
        "_id": "cart_item_id_1",
        "productId": "65a1b2c3d4e5f6789012345c",
        "productName": "Amoxicillin",
        "productImage": "https://example.com/images/amoxicillin-thumb.jpg",
        "productType": "medication",
        "quantity": 3,
        "unitPrice": 15.99,
        "totalPrice": 47.97,
        "isSaved": false
      }
    ],
    "subtotal": 47.97,
    "discount": 0,
    "tax": 1.44,
    "shippingCharges": 10.00,
    "totalAmount": 59.41,
    "couponCode": null,
    "updatedAt": "2025-01-15T14:35:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid quantity or validation failed
- `401` - Unauthorized
- `404` - Cart not found or item not found in cart

**Notes:**
- If quantity is set to 0 or negative, the item is automatically removed from cart
- Cart totals are automatically recalculated after quantity update
- If cart becomes empty after update, coupon and discount are cleared

---

#### Remove Item from Cart
**DELETE** `/api/v1/patient/cart/items/:itemId`

Remove a specific item from the shopping cart.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `itemId` (path) - Cart item ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Item removed from cart",
  "data": {
    "_id": "cart_id",
    "patient": "patient_id",
    "items": [
      {
        "_id": "cart_item_id_2",
        "productId": "65a1b2c3d4e5f6789012345d",
        "productName": "Paracetamol",
        "productImage": "https://example.com/images/paracetamol-thumb.jpg",
        "productType": "medication",
        "quantity": 1,
        "unitPrice": 25.50,
        "totalPrice": 25.50,
        "isSaved": false
      }
    ],
    "subtotal": 25.50,
    "discount": 0,
    "tax": 0.77,
    "shippingCharges": 10.00,
    "totalAmount": 36.27,
    "couponCode": null,
    "updatedAt": "2025-01-15T14:40:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - Cart not found or item not found

**Notes:**
- If cart becomes empty after removal, coupon and discount are automatically cleared
- Cart totals are automatically recalculated

---

#### Clear Cart
**DELETE** `/api/v1/patient/cart`

Remove all items from the shopping cart and clear applied coupons.

**Headers:** `Authorization: Bearer <patient_token>`

**Response:**
```json
{
  "success": true,
  "message": "Cart cleared successfully",
  "data": {
    "_id": "cart_id",
    "patient": "patient_id",
    "items": [],
    "subtotal": 0,
    "discount": 0,
    "tax": 0,
    "shippingCharges": 0,
    "totalAmount": 0,
    "couponCode": null,
    "updatedAt": "2025-01-15T14:45:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - Cart not found

**Notes:**
- Removes all items from cart (including saved items)
- Clears applied coupon code
- Resets all totals to 0
- Cart document is not deleted, only cleared

---

#### Save Item for Later
**POST** `/api/v1/patient/cart/items/:itemId/save`

Mark a cart item as "saved for later". Saved items are not included in checkout calculations but remain in the cart.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `itemId` (path) - Cart item ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Item saved for later",
  "data": {
    "_id": "cart_id",
    "patient": "patient_id",
    "items": [
      {
        "_id": "cart_item_id_1",
        "productId": "65a1b2c3d4e5f6789012345c",
        "productName": "Amoxicillin",
        "productImage": "https://example.com/images/amoxicillin-thumb.jpg",
        "productType": "medication",
        "quantity": 2,
        "unitPrice": 15.99,
        "totalPrice": 31.98,
        "isSaved": true
      }
    ],
    "subtotal": 0,
    "discount": 0,
    "tax": 0,
    "shippingCharges": 0,
    "totalAmount": 0,
    "couponCode": null,
    "updatedAt": "2025-01-15T14:50:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - Cart not found or item not found

**Notes:**
- Saved items (`isSaved: true`) are not included in subtotal, tax, or total calculations
- Saved items remain in cart and can be moved back to active cart later
- If all items are saved, cart totals become 0

---

#### Unsave Item (Move Back to Cart)
**DELETE** `/api/v1/patient/cart/items/:itemId/save`

Move a saved item back to the active cart. This will include the item in checkout calculations again.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `itemId` (path) - Cart item ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Item moved back to cart",
  "data": {
    "_id": "cart_id",
    "patient": "patient_id",
    "items": [
      {
        "_id": "cart_item_id_1",
        "productId": "65a1b2c3d4e5f6789012345c",
        "productName": "Amoxicillin",
        "productImage": "https://example.com/images/amoxicillin-thumb.jpg",
        "productType": "medication",
        "quantity": 2,
        "unitPrice": 15.99,
        "totalPrice": 31.98,
        "isSaved": false
      }
    ],
    "subtotal": 31.98,
    "discount": 0,
    "tax": 0.96,
    "shippingCharges": 10.00,
    "totalAmount": 42.94,
    "couponCode": null,
    "updatedAt": "2025-01-15T15:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Item is not saved for later (already active in cart)
- `401` - Unauthorized
- `404` - Cart not found or item not found

**Notes:**
- Moves saved item back to active cart (`isSaved: false`)
- Item will be included in subtotal, tax, and total calculations
- Cart totals are automatically recalculated after unsaving
- If item was already active (not saved), returns 400 error

---

#### Apply Coupon
**POST** `/api/v1/patient/cart/coupon`

Apply a coupon code to the cart for discount.

**Headers:** `Authorization: Bearer <patient_token>`

**Request Body:**
```json
{
  "couponCode": "SAVE10"
}
```

**Required Fields:**
- `couponCode` - Coupon code string (case-insensitive)

**Response:**
```json
{
  "success": true,
  "message": "Coupon applied successfully",
  "data": {
    "_id": "cart_id",
    "patient": "patient_id",
    "items": [
      {
        "_id": "cart_item_id_1",
        "productId": "65a1b2c3d4e5f6789012345c",
        "productName": "Amoxicillin",
        "productType": "medication",
        "quantity": 2,
        "unitPrice": 15.99,
        "totalPrice": 31.98,
        "isSaved": false
      }
    ],
    "subtotal": 31.98,
    "discount": 3.20,
    "tax": 0.86,
    "shippingCharges": 10.00,
    "totalAmount": 39.64,
    "couponCode": "SAVE10",
    "updatedAt": "2025-01-15T14:55:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid coupon code or validation failed
- `401` - Unauthorized
- `404` - Cart not found or coupon not found/invalid
- `409` - Coupon already applied or expired

**Notes:**
- Coupon code is case-insensitive
- Coupon must be valid, active, and not expired
- Discount is calculated based on coupon rules
- Only one coupon can be applied at a time
- Cart totals are automatically recalculated after coupon application

---

#### Remove Coupon
**DELETE** `/api/v1/patient/cart/coupon`

Remove the applied coupon from the cart.

**Headers:** `Authorization: Bearer <patient_token>`

**Response:**
```json
{
  "success": true,
  "message": "Coupon removed",
  "data": {
    "_id": "cart_id",
    "patient": "patient_id",
    "items": [
      {
        "_id": "cart_item_id_1",
        "productId": "65a1b2c3d4e5f6789012345c",
        "productName": "Amoxicillin",
        "productType": "medication",
        "quantity": 2,
        "unitPrice": 15.99,
        "totalPrice": 31.98,
        "isSaved": false
      }
    ],
    "subtotal": 31.98,
    "discount": 0,
    "tax": 0.96,
    "shippingCharges": 10.00,
    "totalAmount": 42.94,
    "couponCode": null,
    "updatedAt": "2025-01-15T15:00:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - Cart not found

**Notes:**
- Removes applied coupon code
- Resets discount to 0
- Cart totals are automatically recalculated

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
          "_id": "order_item_1",
          "productId": "65a1b2c3d4e5f6789012345c",
          "productType": "medication",
          "medicationName": "Amoxicillin",
          "brand": "Cetaphill",
          "originalPrice": 20.99,
          "salePrice": 15.99,
          "images": {
            "thumbnail": "https://example.com/images/amoxicillin-thumb.jpg",
            "gallery": [
              "https://example.com/images/amoxicillin-1.jpg"
            ]
          },
          "description": "Antibiotic medication used to treat various bacterial infections",
          "dosage": "Capsule - 500mg",
          "dosageOption": {
            "name": "Capsule - 500mg",
            "priceAdjustment": 0
          },
          "quantityOption": {
            "name": "20 Tablets",
            "priceAdjustment": 0
          },
          "generics": [
            "Amoxicillin Trihydrate"
          ],
          "quantity": 1,
          "unitPrice": 15.99,
          "totalPrice": 15.99,
          "status": "ordered"
        }
      ],
      "shippingAddress": {
        "_id": "address_id",
        "type": "home",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "fullName": "John Doe",
        "phoneNumber": "9876543210",
        "countryCode": "+91",
        "addressLine1": "123 Main St",
        "addressLine2": "Apt 4B",
        "city": "Pune",
        "state": "Maharashtra",
        "postalCode": "987612",
        "country": "India",
        "isDefault": true,
        "createdAt": "2025-01-10T10:00:00.000Z",
        "updatedAt": "2025-01-10T10:00:00.000Z"
      },
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

### Order Management APIs

Complete order management with unified create order API that handles all order types (cart, prescription, custom items).

#### Get All Orders
**GET** `/api/v1/patient/orders?status=pending&paymentStatus=paid&startDate=2025-01-01&endDate=2025-01-31&page=1&limit=10`

Get all orders for the logged-in patient (user) with optional filtering and pagination. Returns orders with product details populated.

**Headers:** `Authorization: Bearer <patient_token>`

**Query Parameters:**
- `status` (optional) - Filter by order status: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `returned`
- `paymentStatus` (optional) - Filter by payment status: `pending`, `paid`, `failed`, `refunded`
- `startDate` (optional) - Filter orders from this date (ISO 8601 format, e.g., `2025-01-01`)
- `endDate` (optional) - Filter orders until this date (ISO 8601 format, e.g., `2025-01-31`)
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Number of orders per page (default: 10, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "order_id_123",
      "orderNumber": "ORD202501151234567890",
      "patient": "patient_id_456",
      "items": [
        {
          "_id": "order_item_1",
          "productId": "65a1b2c3d4e5f6789012345c",
          "productType": "medication",
          "medicationName": "Cetaphil Gentle Skin Cleanser 250ml",
          "quantity": 2,
          "unitPrice": 122.89,
          "totalPrice": 245.78,
          "status": "pending",
          "product": {
            "_id": "65a1b2c3d4e5f6789012345c",
            "productName": "Cetaphil Gentle Skin Cleanser 250ml",
            "brand": "Cetaphil",
            "originalPrice": 150.00,
            "salePrice": 122.89,
            "images": {
              "thumbnail": "https://example.com/images/cetaphil-thumb.jpg",
              "gallery": []
            },
            "description": "Gentle skin cleanser",
            "generics": [],
            "category": "Skincare",
            "stock": 100,
            "status": "in_stock",
            "visibility": true,
            "isActive": true
          }
        }
      ],
      "shippingAddress": {
        "_id": "address_id",
        "type": "home",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "fullName": "John Doe",
        "phoneNumber": "9876543210",
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
      "subtotal": 737.34,
      "tax": 22.12,
      "shippingCharges": 10.00,
      "discount": 0,
      "totalAmount": 769.46,
      "status": "pending",
      "paymentStatus": "pending",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Notes:**
- Returns paginated orders for the authenticated patient/user
- Orders are sorted by creation date (newest first)
- Each item includes full product details from Medicine collection
- Shipping address is fully populated
- Billing address is included (same as shipping if `billingAddressSameAsShipping` is true)
- Pagination: Default page size is 10, maximum is 100 per page
- Pagination object includes: `total` (total orders), `page` (current page), `limit` (items per page), `pages` (total pages), `hasNext` (has next page), `hasPrev` (has previous page)

---

#### Get Order by ID
**GET** `/api/v1/patient/orders/:id`

Get a single order by ID with complete details including status and tracking information.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `id` (path) - Order ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "order_id",
    "orderNumber": "ORD202501151234567890",
    "items": [...],
    "subtotal": 737.34,
    "tax": 22.12,
    "shippingCharges": 10.00,
    "discount": 0,
    "totalAmount": 769.46,
    "status": "pending",
    "paymentStatus": "pending",
    "trackingNumber": "TRACK123456",
    "estimatedDelivery": "2025-01-20T10:00:00.000Z",
    "shippingAddress": {...},
    "billingAddress": {...},
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Note:** Status and tracking information are included in this response. No separate status/tracking endpoints needed.

#### Create Order
**POST** `/api/v1/patient/orders`

Create a new order with multiple items. This unified API handles all order types (cart, prescription, or custom items) in one endpoint.

**Headers:** `Authorization: Bearer <patient_token>`

**Request Body (Unified Format):**
```json
{
  "shippingAddress": {
    "firstName": "Alex",
    "lastName": "Driver",
    "email": "alex.driver@example.com",
    "phoneNumber": "+123 987654321",
    "countryCode": "+1",
    "addressLine1": "123 Main Street",
    "addressLine2": "Apt 4B",
    "city": "San Diego",
    "state": "California",
    "postalCode": "22434",
    "country": "USA",
    "type": "home"
  },
  "items": [
    {
      "productId": "65a1b2c3d4e5f6789012345c",
      "productType": "medication",
      "medicationName": "Cetaphil Gentle Skin Cleanser 250ml",
      "quantity": 2,
      "unitPrice": 122.89,
      "totalPrice": 245.78
    },
    {
      "productId": "65a1b2c3d4e5f6789012345d",
      "productType": "medication",
      "medicationName": "Cetaphil Gentle Skin Cleanser 350ml",
      "quantity": 2,
      "unitPrice": 122.89,
      "totalPrice": 245.78
    },
    {
      "productId": "65a1b2c3d4e5f6789012345e",
      "productType": "doctors_note",
      "medicationName": "Doctor's Note - Excuse Note",
      "quantity": 2,
      "unitPrice": 122.89,
      "totalPrice": 245.78
    }
  ],
  "subtotal": 737.34,
  "tax": 22.12,
  "shippingCharges": 10.00,
  "discount": 0,
  "totalAmount": 769.46,
  "billingAddressSameAsShipping": true,
  "orderComment": "Please deliver before 5 PM",
  "createAccount": false
}
```

**Alternative: Use Existing Address (by ID)**
If you want to use an existing saved address:
```json
{
  "shippingAddressId": "65a1b2c3d4e5f6789012345a",
  "items": [...],
  "billingAddressSameAsShipping": true
}
```

**Alternative: Different Billing Address**
If `billingAddressSameAsShipping` is `false`, billing address fields are optional:
```json
{
  "shippingAddress": {
    "firstName": "Alex",
    "lastName": "Driver",
    "email": "alex.driver@example.com",
    "phoneNumber": "+123 987654321",
    "addressLine1": "123 Main Street",
    "city": "San Diego",
    "state": "California",
    "postalCode": "22434"
  },
  "billingAddressSameAsShipping": false,
  "billingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phoneNumber": "+123 987654321",
    "streetAddress": "456 Billing St",
    "city": "Los Angeles",
    "zipCode": "90001"
  },
  "items": [...]
}
```

**Alternative: Create from Cart**
If you want to create order from cart items, use:
```json
{
  "createFromCart": true,
  "shippingAddress": {
    "firstName": "Alex",
    "lastName": "Driver",
    "email": "alex.driver@example.com",
    "phoneNumber": "+123 987654321",
    "addressLine1": "123 Main Street",
    "city": "San Diego",
    "state": "California",
    "postalCode": "22434"
  },
  "billingAddressSameAsShipping": true,
  "orderComment": "Please deliver before 5 PM"
}
```

**Alternative: Create from Prescription**
If you want to create order from prescription, use:
```json
{
  "prescriptionId": "65a1b2c3d4e5f6789012345b",
  "shippingAddress": {
    "firstName": "Alex",
    "lastName": "Driver",
    "email": "alex.driver@example.com",
    "phoneNumber": "+123 987654321",
    "addressLine1": "123 Main Street",
    "city": "San Diego",
    "state": "California",
    "postalCode": "22434"
  },
  "shippingCharges": 50.00,
  "discount": 0,
  "orderComment": "Prescription order"
}
```

**Required Fields:**
- `shippingAddress` OR `shippingAddressId` - **One of these is required:**
  - `shippingAddress` - Shipping address object (will be created/saved) with **required fields:**
    - `firstName` - First name - **Required**
    - `lastName` - Last name - **Required**
    - `email` - Email address - **Required**
    - `phoneNumber` or `phone` - Phone number - **Required**
    - `addressLine1` or `streetAddress` or `streetAddress1` - Street address line 1 - **Required**
    - `city` - City - **Required**
    - `state` or `stateProvince` - State/Province - **Required**
    - `postalCode` or `zipCode` - Postal/Zip code - **Required**
    - **Optional fields:**
      - `addressLine2` or `streetAddress2` - Address line 2 (optional)
      - `countryCode` - Country code (optional, default: "+91")
      - `country` - Country (optional, default: "India")
      - `type` - Address type: "home", "work", or "other" (optional, default: "home")
      - `fullName` - Full name (optional, will be auto-generated from firstName + lastName)
  - `shippingAddressId` - Existing address ID (MongoDB ObjectId) - Use this if address already exists
- `items` - Array of order items (required if not using `createFromCart` or `prescriptionId`), each item must have:
  - `productId` - **Medicine ID from Medicine collection** (MongoDB ObjectId) - **Required**
  - `medicationName` - Name of the medication/product - **Required**
  - `quantity` - Quantity to order (min: 1) - **Required**
  - `unitPrice` - Price per unit - **Required**
  - `totalPrice` - Total price for this item (quantity × unitPrice) - **Required**

**Optional Fields:**
- `createFromCart` - Boolean (default: false). If `true`, items will be taken from cart
- `prescriptionId` - Prescription ID (MongoDB ObjectId). If provided, items will be taken from prescription
- `subtotal` - Order subtotal (will be calculated from items if not provided)
- `tax` - Tax amount (will be calculated as 3% of subtotal for cart, 18% for custom/prescription if not provided)
- `shippingCharges` - Shipping charges (default: 10.00 for cart orders, 50.00 for custom/prescription orders)
- `discount` - Discount amount (default: 0)
- `totalAmount` - Total amount (will be calculated if not provided: subtotal + tax + shippingCharges - discount)
- `billingAddressSameAsShipping` - Boolean (default: true). If `true`, billing address is automatically copied from shipping address (no need to send `billingAddress` separately)
- `billingAddress` - Billing address object (optional, only needed if `billingAddressSameAsShipping` is `false`):
  - `firstName` - First name (required if billing address different)
  - `lastName` - Last name (required if billing address different)
  - `email` - Email address (optional)
  - `phoneNumber` or `phone` - Phone number (optional)
  - `streetAddress` or `addressLine1` - Street address line 1 (optional)
  - `streetAddress2` or `addressLine2` - Street address line 2 (optional)
  - `city` - City (required if billing address different)
  - `state` or `stateProvince` - State/Province (optional)
  - `zipCode` or `postalCode` - Zip/Postal code (required if billing address different)
- `orderComment` or `notes` - Order comment/notes

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
        "productId": "65a1b2c3d4e5f6789012345c",
        "productType": "medication",
        "medicationName": "Cetaphil Gentle Skin Cleanser 250ml",
        "brand": "Cetaphil",
        "originalPrice": 150.00,
        "salePrice": 122.89,
        "images": {
          "thumbnail": "https://example.com/images/cetaphil-250ml-thumb.jpg",
          "gallery": [
            "https://example.com/images/cetaphil-250ml-1.jpg",
            "https://example.com/images/cetaphil-250ml-2.jpg"
          ]
        },
        "description": "Gentle skin cleanser for daily use",
        "dosage": null,
        "dosageOption": null,
        "quantityOption": null,
        "generics": [],
        "quantity": 2,
        "unitPrice": 122.89,
        "totalPrice": 245.78,
        "status": "pending"
      },
      {
        "_id": "order_item_2",
        "productId": "65a1b2c3d4e5f6789012345d",
        "productType": "medication",
        "medicationName": "Cetaphil Gentle Skin Cleanser 350ml",
        "brand": "Cetaphil",
        "originalPrice": 200.00,
        "salePrice": 122.89,
        "images": {
          "thumbnail": "https://example.com/images/cetaphil-350ml-thumb.jpg",
          "gallery": []
        },
        "description": "Gentle skin cleanser for daily use",
        "quantity": 2,
        "unitPrice": 122.89,
        "totalPrice": 245.78,
        "status": "pending"
      },
      {
        "_id": "order_item_3",
        "productId": "65a1b2c3d4e5f6789012345e",
        "productType": "doctors_note",
        "medicationName": "Doctor's Note - Excuse Note",
        "quantity": 2,
        "unitPrice": 122.89,
        "totalPrice": 245.78,
        "status": "pending"
      }
    ],
    "shippingAddress": {
      "_id": "address_id",
      "type": "home",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "fullName": "John Doe",
      "phoneNumber": "9876543210",
      "countryCode": "+91",
      "addressLine1": "123 Main Street",
      "addressLine2": "Apt 4B",
      "city": "Pune",
      "state": "Maharashtra",
      "postalCode": "411001",
      "country": "India",
      "isDefault": true
    },
    "billingAddress": {
      "firstName": "Alex",
      "lastName": "Driver",
      "email": "username@gmail.com",
      "phoneNumber": "+123 987654321",
      "streetAddress": "123 Main Street",
      "streetAddress2": "Apt 4B",
      "city": "San Diego",
      "state": "California",
      "zipCode": "22434"
    },
    "billingAddressSameAsShipping": true,
    "subtotal": 737.34,
    "discount": 0,
    "tax": 22.12,
    "shippingCharges": 10.00,
    "totalAmount": 769.46,
    "status": "pending",
    "paymentStatus": "pending",
    "notes": "Please deliver before 5 PM",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed (missing required fields, invalid productId, empty cart, etc.)
- `401` - Unauthorized
- `404` - Address not found, Prescription not found, or Patient profile not found

**Notes:**
- **Unified API**: One API handles all order types (cart, prescription, custom items)
- **Product ID Required**: All items must have valid Medicine `_id` from Medicine collection
- **Auto Product Details**: Product details (brand, images, description, generics) are automatically fetched using `productId`
- **Product Details Snapshot**: All product details are saved as a snapshot at order creation time
- **Auto Calculations**: Tax and totals are calculated automatically if not provided
- **Cart Clearing**: Cart is automatically cleared when `createFromCart: true` is used
- **Billing Address**: Auto-filled from shipping address if `billingAddressSameAsShipping: true`

**Note:** If `billingAddressSameAsShipping` is `true`, billing address will be automatically copied from shipping address. If `false`, `billingAddress` object is required.

**Required Fields:**
- `shippingAddressId` - Address ID for delivery (MongoDB ObjectId)
- `items` - Array of order items, each item must have:
  - `productId` - **Medicine ID from Medicine collection** (MongoDB ObjectId) - **Required**. This must be a valid `_id` from the Medicine model/collection.
  - `medicationName` - Name of the medication/product
  - `quantity` - Quantity to order (min: 1)
  - `unitPrice` - Price per unit
  - `totalPrice` - Total price for this item (quantity × unitPrice)

**Optional Fields in Items:**
- `productType` - Type: `medication`, `doctors_note`, or `other` (default: `medication`)
- `brand` - Brand name (will be auto-fetched if productId provided)
- `originalPrice` - Original price (will be auto-fetched if productId provided)
- `salePrice` - Sale price (will be auto-fetched if productId provided)
- `images` - Product images (will be auto-fetched if productId provided)
- `description` - Product description (will be auto-fetched if productId provided)
- `dosage` - Dosage information
- `dosageOption` - Dosage option details
- `quantityOption` - Quantity option details
- `generics` - Array of generic names (will be auto-fetched if productId provided)

**Optional Fields:**
- `subtotal` - Order subtotal (will be calculated from items if not provided)
- `tax` - Tax amount (will be calculated as 3% of subtotal if not provided)
- `shippingCharges` - Shipping charges (default: 10.00 for cart orders, 50.00 for custom orders)
- `discount` - Discount amount (default: 0)
- `totalAmount` - Total amount (will be calculated if not provided: subtotal + tax + shippingCharges - discount)
- `billingAddressSameAsShipping` - Boolean (default: true). If `true`, billing address is automatically copied from shipping address (no need to send `billingAddress` separately)
- `billingAddress` - Billing address object (optional, only needed if `billingAddressSameAsShipping` is `false`):
  - `firstName` - First name (optional)
  - `lastName` - Last name (optional)
  - `email` - Email address (optional)
  - `phoneNumber` or `phone` - Phone number (optional)
  - `streetAddress` or `addressLine1` - Street address line 1 (optional)
  - `streetAddress2` or `addressLine2` - Street address line 2 (optional)
  - `city` - City (optional)
  - `state` or `stateProvince` - State/Province (optional)
  - `zipCode` or `postalCode` - Zip/Postal code (optional)
- `orderComment` or `notes` - Order comment/notes
- `createAccount` - Boolean (default: false). If `true`, indicates user wants to create an account for later (for guest checkout scenarios)

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
        "_id": "order_item_4",
        "productId": "65a1b2c3d4e5f6789012345a",
        "productType": "medication",
        "medicationName": "Paracetamol",
        "brand": "Generic",
        "originalPrice": 50.00,
        "salePrice": 50.00,
        "images": {
          "thumbnail": "https://example.com/images/paracetamol-thumb.jpg",
          "gallery": []
        },
        "description": "Pain reliever and fever reducer",
        "dosage": "Tablet - 500mg",
        "dosageOption": null,
        "quantityOption": null,
        "generics": [
          "Acetaminophen"
        ],
        "quantity": 2,
        "unitPrice": 50,
        "totalPrice": 100,
        "status": "pending"
      },
      {
        "_id": "order_item_5",
        "productId": "65a1b2c3d4e5f6789012345b",
        "productType": "medication",
        "medicationName": "Aspirin",
        "brand": "Generic",
        "originalPrice": 30.00,
        "salePrice": 30.00,
        "images": {
          "thumbnail": "https://example.com/images/aspirin-thumb.jpg",
          "gallery": []
        },
        "description": "Anti-inflammatory medication",
        "dosage": "Tablet - 100mg",
        "dosageOption": null,
        "quantityOption": null,
        "generics": [
          "Acetylsalicylic Acid"
        ],
        "quantity": 1,
        "unitPrice": 30,
        "totalPrice": 30,
        "status": "pending"
      }
    ],
    "shippingAddress": {
      "_id": "address_id",
      "type": "home",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "fullName": "John Doe",
      "phoneNumber": "9876543210",
      "countryCode": "+91",
      "addressLine1": "123 Main Street",
      "addressLine2": "Apt 4B",
      "city": "Pune",
      "state": "Maharashtra",
      "postalCode": "411001",
      "country": "India",
      "isDefault": true,
      "createdAt": "2025-01-10T10:00:00.000Z",
      "updatedAt": "2025-01-10T10:00:00.000Z"
    },
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
    "paymentStatus": "pending",
    "notes": "Custom order with different billing address",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed, product ID missing, or address not found
- `401` - Unauthorized
- `404` - Address not found or product not found

**Notes:**
- **Product ID Required**: All items must have a valid `productId`. If not provided, the system will try to find the medicine by name, but it's recommended to always provide `productId`.
- **Auto-fetch Product Details**: If `productId` is provided, product details (brand, images, description, generics, prices) will be automatically fetched and saved with the order.
- **Items Array**: Order items are always returned as an array, even if empty.
- **Address Population**: Shipping address is fully populated with all fields in the response.
- **Product Snapshot**: All product details are saved as a snapshot at order creation time for historical accuracy.

**Required Fields:**
- `shippingAddressId` - Address ID for delivery (MongoDB ObjectId)

**Required for Cart-based Order:**
- `createFromCart` - Must be `true`
- Cart must not be empty

**Required for Prescription-based Order:**
- `prescriptionId` - Prescription ID (MongoDB ObjectId)

**Required for Custom Items Order:**
- `items` - Array of order items with complete product details including:
  - `productId` - Product/Medicine ID
  - `productType` - Type: `medication`, `doctors_note`, or `other`
  - `medicationName` - Name of the medication/product
  - `brand` - Brand name
  - `originalPrice` - Original price (snapshot at order time)
  - `salePrice` - Sale price (snapshot at order time)
  - `images` - Product images (thumbnail and gallery)
  - `description` - Product description
  - `dosage` - Selected dosage
  - `dosageOption` - Dosage option details
  - `quantityOption` - Quantity option details
  - `generics` - Array of generic names
  - `quantity` - Quantity ordered
  - `unitPrice` - Unit price at order time
  - `totalPrice` - Total price for this item
  - `status` - Item status: `pending`, `added`, `saved`, `ordered`

**Optional Fields:**
- `billingAddressSameAsShipping` - Boolean (default: true)
- `billingAddress` - Billing address object (optional, only needed if `billingAddressSameAsShipping` is `false`)
- `createAccount` - Boolean (default: false). If `true`, indicates user wants to create an account for later
- `shippingCharges` - Override shipping charges
- `discount` - Discount amount
- `orderComment` - Order notes/comment

**Notes:**
- **Cart-based orders**: When `createFromCart: true`, cart items are converted to order items and cart is automatically cleared (saved items are retained). Product details (brand, images, description, etc.) are automatically fetched and saved with the order.
- **Prescription orders**: Items are automatically created from prescription medications
- **Custom orders**: Items are created from provided `items` array
- **Product Details Snapshot**: All product details (brand, images, prices, description, dosage, generics) are saved as a snapshot at the time of order creation. This ensures historical accuracy even if product information changes later.
- Cart operations (clearing) happen automatically when order is created from cart
- Billing address is auto-filled from shipping address if not provided
- Tax is calculated automatically (3% for cart orders, 18% for prescription/custom orders)

**Note:** Orders are immutable after creation. To modify an order, create a new order with the desired items. Status and tracking information are included in the `getOrderById` response.

---

#### Update Order Notes
**PUT** `/api/v1/patient/orders/:id/notes`

Update notes/comments for a pending or confirmed order.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `id` (path) - Order ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "notes": "Please deliver before 5 PM. Ring the doorbell twice."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order notes updated successfully",
  "data": {
    "_id": "order_id_123",
    "orderNumber": "ORD202501151234567890",
    "patient": "patient_id_456",
    "items": [
      {
        "_id": "order_item_1",
        "productId": "65a1b2c3d4e5f6789012345c",
        "productType": "medication",
        "medicationName": "Cetaphil Gentle Skin Cleanser 250ml",
        "quantity": 2,
        "unitPrice": 122.89,
        "totalPrice": 245.78,
        "status": "pending",
        "product": {
          "_id": "65a1b2c3d4e5f6789012345c",
          "productName": "Cetaphil Gentle Skin Cleanser 250ml",
          "brand": "Cetaphil",
          "originalPrice": 150.00,
          "salePrice": 122.89,
          "images": {...},
          "description": "Gentle skin cleanser",
          "generics": [],
          "category": "Skincare",
          "stock": 100,
          "status": "in_stock",
          "visibility": true,
          "isActive": true
        }
      }
    ],
    "shippingAddress": {
      "_id": "address_id",
      "type": "home",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "fullName": "John Doe",
      "phoneNumber": "9876543210",
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
    "subtotal": 737.34,
    "tax": 22.12,
    "shippingCharges": 10.00,
    "discount": 0,
    "totalAmount": 769.46,
    "status": "pending",
    "paymentStatus": "pending",
    "notes": "Please deliver before 5 PM. Ring the doorbell twice.",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid order ID, order status not pending/confirmed, or validation failed
- `401` - Unauthorized
- `404` - Order not found

**Notes:**
- Only works for `pending` or `confirmed` orders
- Notes can be updated multiple times
- Maximum length: 1000 characters
- Notes are optional (can be empty string to clear notes)

---

#### Delete Order Item
**DELETE** `/api/v1/patient/orders/:orderId/items/:itemId`

Delete an item from a pending order.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `orderId` (path) - Order ID (MongoDB ObjectId)
- `itemId` (path) - Order item ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Order item deleted successfully",
  "data": {
    "_id": "order_id_123",
    "orderNumber": "ORD202501151234567890",
    "items": [...],
    "subtotal": 491.56,
    "tax": 14.75,
    "totalAmount": 516.31,
    "status": "pending"
  }
}
```

**Error Responses:**
- `400` - Order status not pending, cannot delete last item
- `401` - Unauthorized
- `404` - Order not found or item not found

**Notes:**
- Only works for `pending` orders
- Cannot delete the last item (cancel order instead)
- Totals are automatically recalculated after deletion

---

#### Update Order Item Quantity
**PUT** `/api/v1/patient/orders/:orderId/items/:itemId/quantity`

Update the quantity of an item in a pending order.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `orderId` (path) - Order ID (MongoDB ObjectId)
- `itemId` (path) - Order item ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "quantity": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order item quantity updated successfully",
  "data": {
    "_id": "order_id_123",
    "orderNumber": "ORD202501151234567890",
    "items": [
      {
        "_id": "order_item_1",
        "productId": "65a1b2c3d4e5f6789012345c",
        "medicationName": "Cetaphil Gentle Skin Cleanser 250ml",
        "quantity": 5,
        "unitPrice": 122.89,
        "totalPrice": 614.45,
        "status": "pending",
        "product": {...}
      }
    ],
    "subtotal": 1228.90,
    "tax": 36.87,
    "totalAmount": 1275.77,
    "status": "pending"
  }
}
```

**Error Responses:**
- `400` - Order status not pending, quantity must be at least 1, or validation failed
- `401` - Unauthorized
- `404` - Order not found or item not found

**Notes:**
- Only works for `pending` orders
- Quantity must be at least 1
- Totals are automatically recalculated after update

---

#### Save Order Item
**POST** `/api/v1/patient/orders/:orderId/items/:itemId/save`

Mark an order item as saved for later (only for pending orders). Saved items are excluded from order totals.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `orderId` (path) - Order ID (MongoDB ObjectId)
- `itemId` (path) - Order item ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Order item saved for later",
  "data": {
    "_id": "order_id_123",
    "orderNumber": "ORD202501151234567890",
    "items": [
      {
        "_id": "order_item_1",
        "productId": "65a1b2c3d4e5f6789012345c",
        "medicationName": "Cetaphil Gentle Skin Cleanser 250ml",
        "quantity": 2,
        "unitPrice": 122.89,
        "totalPrice": 245.78,
        "status": "saved",
        "isSaved": true,
        "product": {...}
      }
    ],
    "subtotal": 491.56,
    "tax": 14.75,
    "totalAmount": 516.31,
    "status": "pending"
  }
}
```

**Error Responses:**
- `400` - Order status not pending or item already saved
- `401` - Unauthorized
- `404` - Order not found or item not found

**Notes:**
- Only works for `pending` orders
- Saved items are excluded from subtotal calculation
- Totals are automatically recalculated

---

#### Unsave Order Item
**DELETE** `/api/v1/patient/orders/:orderId/items/:itemId/save`

Move a saved order item back to active (only for pending orders). Item will be included in order totals again.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `orderId` (path) - Order ID (MongoDB ObjectId)
- `itemId` (path) - Order item ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Order item moved back to active",
  "data": {
    "_id": "order_id_123",
    "orderNumber": "ORD202501151234567890",
    "items": [
      {
        "_id": "order_item_1",
        "productId": "65a1b2c3d4e5f6789012345c",
        "medicationName": "Cetaphil Gentle Skin Cleanser 250ml",
        "quantity": 2,
        "unitPrice": 122.89,
        "totalPrice": 245.78,
        "status": "pending",
        "isSaved": false,
        "product": {...}
      }
    ],
    "subtotal": 737.34,
    "tax": 22.12,
    "totalAmount": 769.46,
    "status": "pending"
  }
}
```

**Error Responses:**
- `400` - Order status not pending or item not saved
- `401` - Unauthorized
- `404` - Order not found or item not found

**Notes:**
- Only works for `pending` orders
- Unsaved items are included in subtotal calculation
- Totals are automatically recalculated

---

#### Get Order Status
**GET** `/api/v1/patient/orders/:id/status`

Get order status and payment status.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `id` (path) - Order ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "data": {
    "orderNumber": "ORD202501151234567890",
    "status": "pending",
    "paymentStatus": "pending",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - Order not found

---

#### Get Order Tracking
**GET** `/api/v1/patient/orders/:id/tracking`

Get order tracking information including tracking number, estimated delivery, and shipping address.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `id` (path) - Order ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "data": {
    "orderNumber": "ORD202501151234567890",
    "status": "shipped",
    "paymentStatus": "paid",
    "trackingNumber": "TRACK123456789",
    "estimatedDelivery": "2025-01-20T18:00:00.000Z",
    "deliveredAt": null,
    "shippingAddress": {
      "_id": "address_id",
      "fullName": "John Doe",
      "addressLine1": "123 Main Street",
      "addressLine2": "Apt 4B",
      "city": "Pune",
      "state": "Maharashtra",
      "postalCode": "411001",
      "country": "India",
      "phoneNumber": "9876543210"
    },
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-18T14:20:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - Order not found

**Notes:**
- `trackingNumber` may be null if order hasn't been shipped yet
- `estimatedDelivery` may be null if not set
- `deliveredAt` will be set when order is delivered

---

#### Get Order Invoice
**GET** `/api/v1/patient/orders/:id/invoice`

Get complete invoice details for an order including customer information, items, and pricing breakdown.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `id` (path) - Order ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "data": {
    "invoiceNumber": "INV-ORD202501151234567890",
    "orderNumber": "ORD202501151234567890",
    "orderDate": "2025-01-15T10:30:00.000Z",
    "customer": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "9876543210"
    },
    "shippingAddress": {
      "_id": "address_id",
      "type": "home",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "fullName": "John Doe",
      "phoneNumber": "9876543210",
      "addressLine1": "123 Main Street",
      "addressLine2": "Apt 4B",
      "city": "Pune",
      "state": "Maharashtra",
      "postalCode": "411001",
      "country": "India"
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
    "items": [
      {
        "_id": "order_item_1",
        "productId": "65a1b2c3d4e5f6789012345c",
        "medicationName": "Cetaphil Gentle Skin Cleanser 250ml",
        "quantity": 2,
        "unitPrice": 122.89,
        "totalPrice": 245.78,
        "product": {
          "_id": "65a1b2c3d4e5f6789012345c",
          "productName": "Cetaphil Gentle Skin Cleanser 250ml",
          "brand": "Cetaphil",
          "originalPrice": 150.00,
          "salePrice": 122.89
        }
      }
    ],
    "subtotal": 737.34,
    "shippingCharges": 10.00,
    "tax": 22.12,
    "discount": 0,
    "totalAmount": 769.46,
    "status": "pending",
    "paymentStatus": "pending",
    "notes": "Please deliver before 5 PM"
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - Order not found

**Notes:**
- Complete invoice with all order details
- Customer information from user profile
- All items with product details
- Full pricing breakdown

---

#### Cancel Order
**PUT** `/api/v1/patient/orders/:id/cancel`

Cancel a pending or confirmed order.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `id` (path) - Order ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "reason": "Changed my mind, no longer needed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "_id": "order_id_123",
    "orderNumber": "ORD202501151234567890",
    "status": "cancelled",
    "items": [...],
    "notes": "Cancellation reason: Changed my mind, no longer needed",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Order status not pending/confirmed or validation failed
- `401` - Unauthorized
- `404` - Order not found

**Notes:**
- Only works for `pending` or `confirmed` orders
- Cancellation reason is optional but recommended
- Reason is appended to order notes
- Order status changes to `cancelled`

---

#### Reorder
**POST** `/api/v1/patient/orders/:id/reorder`

Create a new order from an existing order. Uses the same items and shipping address.

**Headers:** `Authorization: Bearer <patient_token>`

**Parameters:**
- `id` (path) - Order ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Order recreated successfully",
  "data": {
    "_id": "order_id_124",
    "orderNumber": "ORD202501151234567891",
    "patient": "patient_id_456",
    "items": [
      {
        "_id": "order_item_1",
        "productId": "65a1b2c3d4e5f6789012345c",
        "medicationName": "Cetaphil Gentle Skin Cleanser 250ml",
        "quantity": 2,
        "unitPrice": 122.89,
        "totalPrice": 245.78,
        "status": "pending",
        "product": {...}
      }
    ],
    "shippingAddress": {...},
    "billingAddress": {...},
    "subtotal": 737.34,
    "tax": 22.12,
    "shippingCharges": 10.00,
    "discount": 0,
    "totalAmount": 769.46,
    "status": "pending",
    "notes": "Reordered from order ORD202501151234567890",
    "createdAt": "2025-01-16T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - Order not found

**Notes:**
- Creates a new order with same items and shipping address
- Discount is reset to 0 for the new order
- Original order is not modified
- New order status is `pending`

---

#### Get Orders Summary
**GET** `/api/v1/patient/orders/summary`

Get summary statistics for all orders of the logged-in patient.

**Headers:** `Authorization: Bearer <patient_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "byStatus": {
      "pending": 2,
      "confirmed": 3,
      "processing": 1,
      "shipped": 5,
      "delivered": 10,
      "cancelled": 3,
      "returned": 1
    },
    "byPaymentStatus": {
      "pending": 2,
      "paid": 20,
      "failed": 1,
      "refunded": 2
    },
    "totalAmount": 25000.50,
    "totalPaid": 22000.30
  }
}
```

**Error Responses:**
- `401` - Unauthorized

**Notes:**
- Returns count of orders by status
- Returns count of orders by payment status
- `totalAmount` - Sum of all order amounts
- `totalPaid` - Sum of paid order amounts only

---

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
  "productId": "65a1b2c3d4e5f6789012345c",
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

// Health Category and Type (Optional - for health module integration)
// IMPORTANT: If healthTypeSlug is provided, healthCategory MUST be provided
// healthTypeSlug must be one of the types within the selected healthCategory
healthCategory: "health_category_id" (MongoDB ObjectId - Select ONE health category)
healthTypeSlug: "asthma" (Select ONE type from the selected category's types, e.g., 'asthma', 'dry-eye', 'copd')

// Admin Flags (Optional)
isTrendy: true (mark as trendy product)
isBestOffer: true (mark as best offer product)
discountPercentage: 25.5 (set discount percentage for best offer, 0-100, optional)

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
  "healthCategory": "health_category_id",
  "healthTypeSlug": "asthma",
  "isTrendy": true,
  "isBestOffer": false,
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
    "healthCategory": {
      "_id": "health_category_id",
      "name": "Respiratory Health",
      "slug": "respiratory-health",
      "description": "Medications for respiratory conditions",
      "icon": "https://example.com/icons/respiratory.svg",
      "types": [
        {
          "name": "Asthma",
          "slug": "asthma",
          "description": "Medications for asthma management",
          "icon": "https://example.com/icons/asthma.svg",
          "order": 0,
          "isActive": true
        }
      ]
    },
    "healthTypeSlug": "asthma",
    "isTrendy": true,
    "isBestOffer": false,
    "views": 0,
    "stock": 450,
    "status": "in_stock",
    "visibility": true,
    "isActive": true,
    "createdAt": "2026-01-02T10:30:00.000Z",
    "updatedAt": "2026-01-02T10:30:00.000Z"
  }
}
```

**Notes:**
- **Health Category Selection:**
  - `healthCategory` (optional) - Select ONE health category (e.g., "Respiratory Health", "Eye Care")
  - `healthTypeSlug` (optional) - Select ONE type from the selected category's types (e.g., "asthma", "dry-eye")
  - **IMPORTANT:** If `healthTypeSlug` is provided, `healthCategory` MUST be provided
  - `healthTypeSlug` must exist in the selected `healthCategory`'s types
  - Example: If you select "Respiratory Health" category, you can only select types like "asthma", "copd" that belong to that category
- **Admin Flags:**
  - `isTrendy` (optional) - Mark medicine as trendy (will appear in trendy medications API)
  - `isBestOffer` (optional) - Mark medicine as best offer (will appear in best offers API)
- **Relationship Flow:**
  1. First, select a health category (only 1 category)
  2. Then, select a type from that category's available types (only 1 type)
  3. The type must belong to the selected category

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

Get a paginated list of all medicines with optional filtering, availability switch, and price sorting.

**Headers:** No authentication required (Public API)

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)
- `search` (optional) - Search by product name, brand, category, or generics
- `category` (optional) - Filter by category
- `status` (optional) - Filter by status (`in_stock`, `low_stock`, `out_of_stock`, `discontinued`)
- `availability` (optional) - Filter by availability switch:
  - `in_stock` - Only in-stock items
  - `out_of_stock` - Only out-of-stock items
  - `low_stock` - Only low-stock items
  - `available` - Available items (in_stock or low_stock)
- `inStock` (optional) - Boolean filter for in-stock items only (true/false). If true, returns items with status `in_stock` or `low_stock`
- `visibility` (optional) - Filter by visibility (true/false)
- `sortBy` (optional) - Sort field (default: `createdAt`):
  - `createdAt` - Sort by creation date
  - `productName` or `name` - Sort by product name
  - `salePrice` or `price` - Sort by sale price
  - `originalPrice` - Sort by original price
  - `price_low` or `price_asc` - Sort by price low to high
  - `price_high` or `price_desc` - Sort by price high to low
- `sortOrder` (optional) - Sort order: `asc` or `desc` (default: `desc`)

**Example Requests:**

1. **Basic request:**
```
GET /api/v1/admin/medicines?page=1&limit=10
```

2. **With availability filter (in-stock only):**
```
GET /api/v1/admin/medicines?availability=in_stock&page=1&limit=10
```

3. **Price sorting (low to high):**
```
GET /api/v1/admin/medicines?sortBy=price_low&sortOrder=asc
```

4. **Price sorting (high to low):**
```
GET /api/v1/admin/medicines?sortBy=price_high&sortOrder=desc
```

5. **With search and filters:**
```
GET /api/v1/admin/medicines?page=1&limit=10&search=amoxicillin&category=Antibiotics&availability=available&sortBy=salePrice&sortOrder=asc
```

6. **Using inStock filter:**
```
GET /api/v1/admin/medicines?inStock=true&sortBy=price_low
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

Get complete details of a specific medicine by ID.

**Headers:** No authentication required (Public API)

**Parameters:**
- `id` (path) - Medicine ID (MongoDB ObjectId)

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
    "images": {
      "thumbnail": "https://example.com/images/amoxicillin-thumb.jpg",
      "gallery": ["https://example.com/images/amoxicillin-1.jpg"]
    },
    "description": "Antibiotic medication used to treat various bacterial infections",
    "howItWorks": "Amoxicillin works by inhibiting the synthesis of bacterial cell walls",
    "category": "Antibiotics",
    "healthCategory": {
      "_id": "health_category_id",
      "name": "Respiratory Health",
      "slug": "respiratory-health",
      "description": "Medications and treatments for respiratory conditions",
      "icon": "https://example.com/icons/respiratory.svg",
      "types": [
        {
          "name": "Asthma",
          "slug": "asthma",
          "description": "Medications for asthma management",
          "icon": "https://example.com/icons/asthma.svg",
          "order": 0,
          "isActive": true
        }
      ]
    },
    "healthTypeSlug": "asthma",
    "generics": ["Amoxicillin Trihydrate", "Amoxicillin Sodium"],
    "dosageOptions": [
      {
        "name": "Capsule - 500mg",
        "priceAdjustment": 0
      }
    ],
    "quantityOptions": [
      {
        "name": "20 Tablets",
        "priceAdjustment": 0
      }
    ],
    "stock": 450,
    "status": "in_stock",
    "visibility": true,
    "isActive": true,
    "isTrendy": true,
    "isBestOffer": false,
    "discountPercentage": 0,
    "views": 0,
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-03T12:30:00.000Z"
  }
}
```

**Error Responses:**
- `404` - Medicine not found

---

### Find Similar Medicines
**GET** `/api/v1/admin/medicines/:id/similar?limit=10`

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
- `500` - Server error

**Notes:**
- This is a public API (no authentication required)
- Only returns active and visible medicines
- Returns medicine with populated healthCategory data if available

---

### Find Similar Medicines
**GET** `/api/v1/admin/medicines/:id/similar?limit=10`

Find medicines similar to the specified medicine based on health category, health type, category, generics, brand, and price range.

**Headers:** No authentication required (Public API)

**Parameters:**
- `id` (path) - Medicine ID (MongoDB ObjectId)

**Query Parameters:**
- `limit` (optional) - Maximum number of similar medicines to return (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "message": "Similar medicines retrieved successfully",
  "data": [
    {
      "_id": "similar_medicine_id_1",
      "productName": "Amoxicillin Capsules",
      "brand": "Cetaphill",
      "originalPrice": 22.99,
      "salePrice": 16.99,
      "images": {
        "thumbnail": "https://example.com/images/amoxicillin-capsules-thumb.jpg",
        "gallery": ["https://example.com/images/amoxicillin-capsules-1.jpg"]
      },
      "description": "Antibiotic medication for bacterial infections",
      "category": "Antibiotics",
      "healthCategory": {
        "_id": "health_category_id",
        "name": "Respiratory Health",
        "slug": "respiratory-health",
        "description": "Medications and treatments for respiratory conditions",
        "icon": "https://example.com/icons/respiratory.svg",
        "types": [
          {
            "name": "Asthma",
            "slug": "asthma",
            "description": "Medications for asthma management",
            "icon": "https://example.com/icons/asthma.svg",
            "order": 0,
            "isActive": true
          }
        ]
      },
      "healthTypeSlug": "asthma",
      "generics": ["Amoxicillin Trihydrate"],
      "dosageOptions": [
        {
          "name": "Capsule - 500mg",
          "priceAdjustment": 0
        }
      ],
      "quantityOptions": [
        {
          "name": "20 Tablets",
          "priceAdjustment": 0
        }
      ],
      "stock": 300,
      "status": "in_stock",
      "visibility": true,
      "isActive": true,
      "isTrendy": false,
      "isBestOffer": false,
      "discountPercentage": 0,
      "views": 0,
      "createdAt": "2025-01-02T10:00:00.000Z",
      "updatedAt": "2025-01-03T12:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "pages": 1
  }
}
```

**Similarity Criteria (Priority Order):**
1. **Health Category Match** (Highest Priority) - Medicines with the same health category
2. **Health Type Slug Match** - Medicines with the same health type slug (chronic condition)
3. **Category Match** - Medicines in the same category
4. **Generics Match** - Medicines with matching generic ingredients
5. **Brand Match** - Medicines from the same brand
6. **Price Similarity** - Medicines within 30% price range of the original medicine

**Filtering:**
- Only returns active and visible medicines
- Only includes medicines with status `in_stock` or `low_stock`
- Excludes the original medicine itself
- Results are sorted by similarity score (highest first), then by price (lowest first)

**Error Responses:**
- `404` - Medicine not found
- `400` - Invalid medicine ID

**Notes:**
- This is a public API (no authentication required)
- Similarity is calculated using multiple criteria with weighted scoring
- Results are limited to prevent overwhelming responses
- Price range is automatically calculated (±30% of original medicine price)
- Medicines are sorted by relevance (most similar first)

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

### Update Medicine Stock and Status

**PUT** `/api/v1/admin/medicines/:id/stock-status`

Update medicine stock quantity and/or status. This is a dedicated endpoint for quick stock management.

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `id` (path) - Medicine ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "stock": 450,
  "status": "in_stock"
}
```

**Fields:**
- `stock` (optional) - Stock quantity (non-negative integer). If provided, status will be auto-updated based on stock:
  - `stock = 0` → `status = "out_of_stock"`
  - `stock < 20` → `status = "low_stock"`
  - `stock >= 20` → `status = "in_stock"`
- `status` (optional) - Medicine status. Must be one of:
  - `"in_stock"` - Available in stock
  - `"low_stock"` - Low stock (less than 20)
  - `"out_of_stock"` - Out of stock
  - `"discontinued"` - Product discontinued

**Response:**
```json
{
  "success": true,
  "message": "Medicine stock and status updated successfully",
  "data": {
    "_id": "medicine_id",
    "productName": "Amoxicillin",
    "brand": "Cetaphill",
    "stock": 450,
    "status": "in_stock",
    "originalPrice": 100,
    "salePrice": 30,
    "healthCategory": {
      "_id": "health_category_id",
      "name": "Respiratory Health",
      "slug": "respiratory-health"
    },
    "updatedAt": "2026-01-05T20:00:00.000Z"
  }
}
```

**Example Requests:**

1. **Update stock only (status auto-updated):**
```json
{
  "stock": 450
}
```

2. **Update status only:**
```json
{
  "status": "out_of_stock"
}
```

3. **Update both stock and status:**
```json
{
  "stock": 15,
  "status": "low_stock"
}
```

**Error Responses:**
- `400` - Invalid medicine ID, invalid stock value, or invalid status
- `404` - Medicine not found
- `401` - Unauthorized
- `403` - Forbidden (admin/sub-admin only)
- `500` - Server error

**Notes:**
- If only `stock` is provided, `status` will be automatically updated based on stock quantity
- If only `status` is provided, stock remains unchanged
- Both fields are optional, but at least one must be provided
- This endpoint is optimized for quick stock management without requiring full medicine update

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

## Newsletter Subscription APIs (Public)

APIs for newsletter email subscriptions. Users can subscribe and unsubscribe from the newsletter without authentication.

### Subscribe to Newsletter

**POST** `/api/v1/newsletter/subscribe`

Subscribe to the newsletter. This endpoint is public and does not require authentication.

**Headers:** No authentication required (Public API)

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully subscribed to newsletter",
  "data": {
    "_id": "newsletter_id",
    "email": "user@example.com",
    "status": "subscribed",
    "subscribedAt": "2026-01-05T20:00:00.000Z",
    "source": "website",
    "createdAt": "2026-01-05T20:00:00.000Z",
    "updatedAt": "2026-01-05T20:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid email address
- `500` - Server error

**Notes:**
- If email is already subscribed, returns existing subscription
- If email was previously unsubscribed, it will be resubscribed
- Email is automatically converted to lowercase
- IP address and user agent are automatically captured

---

### Unsubscribe from Newsletter

**POST** `/api/v1/newsletter/unsubscribe`

Unsubscribe from the newsletter. This endpoint is public and does not require authentication.

**Headers:** No authentication required (Public API)

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully unsubscribed from newsletter",
  "data": {
    "_id": "newsletter_id",
    "email": "user@example.com",
    "status": "unsubscribed",
    "subscribedAt": "2026-01-05T20:00:00.000Z",
    "unsubscribedAt": "2026-01-05T20:30:00.000Z",
    "createdAt": "2026-01-05T20:00:00.000Z",
    "updatedAt": "2026-01-05T20:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid email address
- `404` - Email not found in newsletter subscriptions
- `500` - Server error

---

### Get Newsletter Statistics (Admin Only)

**GET** `/api/v1/newsletter/statistics`

Get newsletter subscription statistics. Requires admin authentication.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 1250,
    "subscribed": 1100,
    "unsubscribed": 140,
    "pending": 10,
    "recentSubscriptions": 45
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Forbidden (admin/sub-admin only)

---

### Get All Newsletter Subscriptions (Admin Only)

**GET** `/api/v1/newsletter?page=1&limit=20&search=example&status=subscribed&sortBy=subscribedAt&sortOrder=desc`

Get a paginated list of all newsletter subscriptions with search, filter, and sort capabilities.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20, max: 100)
- `search` (optional) - Search by email
- `status` (optional) - Filter by status: `subscribed`, `unsubscribed`, `pending`
- `sortBy` (optional) - Sort field: `subscribedAt`, `email`, `status` (default: `subscribedAt`)
- `sortOrder` (optional) - Sort order: `asc` or `desc` (default: `desc`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "newsletter_id",
      "email": "user@example.com",
      "status": "subscribed",
      "subscribedAt": "2026-01-05T20:00:00.000Z",
      "source": "website",
      "ipAddress": "192.168.1.1",
      "createdAt": "2026-01-05T20:00:00.000Z",
      "updatedAt": "2026-01-05T20:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1250,
    "pages": 63
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Forbidden (admin/sub-admin only)

---

### Delete Newsletter Subscription (Admin Only)

**DELETE** `/api/v1/newsletter/:id`

Delete a newsletter subscription. Requires admin authentication.

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `id` (path) - Newsletter subscription ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Newsletter subscription deleted successfully"
}
```

**Error Responses:**
- `400` - Invalid newsletter subscription ID
- `401` - Unauthorized
- `403` - Forbidden (admin/sub-admin only)
- `404` - Newsletter subscription not found

---

## Contact Form Query APIs

### Create Contact Form Query (Public)
**POST** `/api/v1/contact-form-queries`

Submit a new contact form query. This endpoint is public and does not require authentication. However, if a user is logged in and provides an authentication token, their user information will be saved with the query.

**Headers (Optional):**
- `Authorization: Bearer <token>` - If provided, the logged-in user's information will be saved with the query

**Request Body:**
```json
{
  "name": "Brandon",
  "email": "brandon@email.com",
  "phoneNumber": "(406) 555-0120",
  "services": "Craving Change",
  "message": "I need a refill for my prescription medication."
}
```

**Required Fields:**
- `name` - Name (2-100 characters)
- `email` - Valid email address
- `phoneNumber` - Phone number (supports various formats)
- `services` - Service name (2-100 characters)
- `message` - Message (10-2000 characters)

**Response:**
```json
{
  "success": true,
  "message": "Contact form query submitted successfully",
  "data": {
    "_id": "query_id",
    "name": "Brandon",
    "email": "brandon@email.com",
    "phoneNumber": "(406) 555-0120",
    "services": "Craving Change",
    "message": "I need a refill for my prescription medication.",
    "status": "pending",
    "submittedBy": {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phoneNumber": "1234567890"
    },
    "createdAt": "2025-12-20T10:30:00.000Z",
    "updatedAt": "2025-12-20T10:30:00.000Z"
  }
}
```

**Note:** If the user is not logged in, `submittedBy` will be `null`.

**Error Responses:**
- `400` - Validation failed

---

### Get Contact Form Query Statistics (Admin/Sub-Admin Only)
**GET** `/api/v1/admin/contact-form-queries/statistics`

Get statistics about contact form queries.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "pending": 45,
    "inProgress": 12,
    "resolved": 88,
    "archived": 5,
    "last7Days": 25,
    "last30Days": 95
  }
}
```

---

### Get All Contact Form Queries (Admin/Sub-Admin Only)
**GET** `/api/v1/admin/contact-form-queries`

Get a paginated list of all contact form queries with search, filter, and sort capabilities.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10, max: 100)
- `search` (optional) - Search in name, email, phone number, or message
- `status` (optional) - Filter by status: `pending`, `in_progress`, `resolved`, `archived`
- `services` (optional) - Filter by services (partial match)
- `sortBy` (optional) - Sort field: `createdAt`, `name`, `email`, `status` (default: `createdAt`)
- `sortOrder` (optional) - Sort order: `asc` or `desc` (default: `desc`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "query_id",
      "name": "Brandon",
      "email": "brandon@email.com",
      "phoneNumber": "(406) 555-0120",
      "services": "Craving Change",
      "message": "I need a refill for my prescription medication.",
      "status": "pending",
      "submittedBy": {
        "_id": "user_id",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phoneNumber": "1234567890"
      },
      "createdAt": "2025-12-20T10:30:00.000Z",
      "updatedAt": "2025-12-20T10:30:00.000Z"
    },
    {
      "_id": "query_id_2",
      "name": "Harold",
      "email": "harold@email.com",
      "phoneNumber": "(671) 555-0110",
      "services": "Meals on Wheels",
      "message": "I would like to consult a doctor about my health concerns.",
      "status": "in_progress",
      "submittedBy": null,
      "respondedAt": "2025-12-19T14:20:00.000Z",
      "respondedBy": {
        "_id": "admin_id",
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@example.com"
      },
      "createdAt": "2025-12-18T09:15:00.000Z",
      "updatedAt": "2025-12-19T14:20:00.000Z"
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

---

### Get Contact Form Query by ID (Admin/Sub-Admin Only)
**GET** `/api/v1/admin/contact-form-queries/:id`

Get a specific contact form query by ID.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "query_id",
    "name": "Brandon",
    "email": "brandon@email.com",
    "phoneNumber": "(406) 555-0120",
    "services": "Craving Change",
    "message": "I need a refill for my prescription medication.",
    "status": "pending",
    "submittedBy": {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phoneNumber": "1234567890"
    },
    "createdAt": "2025-12-20T10:30:00.000Z",
    "updatedAt": "2025-12-20T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `404` - Contact form query not found

---

### Update Contact Form Query (Admin/Sub-Admin Only)
**PUT** `/api/v1/admin/contact-form-queries/:id`

Update a contact form query. When status is updated to `resolved`, `respondedAt` and `respondedBy` are automatically set.

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "status": "resolved",
  "response": "Thank you for contacting us. We have processed your request."
}
```

**Optional Fields:**
- `name` - Name (2-100 characters)
- `email` - Valid email address
- `phoneNumber` - Phone number
- `services` - Service name (2-100 characters)
- `message` - Message (10-2000 characters)
- `status` - Status: `pending`, `in_progress`, `resolved`, `archived`
- `response` - Admin response message (max 2000 characters)

**Response:**
```json
{
  "success": true,
  "message": "Contact form query updated successfully",
  "data": {
    "_id": "query_id",
    "name": "Brandon",
    "email": "brandon@email.com",
    "phoneNumber": "(406) 555-0120",
    "services": "Craving Change",
    "message": "I need a refill for my prescription medication.",
    "status": "resolved",
    "response": "Thank you for contacting us. We have processed your request.",
    "respondedAt": "2025-12-20T11:00:00.000Z",
    "respondedBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com"
    },
    "createdAt": "2025-12-20T10:30:00.000Z",
    "updatedAt": "2025-12-20T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed
- `404` - Contact form query not found

---

### Delete Contact Form Query (Admin/Sub-Admin Only)
**DELETE** `/api/v1/admin/contact-form-queries/:id`

Delete a contact form query.

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "message": "Contact form query deleted successfully"
}
```

**Error Responses:**
- `404` - Contact form query not found

---

## Help Desk APIs

APIs for users to reach the help desk for support. Public endpoint for submitting queries, and admin endpoints for managing queries.

### Submit Help Desk Query (Public)
**POST** `/api/v1/admin/help-desk`

Submit a help desk query. This is a public endpoint - no authentication required.

**Headers:** No authentication required (Public API)

**Request Body:**
```json
{
  "firstName": "John",
  "email": "john@example.com",
  "message": "I need help with my order",
  "priority": "medium",
  "source": "website"
}
```

**Required Fields:**
- `firstName` - First name (1-100 characters)
- `email` - Valid email address (max 255 characters)

**Optional Fields:**
- `message` - Message/query details (max 2000 characters)
- `priority` - Priority level: `low`, `medium`, `high`, `urgent` (default: `medium`)
- `source` - Source of query: `website`, `mobile_app`, `api`, `other` (default: `website`)

**Response:**
```json
{
  "success": true,
  "message": "Help desk query submitted successfully",
  "data": {
    "_id": "query_id",
    "firstName": "John",
    "email": "john@example.com",
    "message": "I need help with my order",
    "status": "pending",
    "priority": "medium",
    "source": "website",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed
- `500` - Server error

**Notes:**
- IP address and user agent are automatically captured
- Query is created with status `pending`
- Admin can view and respond to queries via admin endpoints

---

### Get All Help Desk Queries (Admin/Sub-Admin Only)
**GET** `/api/v1/admin/help-desk?status=pending&priority=high&page=1&limit=20&sortBy=createdAt&sortOrder=desc`

Get list of all help desk queries with filtering, search, and pagination.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `status` (optional) - Filter by status: `pending`, `in_progress`, `resolved`, `closed`
- `priority` (optional) - Filter by priority: `low`, `medium`, `high`, `urgent`
- `email` (optional) - Search by email (case-insensitive)
- `firstName` (optional) - Search by first name (case-insensitive)
- `startDate` (optional) - Filter queries from this date (ISO 8601 format)
- `endDate` (optional) - Filter queries until this date (ISO 8601 format)
- `source` (optional) - Filter by source: `website`, `mobile_app`, `api`, `other`
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20, max: 100)
- `sortBy` (optional) - Sort field: `createdAt`, `updatedAt`, `status`, `priority`, `email`, `firstName` (default: `createdAt`)
- `sortOrder` (optional) - Sort order: `asc` or `desc` (default: `desc`)

**Response:**
```json
{
  "success": true,
  "message": "Help desk queries retrieved successfully",
  "data": [
    {
      "_id": "query_id",
      "firstName": "John",
      "email": "john@example.com",
      "message": "I need help with my order",
      "status": "pending",
      "priority": "high",
      "response": null,
      "respondedBy": null,
      "respondedAt": null,
      "tags": [],
      "source": "website",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Forbidden (admin/sub-admin only)

---

### Get Help Desk Query by ID (Admin/Sub-Admin Only)
**GET** `/api/v1/admin/help-desk/:id`

Get complete details of a specific help desk query.

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `id` (path) - Help desk query ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Help desk query retrieved successfully",
  "data": {
    "_id": "query_id",
    "firstName": "John",
    "email": "john@example.com",
    "message": "I need help with my order",
    "status": "resolved",
    "priority": "high",
    "response": "Thank you for contacting us. We have resolved your order issue.",
    "respondedBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com"
    },
    "respondedAt": "2025-01-15T11:00:00.000Z",
    "tags": ["order", "urgent"],
    "source": "website",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid query ID
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Help desk query not found

---

### Update Help Desk Query (Admin/Sub-Admin Only)
**PUT** `/api/v1/admin/help-desk/:id`

Update a help desk query (status, priority, response, etc.).

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `id` (path) - Help desk query ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "status": "resolved",
  "priority": "high",
  "response": "Thank you for contacting us. We have resolved your order issue.",
  "tags": ["order", "resolved"]
}
```

**Optional Fields:**
- `firstName` - First name (1-100 characters)
- `email` - Valid email address (max 255 characters)
- `message` - Message/query details (max 2000 characters)
- `status` - Status: `pending`, `in_progress`, `resolved`, `closed`
- `priority` - Priority: `low`, `medium`, `high`, `urgent`
- `response` - Admin response (max 5000 characters)
- `tags` - Array of tags (each tag max 50 characters)
- `source` - Source: `website`, `mobile_app`, `api`, `other`

**Response:**
```json
{
  "success": true,
  "message": "Help desk query updated successfully",
  "data": {
    "_id": "query_id",
    "firstName": "John",
    "email": "john@example.com",
    "message": "I need help with my order",
    "status": "resolved",
    "priority": "high",
    "response": "Thank you for contacting us. We have resolved your order issue.",
    "respondedBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com"
    },
    "respondedAt": "2025-01-15T11:00:00.000Z",
    "tags": ["order", "resolved"],
    "source": "website",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed or invalid query ID
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Help desk query not found

**Notes:**
- If `response` is provided and status is updated to `resolved` or `closed`, `respondedBy` and `respondedAt` are automatically set
- Only provided fields will be updated

---

### Delete Help Desk Query (Admin/Sub-Admin Only)
**DELETE** `/api/v1/admin/help-desk/:id`

Delete a help desk query.

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `id` (path) - Help desk query ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Help desk query deleted successfully"
}
```

**Error Responses:**
- `400` - Invalid query ID
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Help desk query not found

---

### Get Help Desk Statistics (Admin/Sub-Admin Only)
**GET** `/api/v1/admin/help-desk/statistics`

Get statistics about help desk queries (total, by status, by priority, by source).

**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "message": "Help desk statistics retrieved successfully",
  "data": {
    "total": 150,
    "byStatus": {
      "pending": 25,
      "inProgress": 10,
      "resolved": 100,
      "closed": 15
    },
    "byPriority": {
      "urgent": 5,
      "high": 20
    },
    "bySource": {
      "website": 120,
      "mobile_app": 25,
      "api": 3,
      "other": 2
    },
    "statusBreakdown": {
      "pending": 25,
      "in_progress": 10,
      "resolved": 100,
      "closed": 15
    }
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Forbidden

**Notes:**
- `byPriority.urgent` and `byPriority.high` only count queries that are not closed
- Statistics are calculated in real-time from the database

---

## Health APIs (Public)

APIs for managing health categories, chronic conditions (types), medications with filters, trendy medications, and best offers.

### Get All Health Categories

**GET** `/api/v1/health/categories?search=respiratory&isActive=true&page=1&limit=10&sortBy=order&sortOrder=asc`

Get list of all health categories with search, filter, and pagination.

**Headers:** No authentication required (Public API)

**Query Parameters:**
- `search` (optional) - Search by name, slug, or description
- `isActive` (optional) - Filter by active status: `true` or `false` (default: `true`)
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 100, max: 100)
- `sortBy` (optional) - Sort field: `name`, `order`, `createdAt`, `updatedAt` (default: `order`)
- `sortOrder` (optional) - Sort order: `asc` or `desc` (default: `asc`)

**Response:**
```json
{
  "success": true,
  "message": "Health categories retrieved successfully",
  "data": [
    {
      "_id": "health_category_id",
      "name": "Respiratory Health",
      "slug": "respiratory-health",
      "description": "Medications and treatments for respiratory conditions",
      "icon": "https://example.com/icons/respiratory.svg",
      "types": [
        {
          "name": "Asthma",
          "slug": "asthma",
          "description": "Medications for asthma management",
          "icon": "https://example.com/icons/asthma.svg",
          "order": 0,
          "isActive": true
        },
        {
          "name": "COPD",
          "slug": "copd",
          "description": "Medications for chronic obstructive pulmonary disease",
          "icon": "https://example.com/icons/copd.svg",
          "order": 1,
          "isActive": true
        }
      ],
      "order": 0,
      "isActive": true,
      "createdBy": {
        "_id": "admin_id",
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@example.com"
      },
      "updatedBy": {
        "_id": "admin_id",
        "firstName": "Admin",
        "lastName": "User"
      },
      "createdAt": "2025-01-01T10:00:00.000Z",
      "updatedAt": "2025-01-03T12:30:00.000Z"
    },
    {
      "_id": "health_category_id_2",
      "name": "Eye Care",
      "slug": "eye-care",
      "description": "Medications and treatments for eye conditions",
      "icon": "https://example.com/icons/eye-care.svg",
      "types": [
        {
          "name": "Dry Eye",
          "slug": "dry-eye",
          "description": "Medications for dry eye syndrome",
          "icon": "https://example.com/icons/dry-eye.svg",
          "order": 0,
          "isActive": true
        }
      ],
      "order": 1,
      "isActive": true,
      "createdAt": "2025-01-01T10:00:00.000Z",
      "updatedAt": "2025-01-03T12:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "pages": 2
  }
}
```

**Notes:**
- Only active categories and types are returned by default
- Types are automatically filtered to show only active ones

---

### Get Health Category by ID

**GET** `/api/v1/health/categories/:id`

Get a specific health category by its ID.

**Headers:** No authentication required (Public API)

**Parameters:**
- `id` (path) - Health category ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Health category retrieved successfully",
  "data": {
    "_id": "health_category_id",
    "name": "Respiratory Health",
    "slug": "respiratory-health",
    "description": "Medications and treatments for respiratory conditions",
    "icon": "https://example.com/icons/respiratory.svg",
    "types": [
      {
        "name": "Asthma",
        "slug": "asthma",
        "description": "Medications for asthma management",
        "icon": "https://example.com/icons/asthma.svg",
        "order": 0,
        "isActive": true
      },
      {
        "name": "COPD",
        "slug": "copd",
        "description": "Medications for chronic obstructive pulmonary disease",
        "icon": "https://example.com/icons/copd.svg",
        "order": 1,
        "isActive": true
      }
    ],
    "order": 0,
    "isActive": true,
    "createdBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User"
    },
    "updatedBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User"
    },
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-03T12:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid health category ID
- `404` - Health category not found

---

### Get Health Category by Slug

**GET** `/api/v1/health/categories/slug/:slug`

Get a specific health category by its slug.

**Headers:** No authentication required (Public API)

**Parameters:**
- `slug` (path) - Health category slug (e.g., `respiratory-health`)

**Response:**
```json
{
  "success": true,
  "message": "Health category retrieved successfully",
  "data": {
    "_id": "health_category_id",
    "name": "Respiratory Health",
    "slug": "respiratory-health",
    "description": "Medications and treatments for respiratory conditions",
    "icon": "https://example.com/icons/respiratory.svg",
    "types": [
      {
        "name": "Asthma",
        "slug": "asthma",
        "description": "Medications for asthma management",
        "icon": "https://example.com/icons/asthma.svg",
        "order": 0,
        "isActive": true
      }
    ],
    "order": 0,
    "isActive": true,
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-03T12:30:00.000Z"
  }
}
```

**Error Responses:**
- `404` - Health category not found

---

### Get Category Types (Chronic Conditions)

**GET** `/api/v1/health/categories/:categoryId/types`

Get all types (chronic conditions) for a specific health category.

**Headers:** No authentication required (Public API)

**Parameters:**
- `categoryId` (path) - Health category ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Category types retrieved successfully",
  "data": {
    "category": {
      "_id": "health_category_id",
      "name": "Respiratory Health",
      "slug": "respiratory-health"
    },
    "types": [
      {
        "name": "Asthma",
        "slug": "asthma",
        "description": "Medications for asthma management",
        "icon": "https://example.com/icons/asthma.svg",
        "order": 0,
        "isActive": true
      },
      {
        "name": "COPD",
        "slug": "copd",
        "description": "Medications for chronic obstructive pulmonary disease",
        "icon": "https://example.com/icons/copd.svg",
        "order": 1,
        "isActive": true
      },
      {
        "name": "Bronchitis",
        "slug": "bronchitis",
        "description": "Medications for bronchitis treatment",
        "icon": "https://example.com/icons/bronchitis.svg",
        "order": 2,
        "isActive": true
      }
    ]
  }
}
```

**Error Responses:**
- `400` - Invalid health category ID
- `404` - Health category not found

**Notes:**
- Only active types are returned
- Types are sorted by order field

---

### Get Medications by Health Category ID

**GET** `/api/v1/health/categories/:categoryId/medications?search=inhaler&healthTypeSlug=asthma&minPrice=100&maxPrice=500&status=in_stock&inStock=true&sortBy=salePrice&sortOrder=asc&page=1&limit=20`

Get all medications for a specific health category with optional filters.

**Headers:** No authentication required (Public API)

**Parameters:**
- `categoryId` (path) - Health category ID (MongoDB ObjectId)

**Query Parameters:**
- `search` (optional) - Search by product name, brand, category, or generics
- `healthTypeSlug` (optional) - Filter by health type slug (chronic condition, e.g., 'asthma', 'dry-eye')
- `minPrice` (optional) - Minimum price filter (number)
- `maxPrice` (optional) - Maximum price filter (number)
- `status` (optional) - Filter by status: `in_stock`, `low_stock`, `out_of_stock`, `discontinued`
- `inStock` (optional) - Filter for in-stock items only (boolean: `true`/`false`)
- `sortBy` (optional) - Sort field: `createdAt`, `productName`, `salePrice`, `views` (default: `createdAt`)
- `sortOrder` (optional) - Sort order: `asc` or `desc` (default: `desc`)
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "message": "Medications retrieved successfully",
  "data": {
    "category": {
      "_id": "695bf39bdad7abe7762c1b0f",
      "name": "Respiratory Health",
      "slug": "respiratory-health",
      "description": "Medications and treatments for respiratory conditions",
      "icon": "https://example.com/icons/respiratory.svg"
    },
    "medications": [
      {
        "_id": "medicine_id",
        "productName": "Albuterol Inhaler",
        "brand": "ProAir",
        "originalPrice": 45.99,
        "salePrice": 29.99,
        "images": {
          "thumbnail": "https://example.com/images/albuterol-thumb.jpg",
          "gallery": [
            "https://example.com/images/albuterol-1.jpg",
            "https://example.com/images/albuterol-2.jpg"
          ]
        },
        "description": "Bronchodilator for asthma relief",
        "category": "Respiratory",
        "healthCategory": {
          "_id": "695bf39bdad7abe7762c1b0f",
          "name": "Respiratory Health",
          "slug": "respiratory-health",
          "description": "Medications and treatments for respiratory conditions",
          "icon": "https://example.com/icons/respiratory.svg"
        },
        "healthTypeSlug": "asthma",
        "stock": 150,
        "status": "in_stock",
        "views": 250,
        "isTrendy": true,
        "isBestOffer": false,
        "createdAt": "2025-01-01T10:00:00.000Z",
        "updatedAt": "2025-01-05T12:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

**Example Requests:**

1. **Get all medications for a category:**
```
GET /api/v1/health/categories/695bf39bdad7abe7762c1b0f/medications
```

2. **Get medications with filters:**
```
GET /api/v1/health/categories/695bf39bdad7abe7762c1b0f/medications?healthTypeSlug=asthma&status=in_stock&sortBy=salePrice&sortOrder=asc
```

3. **Search within category:**
```
GET /api/v1/health/categories/695bf39bdad7abe7762c1b0f/medications?search=inhaler&minPrice=20&maxPrice=50
```

**Error Responses:**
- `400` - Invalid health category ID or invalid query parameters
- `404` - Health category not found
- `500` - Server error

**Notes:**
- This endpoint automatically filters medications by the specified health category
- Only returns active and visible medicines
- Health category information is included in the response
- Supports pagination and advanced filtering

**Alternative Endpoint:**
You can also use the shorter path:
```
GET /api/v1/health/medicines/:categoryId
```
This is equivalent to `/categories/:categoryId/medications` and returns the same response.

---

### Get Medications with Filters

**GET** `/api/v1/health/medications?search=inhaler&category=Respiratory&healthTypeSlug=asthma&minPrice=100&maxPrice=500&status=in_stock&inStock=true&sortBy=salePrice&sortOrder=asc&page=1&limit=20`

Get medications with advanced filtering options.

**Headers:** No authentication required (Public API)

**Query Parameters:**
- `search` (optional) - Search by product name, brand, category, or generics
- `category` (optional) - Filter by medicine category (string, case-insensitive)
- `healthCategoryId` (optional) - Filter by health category ID (MongoDB ObjectId)
- `healthTypeSlug` (optional) - Filter by chronic condition slug (e.g., `asthma`, `dry-eye`)
- `minPrice` (optional) - Minimum price filter (number)
- `maxPrice` (optional) - Maximum price filter (number)
- `status` (optional) - Filter by stock status: `in_stock`, `low_stock`, `out_of_stock`
- `inStock` (optional) - Filter for in-stock items only: `true` or `false`
- `sortBy` (optional) - Sort field: `productName`, `brand`, `salePrice`, `originalPrice`, `createdAt`, `updatedAt` (default: `createdAt`)
- `sortOrder` (optional) - Sort order: `asc` or `desc` (default: `desc`)
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "message": "Medications retrieved successfully",
  "data": [
    {
      "_id": "medicine_id",
      "productName": "Albuterol Inhaler",
      "brand": "ProAir",
      "originalPrice": 45.99,
      "salePrice": 39.99,
      "images": {
        "thumbnail": "https://example.com/images/albuterol-thumb.jpg",
        "gallery": [
          "https://example.com/images/albuterol-1.jpg",
          "https://example.com/images/albuterol-2.jpg"
        ]
      },
      "description": "Fast-acting bronchodilator for asthma relief",
      "howItWorks": "Relaxes muscles in airways to improve breathing",
      "category": "Respiratory",
      "generics": ["Albuterol Sulfate", "Salbutamol"],
      "dosageOptions": [
        {
          "name": "90mcg - 200 Doses",
          "priceAdjustment": 0,
          "_id": "dosage_id_1"
        },
        {
          "name": "180mcg - 200 Doses",
          "priceAdjustment": 5.00,
          "_id": "dosage_id_2"
        }
      ],
      "quantityOptions": [
        {
          "name": "1 Inhaler",
          "priceAdjustment": 0,
          "_id": "quantity_id_1"
        },
        {
          "name": "2 Inhalers",
          "priceAdjustment": -5.00,
          "_id": "quantity_id_2"
        }
      ],
      "usage": [
        {
          "title": "For Asthma Attacks",
          "description": "Use 1-2 puffs as needed for immediate relief"
        },
        {
          "title": "Preventive Use",
          "description": "Use 15-30 minutes before exercise"
        }
      ],
      "precautions": "Do not exceed recommended dosage. Consult doctor if symptoms worsen.",
      "sideEffects": "May cause nervousness, dizziness, or rapid heartbeat",
      "drugInteractions": "May interact with beta-blockers. Consult doctor before use.",
      "indications": "Used for treating and preventing asthma attacks and exercise-induced bronchospasm",
      "stock": 150,
      "status": "in_stock",
      "visibility": true,
      "isActive": true,
      "createdAt": "2025-01-01T10:00:00.000Z",
      "updatedAt": "2025-01-03T12:30:00.000Z"
    },
    {
      "_id": "medicine_id_2",
      "productName": "Salmeterol Inhaler",
      "brand": "Serevent",
      "originalPrice": 55.99,
      "salePrice": 49.99,
      "images": {
        "thumbnail": "https://example.com/images/salmeterol-thumb.jpg",
        "gallery": []
      },
      "description": "Long-acting bronchodilator for asthma control",
      "category": "Respiratory",
      "generics": ["Salmeterol Xinafoate"],
      "stock": 75,
      "status": "in_stock",
      "visibility": true,
      "isActive": true,
      "createdAt": "2025-01-02T10:00:00.000Z",
      "updatedAt": "2025-01-03T12:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

**Error Responses:**
- `400` - Invalid query parameters

**Notes:**
- Only active and visible medications are returned
- `healthTypeSlug` filters medications by chronic condition (e.g., `asthma`, `dry-eye`)
- Price filters work on `salePrice` field
- `inStock=true` returns medications with status `in_stock` or `low_stock`

---

### Get Trendy Medications

**GET** `/api/v1/health/medications/trendy?limit=10&category=Respiratory`

Get trendy/popular medications (newest first by default).

**Headers:** No authentication required (Public API)

**Query Parameters:**
- `limit` (optional) - Number of medications to return (default: 10, max: 50)
- `category` (optional) - Filter by medicine category (string, case-insensitive)

**Response:**
```json
{
  "success": true,
  "message": "Trendy medications retrieved successfully",
  "data": [
    {
      "_id": "medicine_id",
      "productName": "Albuterol Inhaler",
      "brand": "ProAir",
      "originalPrice": 45.99,
      "salePrice": 39.99,
      "images": {
        "thumbnail": "https://example.com/images/albuterol-thumb.jpg",
        "gallery": []
      },
      "description": "Fast-acting bronchodilator for asthma relief",
      "category": "Respiratory",
      "stock": 150,
      "status": "in_stock",
      "visibility": true,
      "isActive": true,
      "createdAt": "2025-01-05T10:00:00.000Z",
      "updatedAt": "2025-01-05T10:00:00.000Z"
    },
    {
      "_id": "medicine_id_2",
      "productName": "Artificial Tears",
      "brand": "Systane",
      "originalPrice": 12.99,
      "salePrice": 9.99,
      "images": {
        "thumbnail": "https://example.com/images/tears-thumb.jpg",
        "gallery": []
      },
      "description": "Lubricating eye drops for dry eye relief",
      "category": "Eye Care",
      "stock": 200,
      "status": "in_stock",
      "visibility": true,
      "isActive": true,
      "createdAt": "2025-01-04T10:00:00.000Z",
      "updatedAt": "2025-01-04T10:00:00.000Z"
    }
  ]
}
```

**Notes:**
- Returns newest medications first (sorted by `createdAt` desc)
- Only returns in-stock or low-stock medications
- Only active and visible medications are returned

---

### Get Best Offers

**GET** `/api/v1/health/medications/best-offers?limit=10&category=Respiratory`

Get medications with highest discount percentage (best offers).

**Headers:** No authentication required (Public API)

**Query Parameters:**
- `limit` (optional) - Number of medications to return (default: 10, max: 50)
- `category` (optional) - Filter by medicine category (string, case-insensitive)

**Response:**
```json
{
  "success": true,
  "message": "Best offers retrieved successfully",
  "data": [
    {
      "_id": "medicine_id",
      "productName": "Albuterol Inhaler",
      "brand": "ProAir",
      "originalPrice": 45.99,
      "salePrice": 29.99,
      "discount": 34.79,
      "images": {
        "thumbnail": "https://example.com/images/albuterol-thumb.jpg",
        "gallery": []
      },
      "description": "Fast-acting bronchodilator for asthma relief",
      "category": "Respiratory",
      "stock": 150,
      "status": "in_stock",
      "visibility": true,
      "isActive": true,
      "createdAt": "2025-01-01T10:00:00.000Z",
      "updatedAt": "2025-01-03T12:30:00.000Z"
    },
    {
      "_id": "medicine_id_2",
      "productName": "Artificial Tears",
      "brand": "Systane",
      "originalPrice": 12.99,
      "salePrice": 9.99,
      "discount": 23.09,
      "images": {
        "thumbnail": "https://example.com/images/tears-thumb.jpg",
        "gallery": []
      },
      "description": "Lubricating eye drops for dry eye relief",
      "category": "Eye Care",
      "stock": 200,
      "status": "in_stock",
      "visibility": true,
      "isActive": true,
      "createdAt": "2025-01-02T10:00:00.000Z",
      "updatedAt": "2025-01-02T10:00:00.000Z"
    },
    {
      "_id": "medicine_id_3",
      "productName": "Fluticasone Nasal Spray",
      "brand": "Flonase",
      "originalPrice": 25.99,
      "salePrice": 21.99,
      "discount": 15.39,
      "images": {
        "thumbnail": "https://example.com/images/flonase-thumb.jpg",
        "gallery": []
      },
      "description": "Nasal corticosteroid for allergy relief",
      "category": "Respiratory",
      "stock": 100,
      "status": "in_stock",
      "visibility": true,
      "isActive": true,
      "createdAt": "2025-01-03T10:00:00.000Z",
      "updatedAt": "2025-01-03T10:00:00.000Z"
    }
  ]
}
```

**Notes:**
- Medications are sorted by discount percentage (highest first)
- Discount is calculated as: `((originalPrice - salePrice) / originalPrice) * 100`
- Only returns in-stock or low-stock medications
- Only active and visible medications are returned
- Each medication includes a `discount` field showing the discount percentage

---

## Health Category Management APIs (Admin/Sub-Admin Only)

APIs for managing health categories and their types (chronic conditions). These endpoints require admin or sub-admin authentication.

### Create Health Category

**POST** `/api/v1/health/categories`

Create a new health category with optional types (chronic conditions).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "name": "Respiratory Health",
  "slug": "respiratory-health",
  "description": "Medications and treatments for respiratory conditions",
  "icon": "https://example.com/icons/respiratory.svg",
  "types": [
    {
      "name": "Asthma",
      "slug": "asthma",
      "description": "Medications for asthma management",
      "icon": "https://example.com/icons/asthma.svg",
      "order": 0,
      "isActive": true
    },
    {
      "name": "COPD",
      "slug": "copd",
      "description": "Medications for chronic obstructive pulmonary disease",
      "icon": "https://example.com/icons/copd.svg",
      "order": 1,
      "isActive": true
    },
    {
      "name": "Dry Eye",
      "slug": "dry-eye",
      "description": "Medications for dry eye syndrome",
      "icon": "https://example.com/icons/dry-eye.svg",
      "order": 0,
      "isActive": true
    }
  ],
  "order": 0,
  "isActive": true
}
```

**Required Fields:**
- `name` - Category name (2-100 characters)

**Optional Fields:**
- `slug` - Category slug (auto-generated from name if not provided)
- `description` - Category description (max 500 characters)
- `icon` - Icon URL or icon name
- `types` - Array of type objects (chronic conditions)
  - `name` - Type name (required if types array provided, 2-100 characters)
  - `slug` - Type slug (auto-generated from name if not provided)
  - `description` - Type description (max 500 characters)
  - `icon` - Type icon URL
  - `order` - Display order (default: 0)
  - `isActive` - Active status (default: true)
- `order` - Display order (default: 0)
- `isActive` - Active status (default: true)

**Response:**
```json
{
  "success": true,
  "message": "Health category created successfully",
  "data": {
    "_id": "health_category_id",
    "name": "Respiratory Health",
    "slug": "respiratory-health",
    "description": "Medications and treatments for respiratory conditions",
    "icon": "https://example.com/icons/respiratory.svg",
    "types": [
      {
        "name": "Asthma",
        "slug": "asthma",
        "description": "Medications for asthma management",
        "icon": "https://example.com/icons/asthma.svg",
        "order": 0,
        "isActive": true
      },
      {
        "name": "COPD",
        "slug": "copd",
        "description": "Medications for chronic obstructive pulmonary disease",
        "icon": "https://example.com/icons/copd.svg",
        "order": 1,
        "isActive": true
      }
    ],
    "order": 0,
    "isActive": true,
    "createdBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com"
    },
    "updatedBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com"
    },
    "createdAt": "2025-01-05T10:00:00.000Z",
    "updatedAt": "2025-01-05T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed
- `401` - Unauthorized
- `403` - Forbidden (admin/sub-admin only)
- `409` - Category with this name or slug already exists

---

### Update Health Category

**PUT** `/api/v1/health/categories/:id`

Update an existing health category.

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `id` (path) - Health category ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "name": "Respiratory Health Updated",
  "description": "Updated description for respiratory health",
  "icon": "https://example.com/icons/respiratory-new.svg",
  "types": [
    {
      "name": "Asthma",
      "slug": "asthma",
      "description": "Updated asthma description",
      "icon": "https://example.com/icons/asthma-new.svg",
      "order": 0,
      "isActive": true
    },
    {
      "name": "Bronchitis",
      "slug": "bronchitis",
      "description": "Medications for bronchitis",
      "icon": "https://example.com/icons/bronchitis.svg",
      "order": 2,
      "isActive": true
    }
  ],
  "order": 1,
  "isActive": true
}
```

**All Fields are Optional:**
- `name` - Category name (2-100 characters)
- `slug` - Category slug (lowercase alphanumeric with hyphens)
- `description` - Category description (max 500 characters)
- `icon` - Icon URL
- `types` - Array of type objects (replaces existing types)
- `order` - Display order
- `isActive` - Active status

**Response:**
```json
{
  "success": true,
  "message": "Health category updated successfully",
  "data": {
    "_id": "health_category_id",
    "name": "Respiratory Health Updated",
    "slug": "respiratory-health",
    "description": "Updated description for respiratory health",
    "icon": "https://example.com/icons/respiratory-new.svg",
    "types": [
      {
        "name": "Asthma",
        "slug": "asthma",
        "description": "Updated asthma description",
        "icon": "https://example.com/icons/asthma-new.svg",
        "order": 0,
        "isActive": true
      },
      {
        "name": "Bronchitis",
        "slug": "bronchitis",
        "description": "Medications for bronchitis",
        "icon": "https://example.com/icons/bronchitis.svg",
        "order": 2,
        "isActive": true
      }
    ],
    "order": 1,
    "isActive": true,
    "createdBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User"
    },
    "updatedBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com"
    },
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-05T12:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid health category ID or validation failed
- `401` - Unauthorized
- `403` - Forbidden (admin/sub-admin only)
- `404` - Health category not found
- `409` - Category with this name or slug already exists

**Notes:**
- Updating `types` array will replace all existing types
- Slug is auto-generated from name if name is updated and slug is not provided
- Type slugs are auto-generated from type names if not provided

---

### Activate Health Category

**PUT** `/api/v1/health/categories/:id/activate`

Activate a health category (set `isActive` to `true`).

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `id` (path) - Health category ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Health category activated successfully",
  "data": {
    "_id": "health_category_id",
    "name": "Respiratory Health",
    "slug": "respiratory-health",
    "isActive": true,
    "updatedBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User"
    },
    "updatedAt": "2025-01-05T12:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid health category ID
- `401` - Unauthorized
- `403` - Forbidden (admin/sub-admin only)
- `404` - Health category not found

---

### Deactivate Health Category

**PUT** `/api/v1/health/categories/:id/deactivate`

Deactivate a health category (set `isActive` to `false`).

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `id` (path) - Health category ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Health category deactivated successfully",
  "data": {
    "_id": "health_category_id",
    "name": "Respiratory Health",
    "slug": "respiratory-health",
    "isActive": false,
    "updatedBy": {
      "_id": "admin_id",
      "firstName": "Admin",
      "lastName": "User"
    },
    "updatedAt": "2025-01-05T12:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid health category ID
- `401` - Unauthorized
- `403` - Forbidden (admin/sub-admin only)
- `404` - Health category not found

---

### Delete Health Category

**DELETE** `/api/v1/health/categories/:id`

Delete a health category (soft delete - sets `isActive` to `false`).

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `id` (path) - Health category ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Health category deleted successfully",
  "data": {
    "message": "Health category deleted successfully"
  }
}
```

**Error Responses:**
- `400` - Invalid health category ID
- `401` - Unauthorized
- `403` - Forbidden (admin/sub-admin only)
- `404` - Health category not found

**Notes:**
- This is a soft delete operation (sets `isActive` to `false`)
- Deleted categories will not appear in public GET requests
- Category can be reactivated using the activate endpoint

---

## Medicine Management APIs (Admin/Sub-Admin Only)

APIs for managing medicine relationships with health categories and marking medicines as trendy or best offers.

### Mark Medicine as Trendy

**PUT** `/api/v1/health/medications/:id/mark-trendy`

Mark a medicine as trendy (will appear in trendy medications API).

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `id` (path) - Medicine ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Medicine marked as trendy successfully",
  "data": {
    "_id": "medicine_id",
    "productName": "Albuterol Inhaler",
    "brand": "ProAir",
    "isTrendy": true,
    "healthCategory": {
      "_id": "health_category_id",
      "name": "Respiratory Health",
      "slug": "respiratory-health",
      "description": "Medications for respiratory conditions",
      "icon": "https://example.com/icons/respiratory.svg"
    },
    "healthTypeSlug": "asthma",
    "views": 150,
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-05T12:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid medicine ID
- `401` - Unauthorized
- `403` - Forbidden (admin/sub-admin only)
- `404` - Medicine not found

---

### Unmark Medicine as Trendy

**PUT** `/api/v1/health/medications/:id/unmark-trendy`

Unmark a medicine as trendy.

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `id` (path) - Medicine ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Medicine unmarked as trendy successfully",
  "data": {
    "_id": "medicine_id",
    "productName": "Albuterol Inhaler",
    "brand": "ProAir",
    "isTrendy": false,
    "healthCategory": {
      "_id": "health_category_id",
      "name": "Respiratory Health",
      "slug": "respiratory-health"
    },
    "updatedAt": "2025-01-05T12:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid medicine ID
- `401` - Unauthorized
- `403` - Forbidden (admin/sub-admin only)
- `404` - Medicine not found

---

### Mark Medicine as Best Offer

**PUT** `/api/v1/health/medications/:id/mark-best-offer`

Mark a medicine as best offer (will appear in best offers API). You can optionally set a discount percentage.

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `id` (path) - Medicine ID (MongoDB ObjectId)

**Request Body (Optional):**
```json
{
  "discountPercentage": 25.5
}
```

**Fields:**
- `discountPercentage` (optional) - Discount percentage (0-100). If not provided, discount is calculated from `originalPrice` and `salePrice`.

**Response:**
```json
{
  "success": true,
  "message": "Medicine marked as best offer successfully",
  "data": {
    "_id": "medicine_id",
    "productName": "Albuterol Inhaler",
    "brand": "ProAir",
    "originalPrice": 45.99,
    "salePrice": 29.99,
    "isBestOffer": true,
    "discountPercentage": 25.5,
    "healthCategory": {
      "_id": "health_category_id",
      "name": "Respiratory Health",
      "slug": "respiratory-health"
    },
    "healthTypeSlug": "asthma",
    "views": 150,
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-05T12:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid medicine ID
- `401` - Unauthorized
- `403` - Forbidden (admin/sub-admin only)
- `404` - Medicine not found

---

### Unmark Medicine as Best Offer

**PUT** `/api/v1/health/medications/:id/unmark-best-offer`

Unmark a medicine as best offer.

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `id` (path) - Medicine ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Medicine unmarked as best offer successfully",
  "data": {
    "_id": "medicine_id",
    "productName": "Albuterol Inhaler",
    "brand": "ProAir",
    "isBestOffer": false,
    "healthCategory": {
      "_id": "health_category_id",
      "name": "Respiratory Health",
      "slug": "respiratory-health"
    },
    "updatedAt": "2025-01-05T12:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid medicine ID
- `401` - Unauthorized
- `403` - Forbidden (admin/sub-admin only)
- `404` - Medicine not found

---

### Update Medicine Health Category and Type

**PUT** `/api/v1/health/medications/:id/health-relation`

Update a medicine's relationship with health category and type (chronic condition).

**Headers:** `Authorization: Bearer <admin_token>`

**Parameters:**
- `id` (path) - Medicine ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "healthCategory": "health_category_id",
  "healthTypeSlug": "asthma"
}
```

**Fields:**
- `healthCategory` (optional) - Health category ID (MongoDB ObjectId)
- `healthTypeSlug` (optional) - Health type slug (e.g., 'asthma', 'dry-eye')

**Response:**
```json
{
  "success": true,
  "message": "Medicine health relation updated successfully",
  "data": {
    "_id": "medicine_id",
    "productName": "Albuterol Inhaler",
    "brand": "ProAir",
    "healthCategory": {
      "_id": "health_category_id",
      "name": "Respiratory Health",
      "slug": "respiratory-health",
      "description": "Medications for respiratory conditions",
      "icon": "https://example.com/icons/respiratory.svg",
      "types": [
        {
          "name": "Asthma",
          "slug": "asthma",
          "description": "Medications for asthma management",
          "icon": "https://example.com/icons/asthma.svg",
          "order": 0,
          "isActive": true
        }
      ]
    },
    "healthTypeSlug": "asthma",
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-05T12:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid medicine ID or health category ID
- `401` - Unauthorized
- `403` - Forbidden (admin/sub-admin only)
- `404` - Medicine not found, health category not found, or health type not found in category

**Notes:**
- If `healthTypeSlug` is provided, it must exist in the selected `healthCategory`
- Both fields are optional - you can update just one or both
- The health type slug is validated against the health category's types

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

