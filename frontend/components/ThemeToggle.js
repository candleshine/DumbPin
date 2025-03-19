/**
 * ThemeToggle Component
 * Provides a toggle switch for changing between light and dark themes
 */

class ThemeToggle {
  constructor(containerElement) {
    this.container = containerElement;
    this.currentTheme = localStorage.getItem('theme') || 'light';
    this.init();
  }

  /**
   * Initialize the component
   */
  init() {
    // Create toggle container
    this.createToggleContainer();
    // Set up event listeners
    this.setupEventListeners();
    // Apply saved theme
    this.applyTheme(this.currentTheme);
  }

  /**
   * Create the theme toggle container
   */
  createToggleContainer() {
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'theme-toggle';
    
    toggleContainer.innerHTML = `
      <button class="theme-toggle__button" aria-label="Toggle dark mode">
        <span class="theme-toggle__icon theme-toggle__icon--light">☀️</span>
        <span class="theme-toggle__icon theme-toggle__icon--dark">🌙</span>
      </button>
    `;
    
    this.container.appendChild(toggleContainer);
    this.toggleButton = toggleContainer.querySelector('.theme-toggle__button');
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    this.toggleButton.addEventListener('click', () => {
      this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
      this.applyTheme(this.currentTheme);
      localStorage.setItem('theme', this.currentTheme);
    });
  }

  /**
   * Apply the selected theme
   * @param {string} theme - The theme to apply ('light' or 'dark')
   */
  applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      this.toggleButton.classList.add('theme-toggle__button--dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      this.toggleButton.classList.remove('theme-toggle__button--dark');
    }
  }
}

export default ThemeToggle;