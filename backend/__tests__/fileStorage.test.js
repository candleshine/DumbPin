/**
 * Backend FileStorage Tests
 * Tests the server-side storage functionality
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const fileStorage = require('../utils/fileStorage');

// Mock file data
const mockFile = {
  originalname: 'test-image.jpg',
  mimetype: 'image/jpeg',
  buffer: Buffer.from('test image content'),
  size: 1024
};

// Test directory for file storage
const TEST_STORAGE_DIR = path.join(__dirname, '../../uploads/test');

describe('Backend FileStorage Module', () => {
  beforeAll(() => {
    // Create test directory if it doesn't exist
    if (!fsSync.existsSync(TEST_STORAGE_DIR)) {
      fsSync.mkdirSync(TEST_STORAGE_DIR, { recursive: true });
    }
    
    // Mock the STORAGE_DIR path for testing
    jest.spyOn(path, 'join').mockImplementation((...args) => {
      if (args[1] === '../../uploads' && args.length === 2) {
        return TEST_STORAGE_DIR;
      }
      return path.posix.join(...args);
    });
  });
  
  afterAll(async () => {
    // Clean up test directory
    if (fsSync.existsSync(TEST_STORAGE_DIR)) {
      const files = await fs.readdir(TEST_STORAGE_DIR);
      for (const file of files) {
        await fs.unlink(path.join(TEST_STORAGE_DIR, file));
      }
      await fs.rmdir(TEST_STORAGE_DIR);
    }
    
    // Restore mocks
    jest.restoreAllMocks();
  });
  
  afterEach(async () => {
    // Clean up files after each test
    const files = await fs.readdir(TEST_STORAGE_DIR);
    for (const file of files) {
      await fs.unlink(path.join(TEST_STORAGE_DIR, file));
    }
  });
  
  describe('File Operations', () => {
    test('saveFile should save a file and return metadata', async () => {
      const ownerId = 'user1';
      const result = await fileStorage.saveFile(mockFile, ownerId);
      
      // Check result structure
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('fileName', mockFile.originalname);
      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('fileType', mockFile.mimetype);
      expect(result).toHaveProperty('fileSize', mockFile.size);
      expect(result).toHaveProperty('ownerId', ownerId);
      
      // Check if file exists
      const fileExists = fsSync.existsSync(result.filePath);
      expect(fileExists).toBe(true);
      
      // Check if metadata file exists
      const fileId = path.basename(result.filePath, path.extname(result.filePath));
      const metadataPath = path.join(TEST_STORAGE_DIR, `${fileId}.meta.json`);
      const metadataExists = fsSync.existsSync(metadataPath);
      expect(metadataExists).toBe(true);
      
      // Check metadata content
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      const metadata = JSON.parse(metadataContent);
      expect(metadata).toHaveProperty('id', fileId);
      expect(metadata).toHaveProperty('originalName', mockFile.originalname);
      expect(metadata).toHaveProperty('ownerId', ownerId);
      expect(metadata).toHaveProperty('permissions');
      expect(metadata.permissions).toHaveProperty('readAccess');
      expect(metadata.permissions).toHaveProperty('writeAccess');
    });
    
    test('getFile should retrieve a file', async () => {
      // First save a file
      const result = await fileStorage.saveFile(mockFile, 'user1');
      
      // Then retrieve it
      const fileBuffer = await fileStorage.getFile(result.filePath);
      
      // Check if the content matches
      expect(fileBuffer).toEqual(mockFile.buffer);
    });
    
    test('deleteFile should remove a file and its metadata', async () => {
      // First save a file
      const result = await fileStorage.saveFile(mockFile, 'user1');
      const fileId = path.basename(result.filePath, path.extname(result.filePath));
      const metadataPath = path.join(TEST_STORAGE_DIR, `${fileId}.meta.json`);
      
      // Verify files exist before deletion
      expect(fsSync.existsSync(result.filePath)).toBe(true);
      expect(fsSync.existsSync(metadataPath)).toBe(true);
      
      // Delete the file
      const deleted = await fileStorage.deleteFile(result.filePath);
      
      // Check deletion result
      expect(deleted).toBe(true);
      
      // Verify files no longer exist
      expect(fsSync.existsSync(result.filePath)).toBe(false);
      expect(fsSync.existsSync(metadataPath)).toBe(false);
    });
    
    test('updateFileMetadata should update metadata', async () => {
      // First save a file
      const result = await fileStorage.saveFile(mockFile, 'user1');
      const fileId = path.basename(result.filePath, path.extname(result.filePath));
      
      // Update metadata
      const updates = {
        aspectRatio: 1.5,
        width: 800,
        height: 533
      };
      
      const updated = await fileStorage.updateFileMetadata(fileId, updates);
      expect(updated).toBe(true);
      
      // Check if metadata was updated
      const metadataPath = path.join(TEST_STORAGE_DIR, `${fileId}.meta.json`);
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      const metadata = JSON.parse(metadataContent);
      
      expect(metadata).toHaveProperty('aspectRatio', updates.aspectRatio);
      expect(metadata).toHaveProperty('width', updates.width);
      expect(metadata).toHaveProperty('height', updates.height);
    });
    
    test('getFileMetadata should retrieve file metadata', async () => {
      // First save a file
      const result = await fileStorage.saveFile(mockFile, 'user1');
      const fileId = path.basename(result.filePath, path.extname(result.filePath));
      
      // Get metadata
      const metadata = await fileStorage.getFileMetadata(fileId);
      
      // Check metadata content
      expect(metadata).toHaveProperty('id', fileId);
      expect(metadata).toHaveProperty('originalName', mockFile.originalname);
      expect(metadata).toHaveProperty('ownerId', 'user1');
      expect(metadata).toHaveProperty('permissions');
    });
    
    test('getFileMetadata should return null for non-existent file', async () => {
      const metadata = await fileStorage.getFileMetadata('non-existent-file');
      expect(metadata).toBeNull();
    });
  });
  
  describe('Access Control', () => {
    let fileId;
    const ownerId = 'user1';
    const testUser = 'user2';
    
    beforeEach(async () => {
      // Create a test file for each test
      const result = await fileStorage.saveFile(mockFile, ownerId);
      fileId = path.basename(result.filePath, path.extname(result.filePath));
    });
    
    test('checkFileAccess should verify owner access', async () => {
      const hasAccess = await fileStorage.checkFileAccess(fileId, ownerId, 'write');
      expect(hasAccess).toBe(true);
    });
    
    test('checkFileAccess should deny access to non-owners', async () => {
      const hasAccess = await fileStorage.checkFileAccess(fileId, testUser, 'read');
      expect(hasAccess).toBe(false);
    });
    
    test('shareFile should grant read access to a user', async () => {
      // Share file with test user
      const shared = await fileStorage.shareFile(fileId, testUser, 'read');
      expect(shared).toBe(true);
      
      // Verify access
      const hasAccess = await fileStorage.checkFileAccess(fileId, testUser, 'read');
      expect(hasAccess).toBe(true);
      
      // Verify no write access
      const hasWriteAccess = await fileStorage.checkFileAccess(fileId, testUser, 'write');
      expect(hasWriteAccess).toBe(false);
    });
    
    test('shareFile should grant write access and implied read access', async () => {
      // Share file with write access
      const shared = await fileStorage.shareFile(fileId, testUser, 'write');
      expect(shared).toBe(true);
      
      // Verify write access
      const hasWriteAccess = await fileStorage.checkFileAccess(fileId, testUser, 'write');
      expect(hasWriteAccess).toBe(true);
      
      // Verify implied read access
      const hasReadAccess = await fileStorage.checkFileAccess(fileId, testUser, 'read');
      expect(hasReadAccess).toBe(true);
    });
    
    test('revokeFileAccess should remove access', async () => {
      // First share the file
      await fileStorage.shareFile(fileId, testUser, 'write');
      
      // Verify access before revocation
      const hasAccessBefore = await fileStorage.checkFileAccess(fileId, testUser, 'write');
      expect(hasAccessBefore).toBe(true);
      
      // Revoke access
      const revoked = await fileStorage.revokeFileAccess(fileId, testUser, 'all');
      expect(revoked).toBe(true);
      
      // Verify access after revocation
      const hasAccessAfter = await fileStorage.checkFileAccess(fileId, testUser, 'read');
      expect(hasAccessAfter).toBe(false);
    });
    
    test('revokeFileAccess should not allow revoking owner access', async () => {
      // Try to revoke owner's access
      const revoked = await fileStorage.revokeFileAccess(fileId, ownerId, 'all');
      expect(revoked).toBe(false);
      
      // Verify owner still has access
      const hasAccess = await fileStorage.checkFileAccess(fileId, ownerId, 'write');
      expect(hasAccess).toBe(true);
    });
    
    test('revokeFileAccess should allow revoking only read access', async () => {
      // First share the file with both read and write access
      await fileStorage.shareFile(fileId, testUser, 'write');
      
      // Revoke only read access
      const revoked = await fileStorage.revokeFileAccess(fileId, testUser, 'read');
      expect(revoked).toBe(true);
      
      // Verify read access is revoked
      const hasReadAccess = await fileStorage.checkFileAccess(fileId, testUser, 'read');
      expect(hasReadAccess).toBe(false);
      
      // Verify write access is still there
      const hasWriteAccess = await fileStorage.checkFileAccess(fileId, testUser, 'write');
      expect(hasWriteAccess).toBe(true);
    });
  });
  
  describe('Map Data Operations', () => {
    const testMapData = {
      id: 'map1',
      name: 'Test Map',
      center: { lat: 51.505, lng: -0.09 },
      zoom: 13
    };
    
    test('saveMapData should save map data', async () => {
      const result = await fileStorage.saveMapData('map1', testMapData);
      expect(result).toBe(true);
      
      // Check if map data file exists
      const mapDataPath = path.join(TEST_STORAGE_DIR, 'map_map1.json');
      const exists = fsSync.existsSync(mapDataPath);
      expect(exists).toBe(true);
      
      // Check content
      const content = await fs.readFile(mapDataPath, 'utf8');
      const data = JSON.parse(content);
      expect(data).toEqual(testMapData);
    });
    
    test('getMapData should retrieve map data', async () => {
      // First save map data
      await fileStorage.saveMapData('map1', testMapData);
      
      // Then retrieve it
      const data = await fileStorage.getMapData('map1');
      expect(data).toEqual(testMapData);
    });
    
    test('deleteMapData should remove map data', async () => {
      // First save map data
      await fileStorage.saveMapData('map1', testMapData);
      
      // Verify file exists before deletion
      const mapDataPath = path.join(TEST_STORAGE_DIR, 'map_map1.json');
      expect(fsSync.existsSync(mapDataPath)).toBe(true);
      
      // Delete the map data
      const deleted = await fileStorage.deleteMapData('map1');
      expect(deleted).toBe(true);
      
      // Verify file no longer exists
      expect(fsSync.existsSync(mapDataPath)).toBe(false);
    });
  });
});