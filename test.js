// Test script for physics-enabled primitives
// Shows how to use the new integrated physics API

const spacing = 3 // Space between shapes

// Dynamic box - simple physics enabled
const box = app.create('prim', {
  kind: 'box',
  size: [1, 1, 1],
  position: [-spacing * 2.5, 3, 0],
  color: '#ff4444',
  physics: {
    type: 'dynamic',
    mass: 1
  }
})

// Dynamic sphere with custom properties
const sphere = app.create('prim', {
  kind: 'sphere',
  size: [0.5],
  position: [-spacing * 1.5, 3, 0],
  color: '#44ff44',
  physics: {
    type: 'dynamic',
    mass: 2,
    restitution: 0.8 // Bouncy!
  }
})

// Dynamic cylinder
const cylinder = app.create('prim', {
  kind: 'cylinder',
  size: [0.5, 2],
  position: [-spacing * 0.5, 3, 0],
  color: '#4488ff',
  physics: {
    type: 'dynamic',
    mass: 3
  }
})

// Dynamic cone with damping
const cone = app.create('prim', {
  kind: 'cone',
  size: [0.6, 1.5],
  position: [spacing * 0.5, 3, 0],
  color: '#ff44ff',
  physics: {
    type: 'dynamic',
    mass: 1.5,
    linearDamping: 0.5,
    angularDamping: 0.5
  }
})

// Dynamic torus
const torus = app.create('prim', {
  kind: 'torus',
  size: [0.8, 0.3],
  position: [spacing * 1.5, 3, 0],
  color: '#ffff44',
  physics: {
    type: 'dynamic',
    mass: 2
  }
})

// Static ground - just enable physics with default static type
const ground = app.create('prim', {
  kind: 'box',
  size: [20, 1, 20],
  position: [0, -0.5, 0],
  color: '#888888',
  physics: true // Defaults to static
})

// Static wall with custom friction
const wall = app.create('prim', {
  kind: 'plane',
  size: [10, 10],
  position: [0, 5, -5],
  color: '#44ffff',
  physics: {
    type: 'static',
    staticFriction: 0.8,
    dynamicFriction: 0.8
  }
})

// Kinematic platform that moves back and forth
const platform = app.create('prim', {
  kind: 'box',
  size: [4, 0.5, 2],
  position: [0, 1, 2],
  color: '#ff8844',
  physics: {
    type: 'kinematic'
  }
})

// Add all shapes to the scene
app.add(box)
app.add(sphere)
app.add(cylinder)
app.add(cone)
app.add(torus)
app.add(ground)
app.add(wall)
app.add(platform)

// Animate the kinematic platform
let time = 0
app.on('update', (dt) => {
  time += dt
  
  // Move platform side to side
  platform.position.x = Math.sin(time) * 5
  
  // Spin the torus for visual effect (doesn't affect physics)
  torus.rotation.y += 0.02
})

// Example of trigger zone
const triggerZone = app.create('prim', {
  kind: 'box',
  size: [5, 3, 5],
  position: [0, 1.5, 0],
  color: '#00ff0080', // Semi-transparent
  emissive: { color: '#00ff00', intensity: 0.5 },
  physics: {
    type: 'static',
    trigger: true,
    onTriggerEnter: (event) => {
      console.log('Something entered the trigger zone!', event)
    },
    onTriggerLeave: (event) => {
      console.log('Something left the trigger zone!', event)
    }
  }
})
app.add(triggerZone)

console.log('Physics-enabled primitives created!')
console.log('Dynamic objects will fall and interact with physics')
console.log('The platform moves back and forth')
console.log('The green zone is a trigger that logs when objects enter/leave')