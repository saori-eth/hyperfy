// Configuration
const TOTAL_COUNT = 1000
const WORLD_SIZE = 50
const SHAPES = ['box', 'sphere', 'cylinder', 'cone', 'torus']

// Statistics
const stats = {
  shapes: {},
  startTime: 0,
  frameCount: 0,
  lastFpsTime: 0
}

// Initialize shape counters
SHAPES.forEach(shape => stats.shapes[shape] = 0)

// Store all primitives for animation
const primitives = []

console.log(`Creating ${TOTAL_COUNT} primitives...`)
console.log('App object:', typeof app !== 'undefined' ? 'Available' : 'Not available')
if (typeof app !== 'undefined') {
  console.log('App methods:', {
    create: typeof app.create,
    add: typeof app.add
  })
}
stats.startTime = Date.now ? Date.now() : 0

// Create primitives with even distribution
for (let i = 0; i < TOTAL_COUNT; i++) {
  // Choose shape type
  const shape = SHAPES[i % SHAPES.length]
  stats.shapes[shape]++
  
  // Random position in 3D space
  const position = [
    (Math.random() - 0.5) * WORLD_SIZE,
    (Math.random() - 0.5) * WORLD_SIZE * 0.5, // Flatter Y distribution
    (Math.random() - 0.5) * WORLD_SIZE
  ]
  
  // Size based on shape type
  let size
  if (shape === 'sphere') {
    size = [0.5 + Math.random() * 2]
  } else if (shape === 'torus') {
    const radius = 0.5 + Math.random() * 1.5
    size = [radius, radius * (0.2 + Math.random() * 0.3)]
  } else if (shape === 'cylinder' || shape === 'cone') {
    size = [0.5 + Math.random(), 1 + Math.random() * 2]
  } else { // box
    size = [
      0.5 + Math.random() * 2,
      0.5 + Math.random() * 2,
      0.5 + Math.random() * 2
    ]
  }
  
  // Initial color using HSL
  const hue = (i / TOTAL_COUNT) * 360
  const saturation = 50 + Math.random() * 50
  const lightness = 40 + Math.random() * 30
  const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`
  
  // Add emissive to some shapes (20% chance)
  let emissive = null
  if (Math.random() < 0.2) {
    // Create emissive color with similar hue but higher saturation/lightness
    const emissiveHue = hue
    const emissiveSaturation = 70 + Math.random() * 30
    const emissiveLightness = 50 + Math.random() * 30
    const emissiveColor = `hsl(${emissiveHue}, ${emissiveSaturation}%, ${emissiveLightness}%)`
    
    // 50% chance to use object format with custom intensity
    if (Math.random() < 0.5) {
      emissive = {
        color: emissiveColor,
        intensity: 0.5 + Math.random() * 2.0 // Random intensity between 0.5 and 2.5
      }
    } else {
      emissive = emissiveColor // Default intensity of 1.0
    }
  }
  
  // Create primitive
  const prim = app.create('prim', {
    kind: shape,
    size: size,
    position: position,
    color: color,
    emissive: emissive,
    castShadow: false,
    receiveShadow: false
  })
  
  app.add(prim)
  
  // Store primitive reference
  primitives.push(prim)
  
  // Log first primitive to debug
  if (i === 0) {
    console.log('First primitive created:', prim)
    console.log('First primitive properties:', {
      kind: prim.kind,
      position: prim.position,
      size: prim.size,
      color: prim.color,
      emissive: prim.emissive
    })
  }
}

const creationTime = Date.now ? Date.now() - stats.startTime : 0

console.log(`Created ${primitives.length} primitives in ${creationTime}ms`)
console.log('Distribution:', stats.shapes)

// Try to set camera position if available
if (typeof world !== 'undefined' && world.getAvatar) {
  try {
    const avatar = world.getAvatar()
    if (avatar) {
      avatar.position = [0, 50, 100]
      console.log('Camera/avatar position set')
    }
  } catch (e) {
    console.log('Could not set avatar position:', e.message)
  }
}
