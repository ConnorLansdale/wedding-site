/**
 * Simple hash-based client-side router
 *
 * How it works:
 * 1. User clicks link with href="#/details"
 * 2. Browser updates URL to /#/details (no page reload)
 * 3. 'hashchange' event fires
 * 4. Router reads hash, loads appropriate content
 * 5. Content swapped in DOM
 */

interface Route {
  path: string;
  template: string;
}

/**
 * Route definitions
 * Each route has a path (hash) and HTML template
 */
const routes: Route[] = [
  {
    path: '',
    template: 'home'
  },
  {
    path: 'details',
    template: 'details'
  },
  {
    path: 'rsvp',
    template: 'rsvp'
  },
  {
    path: 'registry',
    template: 'registry'
  },
  {
    path: 'admin',
    template: 'admin'
  }
];

/**
 * Get current route from URL hash
 */
function getCurrentRoute(): string {
  const hash = window.location.hash.slice(1); // Remove '#'
  return hash.startsWith('/') ? hash.slice(1) : hash; // Remove leading '/'
}

/**
 * Update active nav link
 */
function updateActiveNav(path: string): void {
  // Remove active class from all links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });

  // Add active class to current link
  const activeLink = document.querySelector(`a[href="#/${path}"]`) ||
                     document.querySelector('a[href="/"]');
  if (activeLink) {
    activeLink.classList.add('active');
  }
}

/**
 * Show a specific page section
 */
function showPage(pageName: string): void {
  // Hide all pages
  document.querySelectorAll('.page-content').forEach(page => {
    (page as HTMLElement).style.display = 'none';
  });

  // Show requested page
  const pageToShow = document.getElementById(`page-${pageName}`);
  if (pageToShow) {
    pageToShow.style.display = 'block';
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/**
 * Navigate to a route
 */
function navigate(): void {
  const currentPath = getCurrentRoute();

  // Find matching route or default to home
  const route = routes.find(r => r.path === currentPath) || routes[0];

  // Update nav and show page
  updateActiveNav(route.path);
  showPage(route.template);
}

/**
 * Initialize the router
 */
export function initRouter(): void {
  // Listen for hash changes
  window.addEventListener('hashchange', navigate);

  // Handle initial load
  navigate();

  console.log('📍 Router initialized (hash-based SPA)');
}

// Export for manual navigation if needed
export { navigate };
