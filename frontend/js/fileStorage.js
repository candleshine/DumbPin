/**
 * File Storage Utility for Frontend
 * Handles client-side storage of image data and pins
 */

/**
 * Save image data to local storage
 * @param {Object} imageData - Image data to save
 * @returns {boolean} - Whether the save was successful
 */
const saveImageData = (imageData) => {
  try {
    if (!imageData || !imageData.id) return false;
    
    // Store in localStorage with image ID as key
    const key = `image_${imageData.id}`;
    localStorage.setItem(key, JSON.stringify(imageData));
    
    // Update image list
    const imageList = getImageList();
    if (!imageList.includes(imageData.id)) {
      imageList.push(imageData.id);
      localStorage.setItem('image_list', JSON.stringify(imageList));
    }
    
    return true;
  } catch (error) {
    console.error('Error saving image data to local storage:', error);
    return false;
  }
};

/**
 * Get image data from local storage
 * @param {string} imageId - ID of the image to retrieve
 * @returns {Object|null} - Image data or null if not found
 */
const getImageData = (imageId) => {
  try {
    const key = `image_${imageId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting image data from local storage:', error);
    return null;
  }
};

/**
 * Get list of all stored image IDs
 * @returns {Array} - Array of image IDs
 */
const getImageList = () => {
  try {
    const list = localStorage.getItem('image_list');
    return list ? JSON.parse(list) : [];
  } catch (error) {
    console.error('Error getting image list from local storage:', error);
    return [];
  }
};

/**
 * Delete image data from local storage
 * @param {string} imageId - ID of the image to delete
 * @returns {boolean} - Whether the deletion was successful
 */
const deleteImageData = (imageId) => {
  try {
    // Remove image data
    const key = `image_${imageId}`;
    localStorage.removeItem(key);
    
    // Remove from image list
    const imageList = getImageList();
    const updatedList = imageList.filter(id => id !== imageId);
    localStorage.setItem('image_list', JSON.stringify(updatedList));
    
    // Remove pins for this image
    const pinKey = `pins_${imageId}`;
    localStorage.removeItem(pinKey);
    
    // Remove permissions for this image
    const permissionsKey = `permissions_${imageId}`;
    localStorage.removeItem(permissionsKey);
    
    return true;
  } catch (error) {
    console.error('Error deleting image data from local storage:', error);
    return false;
  }
};

/**
 * Save pin data for an image
 * @param {string} imageId - ID of the image
 * @param {Object} pinData - Pin data to save
 * @returns {boolean} - Whether the save was successful
 */
const savePin = (imageId, pinData) => {
  try {
    if (!imageId || !pinData || !pinData.id) return false;
    
    // Get existing pins
    const pins = getPins(imageId);
    
    // Check if pin already exists
    const existingPinIndex = pins.findIndex(pin => pin.id === pinData.id);
    
    if (existingPinIndex !== -1) {
      // Update existing pin
      pins[existingPinIndex] = pinData;
    } else {
      // Add new pin
      pins.push(pinData);
    }
    
    // Save updated pins
    const pinKey = `pins_${imageId}`;
    localStorage.setItem(pinKey, JSON.stringify(pins));
    
    return true;
  } catch (error) {
    console.error('Error saving pin data to local storage:', error);
    return false;
  }
};

/**
 * Get all pins for an image
 * @param {string} imageId - ID of the image
 * @returns {Array} - Array of pin data
 */
const getPins = (imageId) => {
  try {
    const pinKey = `pins_${imageId}`;
    const data = localStorage.getItem(pinKey);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting pins from local storage:', error);
    return [];
  }
};

/**
 * Delete a pin
 * @param {string} imageId - ID of the image
 * @param {string} pinId - ID of the pin to delete
 * @returns {boolean} - Whether the deletion was successful
 */
const deletePin = (imageId, pinId) => {
  try {
    // Get existing pins
    const pins = getPins(imageId);
    
    // Filter out the pin to delete
    const updatedPins = pins.filter(pin => pin.id !== pinId);
    
    // Save updated pins
    const pinKey = `pins_${imageId}`;
    localStorage.setItem(pinKey, JSON.stringify(updatedPins));
    
    return true;
  } catch (error) {
    console.error('Error deleting pin from local storage:', error);
    return false;
  }
};

/**
 * Set permissions for an image
 * @param {string} imageId - ID of the image
 * @param {Object} permissions - Permission settings
 * @param {string} permissions.ownerId - ID of the image owner
 * @param {Array} permissions.readAccess - Array of user IDs with read access
 * @param {Array} permissions.writeAccess - Array of user IDs with write access
 * @returns {boolean} - Whether the operation was successful
 */
const setImagePermissions = (imageId, permissions) => {
  try {
    if (!imageId || !permissions || !permissions.ownerId) return false;
    
    const permissionsKey = `permissions_${imageId}`;
    localStorage.setItem(permissionsKey, JSON.stringify(permissions));
    
    return true;
  } catch (error) {
    console.error('Error setting image permissions:', error);
    return false;
  }
};

/**
 * Get permissions for an image
 * @param {string} imageId - ID of the image
 * @returns {Object|null} - Permission settings or null if not found
 */
const getImagePermissions = (imageId) => {
  try {
    const permissionsKey = `permissions_${imageId}`;
    const data = localStorage.getItem(permissionsKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting image permissions:', error);
    return null;
  }
};

/**
 * Check if a user has access to an image
 * @param {string} imageId - ID of the image
 * @param {string} userId - ID of the user
 * @param {string} accessType - Type of access ('read' or 'write')
 * @returns {boolean} - Whether the user has the specified access
 */
const checkImageAccess = (imageId, userId, accessType = 'read') => {
  try {
    const permissions = getImagePermissions(imageId);
    
    if (!permissions) return false;
    
    // Owner has all access
    if (permissions.ownerId === userId) return true;
    
    // Check for specific access type
    if (accessType === 'read') {
      return permissions.readAccess && permissions.readAccess.includes(userId);
    } else if (accessType === 'write') {
      return permissions.writeAccess && permissions.writeAccess.includes(userId);
    }
    
    return false;
  } catch (error) {
    console.error('Error checking image access:', error);
    return false;
  }
};

/**
 * Share an image with another user
 * @param {string} imageId - ID of the image
 * @param {string} userId - ID of the user to share with
 * @param {string} accessType - Type of access to grant ('read' or 'write')
 * @returns {boolean} - Whether the operation was successful
 */
const shareImage = (imageId, userId, accessType = 'read') => {
  try {
    if (!imageId || !userId) return false;
    
    const permissions = getImagePermissions(imageId) || {
      ownerId: null,
      readAccess: [],
      writeAccess: []
    };
    
    if (accessType === 'read' && !permissions.readAccess.includes(userId)) {
      permissions.readAccess.push(userId);
    } else if (accessType === 'write' && !permissions.writeAccess.includes(userId)) {
      permissions.writeAccess.push(userId);
      // Write access implies read access
      if (!permissions.readAccess.includes(userId)) {
        permissions.readAccess.push(userId);
      }
    } else {
      // User already has this access level
      return true;
    }
    
    return setImagePermissions(imageId, permissions);
  } catch (error) {
    console.error('Error sharing image:', error);
    return false;
  }
};

/**
 * Revoke a user's access to an image
 * @param {string} imageId - ID of the image
 * @param {string} userId - ID of the user
 * @param {string} accessType - Type of access to revoke ('read', 'write', or 'all')
 * @returns {boolean} - Whether the operation was successful
 */
const revokeImageAccess = (imageId, userId, accessType = 'all') => {
  try {
    if (!imageId || !userId) return false;
    
    const permissions = getImagePermissions(imageId);
    if (!permissions) return false;
    
    // Cannot revoke owner's access
    if (permissions.ownerId === userId) return false;
    
    if (accessType === 'read' || accessType === 'all') {
      permissions.readAccess = permissions.readAccess.filter(id => id !== userId);
    }
    
    if (accessType === 'write' || accessType === 'all') {
      permissions.writeAccess = permissions.writeAccess.filter(id => id !== userId);
    }
    
    return setImagePermissions(imageId, permissions);
  } catch (error) {
    console.error('Error revoking image access:', error);
    return false;
  }
};

export {
  saveImageData,
  getImageData,
  getImageList,
  deleteImageData,
  savePin,
  getPins,
  deletePin,
  setImagePermissions,
  getImagePermissions,
  checkImageAccess,
  shareImage,
  revokeImageAccess
};