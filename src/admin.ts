import { supabase, type Rsvp, type Invitee } from './supabase'

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

async function fetchInvitees(): Promise<Invitee[]> {
  const { data, error } = await supabase
    .from('invitees')
    .select('*')
    .order('last_name', { ascending: true })

  if (error) throw new Error(error.message)
  return data as Invitee[]
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
    </div>
  `
}

function renderRsvpsTable(rsvps: Rsvp[]): string {
  if (rsvps.length === 0) {
    return `<p class="admin-empty">No RSVPs yet!</p>`
  }

  const rows = rsvps.map(r => `
    <tr class="${r.attending ? 'row--yes' : 'row--no'}">
      <td>${r.guest_name}</td>
      <td>${r.last_name || '—'}</td>
      <td>${r.attending ? 'Yes' : 'No'}</td>
      <td>${r.plus_one_attending === true ? 'Yes' : r.plus_one_attending === false ? 'No' : '—'}</td>
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
            <th>Last Name</th>
            <th>Attending</th>
            <th>Plus One</th>
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

function renderInviteesTab(invitees: Invitee[], rsvpCounts: Map<string, number>): string {
  const rows = invitees.map(inv => {
    const rsvdCount = rsvpCounts.get(inv.last_name.toLowerCase()) ?? 0
    return `
      <tr data-id="${inv.id}">
        <td>${inv.last_name}</td>
        <td>
          <label class="admin-toggle">
            <input type="checkbox" class="invitee-has-plus-one" ${inv.has_plus_one ? 'checked' : ''} />
            ${inv.has_plus_one ? 'Yes' : 'No'}
          </label>
        </td>
        <td>
          <input type="text" class="invitee-plus-one-name form-input form-input--sm"
            value="${inv.plus_one_name ?? ''}" placeholder="Plus one name"
            ${!inv.has_plus_one ? 'disabled' : ''} />
        </td>
        <td>${rsvdCount}</td>
        <td>
          <button class="admin-btn admin-btn--save" data-id="${inv.id}">Save</button>
          <button class="admin-btn admin-btn--delete" data-id="${inv.id}">Delete</button>
        </td>
      </tr>
    `
  }).join('')

  const tableHtml = invitees.length === 0
    ? `<p class="admin-empty">No invitees yet.</p>`
    : `
      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Last Name</th>
              <th>Plus One?</th>
              <th>Plus One Name</th>
              <th>RSVP'd</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `

  return `
    <div class="admin-add-invitee">
      <h3>Add Invitee</h3>
      <form id="add-invitee-form" class="admin-add-form">
        <input type="text" id="new-last-name" class="form-input" placeholder="Last name" required />
        <label class="admin-checkbox-label">
          <input type="checkbox" id="new-has-plus-one" /> Has Plus One
        </label>
        <input type="text" id="new-plus-one-name" class="form-input" placeholder="Plus one name (optional)" />
        <button type="submit" class="admin-btn admin-btn--add">Add</button>
      </form>
      <p id="add-invitee-error" class="admin-login-error"></p>
    </div>
    <h3>Guest List (${invitees.length})</h3>
    ${tableHtml}
  `
}

// ── Tab navigation ────────────────────────────────────────────────────────────

function renderTabNav(activeTab: 'rsvps' | 'invitees'): string {
  return `
    <div class="admin-tabs">
      <button class="admin-tab ${activeTab === 'rsvps' ? 'admin-tab--active' : ''}" data-tab="rsvps">RSVPs</button>
      <button class="admin-tab ${activeTab === 'invitees' ? 'admin-tab--active' : ''}" data-tab="invitees">Invitees</button>
    </div>
  `
}

async function renderDashboard(activeTab: 'rsvps' | 'invitees' = 'rsvps'): Promise<void> {
  const content = document.getElementById('admin-content')
  if (!content) return

  content.innerHTML = `<p class="admin-loading">Loading...</p>`

  try {
    const [rsvps, invitees] = await Promise.all([fetchRsvps(), fetchInvitees()])

    // Build rsvp counts per last_name for invitees tab
    const rsvpCounts = new Map<string, number>()
    for (const r of rsvps) {
      if (r.last_name) {
        const key = r.last_name.toLowerCase()
        rsvpCounts.set(key, (rsvpCounts.get(key) ?? 0) + 1)
      }
    }

    const tabContent = activeTab === 'rsvps'
      ? renderStats(rsvps) + renderRsvpsTable(rsvps)
      : renderInviteesTab(invitees, rsvpCounts)

    content.innerHTML = renderTabNav(activeTab) + `<div id="tab-content">${tabContent}</div>`

    // Wire up tab buttons
    content.querySelectorAll<HTMLButtonElement>('.admin-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab as 'rsvps' | 'invitees'
        renderDashboard(tab)
      })
    })

    // Wire up invitees tab actions
    if (activeTab === 'invitees') {
      wireInviteesTab(content, invitees)
    }
  } catch (err) {
    content.innerHTML = `<p class="admin-error">Failed to load data. Check your connection.</p>`
    console.error(err)
  }
}

function wireInviteesTab(content: HTMLElement, invitees: Invitee[]): void {
  // Add invitee form
  const addForm = content.querySelector<HTMLFormElement>('#add-invitee-form')
  const addError = content.querySelector<HTMLElement>('#add-invitee-error')

  addForm?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const lastName = (content.querySelector<HTMLInputElement>('#new-last-name'))?.value.trim()
    const hasPlusOne = (content.querySelector<HTMLInputElement>('#new-has-plus-one'))?.checked ?? false
    const plusOneName = (content.querySelector<HTMLInputElement>('#new-plus-one-name'))?.value.trim() || null

    if (!lastName) return

    const { error } = await supabase.from('invitees').insert([{
      last_name: lastName,
      has_plus_one: hasPlusOne,
      plus_one_name: plusOneName,
    }])

    if (error) {
      if (addError) addError.textContent = `Error: ${error.message}`
      return
    }
    renderDashboard('invitees')
  })

  // Plus-one toggle (enable/disable name input)
  content.querySelectorAll<HTMLInputElement>('.invitee-has-plus-one').forEach(checkbox => {
    const row = checkbox.closest('tr')!
    const nameInput = row.querySelector<HTMLInputElement>('.invitee-plus-one-name')!
    checkbox.addEventListener('change', () => {
      nameInput.disabled = !checkbox.checked
      checkbox.nextSibling!.textContent = checkbox.checked ? 'Yes' : 'No'
    })
  })

  // Save buttons
  content.querySelectorAll<HTMLButtonElement>('.admin-btn--save').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id
      const row = btn.closest('tr')!
      const hasPlusOne = row.querySelector<HTMLInputElement>('.invitee-has-plus-one')?.checked ?? false
      const plusOneName = row.querySelector<HTMLInputElement>('.invitee-plus-one-name')?.value.trim() || null

      const { error } = await supabase
        .from('invitees')
        .update({ has_plus_one: hasPlusOne, plus_one_name: plusOneName })
        .eq('id', id)

      if (error) {
        alert(`Save failed: ${error.message}`)
        return
      }
      renderDashboard('invitees')
    })
  })

  // Delete buttons
  content.querySelectorAll<HTMLButtonElement>('.admin-btn--delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id
      const inv = invitees.find(i => i.id === id)
      if (!confirm(`Delete invitee "${inv?.last_name}"?`)) return

      const { error } = await supabase
        .from('invitees')
        .delete()
        .eq('id', id)

      if (error) {
        alert(`Delete failed: ${error.message}`)
        return
      }
      renderDashboard('invitees')
    })
  })
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
