// Massive Instancing Test - Thousands of different sized and colored primitives
// Demonstrates the power of shared geometry with per-instance attributes

console.log('=== MASSIVE INSTANCING TEST ===')
console.log('Creating thousands of primitives with unique sizes and colors...')

// Configuration
const TOTAL_OBJECTS = 10000
const SPREAD_RADIUS = 250
const MIN_SIZE = 0.1
const MAX_SIZE = 3.0
const SHAPES = ['box', 'sphere', 'cylinder', 'cone', 'torus', 'plane']

// Track creation
const primitives = []
const shapeCount = {}
SHAPES.forEach(shape => shapeCount[shape] = 0)

console.log(`🎯 Target: ${TOTAL_OBJECTS} objects`)
console.log('🚀 Expected draw calls: ~6 (one per primitive type)')

// Create objects with random distribution
for (let i = 0; i < TOTAL_OBJECTS; i++) {
  // Random shape type
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)]
  shapeCount[shape]++
  
  // Random position in 3D space
  const theta = Math.random() * Math.PI * 2
  const phi = Math.random() * Math.PI
  const radius = Math.random() * SPREAD_RADIUS
  
  const x = radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.sin(phi) * Math.sin(theta) * 0.5 + 10 // Flatter distribution
  const z = radius * Math.cos(phi)
  
  // Random size - each dimension can be different
  let size
  if (shape === 'sphere') {
    // Sphere uses uniform size
    const r = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE)
    size = [r]
  } else if (shape === 'torus') {
    // Torus: major radius and tube ratio
    const major = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE)
    const tube = 0.1 + Math.random() * 0.4 // Tube is relative to major
    size = [major, major * tube]
  } else if (shape === 'cylinder' || shape === 'cone') {
    // Cylinder/cone: radius and height
    const r = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE)
    const h = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE) * 2 // Can be taller
    size = [r, h]
  } else {
    // Box/plane: independent dimensions
    size = [
      MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE),
      MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE),
      MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE)
    ]
  }
  
  // Random color using HSL for better distribution
  const hue = Math.random() * 360
  const saturation = 30 + Math.random() * 70 // 30-100%
  const lightness = 30 + Math.random() * 40 // 30-70%
  const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`
  
  // Create primitive
  const prim = app.create('prim', {
    kind: shape,
    size: size,
    position: [x, y, z],
    color: color,
    castShadow: false, // Disable for performance
    receiveShadow: false
  })
  
  app.add(prim)
  
  // Store for animation
  primitives.push({
    prim,
    rotSpeed: {
      x: (Math.random() - 0.5) * 0.02,
      y: (Math.random() - 0.5) * 0.02,
      z: (Math.random() - 0.5) * 0.02
    },
    colorShift: Math.random(), // Speed of color animation (0-1, where 0 = no animation)
    baseHue: hue,
    pulseSpeed: 0.5 + Math.random() * 2,
    pulseAmount: Math.random() * 0.2,
    baseSize: [...size] // Store original size for pulsing
  })
  
  // Progress logging
  if ((i + 1) % 500 === 0) {
    console.log(`Progress: ${i + 1}/${TOTAL_OBJECTS} objects created...`)
  }
}

console.log('\n✅ All objects created!')
console.log('📊 Distribution by shape:')
Object.entries(shapeCount).forEach(([shape, count]) => {
  console.log(`  ${shape}: ${count} objects`)
})

console.log('\n🎨 Rendering stats:')
console.log(`  - Traditional: ${TOTAL_OBJECTS} draw calls + ${TOTAL_OBJECTS} materials`)
console.log(`  - Instanced: ~${SHAPES.length} draw calls + ${SHAPES.length} materials`)
console.log(`  - Efficiency: ${Math.round(TOTAL_OBJECTS / SHAPES.length)}x improvement!`)

// No lights needed - using default scene lighting

// Animation
let animTime = 0
let frameCount = 0
let lastFpsTime = 0

app.on('update', (dt) => {
  animTime += dt
  frameCount++
  
  // FPS tracking
  if (animTime - lastFpsTime > 1) {
    const fps = frameCount / (animTime - lastFpsTime)
    console.log(`FPS: ${fps.toFixed(1)} | Rendering ${TOTAL_OBJECTS} objects`)
    frameCount = 0
    lastFpsTime = animTime
  }
  
  // Animate subset of objects for performance
  const animateCount = Math.min(1000, primitives.length) // Animate first 1000
  
  // Debug: check first object's color change every second
  if (Math.floor(animTime) !== Math.floor(animTime - dt) && primitives.length > 0) {
    const firstItem = primitives[0]
    if (firstItem.colorShift > 0) {
      console.log(`First object color shift: ${firstItem.colorShift.toFixed(2)}, baseHue: ${firstItem.baseHue.toFixed(0)}`)
    }
  }
  
  for (let i = 0; i < animateCount; i++) {
    const item = primitives[i]
    
    // Rotation
    item.prim.rotation.x += item.rotSpeed.x
    item.prim.rotation.y += item.rotSpeed.y
    item.prim.rotation.z += item.rotSpeed.z
    
    // Color animation - make it more visible
    if (item.colorShift > 0) {
      const newHue = (item.baseHue + animTime * item.colorShift * 50) % 360 // Faster color change
      const color = `hsl(${newHue}, 70%, 50%)`
      item.prim.color = color
    }
    
    // Size pulsing
    if (item.pulseAmount > 0) {
      const pulse = 1 + Math.sin(animTime * item.pulseSpeed) * item.pulseAmount
      if (item.prim.kind === 'sphere') {
        item.prim.size = [item.baseSize[0] * pulse]
      } else if (item.baseSize.length === 2) {
        item.prim.size = [
          item.baseSize[0] * pulse,
          item.baseSize[1] * pulse
        ]
      } else {
        item.prim.size = [
          item.baseSize[0] * pulse,
          item.baseSize[1] * pulse,
          item.baseSize[2] * pulse
        ]
      }
    }
  }
})

console.log('\n🎮 Controls:')
console.log('- Move camera to explore the cloud of objects')
console.log('- First 1000 objects are animated')
console.log('- Watch FPS counter in console')
console.log('\n🌟 All objects use instanced rendering with per-instance colors!')

// Cleanup function
return () => {
  primitives.forEach(item => item.prim.destroy())
  console.log('Cleaned up massive instancing test')
}