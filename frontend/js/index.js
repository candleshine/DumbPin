// Main entry point for the frontend application

import ImageUpload from '../components/ImageUpload';
import ImageDisplay from '../components/ImageDisplay';
import MapDisplay from '../components/MapDisplay';

document.addEventListener('DOMContentLoaded', () => {
  console.log('DumbPin application initialized');
  
  // Initialize the application
  initApp();
});

/**
 * Initialize the application
 */
function initApp() {
  // Create main application container
  const appContainer = document.getElementById('app');
  if (!appContainer) return;
  
  // Clear any existing content
  appContainer.innerHTML = '';
  
  // Create app layout
  appContainer.innerHTML = `
    <header class="app-header">
      <h1>DumbPin</h1>
      <p>Your interactive visual collaboration tool</p>
    </header>
    <main class="app-content">
      <div class="container upload-section" id="uploadSection"></div>
      <div class="container display-section" id="displaySection"></div>
      <div class="container map-section" id="mapSection"></div>
    </main>
  `;
  
  // Initialize components
  const uploadSection = document.getElementById('uploadSection');
  const displaySection = document.getElementById('displaySection');
  const mapSection = document.getElementById('mapSection');
  
  // Create image display component
  const imageDisplay = new ImageDisplay(displaySection);
  
  // Create image upload component with callback
  const imageUpload = new ImageUpload(uploadSection, (imageData) => {
    // When image is uploaded, display it
    imageDisplay.displayImage(imageData);
  });
  
  // Create map display component and connect it with image display
  const mapDisplay = new MapDisplay(mapSection);
  
  // Return components for potential future use
  return { imageUpload, imageDisplay, mapDisplay };
}