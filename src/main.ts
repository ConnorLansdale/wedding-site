import './style.css';
import { initRouter } from './router';
import { isAuthenticated, showPasswordGate } from './auth';
import { initRsvpForm } from './rsvp';
import { initAdminPage } from './admin';

/**
 * Wedding Date Configuration
 * Update this to your actual wedding date!
 */
const WEDDING_DATE = new Date('2026-06-14T16:00:00');

/**
 * Countdown Timer Interface
 */
interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Calculate time remaining until wedding
 */
function calculateTimeRemaining(): CountdownTime {
  const now = new Date().getTime();
  const weddingTime = WEDDING_DATE.getTime();
  const difference = weddingTime - now;

  // If the wedding has passed
  if (difference < 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

/**
 * Update the countdown display
 */
function updateCountdown(): void {
  const time = calculateTimeRemaining();

  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');

  if (daysEl) daysEl.textContent = String(time.days).padStart(3, '0');
  if (hoursEl) hoursEl.textContent = String(time.hours).padStart(2, '0');
  if (minutesEl) minutesEl.textContent = String(time.minutes).padStart(2, '0');
  if (secondsEl) secondsEl.textContent = String(time.seconds).padStart(2, '0');
}

/**
 * Add scroll animation observers
 */
function addScrollAnimation(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1 }
  );

  // Observe all animated elements
  const animatedElements = document.querySelectorAll('.detail-card, .timeline-item');
  animatedElements.forEach((el) => observer.observe(el));
}

/**
 * Initialize the application
 */
async function init(): Promise<void> {
  // Show password gate if not authenticated (skip for admin route — it has its own gate)
  const currentPath = window.location.hash.slice(1).replace(/^\//, '')
  if (currentPath !== 'admin' && !isAuthenticated()) {
    await showPasswordGate();
  }

  // Initialize the router (SPA navigation)
  initRouter();

  // Update countdown immediately
  updateCountdown();

  // Update countdown every second
  setInterval(updateCountdown, 1000);

  // Initialize RSVP form
  initRsvpForm();

  // Initialize admin page
  initAdminPage();

  // Add scroll animations
  addScrollAnimation();

  // Log a fun message for developers who open the console
  console.log('👋 Hey there! Congrats on checking the console.');
  console.log('🎉 This wedding website was built with TypeScript, Vite, and love.');
  console.log(`💍 Wedding date: ${WEDDING_DATE.toLocaleDateString()}`);
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for potential future use
export { calculateTimeRemaining, updateCountdown };
