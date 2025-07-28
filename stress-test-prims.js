// Stress test scene with many primitive shapes

const shapes = ['box', 'sphere', 'cylinder', 'cone', 'torus', 'plane']
const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#8800ff', '#0088ff']

// Grid parameters
const gridSize = 20 // 20x20 grid = 400 objects per layer
const layers = 5    // 5 vertical layers = 2000 total objects
const spacing = 3   // Distance between objects
const startX = -(gridSize * spacing) / 2
const startZ = -(gridSize * spacing) / 2

// Create grid of shapes
for (let layer = 0; layer < layers; layer++) {
  const y = layer * 4 + 2 // Stack layers vertically
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      // Pick random shape and color
      const shapeType = shapes[Math.floor(Math.random() * shapes.length)]
      const color = colors[Math.floor(Math.random() * colors.length)]
      
      // Calculate position
      const x = startX + col * spacing
      const z = startZ + row * spacing
      
      // Random size variation
      const sizeMultiplier = 0.5 + Math.random() * 1.5
      let size
      
      switch (shapeType) {
        case 'box':
          size = [sizeMultiplier, sizeMultiplier * 0.8, sizeMultiplier * 1.2]
          break
        case 'sphere':
          size = [sizeMultiplier * 0.5]
          break
        case 'cylinder':
          size = [sizeMultiplier * 0.4, sizeMultiplier]
          break
        case 'cone':
          size = [sizeMultiplier * 0.5, sizeMultiplier]
          break
        case 'torus':
          size = [sizeMultiplier * 0.5, sizeMultiplier * 0.2]
          break
        case 'plane':
          size = [sizeMultiplier, sizeMultiplier]
          break
      }
      
      // Create the primitive
      const prim = app.create('prim', {
        kind: shapeType,
        size: size,
        position: [x, y, z],
        color: color,
        castShadow: layer < 2, // Only cast shadows for lower layers to save performance
        receiveShadow: true
      })
      
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

// Add a larger central landmark
const landmark = app.create('prim', {
  kind: 'torus',
  size: [10, 3],
  position: [0, 15, 0],
  color: '#ffffff',
  castShadow: true,
  receiveShadow: true
})

// Animate the landmark
app.on('update', () => {
  landmark.rotation.y += 0.005
  landmark.rotation.x += 0.003
})

app.add(landmark)

console.log(`Created ${gridSize * gridSize * layers + 1} primitive objects`)