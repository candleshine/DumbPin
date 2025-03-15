/**
 * Frontend FileStorage Tests
 * Tests the client-side storage functionality
 */

import {
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
} from '../js/fileStorage';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

// Set up localStorage mock before tests
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Frontend FileStorage Module', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Image Storage', () => {
    const testImage = {
      id: 'test-image-1',
      fileName: 'test.jpg',
      fileType: 'image/jpeg',
      fileSize: 1024,
      aspectRatio: 1.5
    };

    test('saveImageData should store image data in localStorage', () => {
      const result = saveImageData(testImage);
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `image_${testImage.id}`,
        JSON.stringify(testImage)
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'image_list',
        JSON.stringify([testImage.id])
      );
    });

    test('saveImageData should handle invalid input', () => {
      expect(saveImageData(null)).toBe(false);
      expect(saveImageData({})).toBe(false);
      expect(saveImageData({ id: null })).toBe(false);
      
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    test('saveImageData should handle localStorage errors', () => {
      // Mock localStorage.setItem to throw an error
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const result = saveImageData(testImage);
      
      expect(result).toBe(false);
    });

    test('getImageData should retrieve image data from localStorage', () => {
      // Setup
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(testImage));
      
      const result = getImageData('test-image-1');
      
      expect(result).toEqual(testImage);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('image_test-image-1');
    });

    test('getImageData should handle missing data', () => {
      const result = getImageData('non-existent');
      
      expect(result).toBeNull();
    });

    test('getImageList should retrieve the list of image IDs', () => {
      // Setup
      const imageList = ['image1', 'image2', 'image3'];
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(imageList));
      
      const result = getImageList();
      
      expect(result).toEqual(imageList);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('image_list');
    });

    test('getImageList should return empty array if no list exists', () => {
      const result = getImageList();
      
      expect(result).toEqual([]);
    });

    test('deleteImageData should remove image data from localStorage', () => {
      // Setup
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(['test-image-1', 'image2']));
      
      const result = deleteImageData('test-image-1');
      
      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('image_test-image-1');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('pins_test-image-1');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('permissions_test-image-1');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'image_list',
        JSON.stringify(['image2'])
      );
    });
  });

  describe('Pin Storage', () => {
    const testPin = {
      id: 'pin1',
      x: 50,
      y: 50,
      color: '#ff0000'
    };

    test('savePin should store a new pin', () => {
      // Setup
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify([]));
      
      const result = savePin('image1', testPin);
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pins_image1',
        JSON.stringify([testPin])
      );
    });

    test('savePin should update an existing pin', () => {
      // Setup
      const existingPins = [{ id: 'pin1', x: 30, y: 30, color: '#00ff00' }];
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(existingPins));
      
      const updatedPin = { ...testPin, x: 60, y: 70 };
      const result = savePin('image1', updatedPin);
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pins_image1',
        JSON.stringify([updatedPin])
      );
    });

    test('getPins should retrieve pins for an image', () => {
      // Setup
      const pins = [testPin, { id: 'pin2', x: 20, y: 30, color: '#0000ff' }];
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(pins));
      
      const result = getPins('image1');
      
      expect(result).toEqual(pins);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('pins_image1');
    });

    test('getPins should return empty array if no pins exist', () => {
      const result = getPins('image1');
      
      expect(result).toEqual([]);
    });

    test('deletePin should remove a pin', () => {
      // Setup
      const pins = [
        testPin,
        { id: 'pin2', x: 20, y: 30, color: '#0000ff' }
      ];
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(pins));
      
      const result = deletePin('image1', 'pin1');
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pins_image1',
        JSON.stringify([pins[1]])
      );
    });
  });

  describe('Access Control', () => {
    const testImageId = 'test-image-1';
    const testOwner = 'user1';
    const testUser = 'user2';
    const testPermissions = {
      ownerId: testOwner,
      readAccess: ['user2', 'user3'],
      writeAccess: ['user3']
    };

    test('setImagePermissions should store permission data', () => {
      const result = setImagePermissions(testImageId, testPermissions);
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `permissions_${testImageId}`,
        JSON.stringify(testPermissions)
      );
    });

    test('setImagePermissions should handle invalid input', () => {
      expect(setImagePermissions(null, testPermissions)).toBe(false);
      expect(setImagePermissions(testImageId, null)).toBe(false);
      expect(setImagePermissions(testImageId, {})).toBe(false);
      
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    test('getImagePermissions should retrieve permission data', () => {
      // Setup
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(testPermissions));
      
      const result = getImagePermissions(testImageId);
      
      expect(result).toEqual(testPermissions);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(`permissions_${testImageId}`);
    });

    test('getImagePermissions should handle missing data', () => {
      const result = getImagePermissions('non-existent');
      
      expect(result).toBeNull();
    });

    test('checkImageAccess should verify owner access', () => {
      // Setup
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(testPermissions));
      
      const result = checkImageAccess(testImageId, testOwner, 'write');
      
      expect(result).toBe(true);
    });

    test('checkImageAccess should verify read access', () => {
      // Setup
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(testPermissions));
      
      const result = checkImageAccess(testImageId, testUser, 'read');
      
      expect(result).toBe(true);
    });

    test('checkImageAccess should verify write access', () => {
      // Setup
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(testPermissions));
      
      // User2 has read but not write access
      const result = checkImageAccess(testImageId, testUser, 'write');
      
      expect(result).toBe(false);
      
      // User3 has write access
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(testPermissions));
      const result2 = checkImageAccess(testImageId, 'user3', 'write');
      
      expect(result2).toBe(true);
    });

    test('shareImage should add a user to access lists', () => {
      // Setup - no existing permissions
      localStorageMock.getItem.mockReturnValueOnce(null);
      
      const result = shareImage(testImageId, 'user4', 'read');
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `permissions_${testImageId}`,
        expect.stringContaining('user4')
      );
    });

    test('shareImage should add write access and implied read access', () => {
      // Setup with existing permissions
      const existingPermissions = {
        ownerId: testOwner,
        readAccess: ['user2'],
        writeAccess: []
      };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(existingPermissions));
      
      const result = shareImage(testImageId, 'user4', 'write');
      
      expect(result).toBe(true);
      
      // Should have added user4 to both read and write access lists
      const expectedPermissions = {
        ownerId: testOwner,
        readAccess: ['user2', 'user4'],
        writeAccess: ['user4']
      };
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `permissions_${testImageId}`,
        JSON.stringify(expectedPermissions)
      );
    });

    test('revokeImageAccess should remove a user from access lists', () => {
      // Setup
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(testPermissions));
      
      const result = revokeImageAccess(testImageId, 'user3', 'all');
      
      expect(result).toBe(true);
      
      // Should have removed user3 from both read and write access lists
      const expectedPermissions = {
        ownerId: testOwner,
        readAccess: ['user2'],
        writeAccess: []
      };
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `permissions_${testImageId}`,
        JSON.stringify(expectedPermissions)
      );
    });

    test('revokeImageAccess should not allow revoking owner access', () => {
      // Setup
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(testPermissions));
      
      const result = revokeImageAccess(testImageId, testOwner, 'all');
      
      expect(result).toBe(false);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });
});