/**
 * Site-wide password gate
 *
 * How it works:
 * - The correct password is stored as an environment variable (never hardcoded)
 * - When a guest enters the correct password, we store a flag in localStorage
 *   so they don't have to re-enter it every visit (persistent across sessions)
 * - If the flag isn't set, show the password screen instead of the site
 *
 * Security note: This is "security through obscurity" - a determined person
 * could find the password in the JS bundle. For a wedding site this is fine,
 * it just keeps casual visitors and bots out.
 */

// sessionStorage clears when the browser tab/window is closed
const STORAGE_KEY = 'wedding_auth'
const CORRECT_PASSWORD = import.meta.env.VITE_SITE_PASSWORD as string

/**
 * Check if the guest has already authenticated
 */
export function isAuthenticated(): boolean {
  return sessionStorage.getItem(STORAGE_KEY) === 'true'
}

/**
 * Attempt to authenticate with a password
 * Returns true if correct, false if wrong
 */
export function attemptLogin(password: string): boolean {
  if (password === CORRECT_PASSWORD) {
    sessionStorage.setItem(STORAGE_KEY, 'true')
    return true
  }
  return false
}

/**
 * Log out (clear authentication)
 */
export function logout(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}

/**
 * Render and handle the password gate screen.
 * Returns a promise that resolves when the user authenticates.
 */
export function showPasswordGate(): Promise<void> {
  return new Promise((resolve) => {
    // Create the overlay
    const overlay = document.createElement('div')
    overlay.id = 'password-gate'
    overlay.innerHTML = `
      <div class="gate-card">
        <h1 class="gate-title">Connor <span class="gate-ampersand">&</span> Kippy</h1>
        <p class="gate-subtitle">Please enter the password to continue</p>
        <form id="gate-form" class="gate-form">
          <div class="gate-input-wrapper">
            <input
              type="password"
              id="gate-input"
              class="gate-input"
              placeholder="Enter password"
              autocomplete="current-password"
              autofocus
            />
            <button type="button" id="gate-toggle" class="gate-toggle" aria-label="Show password">
              <svg id="eye-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg id="eye-off-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
          <p id="gate-error" class="gate-error"></p>
          <button type="submit" class="gate-button">Enter</button>
        </form>
      </div>
    `
    document.body.appendChild(overlay)

    // Focus the input
    const input = document.getElementById('gate-input') as HTMLInputElement
    const error = document.getElementById('gate-error') as HTMLElement
    const form = document.getElementById('gate-form') as HTMLFormElement
    const toggle = document.getElementById('gate-toggle') as HTMLButtonElement
    const eyeIcon = document.getElementById('eye-icon') as HTMLElement
    const eyeOffIcon = document.getElementById('eye-off-icon') as HTMLElement

    // Toggle password visibility
    toggle.addEventListener('click', () => {
      const isPassword = input.type === 'password'
      input.type = isPassword ? 'text' : 'password'
      eyeIcon.style.display = isPassword ? 'none' : 'block'
      eyeOffIcon.style.display = isPassword ? 'block' : 'none'
      toggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password')
      input.focus()
    })

    // Handle form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      const password = input.value.trim()

      if (attemptLogin(password)) {
        // Correct - animate out and resolve
        overlay.classList.add('gate-exit')
        overlay.addEventListener('animationend', () => {
          overlay.remove()
          resolve()
        })
      } else {
        // Wrong - shake and show error
        input.value = ''
        error.textContent = 'Incorrect password. Try again!'
        input.classList.add('gate-shake')
        input.addEventListener('animationend', () => {
          input.classList.remove('gate-shake')
        }, { once: true })
      }
    })
  })
}
