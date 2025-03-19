/**
 * @jest-environment jsdom
 */

// Mock the component imports before requiring the index.js file
jest.mock('../components/ImageUpload');
jest.mock('../components/ImageDisplay');
jest.mock('../components/MapDisplay');

// Mock the SCSS import
jest.mock('../scss/main.scss', () => {}, { virtual: true });

describe('Frontend Application', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  it('should initialize the application', () => {
    // Import the index.js file which contains the initialization code
    require('../js/index.js');
    
    // Trigger the DOMContentLoaded event
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);
    
    // Check if the app container has been populated
    const appContainer = document.getElementById('app');
    expect(appContainer.innerHTML).toContain('DumbPin');
  });
});