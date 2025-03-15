/**
 * ImageUpload Component
 * Handles image file selection, validation, and uploading
 */

class ImageUpload {
  constructor(containerElement, onImageUploaded) {
    this.container = containerElement;
    this.onImageUploaded = onImageUploaded;
    this.selectedFile = null;
    this.init();
  }

  /**
   * Initialize the component
   */
  init() {
    // Create upload container
    this.createUploadContainer();
    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Create the upload container
   */
  createUploadContainer() {
    const uploadContainer = document.createElement('div');
    uploadContainer.className = 'image-upload';
    uploadContainer.innerHTML = `
      <div class="upload-container">
        <div class="file-input-container">
          <input type="file" id="fileInput" class="file-input" accept="image/jpeg,image/png,image/gif">
          <label for="fileInput" class="file-input-label">
            <span class="file-input-icon">📁</span>
            <span class="file-input-text">Choose an image</span>
          </label>
        </div>
        <div class="selected-file-info" id="selectedFileInfo" style="display: none;">
          <p class="selected-file-name" id="selectedFileName"></p>
          <p class="selected-file-size" id="selectedFileSize"></p>
        </div>
        <div class="upload-actions">
          <button id="uploadButton" class="btn btn-primary" disabled>Upload</button>
        </div>
        <div class="upload-progress" id="uploadProgress" style="display: none;">
          <div class="progress-bar" id="progressBar"></div>
        </div>
        <div class="upload-error" id="uploadError" style="display: none;"></div>
      </div>
    `;

    this.container.appendChild(uploadContainer);

    // Store references to DOM elements
    this.fileInput = document.getElementById('fileInput');
    this.selectedFileInfo = document.getElementById('selectedFileInfo');
    this.selectedFileName = document.getElementById('selectedFileName');
    this.selectedFileSize = document.getElementById('selectedFileSize');
    this.uploadButton = document.getElementById('uploadButton');
    this.uploadProgress = document.getElementById('uploadProgress');
    this.progressBar = document.getElementById('progressBar');
    this.uploadError = document.getElementById('uploadError');
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // File selection
    this.fileInput.addEventListener('change', (event) => {
      this.handleFileSelection(event);
    });

    // Upload button click
    this.uploadButton.addEventListener('click', () => {
      this.uploadImage();
    });
  }

  /**
   * Handle file selection
   * @param {Event} event - File input change event
   */
  handleFileSelection(event) {
    const file = event.target.files[0];
    if (!file) {
      this.resetFileSelection();
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      this.showError('Invalid file type. Please select a JPG, PNG, or GIF image.');
      this.resetFileSelection();
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.showError('File size exceeds the 5MB limit. Please select a smaller image.');
      this.resetFileSelection();
      return;
    }

    // Store selected file
    this.selectedFile = file;

    // Update UI
    this.selectedFileName.textContent = file.name;
    this.selectedFileSize.textContent = this.formatFileSize(file.size);
    this.selectedFileInfo.style.display = 'block';
    this.uploadButton.disabled = false;
    this.hideError();
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes < 1024) {
      return bytes + ' bytes';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
  }

  /**
   * Upload the selected image
   */
  uploadImage() {
    if (!this.selectedFile) return;

    // Create form data
    const formData = new FormData();
    formData.append('image', this.selectedFile);

    // Show progress bar
    this.uploadProgress.style.display = 'block';
    this.progressBar.style.width = '0%';
    this.uploadButton.disabled = true;

    // Upload file
    fetch('/api/images/upload', {
      method: 'POST',
      headers: {
        'User-ID': 'user1' // For Phase 1, using mock user ID
      },
      body: formData
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.message || 'Upload failed');
          });
        }
        return response.json();
      })
      .then(data => {
        // Complete progress bar
        this.progressBar.style.width = '100%';
        
        // Reset form after a short delay
        setTimeout(() => {
          this.resetFileSelection();
          this.uploadProgress.style.display = 'none';
          
          // Notify parent component
          if (this.onImageUploaded) {
            this.onImageUploaded(data);
          }
        }, 500);
      })
      .catch(error => {
        this.showError(error.message || 'Failed to upload image. Please try again.');
        this.uploadButton.disabled = false;
        this.uploadProgress.style.display = 'none';
      });
  }

  /**
   * Reset file selection
   */
  resetFileSelection() {
    this.fileInput.value = '';
    this.selectedFile = null;
    this.selectedFileInfo.style.display = 'none';
    this.uploadButton.disabled = true;
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    this.uploadError.textContent = message;
    this.uploadError.style.display = 'block';
  }

  /**
   * Hide error message
   */
  hideError() {
    this.uploadError.style.display = 'none';
    this.uploadError.textContent = '';
  }
}

export default ImageUpload;