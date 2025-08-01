

// Create one of each primitive shape
const spacing = 3 // Space between shapes

// Box
const box = app.create('prim', {
  kind: 'box',
  size: [1, 1, 1],
  position: [-spacing * 2.5, 0, 0],
  color: '#ff4444'
})

// Sphere
const sphere = app.create('prim', {
  kind: 'sphere',
  size: [0.5],
  position: [-spacing * 1.5, 0, 0],
  color: '#44ff44'
})

// Cylinder
const cylinder = app.create('prim', {
  kind: 'cylinder',
  size: [0.5, 2],
  position: [-spacing * 0.5, 0, 0],
  color: '#4488ff'
})

// Cone
const cone = app.create('prim', {
  kind: 'cone',
  size: [0.6, 1.5],
  position: [spacing * 0.5, 0, 0],
  color: '#ff44ff'
})

// Torus
const torus = app.create('prim', {
  kind: 'torus',
  size: [0.8, 0.3],
  position: [spacing * 1.5, 0, 0],
  color: '#ffff44'
})

// Plane (vertical wall)
const plane = app.create('prim', {
  kind: 'plane',
  size: [2, 2],
  position: [spacing * 2.5, 1, 0],
  rotation: [0, Math.PI / 2, 0],
  color: '#44ffff'
})

// Add all shapes
app.add(box)
app.add(sphere)
app.add(cylinder)
app.add(cone)
app.add(torus)
app.add(plane)

console.log('Created all primitive shapes')