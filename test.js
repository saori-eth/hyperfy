// Comprehensive Prim Examples
// Demonstrates all primitive types and material properties

// Basic primitives with different colors
const redBox = app.create('prim', {
  kind: 'box',
  size: [1, 1, 1],
  position: [0, 0.5, 0],
  color: '#ff0000'
})

const blueSphere = app.create('prim', {
  kind: 'sphere',
  size: [0.5],
  position: [2, 0.5, 0],
  color: '#0000ff'
})

const greenCylinder = app.create('prim', {
  kind: 'cylinder',
  size: [0.3, 1],
  position: [4, 0.5, 0],
  color: '#00ff00'
})

const yellowCone = app.create('prim', {
  kind: 'cone',
  size: [0.4, 1],
  position: [6, 0.5, 0],
  color: '#ffff00'
})

const magentaTorus = app.create('prim', {
  kind: 'torus',
  size: [0.5, 0.15],
  position: [8, 0.5, 0],
  color: '#ff00ff'
})

const cyanPlane = app.create('prim', {
  kind: 'plane',
  size: [2, 2],
  position: [10, 0, 0],
  rotation: [-Math.PI/2, 0, 0],
  color: '#00ffff'
})

// Metallic and rough variations
const metallicBox = app.create('prim', {
  kind: 'box',
  size: [1, 1, 1],
  position: [0, 0.5, -3],
  color: '#888888',
  metalness: 1.0,
  roughness: 0.1
})

const roughSphere = app.create('prim', {
  kind: 'sphere',
  size: [0.5],
  position: [2, 0.5, -3],
  color: '#ff8800',
  metalness: 0.0,
  roughness: 1.0
})

const semiMetallicCylinder = app.create('prim', {
  kind: 'cylinder',
  size: [0.3, 1],
  position: [4, 0.5, -3],
  color: '#ffffff',
  metalness: 0.5,
  roughness: 0.5
})

// Emissive examples
const glowingBox = app.create('prim', {
  kind: 'box',
  size: [1, 1, 1],
  position: [0, 0.5, -6],
  color: '#220000',
  emissive: '#ff0000',
  emissiveIntensity: 2.0
})

const brightSphere = app.create('prim', {
  kind: 'sphere',
  size: [0.5],
  position: [2, 0.5, -6],
  color: '#002200',
  emissive: '#00ff00',
  emissiveIntensity: 3.0
})

const subtleGlowCone = app.create('prim', {
  kind: 'cone',
  size: [0.4, 1],
  position: [4, 0.5, -6],
  color: '#666666',
  emissive: '#ffffff',
  emissiveIntensity: 0.5
})

// Transparent examples
const glassCube = app.create('prim', {
  kind: 'box',
  size: [1, 1, 1],
  position: [0, 0.5, -9],
  color: '#ffffff',
  transparent: true,
  opacity: 0.3,
  metalness: 0.0,
  roughness: 0.0
})

const translucentSphere = app.create('prim', {
  kind: 'sphere',
  size: [0.5],
  position: [2, 0.5, -9],
  color: '#ff0000',
  transparent: true,
  opacity: 0.5
})

const semiTransparentTorus = app.create('prim', {
  kind: 'torus',
  size: [0.5, 0.15],
  position: [4, 0.5, -9],
  color: '#0000ff',
  transparent: true,
  opacity: 0.7,
  metalness: 0.3,
  roughness: 0.2
})

// Combined properties showcase
const crystalPrism = app.create('prim', {
  kind: 'cone',
  size: [0.5, 1.5],
  position: [6, 0.75, -9],
  color: '#88ccff',
  emissive: '#0088ff',
  emissiveIntensity: 1.5,
  transparent: true,
  opacity: 0.6,
  metalness: 0.2,
  roughness: 0.1
})

// Different sizes demonstration
const largeCube = app.create('prim', {
  kind: 'box',
  size: [3, 0.5, 2],
  position: [-3, 0.25, 0],
  color: '#ff6600'
})

const thinCylinder = app.create('prim', {
  kind: 'cylinder',
  size: [0.1, 3],
  position: [-3, 1.5, -3],
  color: '#6600ff'
})

const flatTorus = app.create('prim', {
  kind: 'torus',
  size: [1, 0.05],
  position: [-3, 0.5, -6],
  color: '#00ff66'
})

// Add all primitives to the scene
const primitives = [
  redBox, blueSphere, greenCylinder, yellowCone, magentaTorus, cyanPlane,
  metallicBox, roughSphere, semiMetallicCylinder,
  glowingBox, brightSphere, subtleGlowCone,
  glassCube, translucentSphere, semiTransparentTorus, crystalPrism,
  largeCube, thinCylinder, flatTorus
]

primitives.forEach(prim => app.add(prim))

// Animated examples
let time = 0
app.on('update', (dt) => {
  time += dt
  
  // Rotate some primitives
  magentaTorus.rotation.y += 0.01
  flatTorus.rotation.x += 0.02
  crystalPrism.rotation.y += 0.015
  
  // Animate emissive intensity
  brightSphere.emissiveIntensity = 2 + Math.sin(time * 2)
  
  // Animate transparency
  glassCube.opacity = 0.3 + 0.2 * Math.sin(time * 1.5)
  
  // Animate metalness
  semiMetallicCylinder.metalness = 0.5 + 0.5 * Math.sin(time)
})

// Add physics to some primitives
setTimeout(() => {
  // Make the red box dynamic
  redBox.physics = {
    type: 'dynamic',
    mass: 1
  }
  
  // Make the floor static
  const floor = app.create('prim', {
    kind: 'box',
    size: [20, 0.1, 20],
    position: [0, -0.05, -4.5],
    color: '#333333',
    physics: true // static by default
  })
  app.add(floor)
  
  // Drop a few spheres
  for (let i = 0; i < 5; i++) {
    const dropSphere = app.create('prim', {
      kind: 'sphere',
      size: [0.3],
      position: [-1 + i * 0.5, 3 + i * 0.5, 0],
      color: `hsl(${i * 60}, 70%, 50%)`,
      physics: {
        type: 'dynamic',
        mass: 0.5,
        restitution: 0.8
      }
    })
    app.add(dropSphere)
  }
}, 2000)

console.log('Primitive showcase loaded!')
console.log('Features demonstrated:')
console.log('- All 6 primitive types')
console.log('- Color variations')
console.log('- Metalness and roughness')
console.log('- Emissive with intensity')
console.log('- Transparency and opacity')
console.log('- Different sizes and proportions')
console.log('- Animated properties')
console.log('- Physics integration')