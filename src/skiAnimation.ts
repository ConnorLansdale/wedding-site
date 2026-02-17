/**
 * Ski animation - runs on successful login
 *
 * How it works:
 * - Creates a full-screen canvas overlay (z-index just below the password gate)
 * - Spawns 1-8 skiers at the center of the screen
 * - Each skier travels in a random outward direction using parametric equations:
 *     x(t) = cx + cos(angle) * speed * t  +  cos(perp) * amplitude * sin(freq * t + phase)
 *     y(t) = cy + sin(angle) * speed * t  +  sin(perp) * amplitude * sin(freq * t + phase)
 *   The first term is straight-line travel, the second is the S-turn sway
 * - Trails are drawn as line segments between past positions, fading with age
 * - Everything fades out in the final second
 */

const DURATION_MS = 6000
const TRAIL_FADE_MS = 2500  // How long a trail segment takes to fully fade
const SKIER_EMOJI = '⛷️'

interface TrailPoint {
  x: number
  y: number
  t: number  // timestamp when this point was recorded
}

interface Skier {
  angle: number       // outward direction (radians)
  speed: number       // pixels per second along primary direction
  amplitude: number   // width of S-turns in pixels
  frequency: number   // S-turn cycles per second
  phase: number       // phase offset so skiers don't all sway in sync
  trail: TrailPoint[]
}

function getPosition(skier: Skier, cx: number, cy: number, elapsedSec: number): [number, number] {
  const perpAngle = skier.angle + Math.PI / 2
  const dist = skier.speed * elapsedSec
  const sway = skier.amplitude * Math.sin(skier.frequency * elapsedSec * Math.PI * 2 + skier.phase)

  return [
    cx + Math.cos(skier.angle) * dist + Math.cos(perpAngle) * sway,
    cy + Math.sin(skier.angle) * dist + Math.sin(perpAngle) * sway,
  ]
}

function isOffscreen(x: number, y: number, w: number, h: number): boolean {
  const margin = 80
  return x < -margin || x > w + margin || y < -margin || y > h + margin
}

export function runSkierAnimation(): void {
  const w = window.innerWidth
  const h = window.innerHeight
  const cx = w / 2
  const cy = h / 2

  // Create canvas sitting just below the password gate
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 99998;
    pointer-events: none;
  `
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')!

  // Spawn 1–8 skiers, spread roughly evenly around 360°
  const count = Math.floor(Math.random() * 8) + 1
  const skiers: Skier[] = Array.from({ length: count }, (_, i) => {
    // Spread evenly with a small random jitter so they don't bunch up
    const baseAngle = (i / count) * Math.PI * 2
    const jitter = (Math.random() - 0.5) * ((Math.PI * 2) / count) * 0.5

    return {
      angle: baseAngle + jitter,
      speed: 90 + Math.random() * 70,      // 90–160 px/sec
      amplitude: 35 + Math.random() * 55,  // 35–90 px sway
      frequency: 0.6 + Math.random() * 0.8, // 0.6–1.4 cycles/sec
      phase: Math.random() * Math.PI * 2,
      trail: [],
    }
  })

  let startTime: number | null = null

  function animate(timestamp: number): void {
    if (!startTime) startTime = timestamp
    const elapsed = timestamp - startTime
    const elapsedSec = elapsed / 1000

    ctx.clearRect(0, 0, w, h)

    // Fade everything out over the final second
    const globalAlpha = elapsed > DURATION_MS - 1000
      ? 1 - (elapsed - (DURATION_MS - 1000)) / 1000
      : 1

    skiers.forEach(skier => {
      const [x, y] = getPosition(skier, cx, cy, elapsedSec)

      // Record trail point
      skier.trail.push({ x, y, t: elapsed })

      // Draw trail - each segment fades individually based on its age
      for (let i = 1; i < skier.trail.length; i++) {
        const curr = skier.trail[i]
        const prev = skier.trail[i - 1]
        const age = elapsed - curr.t
        const trailAlpha = Math.max(0, 1 - age / TRAIL_FADE_MS) * globalAlpha

        if (trailAlpha <= 0) continue

        ctx.beginPath()
        ctx.moveTo(prev.x, prev.y)
        ctx.lineTo(curr.x, curr.y)
        ctx.strokeStyle = `rgba(180, 220, 255, ${trailAlpha})`
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.stroke()
      }

      // Draw skier emoji (skip if already off screen)
      if (!isOffscreen(x, y, w, h)) {
        ctx.save()
        ctx.globalAlpha = globalAlpha
        ctx.font = '24px serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(SKIER_EMOJI, x, y)
        ctx.restore()
      }
    })

    if (elapsed < DURATION_MS) {
      requestAnimationFrame(animate)
    } else {
      canvas.remove()
    }
  }

  requestAnimationFrame(animate)
}
