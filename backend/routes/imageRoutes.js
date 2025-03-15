/**
 * Image Routes
 * Handles routes for image upload, retrieval, and pin management
 */

const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const { upload, handleFileUploadErrors } = require('../middleware/fileUpload');
const { authenticate, checkOwnership } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Image routes
router.post('/upload', upload.single('image'), handleFileUploadErrors, imageController.uploadImage);
router.get('/', imageController.getUserImages);

// Routes that require ownership verification
router.get('/:imageId', checkOwnership(req => imageController.getImageForOwnershipCheck(req)), imageController.getImageById);
router.delete('/:imageId', checkOwnership(req => imageController.getImageForOwnershipCheck(req)), imageController.deleteImage);

// Pin routes - all require image ownership
router.get('/:imageId/pins', checkOwnership(req => imageController.getImageForOwnershipCheck(req)), imageController.getImagePins);
router.post('/:imageId/pins', checkOwnership(req => imageController.getImageForOwnershipCheck(req)), imageController.addPin);
router.put('/:imageId/pins/:pinId', checkOwnership(req => imageController.getImageForOwnershipCheck(req)), imageController.updatePin);
router.delete('/:imageId/pins/:pinId', checkOwnership(req => imageController.getImageForOwnershipCheck(req)), imageController.deletePin);

module.exports = router;