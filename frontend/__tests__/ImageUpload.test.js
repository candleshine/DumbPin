/**
 * @jest-environment jsdom
 */

import ImageUpload from '../components/ImageUpload';

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ id: 'test-image-id' }),
  })
);

describe('ImageUpload Component', () => {
  let container;
  let imageUpload;
  let onImageUploadedMock;
  
  // Helper to create a mock file
  const createMockFile = (name = 'test.jpg', type = 'image/jpeg', size = 1024) => {
    const file = new File([''], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };
  
  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = '<div id="test-container"></div>';
    container = document.getElementById('test-container');
    
    // Mock callback
    onImageUploadedMock = jest.fn();
    
    // Create component
    imageUpload = new ImageUpload(container, onImageUploadedMock);
    
    // Reset fetch mock
    fetch.mockClear();
  });
  
  test('should initialize correctly', () => {
    expect(container.querySelector('.image-upload')).not.toBeNull();
    expect(container.querySelector('#fileInput')).not.toBeNull();
    expect(container.querySelector('#uploadButton')).not.toBeNull();
    expect(container.querySelector('#dropZone')).not.toBeNull();
  });
  
  test('should handle file selection via input', () => {
    const fileInput = container.querySelector('#fileInput');
    const file = createMockFile();
    
    // Create a mock file selection event
    const event = { target: { files: [file] } };
    
    // Trigger file selection
    imageUpload.handleFileSelection(event);
    
    // Check if file was processed correctly
    expect(imageUpload.selectedFile).toBe(file);
    expect(container.querySelector('#selectedFileInfo').style.display).not.toBe('none');
    expect(container.querySelector('#uploadButton').disabled).toBe(false);
  });
  
  test('should reject invalid file types', () => {
    const file = createMockFile('test.txt', 'text/plain');
    const event = { target: { files: [file] } };
    
    imageUpload.handleFileSelection(event);
    
    expect(imageUpload.selectedFile).toBeNull();
    expect(container.querySelector('#uploadError').style.display).not.toBe('none');
    expect(container.querySelector('#uploadError').textContent).toContain('Invalid file type');
  });
  
  test('should reject files exceeding size limit', () => {
    const file = createMockFile('large.jpg', 'image/jpeg', 6 * 1024 * 1024); // 6MB
    const event = { target: { files: [file] } };
    
    imageUpload.handleFileSelection(event);
    
    expect(imageUpload.selectedFile).toBeNull();
    expect(container.querySelector('#uploadError').style.display).not.toBe('none');
    expect(container.querySelector('#uploadError').textContent).toContain('size exceeds');
  });
  
  test('should handle dropped files', () => {
    const file = createMockFile();
    const dropZone = container.querySelector('#dropZone');
    
    // Mock the validateAndProcessFile method
    const validateSpy = jest.spyOn(imageUpload, 'validateAndProcessFile');
    
    // Create a mock drop event
    const dropEvent = new Event('drop');
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: { files: [file] }
    });
    
    // Trigger drop event
    dropZone.dispatchEvent(dropEvent);
    
    // Check if handleDroppedFiles was called
    expect(validateSpy).toHaveBeenCalledWith(file);
  });
  
  test('should add dragging class on dragenter', () => {
    const dropZone = container.querySelector('#dropZone');
    
    // Create and dispatch dragenter event
    const dragEnterEvent = new Event('dragenter');
    dropZone.dispatchEvent(dragEnterEvent);
    
    // Check if dragging class was added
    expect(dropZone.classList.contains('file-input-container--dragging')).toBe(true);
    expect(imageUpload.isDragging).toBe(true);
  });
  
  test('should remove dragging class on dragleave', () => {
    const dropZone = container.querySelector('#dropZone');
    
    // First add the dragging class
    const dragEnterEvent = new Event('dragenter');
    dropZone.dispatchEvent(dragEnterEvent);
    
    // Then create and dispatch dragleave event
    const dragLeaveEvent = new Event('dragleave');
    dropZone.dispatchEvent(dragLeaveEvent);
    
    // Check if dragging class was removed
    expect(dropZone.classList.contains('file-input-container--dragging')).toBe(false);
    expect(imageUpload.isDragging).toBe(false);
  });
  
  test('should upload image when upload button is clicked', async () => {
    const file = createMockFile();
    const event = { target: { files: [file] } };
    
    // Select a file
    imageUpload.handleFileSelection(event);
    
    // Click upload button
    const uploadButton = container.querySelector('#uploadButton');
    uploadButton.click();
    
    // Check if fetch was called with correct parameters
    expect(fetch).toHaveBeenCalledWith('/api/images/upload', {
      method: 'POST',
      headers: {
        'User-ID': 'user1'
      },
      body: expect.any(FormData)
    });
    
    // Wait for the upload to complete
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Check if callback was called
    expect(onImageUploadedMock).toHaveBeenCalled();
  });
});