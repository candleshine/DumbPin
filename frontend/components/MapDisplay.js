/**
 * MapDisplay Component
 * Integrates with map provider and handles pin placement on map coordinates
 */

/* global L */

class MapDisplay {
  constructor(containerElement) {
    this.container = containerElement;
    this.map = null;
    this.pins = [];
    this.activePinIndex = -1;
    this.isDragging = false;
    this.addPinMode = false;
    this.init();
  }

  /**
   * Initialize the component
   */
  init() {
    // Create map container
    this.createMapContainer();
    // Set up event listeners
    this.setupEventListeners();
    // Initialize map (using Leaflet.js as the map provider)
    this.initializeMap();
  }

  /**
   * Create the map container
   */
  createMapContainer() {
    const mapContainer = document.createElement('div');
    mapContainer.className = 'map-display';
    mapContainer.innerHTML = `
      <div class="map-container">
        <div id="mapWrapper" class="map-wrapper">
          <div id="map" class="map"></div>
          <div id="mapPinContainer" class="map-pin-container"></div>
        </div>
        <div class="no-map-message" id="noMapMessage">
          <p>No map location selected. Please select a location to get started.</p>
        </div>
      </div>
      <div class="map-controls" id="mapControls">
        <div class="pin-controls">
          <button id="addMapPinButton" class="btn btn-primary">Add Pin</button>
          <div class="pin-style-controls">
            <label for="mapPinColor">Pin Color:</label>
            <input type="color" id="mapPinColor" value="#ff6b6b">
          </div>
        </div>
        <div class="zoom-controls">
          <button id="zoomInButton" class="btn btn-secondary">Zoom In</button>
          <button id="zoomOutButton" class="btn btn-secondary">Zoom Out</button>
          <button id="resetViewButton" class="btn btn-secondary">Reset View</button>
        </div>
      </div>
    `;

    this.container.appendChild(mapContainer);

    // Store references to DOM elements
    this.mapWrapper = document.getElementById('mapWrapper');
    this.mapElement = document.getElementById('map');
    this.mapPinContainer = document.getElementById('mapPinContainer');
    this.noMapMessage = document.getElementById('noMapMessage');
    this.mapControls = document.getElementById('mapControls');
    this.addMapPinButton = document.getElementById('addMapPinButton');
    this.mapPinColor = document.getElementById('mapPinColor');
    this.zoomInButton = document.getElementById('zoomInButton');
    this.zoomOutButton = document.getElementById('zoomOutButton');
    this.resetViewButton = document.getElementById('resetViewButton');
  }

  /**
   * Initialize the map using Leaflet.js
   */
  initializeMap() {
    // Hide no map message
    this.noMapMessage.style.display = 'none';
    
    // Check if Leaflet is available
    if (typeof L === 'undefined') {
      console.error('Leaflet library not loaded');
      this.noMapMessage.textContent = 'Map service unavailable. Please try again later.';
      this.noMapMessage.style.display = 'block';
      return;
    }
    
    // Initialize the map
    this.map = L.map('map').setView([51.505, -0.09], 13); // Default to London
    
    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);
    
    // Add click event for pin placement
    this.map.on('click', (event) => {
      if (this.addPinMode) {
        this.addPin(event);
      }
    });
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Add pin button click
    this.addMapPinButton.addEventListener('click', () => {
      this.togglePinMode();
    });

    // Zoom controls
    this.zoomInButton.addEventListener('click', () => {
      this.zoomIn();
    });
    
    this.zoomOutButton.addEventListener('click', () => {
      this.zoomOut();
    });
    
    this.resetViewButton.addEventListener('click', () => {
      this.resetView();
    });
  }

  /**
   * Toggle pin placement mode
   */
  togglePinMode() {
    this.addPinMode = !this.addPinMode;
    if (this.addPinMode) {
      this.addMapPinButton.textContent = 'Cancel';
      this.mapWrapper.classList.add('pin-mode');
    } else {
      this.addMapPinButton.textContent = 'Add Pin';
      this.mapWrapper.classList.remove('pin-mode');
    }
  }

  /**
   * Add a pin at the clicked position on the map
   * @param {Object} event - Map click event
   */
  addPin(event) {
    const latlng = event.latlng;
    
    // Create pin data
    const pinData = {
      id: Date.now().toString(), // Temporary ID until saved to server
      lat: latlng.lat,
      lng: latlng.lng,
      color: this.mapPinColor.value
    };
    
    // Add to pins array
    this.pins.push(pinData);
    
    // Add marker to map
    const marker = L.marker([pinData.lat, pinData.lng], {
      draggable: true,
      title: `Pin ${pinData.id}`,
      icon: this.createCustomIcon(pinData.color)
    }).addTo(this.map);
    
    // Store marker reference in pin data
    pinData.marker = marker;
    
    // Add drag end event to update pin data
    marker.on('dragend', (event) => {
      const position = event.target.getLatLng();
      pinData.lat = position.lat;
      pinData.lng = position.lng;
      this.savePin(pinData);
    });
    
    // Save to server
    this.savePin(pinData);
    
    // Exit pin mode
    this.togglePinMode();
  }
  
  /**
   * Create custom pin icon with specified color
   * @param {string} color - Pin color
   * @returns {L.DivIcon} Custom icon
   */
  createCustomIcon(color) {
    return L.divIcon({
      className: 'custom-map-pin',
      html: `<div style="background-color: ${color}"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  }
  
  /**
   * Save pin data to server
   * @param {Object} pinData - Pin data
   */
  savePin(pinData) {
    // Clone the pin data without the marker reference
    const pinToSave = { ...pinData };
    delete pinToSave.marker;
    
    // Send to server
    fetch('/api/maps/pins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': 'user1' // For Phase 1, using mock user ID
      },
      body: JSON.stringify(pinToSave)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to save pin');
        }
        return response.json();
      })
      .then(data => {
        console.log('Pin saved successfully:', data);
      })
      .catch(error => {
        console.error('Error saving pin:', error);
      });
  }
  
  /**
   * Load pins from server
   * @param {string} mapId - Map ID
   * @returns {Promise} - Promise that resolves when pins are loaded
   */
  loadPins(mapId) {
    return fetch(`/api/maps/${mapId}/pins`, {
      headers: {
        'User-ID': 'user1' // For Phase 1, using mock user ID
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load pins');
        }
        return response.json();
      })
      .then(data => {
        this.pins = data;
        this.renderPins();
        return data; // Return data for chaining
      })
      .catch(error => {
        console.error('Error loading pins:', error);
        throw error; // Re-throw for proper error handling in tests
      });
  }
  
  /**
   * Render all pins on the map
   */
  renderPins() {
    // Clear existing pins
    this.pins.forEach(pin => {
      if (pin.marker) {
        this.map.removeLayer(pin.marker);
      }
    });
    
    // Add pins to map
    this.pins.forEach(pin => {
      const marker = L.marker([pin.lat, pin.lng], {
        draggable: true,
        title: `Pin ${pin.id}`,
        icon: this.createCustomIcon(pin.color)
      }).addTo(this.map);
      
      // Store marker reference
      pin.marker = marker;
      
      // Add drag end event
      marker.on('dragend', (event) => {
        const position = event.target.getLatLng();
        pin.lat = position.lat;
        pin.lng = position.lng;
        this.savePin(pin);
      });
    });
  }
  
  /**
   * Zoom in on the map
   */
  zoomIn() {
    if (this.map) {
      this.map.zoomIn();
    }
  }
  
  /**
   * Zoom out on the map
   */
  zoomOut() {
    if (this.map) {
      this.map.zoomOut();
    }
  }
  
  /**
   * Reset map view to default
   */
  resetView() {
    if (this.map) {
      this.map.setView([51.505, -0.09], 13); // Default to London
    }
  }
  
  /**
   * Export map with pins as PNG
   */
  exportMap() {
    // This is a placeholder for the export functionality
    // Will be implemented in Phase 2
    alert('Export functionality will be available in the next version.');
  }
}

// Export the MapDisplay class as default
module.exports = MapDisplay;