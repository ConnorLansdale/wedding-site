/**
 * Site-wide password gate
 *
 * How it works:
 * - The correct password is stored as an environment variable (never hardcoded)
 * - On login, the guest must also provide their last name, which is verified
 *   against the invitees table in Supabase
 * - On success we store two flags in sessionStorage (cleared when tab closes):
 *   - wedding_auth: 'true'
 *   - wedding_auth_last_name: the matched last name (lowercase from DB)
 *
 * Security note: This is "security through obscurity" - a determined person
 * could find the password in the JS bundle. For a wedding site this is fine,
 * it just keeps casual visitors and bots out.
 */

import { supabase } from './supabase'

// sessionStorage clears when the browser tab/window is closed
const STORAGE_KEY = 'wedding_auth'
const LAST_NAME_KEY = 'wedding_auth_last_name'
const CORRECT_PASSWORD = import.meta.env.VITE_SITE_PASSWORD as string

/**
 * Check if the guest has already authenticated
 */
export function isAuthenticated(): boolean {
  return sessionStorage.getItem(STORAGE_KEY) === 'true'
    && sessionStorage.getItem(LAST_NAME_KEY) !== null
}

/**
 * Log out (clear authentication)
 */
export function logout(): void {
  sessionStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(LAST_NAME_KEY)
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
        <h1 class="gate-title">Kippy <span class="gate-ampersand">&</span> Connor</h1>
        <p class="gate-subtitle">Please enter your last name and password to continue</p>
        <form id="gate-form" class="gate-form">
          <div class="gate-input-wrapper">
            <input
              type="text"
              id="gate-last-name"
              class="gate-input"
              placeholder="Last name"
              autocomplete="family-name"
              autofocus
              required
            />
          </div>
          <div class="gate-input-wrapper">
            <input
              type="password"
              id="gate-input"
              class="gate-input"
              placeholder="Enter password"
              autocomplete="current-password"
              required
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

    const lastNameInput = document.getElementById('gate-last-name') as HTMLInputElement
    const input = document.getElementById('gate-input') as HTMLInputElement
    const error = document.getElementById('gate-error') as HTMLElement
    const form = document.getElementById('gate-form') as HTMLFormElement
    const toggle = document.getElementById('gate-toggle') as HTMLButtonElement
    const eyeIcon = document.getElementById('eye-icon') as HTMLElement
    const eyeOffIcon = document.getElementById('eye-off-icon') as HTMLElement
    const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]')!

    // Toggle password visibility
    toggle.addEventListener('click', () => {
      const isPassword = input.type === 'password'
      input.type = isPassword ? 'text' : 'password'
      eyeIcon.style.display = isPassword ? 'none' : 'block'
      eyeOffIcon.style.display = isPassword ? 'block' : 'none'
      toggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password')
      input.focus()
    })

    function shakeInput(el: HTMLInputElement): void {
      el.classList.add('gate-shake')
      el.addEventListener('animationend', () => {
        el.classList.remove('gate-shake')
      }, { once: true })
    }

    // Handle form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      error.textContent = ''
      submitBtn.disabled = true
      submitBtn.textContent = 'Checking...'

      const password = input.value.trim()
      const lastName = lastNameInput.value.trim()

      // Step 1: Check password
      if (password !== CORRECT_PASSWORD) {
        input.value = ''
        error.textContent = 'Incorrect password. Try again!'
        shakeInput(input)
        submitBtn.disabled = false
        submitBtn.textContent = 'Enter'
        return
      }

      // Step 2: Check last name against invitees table
      try {
        const { data, error: dbError } = await supabase
          .from('invitees')
          .select('last_name')
          .ilike('last_name', lastName)
          .limit(1)

        if (dbError) throw new Error(dbError.message)

        if (!data || data.length === 0) {
          error.textContent = 'Last name not found on guest list. Please check your invitation or contact us.'
          shakeInput(lastNameInput)
          submitBtn.disabled = false
          submitBtn.textContent = 'Enter'
          return
        }

        // Both checks passed — store auth
        const matchedLastName = (data[0] as { last_name: string }).last_name
        sessionStorage.setItem(STORAGE_KEY, 'true')
        sessionStorage.setItem(LAST_NAME_KEY, matchedLastName)

        // Animate gate out
        overlay.classList.add('gate-exit')
        overlay.addEventListener('animationend', () => {
          overlay.remove()
          resolve()
        })
      } catch (err) {
        error.textContent = 'Something went wrong. Please try again.'
        console.error(err)
        submitBtn.disabled = false
        submitBtn.textContent = 'Enter'
      }
    })
  })
}
