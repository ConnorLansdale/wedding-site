import { supabase, type Rsvp, type Invitee } from './supabase'

/**
 * RSVP Form Handler
 *
 * Reads form values, validates them, then submits to Supabase.
 * Supabase acts as both the API and database - we call it directly
 * from the browser. The anon key + Row Level Security keeps it safe.
 */

/**
 * Check if a name has already RSVP'd
 */
async function checkDuplicate(name: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('rsvps')
    .select('id')
    .ilike('guest_name', name)
    .limit(1)

  if (error) throw new Error(error.message)
  return (data?.length ?? 0) > 0
}

/**
 * Submit an RSVP to the database
 */
async function submitRsvp(rsvp: Rsvp): Promise<void> {
  const { error } = await supabase
    .from('rsvps')
    .insert([rsvp])

  if (error) throw new Error(error.message)
}

/**
 * Show a success or error message in the form
 */
function showFormMessage(type: 'success' | 'warning' | 'error', message: string): void {
  const el = document.getElementById('rsvp-message')
  if (!el) return
  el.textContent = message
  el.className = `rsvp-message rsvp-message--${type}`
}

/**
 * Initialize the RSVP form - attach event listeners
 */
export function initRsvpForm(): void {
  const form = document.getElementById('rsvp-form') as HTMLFormElement | null
  if (!form) return

  const plusOneSection = document.getElementById('plus-one-section') as HTMLElement | null
  const plusOneNameSpan = document.getElementById('plus-one-name') as HTMLElement | null

  // Read the last name stored at login
  const authLastName = sessionStorage.getItem('wedding_auth_last_name')

  // Look up invitee to determine plus-one eligibility
  if (authLastName) {
    supabase
      .from('invitees')
      .select('has_plus_one, plus_one_name')
      .ilike('last_name', authLastName)
      .limit(1)
      .then(({ data }) => {
        const invitee = data?.[0] as Pick<Invitee, 'has_plus_one' | 'plus_one_name'> | undefined
        if (invitee?.has_plus_one && plusOneSection) {
          if (plusOneNameSpan) {
            plusOneNameSpan.textContent = invitee.plus_one_name || 'Plus One'
          }
          plusOneSection.style.display = 'block'
        }
      })
  }

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]')
    if (submitBtn) {
      submitBtn.disabled = true
      submitBtn.textContent = 'Sending...'
    }

    // Read form values
    const attending = (form.querySelector<HTMLInputElement>('input[name="attending"]:checked'))?.value === 'true'
    const guestName = (form.querySelector<HTMLInputElement>('#guest-name'))?.value.trim() ?? ''
    const dietaryRestrictions = (form.querySelector<HTMLInputElement>('#dietary-restrictions'))?.value.trim() ?? ''
    const message = (form.querySelector<HTMLTextAreaElement>('#rsvp-message-input'))?.value.trim() ?? ''
    const plusOneVal = (form.querySelector<HTMLInputElement>('input[name="plus-one-attending"]:checked'))?.value
    const plusOneAttending = plusOneVal === 'true' ? true : plusOneVal === 'false' ? false : undefined

    // Basic validation
    if (!guestName) {
      showFormMessage('error', 'Please fill in your name.')
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send RSVP' }
      return
    }

    try {
      const isDuplicate = await checkDuplicate(guestName)
      if (isDuplicate) {
        showFormMessage('warning', `Looks like you're already on the list, ${guestName}! If you need to make changes, reach out to us directly.`)
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send RSVP' }
        return
      }

      await submitRsvp({
        guest_name: guestName,
        attending,
        last_name: authLastName ?? '',
        plus_one_attending: plusOneAttending,
        dietary_restrictions: dietaryRestrictions || undefined,
        message: message || undefined,
      })

      // Success!
      form.reset()
      if (plusOneSection) plusOneSection.style.display = 'none'
      showFormMessage('success', attending
        ? `You're on the list, ${guestName}! Can't wait to see you!`
        : `We'll miss you, ${guestName}. Thank you for letting us know.`
      )
    } catch (err) {
      showFormMessage('error', 'Something went wrong. Please try again or contact us directly.')
      console.error(err)
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send RSVP' }
    }
  })
}
