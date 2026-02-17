import { supabase, type Rsvp } from './supabase'

const ADMIN_STORAGE_KEY = 'wedding_admin_auth'
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string

// ── Auth ─────────────────────────────────────────────────────────────────────

export function isAdminAuthenticated(): boolean {
  return sessionStorage.getItem(ADMIN_STORAGE_KEY) === 'true'
}

function adminLogin(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem(ADMIN_STORAGE_KEY, 'true')
    return true
  }
  return false
}

export function adminLogout(): void {
  sessionStorage.removeItem(ADMIN_STORAGE_KEY)
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchRsvps(): Promise<Rsvp[]> {
  const { data, error } = await supabase
    .from('rsvps')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as Rsvp[]
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  })
}

function renderStats(rsvps: Rsvp[]): string {
  const attending = rsvps.filter(r => r.attending)
  const notAttending = rsvps.filter(r => !r.attending)
  const totalGuests = attending.reduce((sum, r) => sum + (r.number_of_guests ?? 1), 0)

  return `
    <div class="admin-stats">
      <div class="stat-card">
        <div class="stat-number">${rsvps.length}</div>
        <div class="stat-label">Total RSVPs</div>
      </div>
      <div class="stat-card stat-card--yes">
        <div class="stat-number">${attending.length}</div>
        <div class="stat-label">Attending</div>
      </div>
      <div class="stat-card stat-card--no">
        <div class="stat-number">${notAttending.length}</div>
        <div class="stat-label">Not Attending</div>
      </div>
      <div class="stat-card stat-card--guests">
        <div class="stat-number">${totalGuests}</div>
        <div class="stat-label">Total Guests</div>
      </div>
    </div>
  `
}

function renderTable(rsvps: Rsvp[]): string {
  if (rsvps.length === 0) {
    return `<p class="admin-empty">No RSVPs yet!</p>`
  }

  const rows = rsvps.map(r => `
    <tr class="${r.attending ? 'row--yes' : 'row--no'}">
      <td>${r.guest_name}</td>
      <td>${r.email}</td>
      <td>${r.attending ? 'Yes' : 'No'}</td>
      <td>${r.attending ? (r.number_of_guests ?? 1) : '—'}</td>
      <td>${r.dietary_restrictions || '—'}</td>
      <td class="td--message">${r.message || '—'}</td>
      <td>${formatDate(r.created_at!)}</td>
    </tr>
  `).join('')

  return `
    <div class="admin-table-wrapper">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Attending</th>
            <th>Guests</th>
            <th>Dietary</th>
            <th>Message</th>
            <th>Submitted</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `
}

async function renderDashboard(): Promise<void> {
  const content = document.getElementById('admin-content')
  if (!content) return

  content.innerHTML = `<p class="admin-loading">Loading RSVPs...</p>`

  try {
    const rsvps = await fetchRsvps()
    content.innerHTML = renderStats(rsvps) + renderTable(rsvps)
  } catch (err) {
    content.innerHTML = `<p class="admin-error">Failed to load RSVPs. Check your connection.</p>`
    console.error(err)
  }
}

// ── Password gate ─────────────────────────────────────────────────────────────

function renderLoginForm(): void {
  const content = document.getElementById('admin-content')
  if (!content) return

  content.innerHTML = `
    <form id="admin-login-form" class="admin-login-form">
      <h2>Admin Access</h2>
      <input
        type="password"
        id="admin-password-input"
        class="form-input"
        placeholder="Admin password"
        autofocus
      />
      <p id="admin-login-error" class="admin-login-error"></p>
      <button type="submit" class="rsvp-submit">Login</button>
    </form>
  `

  const form = document.getElementById('admin-login-form') as HTMLFormElement
  const input = document.getElementById('admin-password-input') as HTMLInputElement
  const error = document.getElementById('admin-login-error') as HTMLElement

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (adminLogin(input.value.trim())) {
      await renderDashboard()
    } else {
      input.value = ''
      error.textContent = 'Incorrect password.'
    }
  })
}

// ── Public init ───────────────────────────────────────────────────────────────

export async function initAdminPage(): Promise<void> {
  // Wire up logout button
  document.getElementById('admin-logout')?.addEventListener('click', () => {
    adminLogout()
    renderLoginForm()
  })

  if (isAdminAuthenticated()) {
    await renderDashboard()
  } else {
    renderLoginForm()
  }
}
