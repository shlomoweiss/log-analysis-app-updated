// QueryTranslationService.js

/**
 * Translates the user-provided query into a backend/search-compliant query.
 * 
 * @param {Object} queryData - Incoming query details from controller.
 * @param {Object} [extraData] - Optional extra data from controller, e.g., indicesFields cache.
 *        { indicesFields: { ... } }
 * @returns {Object} translatedQuery - Compliant query for backend/search.
 */
async function translateQuery(queryData, extraData = {}) {
    // Example: safely extract indicesFields from extraData if present
    const indicesFields = extraData.indicesFields || null;

    // -- Your translation logic here --
    // For example, you might want to validate/filter/auto-complete query fields
    // using indicesFields information
    if (indicesFields) {
        // Example: Imagine queryData has a 'fields' array you want to validate
        if (Array.isArray(queryData.fields)) {
            queryData.fields = queryData.fields.filter(field =>
                indicesFields.includes(field)
            );
        }
        // Or you may adapt your translation knowing the available fields, etc.
    }

    // Handle query translation as before...
    // const translatedQuery = ... (your logic using queryData and possibly indicesFields)

    // For now, a minimal and safe example:
    const translatedQuery = {
        ...queryData,
        // You might want to append diagnostics/debug info (remove in prod)
        _usedFields: indicesFields, // Remove if not necessary
    };

    return translatedQuery;
}

module.exports = {
    translateQuery,
};