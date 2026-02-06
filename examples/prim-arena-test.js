// Shooter Arena with Collectible Rings
// A medium-sized arena with walls, obstacles, and collectible rings

// Arena configuration
const ARENA_SIZE = 40
const WALL_HEIGHT = 6
const WALL_THICKNESS = 1
const RING_COUNT = 20
const OBSTACLE_COUNT = 15

// Track game state
const gameState = {
  score: 0,
  ringsCollected: 0,
  rings: [],
  startTime: Date.now(),
}

console.log('Building arena...')

// Create floor
const floor = object.create('prim', {
  type: 'box',
  scale: [ARENA_SIZE, 0.2, ARENA_SIZE],
  position: [0, -0.1, 0],
  color: '#2a2a2a',
  metalness: 0.2,
  roughness: 0.8,
  physics: 'static',
})
object.add(floor)

// Create walls
const walls = []

// North wall
walls.push(
  object.create('prim', {
    type: 'box',
    scale: [ARENA_SIZE, WALL_HEIGHT, WALL_THICKNESS],
    position: [0, WALL_HEIGHT / 2, -ARENA_SIZE / 2],
    color: '#444444',
    physics: 'static',
  })
)

// South wall
walls.push(
  object.create('prim', {
    type: 'box',
    scale: [ARENA_SIZE, WALL_HEIGHT, WALL_THICKNESS],
    position: [0, WALL_HEIGHT / 2, ARENA_SIZE / 2],
    color: '#444444',
    physics: 'static',
  })
)

// East wall
walls.push(
  object.create('prim', {
    type: 'box',
    scale: [WALL_THICKNESS, WALL_HEIGHT, ARENA_SIZE],
    position: [ARENA_SIZE / 2, WALL_HEIGHT / 2, 0],
    color: '#444444',
    physics: 'static',
  })
)

// West wall
walls.push(
  object.create('prim', {
    type: 'box',
    scale: [WALL_THICKNESS, WALL_HEIGHT, ARENA_SIZE],
    position: [-ARENA_SIZE / 2, WALL_HEIGHT / 2, 0],
    color: '#444444',
    physics: 'static',
  })
)

walls.forEach(wall => object.add(wall))

// Create obstacles (cover)
const obstacles = []
for (let i = 0; i < OBSTACLE_COUNT; i++) {
  const isLarge = Math.random() < 0.3
  const height = isLarge ? 3 : 1.5
  const width = isLarge ? 3 : 1.5

  // Random position avoiding center spawn area
  let x, z
  do {
    x = (Math.random() - 0.5) * (ARENA_SIZE - 4)
    z = (Math.random() - 0.5) * (ARENA_SIZE - 4)
  } while (Math.abs(x) < 5 && Math.abs(z) < 5) // Keep center clear

  const obstacle = object.create('prim', {
    type: Math.random() < 0.7 ? 'box' : 'cylinder',
    scale: [width, height, width],
    position: [x, height / 2, z],
    color: `hsl(${200 + Math.random() * 40}, 20%, ${30 + Math.random() * 20}%)`,
    metalness: 0.4,
    roughness: 0.6,
    physics: 'static',
  })

  obstacles.push(obstacle)
  object.add(obstacle)
}

// Create collectible rings
function createRing(index) {
  // Random position at various heights
  const x = (Math.random() - 0.5) * (ARENA_SIZE - 4)
  const y = 0.5 + Math.random() * 3
  const z = (Math.random() - 0.5) * (ARENA_SIZE - 4)

  const ring = object.create('prim', {
    type: 'torus',
    scale: [0.8, 0.8, 0.8],
    position: [x, y, z],
    color: '#ffd700',
    emissive: '#ffaa00',
    emissiveIntensity: 2,
    metalness: 0.8,
    roughness: 0.2,
    physics: 'static',
    trigger: true,
    tag: `ring_${index}`,
    onTriggerEnter: other => {
      if (other.playerId) {
        // Player touched the ring
        collectRing(ring, index, other.playerId)
      }
    },
  })

  // Store reference
  gameState.rings[index] = ring

  return ring
}

// Ring collection handler
function collectRing(ring, index, playerId) {
  if (!gameState.rings[index]) return // Already collected

  // Remove ring
  object.remove(ring)
  gameState.rings[index] = null

  // Update score
  gameState.score += 100
  gameState.ringsCollected++

  console.log(`Player ${playerId} collected ring! Score: ${gameState.score}`)

  // Create particle effect at ring position
  createCollectEffect(ring.position)

  // Check win condition
  if (gameState.ringsCollected >= RING_COUNT) {
    const time = Math.floor((Date.now() - gameState.startTime) / 1000)
    console.log(`🎉 All rings collected in ${time} seconds! Final score: ${gameState.score}`)
  }

  // Respawn ring after delay
  setTimeout(() => {
    if (gameState.ringsCollected < RING_COUNT) {
      const newRing = createRing(index)
      object.add(newRing)
    }
  }, 5000)
}

// Create collect effect (burst of small cubes)
function createCollectEffect(position) {
  const particles = []
  for (let i = 0; i < 8; i++) {
    const particle = object.create('prim', {
      type: 'box',
      scale: [0.1, 0.1, 0.1],
      position: [...position],
      color: '#ffff00',
      emissive: '#ffff00',
      emissiveIntensity: 3,
    })

    object.add(particle)
    particles.push({
      prim: particle,
      velocity: [(Math.random() - 0.5) * 10, 5 + Math.random() * 5, (Math.random() - 0.5) * 10],
      lifetime: 1,
    })
  }

  // Animate particles
  let elapsed = 0
  const updateParticles = dt => {
    elapsed += dt

    particles.forEach(p => {
      p.prim.position.x += p.velocity[0] * dt
      p.prim.position.y += p.velocity[1] * dt - 9.8 * dt * dt // gravity
      p.prim.position.z += p.velocity[2] * dt

      // Fade out
      const alpha = Math.max(0, 1 - elapsed / p.lifetime)
      p.prim.opacity = alpha
      p.prim.transparent = true
      p.prim.emissiveIntensity = 3 * alpha
    })

    if (elapsed >= 1) {
      // Remove particles
      particles.forEach(p => object.remove(p.prim))
      object.off('update', updateParticles)
    }
  }

  object.on('update', updateParticles)
}

// Add initial rings
for (let i = 0; i < RING_COUNT; i++) {
  const ring = createRing(i)
  object.add(ring)
}

// Add spinning animation to rings
object.on('update', dt => {
  gameState.rings.forEach(ring => {
    if (ring) {
      ring.rotation.y += 2 * dt
      ring.rotation.x = Math.sin(Date.now() * 0.001) * 0.2
    }
  })
})

// Create some ambient lighting with glowing crystals
const crystals = []
for (let i = 0; i < 4; i++) {
  const angle = (i / 4) * Math.PI * 2
  const x = Math.cos(angle) * (ARENA_SIZE / 2 - 3)
  const z = Math.sin(angle) * (ARENA_SIZE / 2 - 3)

  const crystal = object.create('prim', {
    type: 'cone',
    scale: [0.5, 2, 0.5],
    position: [x, 1, z],
    color: '#4488ff',
    emissive: '#4488ff',
    emissiveIntensity: 3,
    metalness: 0.2,
    roughness: 0.3,
    transparent: true,
    opacity: 0.8,
  })

  crystals.push(crystal)
  object.add(crystal)
}

// Animate crystals
object.on('update', dt => {
  crystals.forEach((crystal, i) => {
    crystal.position.y = 1 + Math.sin(Date.now() * 0.001 + i) * 0.3
    crystal.emissiveIntensity = 2 + Math.sin(Date.now() * 0.002 + i * 0.5) * 1
  })
})

// Create spawn point indicator
const spawnIndicator = object.create('prim', {
  type: 'cylinder',
  scale: [2, 0.1, 2],
  position: [0, 0.05, 0],
  color: '#00ff00',
  emissive: '#00ff00',
  emissiveIntensity: 1,
  transparent: true,
  opacity: 0.5,
})
object.add(spawnIndicator)

// Position camera for overview
if (typeof world !== 'undefined' && world.getAvatar) {
  try {
    const avatar = world.getAvatar()
    if (avatar) {
      avatar.position = [0, 25, 30]
      avatar.rotation.x = -0.5
      console.log('Camera positioned for arena overview')
    }
  } catch (e) {
    console.log('Could not set avatar position:', e.message)
  }
}

console.log('Arena ready!')
console.log(`- Size: ${ARENA_SIZE}x${ARENA_SIZE}`)
console.log(`- ${RING_COUNT} collectible rings`)
console.log(`- ${OBSTACLE_COUNT} obstacles for cover`)
console.log('- Walk into rings to collect them!')
console.log('- Rings respawn after 5 seconds')
