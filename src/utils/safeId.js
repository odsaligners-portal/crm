/**
 * Safely converts an ID to a string for use in React keys and other places
 * where primitives are expected. Handles ObjectId objects, null, undefined, etc.
 *
 * @param {any} id - The ID to convert (can be string, ObjectId, number, etc.)
 * @returns {string} - A string representation of the ID, or empty string if invalid
 */
export const safeId = (id) => {
  if (id === null || id === undefined) return "";
  if (typeof id === "string") return id;
  if (typeof id === "number") return String(id);
  if (typeof id === "object") {
    // Handle ObjectId-like objects
    if (id.toString && typeof id.toString === "function") {
      return String(id);
    }
    // If it's an object with an _id property, try to get that
    if (id._id) {
      return safeId(id._id);
    }
  }
  return String(id);
};

/**
 * Safely gets an ID from an object, with fallback to index
 * Useful for React keys: key={safeKey(item._id, index)}
 *
 * @param {any} id - The ID to convert
 * @param {number} fallbackIndex - Fallback index if ID is invalid
 * @returns {string} - A string representation of the ID or index
 */
export const safeKey = (id, fallbackIndex = null) => {
  const idString = safeId(id);
  if (idString) return idString;
  if (fallbackIndex !== null) return String(fallbackIndex);
  return "";
};
