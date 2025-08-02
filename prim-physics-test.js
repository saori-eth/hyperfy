// Primitive Physics Test - Tests all physics combinations for each primitive type

const PRIMITIVE_TYPES = ['box', 'sphere', 'cylinder', 'cone', 'torus', 'plane']
const PHYSICS_TYPES = ['static', 'kinematic', 'dynamic']

// Grid layout configuration
const GRID_SPACING = 4
const ROW_SPACING = 7
const START_X = -15
const START_Z = -18

// Create floor
const floor = app.create('prim', {
  kind: 'box',
  size: [50, 0.2, 50],
  position: [0, -0.1, 0],
  color: '#2a2a2a',
  metalness: 0.3,
  roughness: 0.8,
  physics: true
})
app.add(floor)

// Create walls to contain dynamic objects
const walls = []
const wallConfig = [
  { pos: [0, 2, -25], size: [50, 4, 0.5] }, // North
  { pos: [0, 2, 25], size: [50, 4, 0.5] },  // South
  { pos: [-25, 2, 0], size: [0.5, 4, 50] }, // West
  { pos: [25, 2, 0], size: [0.5, 4, 50] }   // East
]

wallConfig.forEach(config => {
  const wall = app.create('prim', {
    kind: 'box',
    size: config.size,
    position: config.pos,
    color: '#444444',
    physics: true
  })
  walls.push(wall)
  app.add(wall)
})

// Store all test primitives
const testPrimitives = []

// Add title
const titleUI = app.create('ui', {
  width: 400,
  height: 80,
  size: 0.01,
  position: [0, 5, -20],
  billboard: 'y',
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  borderRadius: 10,
  borderWidth: 3,
  borderColor: '#ffffff',
  padding: 10,
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center'
})

const titleText = app.create('uitext', {
  value: 'PRIMITIVE PHYSICS TEST',
  fontSize: 32,
  color: '#ffffff',
  textAlign: 'center',
  fontWeight: 'bold'
})

const subtitleText = app.create('uitext', {
  value: 'Testing convex mesh colliders',
  fontSize: 18,
  color: '#aaaaaa',
  textAlign: 'center',
  margin: 5
})

titleUI.add(titleText)
titleUI.add(subtitleText)
app.add(titleUI)

// Add column headers
PHYSICS_TYPES.forEach((physicsType, index) => {
  const headerUI = app.create('ui', {
    width: 140,
    height: 60,
    size: 0.01,
    position: [START_X + index * GRID_SPACING * 3, 3, START_Z - 5],
    billboard: 'y',
    backgroundColor: physicsType === 'dynamic' ? 'rgba(255, 68, 68, 0.2)' : 
                     physicsType === 'kinematic' ? 'rgba(68, 255, 68, 0.2)' : 
                     'rgba(68, 68, 255, 0.2)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: physicsType === 'dynamic' ? '#ff4444' : 
                 physicsType === 'kinematic' ? '#44ff44' : '#4444ff',
    padding: 10,
    flexDirection: 'column',
    alignItems: 'center'
  })
  
  const headerText = app.create('uitext', {
    value: physicsType.toUpperCase(),
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold'
  })
  
  const headerDesc = app.create('uitext', {
    value: physicsType === 'dynamic' ? 'Falls & Bounces' : 
           physicsType === 'kinematic' ? 'Animated' : 'Immovable',
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
    margin: 2
  })
  
  headerUI.add(headerText)
  headerUI.add(headerDesc)
  app.add(headerUI)
})

// Create test grid
PRIMITIVE_TYPES.forEach((primType, typeIndex) => {
  const rowZ = START_Z + typeIndex * ROW_SPACING
  
  PHYSICS_TYPES.forEach((physicsType, physIndex) => {
    const x = START_X + physIndex * GRID_SPACING * 3
    
    // Create UI label for this combination
    const labelUI = app.create('ui', {
      width: 120,
      height: 40,
      size: 0.01,
      position: [x, 0.5, rowZ + 2.5],
      billboard: 'y',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: 5,
      padding: 5
    })
    
    const labelText = app.create('uitext', {
      value: physicsType.toUpperCase(),
      fontSize: 20,
      color: physicsType === 'dynamic' ? '#ff4444' : 
              physicsType === 'kinematic' ? '#44ff44' : '#4444ff',
      textAlign: 'center',
      fontWeight: 'bold'
    })
    
    labelUI.add(labelText)
    app.add(labelUI)
    
    // Create the test primitive
    const size = primType === 'sphere' ? [0.5] :
                 primType === 'cylinder' || primType === 'cone' ? [0.5, 1.5] :
                 primType === 'torus' ? [0.6, 0.2] :
                 primType === 'plane' ? [1.5, 1.5] : [1, 1, 1]
    
    const height = primType === 'sphere' ? 0.5 :
                   primType === 'box' ? 0.5 :
                   primType === 'cylinder' || primType === 'cone' ? 0.75 :
                   primType === 'torus' ? 0.7 :
                   primType === 'plane' ? 0.75 : 0.5
    
    // Dynamic objects start higher to drop
    const yPos = physicsType === 'dynamic' ? height + 3 : height
    
    const testPrim = app.create('prim', {
      kind: primType,
      size: size,
      position: [x, yPos, rowZ],
      rotation: primType === 'plane' ? [0, Math.PI / 4, 0] : [0, 0, 0],
      color: `hsl(${typeIndex * 60}, 70%, 50%)`,
      metalness: 0.5,
      roughness: 0.5,
      doubleSided: primType === 'plane',
      physics: {
        type: physicsType,
        mass: physicsType === 'dynamic' ? 1 : undefined,
        restitution: 0.3,
        linearDamping: 0.1,
        angularDamping: 0.1
      }
    })
    
    testPrimitives.push({
      prim: testPrim,
      type: primType,
      physicsType: physicsType,
      originalY: yPos
    })
    
    app.add(testPrim)
    
    // Add trigger zone to test collision detection
    if (physIndex === 0) { // Only for first column
      const trigger = app.create('prim', {
        kind: 'box',
        size: [2, 2, 2],
        position: [x + GRID_SPACING, 1, rowZ],
        color: '#00ff00',
        transparent: true,
        opacity: 0.2,
        physics: {
          type: 'static',
          trigger: true,
          tag: `trigger_${primType}`,
          onTriggerEnter: (other) => {
            console.log(`${primType} trigger entered by:`, other.tag || 'unknown')
          },
          onTriggerLeave: (other) => {
            console.log(`${primType} trigger left by:`, other.tag || 'unknown')
          }
        }
      })
      app.add(trigger)
      
      // Add trigger label
      const triggerLabelUI = app.create('ui', {
        width: 80,
        height: 30,
        size: 0.01,
        position: [x + GRID_SPACING, 2.5, rowZ],
        billboard: 'y',
        backgroundColor: 'rgba(0, 255, 0, 0.2)',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#00ff00',
        padding: 3
      })
      
      const triggerLabelText = app.create('uitext', {
        value: 'TRIGGER',
        fontSize: 14,
        color: '#00ff00',
        textAlign: 'center',
        fontWeight: 'bold'
      })
      
      triggerLabelUI.add(triggerLabelText)
      app.add(triggerLabelUI)
    }
  })
})

// Add row labels
PRIMITIVE_TYPES.forEach((primType, index) => {
  const rowLabelUI = app.create('ui', {
    width: 150,
    height: 50,
    size: 0.01,
    position: [START_X - 5, 1, START_Z + index * ROW_SPACING],
    billboard: 'y',
    backgroundColor: 'rgba(40, 40, 40, 0.9)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: `hsl(${index * 60}, 70%, 50%)`,
    padding: 8
  })
  
  const rowLabelText = app.create('uitext', {
    value: primType.toUpperCase(),
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold'
  })
  
  rowLabelUI.add(rowLabelText)
  app.add(rowLabelUI)
})

// Add interactive test ball
const testBall = app.create('prim', {
  kind: 'sphere',
  size: [0.3],
  position: [0, 5, 0],
  color: '#ff00ff',
  emissive: '#ff00ff',
  emissiveIntensity: 0.5,
  physics: {
    type: 'dynamic',
    mass: 2,
    restitution: 0.8,
    tag: 'test_ball'
  }
})
app.add(testBall)

// Animation for kinematic objects
let time = 0
app.on('fixedUpdate', (dt) => {
  time += dt
  
  testPrimitives.forEach(item => {
    if (item.physicsType === 'kinematic') {
      // Update position and rotation directly on the prim
      // The prim's commit method will handle updating the physics actor
      item.prim.position.y = item.originalY + Math.sin(time * 2) * 0.5
      item.prim.rotation.y = time
      
      // Force immediate update of the physics actor
      item.prim.clean()
    }
  })
})

// Add physics force test
let forceTimer = 0
app.on('fixedUpdate', (dt) => {
  forceTimer += dt
  
  // Apply random impulse to test ball every 5 seconds
  if (forceTimer > 5 && testBall.actor) {
    const force = new PHYSX.PxVec3(
      (Math.random() - 0.5) * 10,
      5 + Math.random() * 5,
      (Math.random() - 0.5) * 10
    )
    PHYSX.PxRigidBodyExt.prototype.addForceAtPos(
      testBall.actor,
      force,
      testBall.actor.getGlobalPose().p,
      PHYSX.PxForceModeEnum.eIMPULSE
    )
    PHYSX.destroy(force)
    forceTimer = 0
    console.log('Applied impulse to test ball')
    updateStatus('⚡ Applied impulse to test ball')
  }
})

// Position camera for overview
if (typeof world !== 'undefined' && world.getAvatar) {
  try {
    const avatar = world.getAvatar()
    if (avatar) {
      avatar.position = [0, 15, 20]
      avatar.rotation.x = -0.4
    }
  } catch (e) {
    console.log('Could not set avatar position:', e.message)
  }
}

// Add status display for physics events
const statusUI = app.create('ui', {
  space: 'screen',
  width: 300,
  height: 150,
  size: 0.01,
  position: [0, 1, 0],
  pivot: 'bottom-left',
  offset: [20, -20, 0],
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  borderRadius: 10,
  borderWidth: 2,
  borderColor: '#666666',
  padding: 10,
  flexDirection: 'column',
  gap: 5
})

const statusTitle = app.create('uitext', {
  value: 'PHYSICS STATUS',
  fontSize: 18,
  color: '#ffffff',
  textAlign: 'center',
  fontWeight: 'bold',
  margin: 5
})

const statusText = app.create('uitext', {
  value: 'Waiting for collisions...',
  fontSize: 14,
  color: '#aaaaaa',
  textAlign: 'left',
  lineHeight: 1.4
})

statusUI.add(statusTitle)
statusUI.add(statusText)
app.add(statusUI)

// Update status on trigger events
let eventLog = []
const updateStatus = (message) => {
  eventLog.unshift(message)
  eventLog = eventLog.slice(0, 5) // Keep last 5 events
  statusText.value = eventLog.join('\\n')
}

// Update trigger callbacks to use status display
testPrimitives.forEach(item => {
  if (item.prim.physics && item.prim.physics.onTriggerEnter) {
    const originalEnter = item.prim.physics.onTriggerEnter
    item.prim.physics.onTriggerEnter = (other) => {
      originalEnter(other)
      updateStatus(`✓ ${item.type} trigger entered`)
    }
  }
})

console.log('=== Primitive Physics Test ===')
console.log('Layout:')
console.log('- Rows: Different primitive types (box, sphere, cylinder, cone, torus, plane)')
console.log('- Columns: Different physics types')
console.log('  - Blue: Static (immovable)')
console.log('  - Green: Kinematic (animated)')
console.log('  - Red: Dynamic (falls and bounces)')
console.log('- Green boxes: Trigger zones (first column only)')
console.log('- Purple ball: Test dynamic object with periodic impulses')
console.log('')
console.log('All non-box/sphere shapes now use convex mesh colliders!')