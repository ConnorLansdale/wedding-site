import { supabase, type Rsvp } from './supabase'

/**
 * RSVP Form Handler
 *
 * Reads form values, validates them, then submits to Supabase.
 * Supabase acts as both the API and database - we call it directly
 * from the browser. The anon key + Row Level Security keeps it safe.
 */

/**
 * Check if an email has already RSVP'd
 */
async function checkDuplicate(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('rsvps')
    .select('id')
    .eq('email', email)
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
function showFormMessage(type: 'success' | 'error', message: string): void {
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

  // Toggle guest count field based on attending selection
  const attendingInputs = form.querySelectorAll<HTMLInputElement>('input[name="attending"]')
  const guestCountSection = document.getElementById('guest-count-section')

  attendingInputs.forEach(input => {
    input.addEventListener('change', () => {
      const attending = (form.querySelector<HTMLInputElement>('input[name="attending"]:checked'))?.value === 'true'
      if (guestCountSection) {
        guestCountSection.style.display = attending ? 'block' : 'none'
      }
    })
  })

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
    const email = (form.querySelector<HTMLInputElement>('#guest-email'))?.value.trim() ?? ''
    const phone = (form.querySelector<HTMLInputElement>('#guest-phone'))?.value.trim() ?? ''
    const numberOfGuests = parseInt((form.querySelector<HTMLInputElement>('#number-of-guests'))?.value ?? '1')
    const dietaryRestrictions = (form.querySelector<HTMLInputElement>('#dietary-restrictions'))?.value.trim() ?? ''
    const message = (form.querySelector<HTMLTextAreaElement>('#rsvp-message-input'))?.value.trim() ?? ''

    // Basic validation
    if (!guestName || !email) {
      showFormMessage('error', 'Please fill in your name and email.')
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send RSVP' }
      return
    }

    try {
      const isDuplicate = await checkDuplicate(email)
      if (isDuplicate) {
        showFormMessage('success', `You're already on the list, ${guestName}! If you need to make changes, reach out to us directly.`)
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send RSVP' }
        return
      }

      await submitRsvp({
        guest_name: guestName,
        email,
        phone: phone || undefined,
        attending,
        number_of_guests: attending ? numberOfGuests : 0,
        dietary_restrictions: dietaryRestrictions || undefined,
        message: message || undefined,
      })

      // Success!
      form.reset()
      if (guestCountSection) guestCountSection.style.display = 'none'
      showFormMessage('success', attending
        ? `🎉 You're on the list, ${guestName}! Can't wait to see you!`
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
