// 10,000 Primitives Stress Test
// Tests the instanced rendering system with massive scale

console.log('=== 10,000 PRIMITIVES STRESS TEST ===')
console.log('Testing instanced rendering at scale with static primitives')

// Configuration
const TOTAL_COUNT = 10000
const WORLD_SIZE = 200
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
  
  // Create primitive
  const prim = app.create('prim', {
    kind: shape,
    size: size,
    position: position,
    color: color,
    castShadow: false,
    receiveShadow: false
  })
  
  app.add(prim)
  
  // Store primitive reference
  primitives.push(prim)
  
  // Progress logging
  if (i % 1000 === 999) {
    console.log(`Progress: ${i + 1} / ${TOTAL_COUNT}`)
  }
}

const creationTime = Date.now ? Date.now() - stats.startTime : 0
console.log(`\n✅ Created ${TOTAL_COUNT} primitives in ${creationTime}ms`)

// Log distribution
console.log('\n📊 Shape Distribution:')
Object.entries(stats.shapes).forEach(([shape, count]) => {
  console.log(`  ${shape}: ${count} instances`)
})

console.log('\n🎯 Expected Performance:')
console.log(`  Draw calls: ~${SHAPES.length} (one per shape type)`)
console.log(`  Reduction: ${Math.round(TOTAL_COUNT / SHAPES.length)}x fewer draw calls`)

// FPS monitoring and color animation
let animTime = 0
let colorShift = 0
app.on('update', (dt) => {
  animTime += dt
  stats.frameCount++
  colorShift += dt * 0.1 // Slow color shift
  
  // Update colors for all primitives
  for (let i = 0; i < primitives.length; i++) {
    const prim = primitives[i]
    
    // Create animated color based on position and time
    const hue = ((i / TOTAL_COUNT) * 360 + colorShift * 50) % 360
    const saturation = 60 + Math.sin(animTime + i * 0.001) * 20
    const lightness = 50 + Math.cos(animTime * 0.5 + i * 0.002) * 15
    
    // Update the color
    prim.color = `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }
  
  // FPS calculation every second
  if (animTime - stats.lastFpsTime > 1) {
    const fps = stats.frameCount / (animTime - stats.lastFpsTime)
    console.log(`FPS: ${fps.toFixed(1)} | Rendering ${TOTAL_COUNT} objects with animated colors`)
    stats.frameCount = 0
    stats.lastFpsTime = animTime
  }
})

// Instructions
console.log('\n🎮 STRESS TEST COMPLETE:')
console.log('  ✓ 10,000 primitives created')
console.log('  ✓ Different shapes and sizes')
console.log('  ✓ Colors animating in real-time')
console.log('  ✓ Demonstrates instance color updates')
console.log('\n📈 Monitor FPS in console')
console.log('💡 All rendering in ~5 draw calls!')
console.log('🌈 Watch the color wave animation!')

// Cleanup function
return () => {
  primitives.forEach(data => app.remove(data.prim))
  console.log('Cleaned up 10K stress test')
}