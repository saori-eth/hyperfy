console.log('Starting Instanced Prim stress test world...')

const GRID_SIZE = 100
const SPACING = 3
const TOTAL_OBJECTS = GRID_SIZE * GRID_SIZE
const SHAPE_KINDS = ['box', 'sphere', 'cylinder', 'cone', 'torus']
const COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#88ff00', '#0088ff']

console.log(`Creating ${TOTAL_OBJECTS} animated objects in a ${GRID_SIZE}x${GRID_SIZE} grid`)
console.log('🚀 Using instanced rendering - expecting ~5 draw calls total!')

const animatedObjects = []
let objectCount = 0

// Count objects per type for debugging
const typeCounts = {}
SHAPE_KINDS.forEach(kind => typeCounts[kind] = 0)

for (let x = 0; x < GRID_SIZE; x++) {
  for (let z = 0; z < GRID_SIZE; z++) {
    const kind = SHAPE_KINDS[Math.floor(Math.random() * SHAPE_KINDS.length)]
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    
    typeCounts[kind]++
    
    const xPos = (x - GRID_SIZE / 2) * SPACING
    const zPos = (z - GRID_SIZE / 2) * SPACING
    const yPos = 2 + Math.random() * 5
    
    // Create primitive directly - will use instanced rendering automatically
    const prim = app.create('prim', {
      kind: kind,
      size: kind === 'sphere' ? [0.5] : 
            kind === 'torus' ? [0.5, 0.2] : 
            kind === 'cylinder' || kind === 'cone' ? [0.5, 1] : 
            [1, 1, 1],
      position: [xPos, yPos, zPos],
      color: color,
      castShadow: false,
      receiveShadow: false
    })
    
    const randomScale = 0.5 + Math.random() * 1
    prim.scale.set(randomScale, randomScale, randomScale)
    
    animatedObjects.push({
      object: prim,
      baseY: yPos,
      rotationSpeed: {
        x: (Math.random() - 0.5) * 0.05,
        y: (Math.random() - 0.5) * 0.05,
        z: (Math.random() - 0.5) * 0.05
      },
      floatSpeed: 0.5 + Math.random() * 2,
      floatAmplitude: 0.5 + Math.random() * 1.5,
      phaseOffset: Math.random() * Math.PI * 2,
      scaleSpeed: 0.5 + Math.random() * 1.5,
      scaleAmplitude: 0.1 + Math.random() * 0.3,
      baseScale: randomScale,
      orbitRadius: Math.random() > 0.7 ? 1 + Math.random() * 2 : 0,
      orbitSpeed: Math.random() * 0.02,
      colorCycleSpeed: Math.random() > 0.5 ? 0.5 + Math.random() * 2 : 0,
      colorStartIndex: Math.floor(Math.random() * COLORS.length)
    })
    
    app.add(prim)
    objectCount++
    
    if (objectCount % 1000 === 0) {
      console.log(`Created ${objectCount}/${TOTAL_OBJECTS} objects...`)
    }
  }
}

console.log(`✅ All ${TOTAL_OBJECTS} objects created!`)
console.log('📊 Object distribution:')
Object.entries(typeCounts).forEach(([kind, count]) => {
  console.log(`  ${kind}: ${count} instances`)
})
console.log(`🎯 Total draw calls: ~${SHAPE_KINDS.length} (one per primitive type)`)

let globalTime = 0

app.on('update', (dt) => {
  globalTime += dt
  
  animatedObjects.forEach((item, index) => {
    const { 
      object, 
      baseY, 
      rotationSpeed, 
      floatSpeed, 
      floatAmplitude, 
      phaseOffset,
      scaleSpeed,
      scaleAmplitude,
      baseScale,
      orbitRadius,
      orbitSpeed,
      colorCycleSpeed,
      colorStartIndex
    } = item
    
    const time = globalTime + phaseOffset
    
    object.rotation.x += rotationSpeed.x
    object.rotation.y += rotationSpeed.y
    object.rotation.z += rotationSpeed.z
    
    const floatY = baseY + Math.sin(time * floatSpeed) * floatAmplitude
    
    if (orbitRadius > 0) {
      const orbitAngle = time * orbitSpeed
      const baseX = object.position.x - Math.sin(orbitAngle - dt * orbitSpeed) * orbitRadius
      const baseZ = object.position.z - Math.cos(orbitAngle - dt * orbitSpeed) * orbitRadius
      
      object.position.x = baseX + Math.sin(orbitAngle) * orbitRadius
      object.position.z = baseZ + Math.cos(orbitAngle) * orbitRadius
    }
    
    object.position.y = floatY
    
    const scaleFactor = baseScale + Math.sin(time * scaleSpeed) * scaleAmplitude * baseScale
    object.scale.set(scaleFactor, scaleFactor, scaleFactor)
    
    if (colorCycleSpeed > 0) {
      const colorProgress = (time * colorCycleSpeed * 0.1) % 1
      const colorIndex = Math.floor((colorStartIndex + colorProgress * COLORS.length) % COLORS.length)
      object.color = COLORS[colorIndex]
    }
  })
  
  
  if (globalTime > 5) {
    const fps = 1 / dt
    if (fps < 30) {
      console.log(`Performance warning: FPS dropped to ${fps.toFixed(1)}`)
    }
  }
})

console.log('\n=== Instanced Rendering Stress Test Summary ===')
console.log(`Total objects: ${TOTAL_OBJECTS}`)
console.log('🚀 Performance benefits:')
console.log(`- Traditional: ${TOTAL_OBJECTS} draw calls`)
console.log(`- Instanced: ~${SHAPE_KINDS.length} draw calls`)
console.log(`- Reduction: ${Math.round(TOTAL_OBJECTS / SHAPE_KINDS.length)}x fewer draw calls!`)
console.log('\nAnimation types:')
console.log('- Rotation (3 axes with random speeds)')
console.log('- Floating (vertical sine wave motion)')
console.log('- Scaling (pulsing size changes)')
console.log('- Orbiting (some objects orbit their position)')
console.log('- Color cycling (per-instance color updates)')
console.log('\n✨ All objects use instanced rendering with per-instance colors')
console.log('🎨 Colors update without material recreation')
console.log('⚡ Perfect for AI-generated worlds with thousands of objects!')
console.log('\nWatch for FPS drops to test performance limits!')