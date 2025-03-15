/**
 * Image Controller
 * Handles image upload, retrieval, and pin management
 */

const { v4: uuidv4 } = require('uuid');
const Image = require('../models/Image');
const Pin = require('../models/Pin');
const fileStorage = require('../utils/fileStorage');
const sharp = require('sharp');

// In-memory storage for images (to be replaced with a database in future phases)
const images = {};

/**
 * Upload a new image
 */
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        message: 'Invalid file type. Only JPG, PNG, and GIF files are allowed.' 
      });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res.status(400).json({ 
        message: 'File size exceeds the 5MB limit.' 
      });
    }

    // Get image dimensions for aspect ratio
    let metadata;
    try {
      metadata = await sharp(req.file.buffer).metadata();
    } catch (error) {
      console.error('Error processing image:', error);
      return res.status(400).json({ message: 'Invalid image file' });
    }

    // Calculate aspect ratio
    const aspectRatio = metadata.width / metadata.height;
    
    // Save file to storage
    const fileData = await fileStorage.saveFile(req.file, req.user.id);
    
    // Update metadata with aspect ratio
    await fileStorage.updateFileMetadata(fileData.id, { 
      aspectRatio,
      width: metadata.width,
      height: metadata.height
    });
    
    // Create new image record
    const image = new Image(
      fileData.id,
      fileData.fileName,
      fileData.filePath,
      fileData.fileType,
      fileData.fileSize,
      req.user.id
    );
    
    // Add aspect ratio to image object
    image.aspectRatio = aspectRatio;
    
    // Store in memory
    images[image.id] = image;
    
    // Return image data (excluding file path for security)
    const responseData = {
      id: image.id,
      fileName: image.fileName,
      fileType: image.fileType,
      fileSize: image.fileSize,
      aspectRatio,
      createdAt: image.createdAt
    };
    
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
};

/**
 * Get all images for the authenticated user
 */
const getUserImages = (req, res) => {
  try {
    const userImages = Object.values(images).filter(
      image => image.ownerId === req.user.id
    );
    
    // Map to response format (excluding sensitive data)
    const responseData = userImages.map(image => ({
      id: image.id,
      fileName: image.fileName,
      fileType: image.fileType,
      fileSize: image.fileSize,
      aspectRatio: image.aspectRatio,
      pinCount: image.pins.length,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt
    }));
    
    res.json(responseData);
  } catch (error) {
    console.error('Error getting user images:', error);
    res.status(500).json({ message: 'Failed to retrieve images' });
  }
};

/**
 * Get a single image by ID
 */
const getImageById = async (req, res) => {
  try {
    const { imageId } = req.params;
    const image = images[imageId];
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    // Check ownership
    if (image.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Get file buffer
    const imageBuffer = await fileStorage.getFile(image.filePath);
    
    // Set content type based on file type
    res.set('Content-Type', image.fileType);
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error getting image:', error);
    res.status(500).json({ message: 'Failed to retrieve image' });
  }
};

/**
 * Delete an image
 */
const deleteImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const image = images[imageId];
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    // Check ownership
    if (image.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Delete file from storage
    const deleted = await fileStorage.deleteFile(image.filePath);
    if (!deleted) {
      return res.status(500).json({ message: 'Failed to delete image file' });
    }
    
    // Remove from memory store
    delete images[imageId];
    
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Failed to delete image' });
  }
};

/**
 * Add a pin to an image
 */
const addPin = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { x, y, color, label } = req.body;
    const image = images[imageId];
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    // Check ownership
    if (image.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Validate coordinates
    if (typeof x !== 'number' || typeof y !== 'number' || x < 0 || x > 100 || y < 0 || y > 100) {
      return res.status(400).json({ 
        message: 'Invalid pin coordinates. X and Y must be percentages between 0 and 100.' 
      });
    }
    
    // Create new pin
    const pin = new Pin(uuidv4(), x, y, color, label, req.user.id);
    
    // Add pin to image
    image.addPin(pin);
    
    // Auto-save pin data
    await fileStorage.updateFileMetadata(image.id, {
      pins: image.pins
    });
    
    res.status(201).json(pin);
  } catch (error) {
    console.error('Error adding pin:', error);
    res.status(500).json({ message: 'Failed to add pin' });
  }
};

/**
 * Update a pin
 */
const updatePin = async (req, res) => {
  try {
    const { imageId, pinId } = req.params;
    const { x, y, color, label } = req.body;
    const image = images[imageId];
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    // Check ownership
    if (image.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Find pin
    const pin = image.pins.find(p => p.id === pinId);
    if (!pin) {
      return res.status(404).json({ message: 'Pin not found' });
    }
    
    // Update position if provided
    if (typeof x === 'number' && typeof y === 'number') {
      // Validate coordinates
      if (x < 0 || x > 100 || y < 0 || y > 100) {
        return res.status(400).json({ 
          message: 'Invalid pin coordinates. X and Y must be percentages between 0 and 100.' 
        });
      }
      pin.updatePosition(x, y);
    }
    
    // Update style if provided
    if (color || label !== undefined) {
      pin.updateStyle({ color, label });
    }
    
    // Auto-save pin data
    await fileStorage.updateFileMetadata(image.id, {
      pins: image.pins
    });
    
    res.json(pin);
  } catch (error) {
    console.error('Error updating pin:', error);
    res.status(500).json({ message: 'Failed to update pin' });
  }
};

/**
 * Delete a pin
 */
const deletePin = async (req, res) => {
  try {
    const { imageId, pinId } = req.params;
    const image = images[imageId];
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    // Check ownership
    if (image.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Remove pin
    const removed = image.removePin(pinId);
    if (!removed) {
      return res.status(404).json({ message: 'Pin not found' });
    }
    
    // Auto-save pin data
    await fileStorage.updateFileMetadata(image.id, {
      pins: image.pins
    });
    
    res.json({ message: 'Pin deleted successfully' });
  } catch (error) {
    console.error('Error deleting pin:', error);
    res.status(500).json({ message: 'Failed to delete pin' });
  }
};

/**
 * Get all pins for an image
 */
const getImagePins = (req, res) => {
  try {
    const { imageId } = req.params;
    const image = images[imageId];
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    // Check ownership
    if (image.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    res.json(image.pins);
  } catch (error) {
    console.error('Error getting image pins:', error);
    res.status(500).json({ message: 'Failed to retrieve pins' });
  }
};

// Helper function to get image by ID (for ownership middleware)
const getImageForOwnershipCheck = (req) => {
  const imageId = req.params.imageId;
  return images[imageId];
};

module.exports = {
  uploadImage,
  getUserImages,
  getImageById,
  deleteImage,
  addPin,
  updatePin,
  deletePin,
  getImagePins,
  getImageForOwnershipCheck
};