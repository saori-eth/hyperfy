// Test script for Prim node with instanced rendering system
// This demonstrates the performance benefits of the new per-instance color system

console.log('Starting Prim node test with instanced rendering...')

// Test 1: Create prims of each kind
console.log('\n1. Testing all prim kinds:')
const kinds = ['box', 'sphere', 'cylinder', 'cone', 'torus', 'plane']
const primsByKind = {}

kinds.forEach((kind, index) => {
  const prim = app.create('prim', {
    kind: kind,
    size: kind === 'sphere' ? [1] : kind === 'torus' ? [1, 0.3] : [1, 1, 1],
    position: [index * 3 - 7.5, 2, 0],
    color: '#ffffff'
  })
  primsByKind[kind] = prim
  app.add(prim)
  console.log(`- Created ${kind} prim`)
})

// Test 2: Test size property
console.log('\n2. Testing size property:')
const sizeTestBox = app.create('prim', {
  kind: 'box',
  size: [1, 1, 1],
  position: [0, 2, 5],
  color: '#ff0000'
})
app.add(sizeTestBox)

// Change size after creation
setTimeout(() => {
  console.log('- Changing box size to [2, 3, 1]')
  sizeTestBox.size = [2, 3, 1]
}, 1000)

// Test different size formats
const sizeTestSphere = app.create('prim', {
  kind: 'sphere',
  size: [0.5], // Single value for sphere
  position: [3, 2, 5],
  color: '#00ff00'
})
app.add(sizeTestSphere)

setTimeout(() => {
  console.log('- Changing sphere size to [1.5]')
  sizeTestSphere.size = [1.5]
}, 2000)

// Test 3: Test color property with instanced rendering
console.log('\n3. Testing color property with instance attributes:')
const colorTestPrim = app.create('prim', {
  kind: 'box',
  size: [2, 2, 2],
  position: [0, 2, 10],
  color: '#0000ff'
})
app.add(colorTestPrim)

// Create multiple prims to show instancing benefit
console.log('- Creating 50 boxes with different colors (single draw call)')
const instancedColorPrims = []
for (let i = 0; i < 50; i++) {
  const angle = (i / 50) * Math.PI * 2
  const radius = 5
  const hue = i / 50 * 360
  const prim = app.create('prim', {
    kind: 'box',
    size: [0.5, 0.5, 0.5],
    position: [
      Math.cos(angle) * radius,
      2,
      10 + Math.sin(angle) * radius
    ],
    color: `hsl(${hue}, 70%, 50%)`
  })
  app.add(prim)
  instancedColorPrims.push(prim)
}

// Animate colors to show dynamic updates
let colorAnimTime = 0
app.on('update', (dt) => {
  colorAnimTime += dt
  instancedColorPrims.forEach((prim, i) => {
    const hue = ((i / instancedColorPrims.length + colorAnimTime * 0.1) % 1) * 360
    prim.color = `hsl(${hue}, 70%, 50%)`
  })
})

// Test 4: Test transform properties (position, rotation, scale)
console.log('\n4. Testing transform properties:')
const transformPrim = app.create('prim', {
  kind: 'cone',
  size: [1, 2],
  position: [0, 2, 15],
  color: '#ff8800'
})
app.add(transformPrim)

// Animate transforms
let transformTime = 0
app.on('update', (dt) => {
  transformTime += dt
  const time = transformTime
  
  // Position animation
  transformPrim.position.x = Math.sin(time) * 3
  transformPrim.position.y = 2 + Math.sin(time * 2) * 0.5
  
  // Rotation animation
  transformPrim.rotation.y += 0.02
  transformPrim.rotation.x = Math.sin(time * 0.5) * 0.3
  
  // Scale animation
  const scale = 1 + Math.sin(time * 3) * 0.3
  transformPrim.scale.set(scale, scale, scale)
})

// Test 5: Test shadow properties
console.log('\n5. Testing shadow properties:')
const shadowTestPrim = app.create('prim', {
  kind: 'torus',
  size: [2, 0.5],
  position: [-5, 3, 20],
  color: '#ffffff',
  castShadow: true,
  receiveShadow: true
})
app.add(shadowTestPrim)

// Toggle shadows
setTimeout(() => {
  console.log('- Disabling cast shadow')
  shadowTestPrim.castShadow = false
}, 3000)

setTimeout(() => {
  console.log('- Disabling receive shadow')
  shadowTestPrim.receiveShadow = false
}, 4000)

setTimeout(() => {
  console.log('- Re-enabling shadows')
  shadowTestPrim.castShadow = true
  shadowTestPrim.receiveShadow = true
}, 5000)

// Test 6: Test active property
console.log('\n6. Testing active property:')
const activeTestPrim = app.create('prim', {
  kind: 'cylinder',
  size: [1, 2],
  position: [5, 2, 20],
  color: '#00ff00'
})
app.add(activeTestPrim)

// Toggle active state
let isActive = true
let activeTimer = 0

app.on('update', (dt) => {
  activeTimer += dt
  if (activeTimer > 2) {
    isActive = !isActive
    activeTestPrim.active = isActive
    console.log(`- Set active to ${isActive}`)
    activeTimer = 0
  }
})

// Test 7: Test clone method
console.log('\n7. Testing clone method:')
const originalPrim = app.create('prim', {
  kind: 'box',
  size: [1, 1, 1],
  position: [0, 2, 25],
  color: '#ff00ff'
})
app.add(originalPrim)

// Clone and modify
const clonedPrim = originalPrim.clone()
clonedPrim.position.x = 3
clonedPrim.color = '#00ffff'
app.add(clonedPrim)
console.log('- Cloned prim and changed position/color')

// Test 8: Test hierarchy (add/remove children)
console.log('\n8. Testing hierarchy:')
const parentPrim = app.create('prim', {
  kind: 'box',
  size: [3, 0.5, 3],
  position: [0, 2, 30],
  color: '#888888'
})
app.add(parentPrim)

const childPrim = app.create('prim', {
  kind: 'sphere',
  size: [0.5],
  position: [0, 1, 0], // Relative to parent
  color: '#ffff00'
})
parentPrim.add(childPrim)
console.log('- Added child sphere to parent box')

// Rotate parent to show hierarchy
app.on('update', () => {
  parentPrim.rotation.y += 0.01
})

// Test 9: Test null color (no color specified)
console.log('\n9. Testing null color (default material):')
const noColorPrim = app.create('prim', {
  kind: 'box',
  size: [2, 2, 2],
  position: [0, 2, 35]
  // No color specified - should use default material
})
app.add(noColorPrim)
console.log('- Created prim without color')

// Test 10: Test changing kind (should rebuild)
console.log('\n10. Testing kind change:')
const kindChangePrim = app.create('prim', {
  kind: 'box',
  size: [1.5, 1.5, 1.5],
  position: [0, 2, 40],
  color: '#ff0000'
})
app.add(kindChangePrim)

const primKinds = ['box', 'sphere', 'cylinder', 'cone', 'torus', 'plane']
let kindIndex = 0
let kindTimer = 0

app.on('update', (dt) => {
  kindTimer += dt
  if (kindTimer > 2.5) {
    kindIndex = (kindIndex + 1) % primKinds.length
    kindChangePrim.kind = primKinds[kindIndex]
    console.log(`- Changed kind to ${primKinds[kindIndex]}`)
    kindTimer = 0
  }
})

// Test 11: Performance test - many prims with instance colors
console.log('\n11. Testing instanced rendering performance:')
const perfTestPrims = []

// Create a large grid to demonstrate instancing efficiency
const gridSize = 20
const spacing = 1.5

for (let x = 0; x < gridSize; x++) {
  for (let z = 0; z < gridSize; z++) {
    const prim = app.create('prim', {
      kind: 'sphere',
      size: [0.4],
      position: [
        (x - gridSize / 2) * spacing,
        2,
        45 + (z - gridSize / 2) * spacing
      ],
      color: `hsl(${(x * gridSize + z) / (gridSize * gridSize) * 360}, 70%, 50%)`
    })
    app.add(prim)
    perfTestPrims.push(prim)
  }
}

console.log(`- Created ${perfTestPrims.length} instanced spheres`)
console.log('- All spheres render in a single draw call thanks to instance attributes')

// Animate the grid
let gridAnimTime = 0
app.on('update', (dt) => {
  gridAnimTime += dt
  perfTestPrims.forEach((prim, i) => {
    const wave = Math.sin(gridAnimTime + i * 0.01) * 0.5
    prim.position.y = 2 + wave
  })
})

// Test summary
console.log('\n=== Prim Node Test Summary ===')
console.log('All tests initiated. Watch console for ongoing results.')
console.log('Tests include:')
console.log('- All primitive kinds (box, sphere, cylinder, cone, torus, plane)')
console.log('- Size property changes')
console.log('- Color property changes with instance attributes')
console.log('- 50 boxes with animated colors (single draw call)')
console.log('- Transform animations (position, rotation, scale)')
console.log('- Shadow properties (castShadow, receiveShadow)')
console.log('- Active property toggling')
console.log('- Clone method')
console.log('- Hierarchy (parent/child relationships)')
console.log('- Null color (default material)')
console.log('- Kind property changes (rebuilding geometry)')
console.log(`- Performance test: ${gridSize * gridSize} instanced spheres`)
console.log('\n🚀 Instance Color Benefits:')
console.log('- All primitives of the same kind share one draw call')
console.log('- Colors can be updated without material recreation')
console.log('- Massive performance gains for AI-generated worlds')
console.log('\nEnd of test script.')