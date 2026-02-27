const PALETTE = [
  [126, 184, 247],  // soft blue
  [247, 168, 126],  // warm orange
  [168, 247, 126],  // fresh green
  [247, 126, 168],  // rose pink
  [168, 126, 247],  // lavender
  [126, 247, 218],  // mint
  [247, 232, 126],  // soft yellow
  [247, 126, 126],  // coral
]

function randomColor() {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)]
}

function nextColor(current) {
  const idx = PALETTE.findIndex(c => c[0] === current[0] && c[1] === current[1] && c[2] === current[2])
  const next = (idx + 1 + Math.floor(Math.random() * (PALETTE.length - 1))) % PALETTE.length
  return PALETTE[next]
}

export function createParticles(count, w, h) {
  const particles = []
  for (let i = 0; i < count; i++) {
    const radius = 6 + Math.random() * 18
    particles.push({
      x: radius + Math.random() * (w - radius * 2),
      y: radius + Math.random() * (h - radius * 2),
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius,
      mass: radius * radius,
      color: randomColor(),
      glow: 0,
    })
  }
  return particles
}

export function updateParticles(particles, w, h) {
  const n = particles.length

  // move
  for (const p of particles) {
    p.x += p.vx
    p.y += p.vy
    p.glow *= 0.96

    // wall bounce
    if (p.x - p.radius < 0) { p.x = p.radius; p.vx = Math.abs(p.vx) }
    if (p.x + p.radius > w) { p.x = w - p.radius; p.vx = -Math.abs(p.vx) }
    if (p.y - p.radius < 0) { p.y = p.radius; p.vy = Math.abs(p.vy) }
    if (p.y + p.radius > h) { p.y = h - p.radius; p.vy = -Math.abs(p.vy) }
  }

  // particle-particle collisions
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = particles[i]
      const b = particles[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const minDist = a.radius + b.radius

      if (dist < minDist && dist > 0.01) {
        // separate overlapping particles
        const nx = dx / dist
        const ny = dy / dist
        const overlap = minDist - dist
        const totalMass = a.mass + b.mass
        a.x -= nx * overlap * (b.mass / totalMass)
        a.y -= ny * overlap * (b.mass / totalMass)
        b.x += nx * overlap * (a.mass / totalMass)
        b.y += ny * overlap * (a.mass / totalMass)

        // elastic collision response
        const dvx = a.vx - b.vx
        const dvy = a.vy - b.vy
        const dot = dvx * nx + dvy * ny
        if (dot > 0) {
          const impulse = (2 * dot) / totalMass
          a.vx -= impulse * b.mass * nx
          a.vy -= impulse * b.mass * ny
          b.vx += impulse * a.mass * nx
          b.vy += impulse * a.mass * ny
        }

        // subtle glow on collision
        a.glow = Math.min(a.glow + 0.3, 1)
        b.glow = Math.min(b.glow + 0.3, 1)
      }
    }
  }

  // gentle speed cap
  for (const p of particles) {
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
    if (speed > 4) {
      p.vx = (p.vx / speed) * 4
      p.vy = (p.vy / speed) * 4
    }
  }
}

export function drawParticles(ctx, particles, w, h) {
  ctx.fillStyle = 'rgba(10, 10, 26, 0.25)'
  ctx.fillRect(0, 0, w, h)

  for (const p of particles) {
    const [r, g, b] = p.color
    const glowSize = p.radius * (1 + p.glow * 0.8)

    // outer glow
    if (p.glow > 0.05) {
      const grad = ctx.createRadialGradient(p.x, p.y, p.radius * 0.5, p.x, p.y, glowSize * 2.5)
      grad.addColorStop(0, `rgba(${r},${g},${b},${p.glow * 0.3})`)
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
      ctx.beginPath()
      ctx.arc(p.x, p.y, glowSize * 2.5, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()
    }

    // main body
    const bodyGrad = ctx.createRadialGradient(
      p.x - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.1,
      p.x, p.y, p.radius
    )
    bodyGrad.addColorStop(0, `rgba(${Math.min(r + 60, 255)},${Math.min(g + 60, 255)},${Math.min(b + 60, 255)},0.95)`)
    bodyGrad.addColorStop(1, `rgba(${r},${g},${b},0.8)`)

    ctx.beginPath()
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
    ctx.fillStyle = bodyGrad
    ctx.fill()
  }
}

const MIN_RADIUS = 4
const MAX_RADIUS = 40
const SIZE_STEP = 3

export function handleInteraction(particles, x, y) {
  const HIT_RADIUS = 50
  for (const p of particles) {
    const dx = p.x - x
    const dy = p.y - y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < p.radius + HIT_RADIUS) {
      p.color = nextColor(p.color)
      p.glow = 1

      // randomly grow or shrink, clamped to limits
      if (Math.random() < 0.5) {
        p.radius = Math.min(p.radius + SIZE_STEP, MAX_RADIUS)
      } else {
        p.radius = Math.max(p.radius - SIZE_STEP, MIN_RADIUS)
      }
      p.mass = p.radius * p.radius

      // small push away from tap
      if (dist > 0.1) {
        p.vx += (dx / dist) * 1.5
        p.vy += (dy / dist) * 1.5
      }
    }
  }
}
