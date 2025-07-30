// Roblox-style Obstacle Course using Instanced Primitives
// Configurable spacing and difficulty for different player physics

console.log('=== OBSTACLE COURSE ===')
console.log('Creating a challenging parkour course with instanced primitives!')

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
  COURSE_LENGTH: 20,          // Number of obstacles
  
  // Visual settings
  CHECKPOINT_INTERVAL: 5,     // Checkpoint every N obstacles
  USE_COLORS: true,           // Color coding for difficulty
}

// Color scheme
const COLORS = {
  start: '#00ff00',           // Green
  normal: '#3399ff',          // Blue
  hard: '#ff9900',            // Orange
  veryHard: '#ff3333',        // Red
  checkpoint: '#ffff00',      // Yellow
  moving: '#ff00ff',          // Magenta
  finish: '#00ffff',          // Cyan
}

// Track all course elements
const courseElements = []
let currentZ = 0
let currentY = 2

// Helper to create a platform
function createPlatform(x, y, z, width, depth, color, type = 'normal') {
  const platform = app.create('prim', {
    kind: 'box',
    size: [width, CONFIG.PLATFORM_HEIGHT, depth],
    position: [x, y, z],
    color: CONFIG.USE_COLORS ? color : '#cccccc',
    castShadow: true,
    receiveShadow: true
  })
  
  app.add(platform)
  courseElements.push({ 
    prim: platform, 
    type: type,
    originalY: y
  })
  
  return platform
}

// 1. Starting Platform
console.log('Building starting area...')
createPlatform(0, currentY, currentZ, 8, 8, COLORS.start, 'start')
currentZ += 8

// 2. Simple Jumps
console.log('Adding simple jumps...')
for (let i = 0; i < 3; i++) {
  currentZ += CONFIG.PLAYER_JUMP_DISTANCE * CONFIG.GAP_DIFFICULTY
  createPlatform(0, currentY, currentZ, 4, 4, COLORS.normal)
}
currentZ += 4

// 3. Staircase Up
console.log('Building staircase...')
for (let i = 0; i < 5; i++) {
  currentZ += 3
  currentY += 1.5
  createPlatform(0, currentY, currentZ, 3, 3, COLORS.normal)
}

// 4. Checkpoint
currentZ += 5
createPlatform(0, currentY, currentZ, 6, 6, COLORS.checkpoint, 'checkpoint')
console.log(`Checkpoint 1 at height ${currentY}`)

// 5. Moving Platforms Section
console.log('Creating moving platforms...')
const movingPlatforms = []
for (let i = 0; i < 4; i++) {
  currentZ += CONFIG.PLAYER_JUMP_DISTANCE * 0.9
  const platform = createPlatform(
    Math.sin(i * 0.5) * 3, 
    currentY, 
    currentZ, 
    3, 
    3, 
    COLORS.moving, 
    'moving'
  )
  movingPlatforms.push({
    platform,
    offset: i * Math.PI * 0.5,
    radius: 3,
    speed: 0.5 + i * 0.1
  })
}

// 6. Narrow Path
console.log('Adding narrow path...')
currentZ += 5
for (let i = 0; i < 5; i++) {
  currentZ += 2
  createPlatform(0, currentY, currentZ, 1.5, 2, COLORS.hard)
}

// 7. Diagonal Jumps
console.log('Creating diagonal section...')
let currentX = 0
for (let i = 0; i < 6; i++) {
  currentZ += CONFIG.PLAYER_JUMP_DISTANCE * 0.7
  currentX = (i % 2 === 0) ? -4 : 4
  currentY += (Math.random() - 0.5) * CONFIG.HEIGHT_VARIATION
  const difficulty = Math.abs(currentX) / 4
  const color = difficulty > 0.8 ? COLORS.veryHard : COLORS.hard
  createPlatform(currentX, currentY, currentZ, 3, 3, color)
}

// 8. Checkpoint 2
currentZ += 5
currentX = 0
createPlatform(currentX, currentY, currentZ, 6, 6, COLORS.checkpoint, 'checkpoint')
console.log(`Checkpoint 2 at height ${currentY}`)

// 9. Spiral Tower
console.log('Building spiral tower...')
const spiralSteps = 12
for (let i = 0; i < spiralSteps; i++) {
  const angle = (i / spiralSteps) * Math.PI * 2
  const radius = 5
  currentX = Math.cos(angle) * radius
  const spiralZ = currentZ + Math.sin(angle) * radius
  currentY += 1
  createPlatform(currentX, currentY, spiralZ, 2.5, 2.5, COLORS.hard)
}
currentZ += 10

// 10. Disappearing Platforms
console.log('Adding disappearing platforms...')
const disappearingPlatforms = []
currentX = 0
for (let i = 0; i < 5; i++) {
  currentZ += CONFIG.PLAYER_JUMP_DISTANCE * 0.8
  const platform = createPlatform(0, currentY, currentZ, 3, 3, COLORS.veryHard, 'disappearing')
  disappearingPlatforms.push({
    platform,
    visibleTime: 2,
    invisibleTime: 2,
    offset: i * 0.8
  })
}

// 11. Final Gauntlet - Mixed Challenges
console.log('Creating final gauntlet...')
for (let i = 0; i < 8; i++) {
  currentZ += CONFIG.PLAYER_JUMP_DISTANCE * (0.6 + Math.random() * 0.4)
  currentX = (Math.random() - 0.5) * 8
  currentY += (Math.random() - 0.5) * CONFIG.HEIGHT_VARIATION * 1.5
  
  const size = 2 + Math.random() * 2
  const isHard = Math.random() > 0.5
  createPlatform(
    currentX, 
    currentY, 
    currentZ, 
    size, 
    size, 
    isHard ? COLORS.veryHard : COLORS.hard
  )
}

// 12. Finish Platform
currentZ += 8
currentX = 0
createPlatform(currentX, currentY, currentZ, 10, 10, COLORS.finish, 'finish')
console.log(`Course complete! Total length: ${currentZ} units`)

// Add some decorative elements
console.log('Adding obstacles and decorations...')

// Floating rings to jump through
for (let i = 5; i < currentZ; i += 15) {
  const ring = app.create('prim', {
    kind: 'torus',
    size: [3, 0.5],
    position: [0, currentY + 5, i],
    color: '#ffffff',
    rotation: [Math.PI / 2, 0, 0]
  })
  app.add(ring)
  courseElements.push({ prim: ring, type: 'decoration' })
}

// Side barriers at key points
const barrierPoints = [10, 30, 50, 70]
barrierPoints.forEach(z => {
  if (z < currentZ) {
    [-10, 10].forEach(x => {
      const barrier = app.create('prim', {
        kind: 'box',
        size: [0.5, 20, 20],
        position: [x, 10, z],
        color: '#444444'
      })
      app.add(barrier)
      courseElements.push({ prim: barrier, type: 'barrier' })
    })
  }
})

// Animation system
let animTime = 0
app.on('update', (dt) => {
  animTime += dt
  
  // Animate moving platforms
  movingPlatforms.forEach(item => {
    const x = Math.sin(animTime * item.speed + item.offset) * item.radius
    item.platform.position.x = x
  })
  
  // Animate disappearing platforms
  disappearingPlatforms.forEach(item => {
    const cycle = animTime + item.offset
    const phase = cycle % (item.visibleTime + item.invisibleTime)
    const isVisible = phase < item.visibleTime
    item.platform.active = isVisible
    
    // Flash warning before disappearing
    if (isVisible && phase > item.visibleTime - 0.5) {
      const flash = Math.sin(phase * 20) > 0
      item.platform.color = flash ? COLORS.veryHard : '#ffffff'
    }
  })
  
  // Gentle floating for checkpoints
  courseElements.forEach(element => {
    if (element.type === 'checkpoint') {
      const float = Math.sin(animTime * 2) * 0.2
      element.prim.position.y = element.originalY + float
    }
  })
})

// Instructions
console.log('\n🎮 OBSTACLE COURSE READY!')
console.log('📏 Configuration:')
console.log(`  Jump Height: ${CONFIG.PLAYER_JUMP_HEIGHT} units`)
console.log(`  Jump Distance: ${CONFIG.PLAYER_JUMP_DISTANCE} units`)
console.log(`  Difficulty: ${CONFIG.GAP_DIFFICULTY * 100}%`)
console.log('\n🎯 Features:')
console.log('  - Simple jumps (blue)')
console.log('  - Moving platforms (magenta)')
console.log('  - Narrow paths (orange)')
console.log('  - Disappearing platforms (red/white flash)')
console.log('  - Checkpoints (yellow)')
console.log('  - Spiral tower climb')
console.log('  - Final gauntlet')
console.log('\n💡 Tip: Adjust CONFIG values to match your player physics!')

// Cleanup
return () => {
  courseElements.forEach(element => element.prim.destroy())
  console.log('Obstacle course cleaned up')
}