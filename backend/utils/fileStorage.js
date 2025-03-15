/**
 * File Storage Utility
 * Handles file uploads, storage, and retrieval
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Define storage directory
const STORAGE_DIR = path.join(__dirname, '../../uploads');

// Ensure storage directory exists
if (!fsSync.existsSync(STORAGE_DIR)) {
  fsSync.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * Save a file to the storage system
 * @param {Object} file - The file object from multer
 * @param {string} ownerId - ID of the file owner
 * @returns {Promise<Object>} - File metadata
 */
const saveFile = async (file, ownerId) => {
  try {
    const fileId = uuidv4();
    const fileExt = path.extname(file.originalname);
    const fileName = `${fileId}${fileExt}`;
    const filePath = path.join(STORAGE_DIR, fileName);
    
    // Write file to disk
    await fs.writeFile(filePath, file.buffer);
    
    // Implement auto-save functionality by creating a metadata file
    const metadataPath = path.join(STORAGE_DIR, `${fileId}.meta.json`);
    const metadata = {
      id: fileId,
      originalName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      ownerId,
      createdAt: new Date().toISOString(),
      lastSaved: new Date().toISOString(),
      permissions: {
        readAccess: [],
        writeAccess: []
      }
    };
    
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    return {
      id: fileId,
      fileName: file.originalname,
      filePath,
      fileType: file.mimetype,
      fileSize: file.size,
      ownerId,
      aspectRatio: null // Will be calculated when image is first accessed
    };
  } catch (error) {
    console.error('Error saving file:', error);
    throw new Error(`Failed to save file: ${error.message}`);
  }
};

/**
 * Get a file from storage
 * @param {string} filePath - Path to the file
 * @returns {Promise<Buffer>} - File buffer
 */
const getFile = async (filePath) => {
  try {
    return await fs.readFile(filePath);
  } catch (error) {
    console.error('Error reading file:', error);
    throw new Error(`Failed to read file: ${error.message}`);
  }
};

/**
 * Delete a file from storage
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} - Whether the file was deleted successfully
 */
const deleteFile = async (filePath) => {
  try {
    // Delete the main file
    await fs.unlink(filePath);
    
    // Delete the metadata file if it exists
    const fileId = path.basename(filePath, path.extname(filePath));
    const metadataPath = path.join(STORAGE_DIR, `${fileId}.meta.json`);
    if (fsSync.existsSync(metadataPath)) {
      await fs.unlink(metadataPath);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Auto-save file metadata
 * @param {string} fileId - ID of the file
 * @param {Object} updates - Metadata updates
 * @returns {Promise<boolean>} - Whether the update was successful
 */
const updateFileMetadata = async (fileId, updates) => {
  try {
    const metadataPath = path.join(STORAGE_DIR, `${fileId}.meta.json`);
    
    // Check if metadata file exists
    if (!fsSync.existsSync(metadataPath)) {
      return false;
    }
    
    // Read existing metadata
    const metadataRaw = await fs.readFile(metadataPath, 'utf8');
    const metadata = JSON.parse(metadataRaw);
    
    // Update metadata
    const updatedMetadata = {
      ...metadata,
      ...updates,
      lastSaved: new Date().toISOString()
    };
    
    // Write updated metadata
    await fs.writeFile(metadataPath, JSON.stringify(updatedMetadata, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error updating file metadata:', error);
    return false;
  }
};

/**
 * Get file metadata
 * @param {string} fileId - ID of the file
 * @returns {Promise<Object|null>} - File metadata or null if not found
 */
const getFileMetadata = async (fileId) => {
  try {
    const metadataPath = path.join(STORAGE_DIR, `${fileId}.meta.json`);
    
    // Check if metadata file exists
    if (!fsSync.existsSync(metadataPath)) {
      return null;
    }
    
    // Read metadata
    const metadataRaw = await fs.readFile(metadataPath, 'utf8');
    return JSON.parse(metadataRaw);
  } catch (error) {
    console.error('Error getting file metadata:', error);
    return null;
  }
};

/**
 * Check if a user has access to a file
 * @param {string} fileId - ID of the file
 * @param {string} userId - ID of the user
 * @param {string} accessType - Type of access ('read' or 'write')
 * @returns {Promise<boolean>} - Whether the user has the specified access
 */
const checkFileAccess = async (fileId, userId, accessType = 'read') => {
  try {
    const metadata = await getFileMetadata(fileId);
    
    if (!metadata) return false;
    
    // Owner has all access
    if (metadata.ownerId === userId) return true;
    
    // Check for specific access type
    if (accessType === 'read') {
      return metadata.permissions && 
             metadata.permissions.readAccess && 
             metadata.permissions.readAccess.includes(userId);
    } else if (accessType === 'write') {
      return metadata.permissions && 
             metadata.permissions.writeAccess && 
             metadata.permissions.writeAccess.includes(userId);
    }
    
    return false;
  } catch (error) {
    console.error('Error checking file access:', error);
    return false;
  }
};

/**
 * Share a file with another user
 * @param {string} fileId - ID of the file
 * @param {string} userId - ID of the user to share with
 * @param {string} accessType - Type of access to grant ('read' or 'write')
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
const shareFile = async (fileId, userId, accessType = 'read') => {
  try {
    if (!fileId || !userId) return false;
    
    const metadata = await getFileMetadata(fileId);
    if (!metadata) return false;
    
    // Initialize permissions if they don't exist
    if (!metadata.permissions) {
      metadata.permissions = {
        readAccess: [],
        writeAccess: []
      };
    }
    
    // Add user to appropriate access list
    if (accessType === 'read' && !metadata.permissions.readAccess.includes(userId)) {
      metadata.permissions.readAccess.push(userId);
    } else if (accessType === 'write') {
      if (!metadata.permissions.writeAccess.includes(userId)) {
        metadata.permissions.writeAccess.push(userId);
      }
      // Write access implies read access
      if (!metadata.permissions.readAccess.includes(userId)) {
        metadata.permissions.readAccess.push(userId);
      }
    } else {
      // User already has this access level
      return true;
    }
    
    // Update metadata
    return await updateFileMetadata(fileId, { permissions: metadata.permissions });
  } catch (error) {
    console.error('Error sharing file:', error);
    return false;
  }
};

/**
 * Revoke a user's access to a file
 * @param {string} fileId - ID of the file
 * @param {string} userId - ID of the user
 * @param {string} accessType - Type of access to revoke ('read', 'write', or 'all')
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
const revokeFileAccess = async (fileId, userId, accessType = 'all') => {
  try {
    if (!fileId || !userId) return false;
    
    const metadata = await getFileMetadata(fileId);
    if (!metadata || !metadata.permissions) return false;
    
    // Cannot revoke owner's access
    if (metadata.ownerId === userId) return false;
    
    if (accessType === 'read' || accessType === 'all') {
      metadata.permissions.readAccess = metadata.permissions.readAccess.filter(id => id !== userId);
    }
    
    if (accessType === 'write' || accessType === 'all') {
      metadata.permissions.writeAccess = metadata.permissions.writeAccess.filter(id => id !== userId);
    }
    
    // Update metadata
    return await updateFileMetadata(fileId, { permissions: metadata.permissions });
  } catch (error) {
    console.error('Error revoking file access:', error);
    return false;
  }
};

/**
 * Save map data to storage
 * @param {string} mapId - ID of the map
 * @param {Object} mapData - Map data to save
 * @returns {Promise<boolean>} - Whether the map data was saved successfully
 */
const saveMapData = async (mapId, mapData) => {
  try {
    const mapDataPath = path.join(STORAGE_DIR, `map_${mapId}.json`);
    
    // Write map data
    await fs.writeFile(mapDataPath, JSON.stringify(mapData, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving map data:', error);
    return false;
  }
};

/**
 * Get map data from storage
 * @param {string} mapId - ID of the map
 * @returns {Promise<Object|null>} - Map data or null if not found
 */
const getMapData = async (mapId) => {
  try {
    const mapDataPath = path.join(STORAGE_DIR, `map_${mapId}.json`);
    
    if (!fsSync.existsSync(mapDataPath)) {
      return null;
    }
    
    // Read map data
    const data = await fs.readFile(mapDataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting map data:', error);
    return null;
  }
};

/**
 * Delete map data from storage
 * @param {string} mapId - ID of the map
 * @returns {Promise<boolean>} - Whether the map data was deleted successfully
 */
const deleteMapData = async (mapId) => {
  try {
    const mapDataPath = path.join(STORAGE_DIR, `map_${mapId}.json`);
    
    if (!fsSync.existsSync(mapDataPath)) {
      return false;
    }
    
    // Delete map data file
    await fs.unlink(mapDataPath);
    return true;
  } catch (error) {
    console.error('Error deleting map data:', error);
    return false;
  }
};

module.exports = {
  saveFile,
  getFile,
  deleteFile,
  updateFileMetadata,
  getFileMetadata,
  checkFileAccess,
  shareFile,
  revokeFileAccess,
  saveMapData,
  getMapData,
  deleteMapData
};