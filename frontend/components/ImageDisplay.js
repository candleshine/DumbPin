/**
 * ImageDisplay Component
 * Displays an image with correct aspect ratio and handles pin placement
 */

class ImageDisplay {
  constructor(containerElement) {
    this.container = containerElement;
    this.image = null;
    this.pins = [];
    this.activePinIndex = -1;
    this.isDragging = false;
    this.addPinMode = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.init();
  }

  /**
   * Initialize the component
   */
  init() {
    // Create display container
    this.createDisplayContainer();
    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Create the image display container
   */
  createDisplayContainer() {
    const displayContainer = document.createElement('div');
    displayContainer.className = 'image-display';
    displayContainer.innerHTML = `
      <div class="image-container">
        <div class="image-wrapper" id="imageWrapper">
          <img id="displayImage" class="display-image" style="display: none;">
          <div id="pinContainer" class="pin-container"></div>
        </div>
        <div class="no-image-message" id="noImageMessage">
          <p>No image selected. Please upload an image to get started.</p>
        </div>
      </div>
      <div class="image-controls" id="imageControls" style="display: none;">
        <div class="pin-controls">
          <button id="addPinButton" class="btn btn-primary">Add Pin</button>
          <div class="pin-style-controls">
            <label for="pinColor">Pin Color:</label>
            <input type="color" id="pinColor" value="#ff6b6b">
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(displayContainer);

    // Store references to DOM elements
    this.imageWrapper = document.getElementById('imageWrapper');
    this.displayImage = document.getElementById('displayImage');
    this.pinContainer = document.getElementById('pinContainer');
    this.noImageMessage = document.getElementById('noImageMessage');
    this.imageControls = document.getElementById('imageControls');
    this.addPinButton = document.getElementById('addPinButton');
    this.pinColor = document.getElementById('pinColor');
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Add pin button click
    this.addPinButton.addEventListener('click', () => {
      this.togglePinMode();
    });

    // Image click for pin placement
    this.imageWrapper.addEventListener('click', (event) => {
      if (this.addPinMode) {
        this.addPin(event);
      }
    });

    // Pin container events for pin dragging
    this.pinContainer.addEventListener('mousedown', (event) => {
      if (event.target.classList.contains('pin')) {
        this.startDragging(event);
      }
    });

    document.addEventListener('mousemove', (event) => {
      if (this.isDragging && this.activePinIndex !== -1) {
        this.dragPin(event);
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.stopDragging();
      }
    });
  }

  /**
   * Display an image
   * @param {Object} imageData - Image data from the server
   */
  displayImage(imageData) {
    this.image = imageData;
    
    // Set image source
    this.displayImage.src = `/api/images/${imageData.id}`;
    this.displayImage.style.display = 'block';
    this.noImageMessage.style.display = 'none';
    this.imageControls.style.display = 'flex';

    // Set aspect ratio if available
    if (imageData.aspectRatio) {
      this.imageWrapper.style.paddingBottom = `${(1 / imageData.aspectRatio) * 100}%`;
    }

    // Try to load pins from server first, then fall back to local storage
    if (imageData.pins && imageData.pins.length > 0) {
      this.pins = imageData.pins;
      this.renderPins();
      
      // Also save server pins to local storage as backup
      import('../js/fileStorage.js')
        .then(module => {
          // Save each pin to local storage
          this.pins.forEach(pin => {
            module.savePin(imageData.id, pin);
          });
        })
        .catch(error => {
          console.error('Error saving pins to local storage:', error);
        });
    } else {
      // Try to load pins from local storage
      this.loadPinsFromLocalStorage(imageData.id);
    }
    
    // Save image data to local storage
    import('../js/fileStorage.js')
      .then(module => {
        module.saveImageData(imageData);
      })
      .catch(error => {
        console.error('Error saving image data to local storage:', error);
      });
  }
  
  /**
   * Load pins from local storage
   * @param {string} imageId - ID of the image
   */
  loadPinsFromLocalStorage(imageId) {
    import('../js/fileStorage.js')
      .then(module => {
        const storedPins = module.getPins(imageId);
        if (storedPins && storedPins.length > 0) {
          this.pins = storedPins;
          this.renderPins();
        } else {
          this.pins = [];
          this.pinContainer.innerHTML = '';
        }
      })
      .catch(error => {
        console.error('Error loading pins from local storage:', error);
        this.pins = [];
        this.pinContainer.innerHTML = '';
      });
  }

  /**
   * Toggle pin placement mode
   */
  togglePinMode() {
    this.addPinMode = !this.addPinMode;
    if (this.addPinMode) {
      this.addPinButton.textContent = 'Cancel';
      this.imageWrapper.classList.add('pin-mode');
    } else {
      this.addPinButton.textContent = 'Add Pin';
      this.imageWrapper.classList.remove('pin-mode');
    }
  }

  /**
   * Add a pin at the clicked position
   * @param {MouseEvent} event - Click event
   */
  addPin(event) {
    if (!this.image) return;
    
    // Get click position relative to image container
    const rect = this.imageWrapper.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    // Create pin data
    const pinData = {
      id: Date.now().toString(), // Temporary ID until saved to server
      x,
      y,
      color: this.pinColor.value
    };
    
    // Add to pins array
    this.pins.push(pinData);
    
    // Render the pin
    this.renderPin(pinData);
    
    // Save to server
    this.savePin(pinData);
    
    // Exit pin mode
    this.togglePinMode();
  }
  
  /**
   * Render all pins
   */
  renderPins() {
    this.pinContainer.innerHTML = '';
    this.pins.forEach(pin => {
      this.renderPin(pin);
    });
  }
  
  /**
   * Render a single pin
   * @param {Object} pin - Pin data
   */
  renderPin(pin) {
    const pinElement = document.createElement('div');
    pinElement.className = 'pin';
    pinElement.dataset.id = pin.id;
    pinElement.style.left = `${pin.x}%`;
    pinElement.style.top = `${pin.y}%`;
    pinElement.style.backgroundColor = pin.color;
    
    this.pinContainer.appendChild(pinElement);
  }
  
  /**
   * Start dragging a pin
   * @param {MouseEvent} event - Mouse down event
   */
  startDragging(event) {
    const pinElement = event.target;
    const pinId = pinElement.dataset.id;
    
    // Find pin index
    this.activePinIndex = this.pins.findIndex(pin => pin.id === pinId);
    
    if (this.activePinIndex !== -1) {
      this.isDragging = true;
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
      
      // Add dragging class
      pinElement.classList.add('dragging');
    }
  }
  
  /**
   * Drag a pin
   * @param {MouseEvent} event - Mouse move event
   */
  dragPin(event) {
    const rect = this.imageWrapper.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    // Update pin position (constrain to image boundaries)
    const constrainedX = Math.max(0, Math.min(100, x));
    const constrainedY = Math.max(0, Math.min(100, y));
    
    // Update pin data
    this.pins[this.activePinIndex].x = constrainedX;
    this.pins[this.activePinIndex].y = constrainedY;
    
    // Update pin element
    const pinElement = document.querySelector(`.pin[data-id="${this.pins[this.activePinIndex].id}"]`);
    if (pinElement) {
      pinElement.style.left = `${constrainedX}%`;
      pinElement.style.top = `${constrainedY}%`;
    }
  }
  
  /**
   * Stop dragging a pin
   */
  stopDragging() {
    if (this.activePinIndex !== -1) {
      // Remove dragging class
      const pinElement = document.querySelector(`.pin[data-id="${this.pins[this.activePinIndex].id}"]`);
      if (pinElement) {
        pinElement.classList.remove('dragging');
      }
      
      // Save updated position to server
      this.updatePin(this.pins[this.activePinIndex]);
      
      // Reset dragging state
      this.isDragging = false;
      this.activePinIndex = -1;
    }
  }
  
  /**
   * Save a new pin to the server
   * @param {Object} pin - Pin data
   */
  savePin(pin) {
    if (!this.image) return;
    
    // First try to save to server
    fetch(`/api/images/${this.image.id}/pins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': 'user1' // For Phase 1, using mock user ID
      },
      body: JSON.stringify({
        x: pin.x,
        y: pin.y,
        color: pin.color
      })
    })
      .then(response => response.json())
      .then(data => {
        // Update pin ID with server-generated ID
        const index = this.pins.findIndex(p => p.id === pin.id);
        if (index !== -1) {
          this.pins[index].id = data.id;
          
          // Update pin element ID
          const pinElement = document.querySelector(`.pin[data-id="${pin.id}"]`);
          if (pinElement) {
            pinElement.dataset.id = data.id;
          }
        }
        
        // Save to local file storage as backup
        import('../js/fileStorage.js')
          .then(module => {
            module.savePin(this.image.id, this.pins[index]);
          })
          .catch(error => {
            console.error('Error importing fileStorage module:', error);
          });
      })
      .catch(error => {
        console.error('Error saving pin to server:', error);
        
        // If server save fails, save to local storage
        import('../js/fileStorage.js')
          .then(module => {
            module.savePin(this.image.id, pin);
          })
          .catch(storageError => {
            console.error('Error importing fileStorage module:', storageError);
          });
      });
  }
  
  /**
   * Update a pin on the server
   * @param {Object} pin - Pin data
   */
  updatePin(pin) {
    if (!this.image) return;
    
    // First try to update on server
    fetch(`/api/images/${this.image.id}/pins/${pin.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': 'user1' // For Phase 1, using mock user ID
      },
      body: JSON.stringify({
        x: pin.x,
        y: pin.y,
        color: pin.color
      })
    })
      .then(() => {
        // Save to local file storage as backup
        import('../js/fileStorage.js')
          .then(module => {
            module.savePin(this.image.id, pin);
          })
          .catch(error => {
            console.error('Error importing fileStorage module:', error);
          });
      })
      .catch(error => {
        console.error('Error updating pin on server:', error);
        
        // If server update fails, save to local storage
        import('../js/fileStorage.js')
          .then(module => {
            module.savePin(this.image.id, pin);
          })
          .catch(storageError => {
            console.error('Error importing fileStorage module:', storageError);
          });
      });
  }
  
  /**
   * Hide error message
   */
  hideError() {
    this.uploadError.style.display = 'none';
    this.uploadError.textContent = '';
  }
}

export default ImageDisplay;