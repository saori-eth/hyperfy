// Stress test scene using clone() method

const shapes = ['box', 'sphere', 'cylinder', 'cone', 'torus', 'plane']
const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#ffff00']

// Grid parameters
const gridSize = 20 // 20x20 grid = 400 objects per layer
const layers = 5    // 5 vertical layers = 2000 total objects
const spacing = 3   // Distance between objects
const startX = -(gridSize * spacing) / 2
const startZ = -(gridSize * spacing) / 2

// Create template prims for each shape type
const templates = {}
shapes.forEach(shapeType => {
  let size
  switch (shapeType) {
    case 'box':
      size = [1, 1, 1]
      break
    case 'sphere':
      size = [0.5]
      break
    case 'cylinder':
      size = [0.4, 1]
      break
    case 'cone':
      size = [0.5, 1]
      break
    case 'torus':
      size = [0.5, 0.2]
      break
    case 'plane':
      size = [1, 1]
      break
  }
  
  // Create template prim for this shape (no color for templates)
  templates[shapeType] = app.create('prim', {
    kind: shapeType,
    size: size,
    castShadow: false,
    receiveShadow: true
    // Note: no color specified for templates
  })
})

// Create grid of shapes using clone
for (let layer = 0; layer < layers; layer++) {
  const y = layer * 4 + 2 // Stack layers vertically
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      // Pick random shape
      const shapeType = shapes[Math.floor(Math.random() * shapes.length)]
      const template = templates[shapeType]
      
      // Clone the template
      const prim = template.clone()
      
      // Set position
      const x = startX + col * spacing
      const z = startZ + row * spacing
      prim.position.set(x, y, z)
      
      // Set random color
      const color = colors[Math.floor(Math.random() * colors.length)]
      prim.color = color
      
      // Add some rotation for visual variety
      prim.rotation.x = Math.random() * Math.PI * 2
      prim.rotation.y = Math.random() * Math.PI * 2
      prim.rotation.z = Math.random() * Math.PI * 2
      
      // Optional: animate some objects
      if (Math.random() > 0.9) { // 10% of objects will rotate
        const rotationSpeed = 0.5 + Math.random() * 2
        const axis = Math.floor(Math.random() * 3)
        
        app.on('update', () => {
          switch(axis) {
            case 0:
              prim.rotation.x += rotationSpeed * 0.01
              break
            case 1:
              prim.rotation.y += rotationSpeed * 0.01
              break
            case 2:
              prim.rotation.z += rotationSpeed * 0.01
              break
          }
        })
      }
      
      app.add(prim)
    }
  }
}

// Add a larger central landmark using clone
const landmarkTemplate = app.create('prim', {
  kind: 'torus',
  size: [10, 3],
  color: '#ffffff',
  castShadow: true,
  receiveShadow: true
})

const landmark = landmarkTemplate.clone()
landmark.position.set(0, 15, 0)

// Animate the landmark
app.on('update', () => {
  landmark.rotation.y += 0.005
  landmark.rotation.x += 0.003
})

app.add(landmark)

console.log(`Created ${gridSize * gridSize * layers + 1} primitive objects using clone()`)