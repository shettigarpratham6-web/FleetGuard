/**
 * Re-export the upload middleware from upload.js for convenience.
 * Routes can import from either uploadMiddleware or upload.
 */
const upload = require('./upload');

module.exports = upload;
