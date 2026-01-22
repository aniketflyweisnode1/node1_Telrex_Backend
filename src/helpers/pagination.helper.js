/**
 * Pagination Helper - Shared utilities for pagination
 */

/**
 * Parse pagination parameters from query
 * @param {Object} query - Request query object
 * @param {Object} defaults - Default values { page: 1, limit: 10 }
 * @returns {Object} { page, limit, skip }
 */
const parsePagination = (query = {}, defaults = {}) => {
  const page = Math.max(1, parseInt(query.page) || defaults.page || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || defaults.limit || 10));
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

/**
 * Build pagination response object
 * @param {number} total - Total count of documents
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const buildPaginationResponse = (total, page, limit) => {
  const pages = Math.ceil(total / limit);
  
  return {
    total,
    page,
    limit,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1
  };
};

/**
 * Execute paginated query with count
 * @param {Model} model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {Object} options - { page, limit, sort, populate, select, lean }
 * @returns {Object} { data, pagination }
 */
const paginatedQuery = async (model, filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 }, populate, select, lean = true } = options;
  const skip = (page - 1) * limit;
  
  // Run count and find in parallel
  const [total, data] = await Promise.all([
    model.countDocuments(filter),
    (() => {
      let query = model.find(filter).sort(sort).skip(skip).limit(limit);
      
      if (populate) {
        if (Array.isArray(populate)) {
          populate.forEach(p => { query = query.populate(p); });
        } else {
          query = query.populate(populate);
        }
      }
      
      if (select) query = query.select(select);
      if (lean) query = query.lean();
      
      return query;
    })()
  ]);
  
  return {
    data,
    pagination: buildPaginationResponse(total, page, limit)
  };
};

module.exports = {
  parsePagination,
  buildPaginationResponse,
  paginatedQuery
};

