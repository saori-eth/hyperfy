// Instanced Primitives Demo
// This demonstrates the power of the new instanced rendering system
// All primitives of the same type render in a single draw call

console.log('=== Instanced Primitives Demo ===')
console.log('Demonstrating per-instance colors with massive performance gains')

// Configuration
const GRID_SIZE = 30 // 30x30 = 900 primitives
const SPACING = 2
const ANIMATE = true

// Track primitives
const primitives = []

// Create a colorful grid of primitives
console.log(`Creating ${GRID_SIZE * GRID_SIZE} primitives...`)

for (let x = 0; x < GRID_SIZE; x++) {
  for (let z = 0; z < GRID_SIZE; z++) {
    // Calculate position
    const xPos = (x - GRID_SIZE / 2) * SPACING
    const zPos = (z - GRID_SIZE / 2) * SPACING
    
    // Create different primitive types in patterns
    const typeIndex = Math.floor((x + z) / 5) % 5
    const types = ['box', 'sphere', 'cylinder', 'cone', 'torus']
    const kind = types[typeIndex]
    
    // Calculate color based on position
    const hue = (x / GRID_SIZE) * 360
    const saturation = 50 + (z / GRID_SIZE) * 50
    const lightness = 40 + Math.random() * 20
    
    // Create primitive
    const prim = app.create('prim', {
      kind: kind,
      size: kind === 'sphere' ? [0.5] : 
            kind === 'torus' ? [0.5, 0.2] :
            kind === 'cylinder' ? [0.4, 1] :
            kind === 'cone' ? [0.5, 1] :
            [0.8, 0.8, 0.8],
      position: [xPos, 0, zPos],
      color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
      castShadow: false, // Disable shadows for performance demo
      receiveShadow: false
    })
    
    app.add(prim)
    primitives.push({
      prim,
      baseY: 0,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.5,
      amplitude: 0.2 + Math.random() * 0.8,
      colorOffset: Math.random()
    })
  }
}

console.log(`✅ Created ${primitives.length} primitives`)
console.log(`🚀 Rendering with only ~5 draw calls (one per primitive type)`)

// Add lighting
const light = app.create('light', {
  type: 'directional',
  position: [10, 20, 10],
  intensity: 1
})
app.add(light)

// Camera position
if (app.camera) {
  app.camera.position.set(0, 30, 50)
  app.camera.lookAt(0, 0, 0)
}

// Animation
if (ANIMATE) {
  console.log('🎨 Animating colors and positions...')
  
  let animTime = 0
  app.on('update', (dt) => {
    animTime += dt
    primitives.forEach((item, index) => {
      // Animate position (wave effect)
      const y = item.baseY + Math.sin(animTime * item.speed + item.phase) * item.amplitude
      item.prim.position.y = y
      
      // Animate color
      const hue = ((index / primitives.length + animTime * 0.05 + item.colorOffset) % 1) * 360
      const saturation = 60 + Math.sin(animTime * 0.3 + item.phase) * 20
      item.prim.color = `hsl(${hue}, ${saturation}%, 50%)`
      
      // Gentle rotation for some visual interest
      if (index % 3 === 0) {
        item.prim.rotation.y = animTime * 0.2
      }
    })
  })
}

// Performance comparison
console.log('\n📊 Performance Comparison:')
console.log('Without instancing: ~900 draw calls, ~900 materials')
console.log('With instancing: ~5 draw calls, ~5 shared materials')
console.log('Result: 180x reduction in draw calls! 🎯')

// Instructions
console.log('\n📝 Instructions:')
console.log('- Watch the colorful wave of primitives')
console.log('- Each primitive has its own color via instance attributes')
console.log('- Colors and positions update every frame')
console.log('- All rendering happens with maximum GPU efficiency')

// Cleanup function
const cleanup = () => {
  primitives.forEach(item => item.prim.destroy())
  light.destroy()
  console.log('Cleaned up instanced primitives demo')
}

// Return cleanup for hot reload
return cleanup