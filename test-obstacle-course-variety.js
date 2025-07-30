// Varied Obstacle Course with Physics and Multiple Shapes
// A colorful parkour course using all primitive types

console.log('=== VARIED OBSTACLE COURSE ===')
console.log('Creating a diverse parkour course with different shapes!')

// CONFIGURATION - Adjust these for your player physics
const CONFIG = {
  // Player movement assumptions
  PLAYER_JUMP_HEIGHT: 3,      // How high can the player jump?
  PLAYER_JUMP_DISTANCE: 5,    // How far can they jump horizontally?
  PLAYER_WIDTH: 1,            // Player collision width
  
  // Course settings
  PLATFORM_HEIGHT: 0.5,       // Standard platform thickness
  GAP_DIFFICULTY: 0.8,        // 0.5 = easy, 1.0 = max jump distance
  HEIGHT_VARIATION: 2,        // Max height difference between platforms
}

// Color scheme
const COLORS = {
  start: '#00ff00',           // Green
  normal: '#3399ff',          // Blue
  hard: '#ff9900',            // Orange
  veryHard: '#ff3333',        // Red
  checkpoint: '#ffff00',      // Yellow
  moving: '#ff00ff',          // Magenta
  rotating: '#00ffcc',        // Teal
  bouncy: '#ff66ff',          // Pink
  finish: '#00ffff',          // Cyan
}

// Track all course elements
const courseElements = []
let currentZ = 0
let currentY = 2

// Helper to create any primitive with physics
function createObstacle(x, y, z, kind, size, color, type = 'normal', physicsType = 'static') {
  // Create a group to hold everything
  const group = app.create('group')
  group.position.set(x, y, z)
  
  // Visual component
  const visual = app.create('prim', {
    kind: kind,
    size: size,
    color: color,
    castShadow: true,
    receiveShadow: true
  })
  
  // Physics components
  const rigidBody = app.create('rigidbody')
  rigidBody.type = physicsType
  
  const collider = app.create('collider')
  
  // Set collider based on shape
  if (kind === 'sphere') {
    collider.type = 'sphere'
    collider.radius = size[0]
  } else if (kind === 'box' || kind === 'plane') {
    collider.type = 'box'
    collider.setSize(size[0], size[1], size[2])
  } else {
    // For complex shapes, use box approximation
    collider.type = 'box'
    if (kind === 'cylinder' || kind === 'cone') {
      collider.setSize(size[0] * 2, size[1], size[0] * 2)
    } else if (kind === 'torus') {
      collider.setSize(size[0] * 2, size[1] * 2, size[0] * 2)
    }
  }
  
  // Build hierarchy
  rigidBody.add(collider)
  rigidBody.add(visual)
  group.add(rigidBody)
  
  app.add(group)
  
  courseElements.push({ 
    group, visual, rigidBody, collider, type,
    originalY: y, originalX: x, kind
  })
  
  return { group, visual, rigidBody, collider }
}

// 1. Starting Area - Mixed shapes
console.log('Building colorful starting area...')
createObstacle(0, currentY, currentZ, 'box', [8, 0.5, 8], COLORS.start, 'start')

// Decorative spheres around start
for (const x of [-3, 3]) {
  createObstacle(x, currentY + 1, currentZ, 'sphere', [0.5], '#ffffff', 'decoration')
}

currentZ += 4

// 2. Shape Parade - Different shapes to jump on
console.log('Creating shape parade...')
const shapes = ['box', 'cylinder', 'sphere', 'cone', 'torus']
for (let i = 0; i < shapes.length; i++) {
  const shape = shapes[i]
  currentZ += CONFIG.PLAYER_JUMP_DISTANCE * 0.7
  const size = shape === 'sphere' ? [1.5] :
               shape === 'torus' ? [1.5, 0.5] :
               shape === 'cylinder' || shape === 'cone' ? [1, 2] :
               [3, 0.5, 3]
  
  createObstacle(
    (i - 2) * 3, 
    currentY + i * 0.5, 
    currentZ, 
    shape, 
    size, 
    COLORS.normal, 
    'platform'
  )
}

currentZ += 3

// 3. Cylinder Bridge
console.log('Building cylinder bridge...')
for (let i = 0; i < 8; i++) {
  currentZ += 2
  const height = 3 + Math.sin(i * 0.5) * 1
  createObstacle(
    Math.sin(i * 0.3) * 2, 
    currentY, 
    currentZ, 
    'cylinder', 
    [0.8, height], 
    COLORS.hard, 
    'bridge'
  )
}

// 4. Bouncing Sphere Section
console.log('Adding bouncing spheres...')
const bouncingSpheres = []
currentZ += 3
for (let i = 0; i < 5; i++) {
  currentZ += CONFIG.PLAYER_JUMP_DISTANCE * 0.8
  const sphere = createObstacle(
    0, 
    currentY, 
    currentZ, 
    'sphere', 
    [1.5], 
    COLORS.bouncy, 
    'bouncy',
    'kinematic'
  )
  bouncingSpheres.push({
    sphere: sphere.group,
    baseY: currentY,
    amplitude: 1 + i * 0.3,
    speed: 1 + i * 0.2,
    offset: i * 0.7
  })
}

// 5. Rotating Platforms
console.log('Creating rotating torus platforms...')
const rotatingPlatforms = []
currentZ += 3
for (let i = 0; i < 4; i++) {
  const torus = createObstacle(
    0, 
    currentY + i * 2, 
    currentZ + i * 4, 
    'torus', 
    [2.5, 0.5], 
    COLORS.rotating, 
    'rotating'
  )
  rotatingPlatforms.push({
    platform: torus.visual,
    speed: 0.5 + i * 0.3,
    axis: i % 2 === 0 ? 'y' : 'z'
  })
}
currentZ += 8
currentY += 8

// 6. Checkpoint - Big colorful platform
const checkpoint = createObstacle(0, currentY, currentZ, 'cylinder', [3, 0.5], COLORS.checkpoint, 'checkpoint')
console.log(`Checkpoint at height ${currentY}`)
currentZ += 3

// 7. Cone Slalom
console.log('Building cone slalom...')
for (let i = 0; i < 10; i++) {
  currentZ += 3
  const x = (i % 2 === 0 ? -3 : 3) + Math.sin(i) * 1
  createObstacle(x, currentY, currentZ, 'cone', [1.5, 3], COLORS.hard, 'slalom')
  
  // Platform to jump on
  createObstacle(x, currentY + 3.5, currentZ, 'box', [2, 0.3, 2], COLORS.normal, 'platform')
}

// 8. Mixed Moving Platforms
console.log('Adding mixed moving platforms...')
const movingMixed = []
currentZ += 3
const movingShapes = ['box', 'cylinder', 'sphere', 'torus']
for (let i = 0; i < 8; i++) {
  currentZ += CONFIG.PLAYER_JUMP_DISTANCE * 0.9
  const shape = movingShapes[i % movingShapes.length]
  const size = shape === 'sphere' ? [1.5] :
               shape === 'torus' ? [2, 0.5] :
               shape === 'cylinder' ? [1.5, 0.5] :
               [3, 0.5, 3]
  
  const platform = createObstacle(
    0, 
    currentY + (i % 2) * 2, 
    currentZ, 
    shape, 
    size, 
    COLORS.moving, 
    'moving',
    'kinematic'
  )
  
  movingMixed.push({
    platform: platform.group,
    offset: i * Math.PI * 0.25,
    radius: 4,
    speed: 0.7,
    vertical: i % 3 === 0
  })
}

// 9. Spiral Tower of Mixed Shapes
console.log('Building spiral tower...')
currentZ += 5
const spiralSteps = 16
for (let i = 0; i < spiralSteps; i++) {
  const angle = (i / spiralSteps) * Math.PI * 2
  const radius = 6
  const x = Math.cos(angle) * radius
  const z = currentZ + Math.sin(angle) * radius
  currentY += 0.8
  
  const shape = shapes[i % shapes.length]
  const size = shape === 'sphere' ? [1] :
               shape === 'torus' ? [1.5, 0.4] :
               shape === 'cylinder' || shape === 'cone' ? [1, 1.5] :
               [2.5, 0.5, 2.5]
  
  createObstacle(x, currentY, z, shape, size, COLORS.hard, 'spiral')
}

// 10. Final Gauntlet - Random obstacles
console.log('Creating final gauntlet...')
currentZ += 5
for (let i = 0; i < 15; i++) {
  currentZ += CONFIG.PLAYER_JUMP_DISTANCE * (0.5 + Math.random() * 0.5)
  const x = (Math.random() - 0.5) * 10
  const y = currentY + (Math.random() - 0.5) * CONFIG.HEIGHT_VARIATION
  
  const shape = shapes[Math.floor(Math.random() * shapes.length)]
  const size = shape === 'sphere' ? [0.8 + Math.random()] :
               shape === 'torus' ? [1 + Math.random(), 0.3 + Math.random() * 0.2] :
               shape === 'cylinder' || shape === 'cone' ? [0.8 + Math.random() * 0.5, 1 + Math.random()] :
               [1.5 + Math.random() * 1.5, 0.5, 1.5 + Math.random() * 1.5]
  
  const difficulty = Math.random()
  const color = difficulty > 0.7 ? COLORS.veryHard : 
                difficulty > 0.4 ? COLORS.hard : 
                COLORS.normal
  
  createObstacle(x, y, currentZ, shape, size, color, 'gauntlet')
}

// 11. Victory Platform
currentZ += 5
createObstacle(0, currentY, currentZ, 'cylinder', [5, 1], COLORS.finish, 'finish')

// Add decorative torus ring above finish
createObstacle(0, currentY + 5, currentZ, 'torus', [3, 0.5], COLORS.finish, 'decoration')

console.log(`Course complete! Total length: ${currentZ} units`)

// Animation system
let animTime = 0
app.on('update', (dt) => {
  animTime += dt
  
  // Bouncing spheres
  for (let i = 0; i < bouncingSpheres.length; i++) {
    const item = bouncingSpheres[i]
    const y = item.baseY + Math.abs(Math.sin(animTime * item.speed + item.offset)) * item.amplitude
    item.sphere.position.y = y
  }
  
  // Rotating platforms
  for (let i = 0; i < rotatingPlatforms.length; i++) {
    const item = rotatingPlatforms[i]
    if (item.axis === 'y') {
      item.platform.rotation.y += dt * item.speed
    } else {
      item.platform.rotation.z += dt * item.speed
    }
  }
  
  // Moving mixed platforms
  for (let i = 0; i < movingMixed.length; i++) {
    const item = movingMixed[i]
    if (item.vertical) {
      const y = Math.sin(animTime * item.speed + item.offset) * 2
      item.platform.position.y = item.platform.position.y * 0.9 + y * 0.1
    } else {
      const x = Math.sin(animTime * item.speed + item.offset) * item.radius
      const z = Math.cos(animTime * item.speed + item.offset) * item.radius * 0.5
      item.platform.position.x = x
      item.platform.position.z = item.platform.position.z * 0.9 + z * 0.1
    }
  }
  
  // Floating checkpoint
  for (let i = 0; i < courseElements.length; i++) {
    const element = courseElements[i]
    if (element.type === 'checkpoint') {
      const float = Math.sin(animTime * 2) * 0.3
      element.group.position.y = element.originalY + float
      element.visual.rotation.y += dt * 0.5
    }
  }
  
  // Spin decorative elements
  for (let i = 0; i < courseElements.length; i++) {
    const element = courseElements[i]
    if (element.type === 'decoration') {
      element.visual.rotation.y += dt * 2
      if (element.kind === 'torus') {
        element.visual.rotation.x += dt * 1.5
      }
    }
  }
})

// Instructions
console.log('\n🎮 VARIED OBSTACLE COURSE READY!')
console.log('📏 Configuration:')
console.log(`  Jump Height: ${CONFIG.PLAYER_JUMP_HEIGHT} units`)
console.log(`  Jump Distance: ${CONFIG.PLAYER_JUMP_DISTANCE} units`)
console.log(`  Difficulty: ${CONFIG.GAP_DIFFICULTY * 100}%`)
console.log('\n🎯 Course Features:')
console.log('  🟦 Shape Parade - All primitive types')
console.log('  🟩 Cylinder Bridge - Wavy path')
console.log('  🟣 Bouncing Spheres - Vertical movement')
console.log('  🟡 Rotating Torus Platforms')
console.log('  🔶 Cone Slalom - Zigzag course')
console.log('  🌀 Spiral Tower - Mixed shapes')
console.log('  💫 Moving Platforms - Various patterns')
console.log('  🏁 Final Gauntlet - Random challenges')
console.log('\n✨ All shapes use instanced rendering with physics!')

// Cleanup
return () => {
  for (let i = 0; i < courseElements.length; i++) {
    courseElements[i].group.destroy()
  }
  console.log('Varied obstacle course cleaned up')
}