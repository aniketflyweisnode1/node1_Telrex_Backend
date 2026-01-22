/**
 * Product Helper - Shared utilities for product-related operations
 * Batch fetching, enriching items with product details
 */

const mongoose = require('mongoose');
const Medicine = require('../models/Medicine.model');

// Medicine fields to select for list views
const MEDICINE_LIST_FIELDS = 'productName brand originalPrice salePrice images description generics dosageOptions quantityOptions category stock status visibility isActive';

// Medicine fields for detailed views
const MEDICINE_DETAIL_FIELDS = `${MEDICINE_LIST_FIELDS} healthCategory healthTypeSlug isTrendy isBestOffer discountPercentage views`;

/**
 * Batch fetch medicines by IDs
 * @param {Array<string>} medicineIds - Array of medicine IDs
 * @param {string} selectFields - Fields to select (default: list fields)
 * @returns {Map} Map of medicineId -> medicine document
 */
const batchFetchMedicines = async (medicineIds, selectFields = MEDICINE_LIST_FIELDS) => {
  if (!medicineIds || medicineIds.length === 0) {
    return new Map();
  }
  
  // Filter valid ObjectIds
  const validIds = medicineIds.filter(id => mongoose.Types.ObjectId.isValid(id));
  
  if (validIds.length === 0) {
    return new Map();
  }
  
  const medicines = await Medicine.find({ _id: { $in: validIds } })
    .select(selectFields)
    .lean();
  
  return new Map(medicines.map(m => [m._id.toString(), m]));
};

/**
 * Batch fetch doctor note templates by IDs
 * @param {Array<string>} templateIds - Array of template IDs
 * @returns {Map} Map of templateId -> template document
 */
const batchFetchDoctorNoteTemplates = async (templateIds) => {
  if (!templateIds || templateIds.length === 0) {
    return new Map();
  }
  
  const validIds = templateIds.filter(id => mongoose.Types.ObjectId.isValid(id));
  
  if (validIds.length === 0) {
    return new Map();
  }
  
  const DoctorNoteTemplate = require('../models/DoctorNoteTemplate.model');
  const templates = await DoctorNoteTemplate.find({ _id: { $in: validIds } })
    .select('productName image price title description')
    .lean();
  
  return new Map(templates.map(t => [t._id.toString(), t]));
};

/**
 * Collect product IDs from items grouped by type
 * @param {Array} items - Array of items with productId and productType
 * @returns {Object} { medicationIds: [], templateIds: [] }
 */
const collectProductIds = (items) => {
  const medicationIds = [];
  const templateIds = [];
  
  if (!items || !Array.isArray(items)) {
    return { medicationIds, templateIds };
  }
  
  items.forEach(item => {
    if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
      const idStr = item.productId.toString();
      
      if (item.productType === 'medication') {
        medicationIds.push(idStr);
      } else if (item.productType === 'doctors_note') {
        templateIds.push(idStr);
      }
    }
  });
  
  return { medicationIds, templateIds };
};

/**
 * Enrich items with product details using lookup maps
 * @param {Array} items - Array of items
 * @param {Map} medicineMap - Medicine lookup map
 * @param {Map} templateMap - Template lookup map
 * @returns {Array} Enriched items
 */
const enrichItemsWithProducts = (items, medicineMap, templateMap) => {
  if (!items || !Array.isArray(items)) return [];
  
  return items.map(item => {
    if (!item.productId) return item;
    
    const productIdStr = item.productId.toString();
    
    if (item.productType === 'medication') {
      const medicine = medicineMap.get(productIdStr);
      if (medicine) {
        return {
          ...item,
          productImage: medicine.images?.thumbnail || item.productImage || null,
          productDetails: {
            brand: medicine.brand,
            images: medicine.images,
            salePrice: medicine.salePrice,
            originalPrice: medicine.originalPrice
          },
          product: medicine // Full product for order items
        };
      }
    } else if (item.productType === 'doctors_note') {
      const template = templateMap.get(productIdStr);
      if (template) {
        return {
          ...item,
          productImage: template.image?.url || item.productImage || null,
          productDetails: {
            image: template.image,
            price: template.price,
            title: template.title,
            description: template.description
          }
        };
      }
    }
    
    return item;
  });
};

/**
 * Batch populate product details for cart/order items
 * Single entry point for all product enrichment
 * @param {Array} items - Array of items
 * @returns {Array} Enriched items
 */
const batchPopulateProducts = async (items) => {
  if (!items || items.length === 0) return [];
  
  // Collect IDs by type
  const { medicationIds, templateIds } = collectProductIds(items);
  
  // Batch fetch in parallel
  const [medicineMap, templateMap] = await Promise.all([
    batchFetchMedicines(medicationIds),
    batchFetchDoctorNoteTemplates(templateIds)
  ]);
  
  // Enrich and return
  return enrichItemsWithProducts(items, medicineMap, templateMap);
};

/**
 * Batch populate medicines for orders (orders array)
 * @param {Array} orders - Array of order documents
 * @returns {Array} Orders with enriched items
 */
const batchPopulateMedicinesForOrders = async (orders) => {
  if (!orders || orders.length === 0) return orders;
  
  // Collect all medication IDs across all orders
  const allMedicationIds = new Set();
  
  orders.forEach(order => {
    if (order.items) {
      order.items.forEach(item => {
        if (item.productId && item.productType === 'medication') {
          allMedicationIds.add(item.productId.toString());
        }
      });
    }
  });
  
  if (allMedicationIds.size === 0) return orders;
  
  // Single batch query
  const medicineMap = await batchFetchMedicines(Array.from(allMedicationIds));
  
  // Enrich all orders
  return orders.map(order => {
    if (!order.items) return order;
    
    const enrichedItems = order.items.map(item => {
      if (item.productType === 'medication' && item.productId) {
        const medicine = medicineMap.get(item.productId.toString());
        if (medicine) {
          return { ...item, product: medicine };
        }
      }
      return item;
    });
    
    return {
      ...order,
      items: enrichedItems,
      billingAddress: order.billingAddress || null,
      billingAddressSameAsShipping: order.billingAddressSameAsShipping !== false
    };
  });
};

module.exports = {
  MEDICINE_LIST_FIELDS,
  MEDICINE_DETAIL_FIELDS,
  batchFetchMedicines,
  batchFetchDoctorNoteTemplates,
  collectProductIds,
  enrichItemsWithProducts,
  batchPopulateProducts,
  batchPopulateMedicinesForOrders
};

