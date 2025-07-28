// Test script for Prim node - tests all properties and methods

console.log('Starting Prim node test...')

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

// Test 3: Test color property
console.log('\n3. Testing color property:')
const colorTestPrim = app.create('prim', {
  kind: 'box',
  size: [2, 2, 2],
  position: [0, 2, 10],
  color: '#0000ff'
})
app.add(colorTestPrim)

// Cycle through colors
const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
let colorIndex = 0
let colorTimer = 0

app.on('update', (dt) => {
  colorTimer += dt
  if (colorTimer > 1.5) {
    colorTestPrim.color = colors[colorIndex]
    console.log(`- Changed color to ${colors[colorIndex]}`)
    colorIndex = (colorIndex + 1) % colors.length
    colorTimer = 0
  }
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
app.on('update', () => {
  const time = Date.now() * 0.001
  
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

// Test summary
console.log('\n=== Prim Node Test Summary ===')
console.log('All tests initiated. Watch console for ongoing results.')
console.log('Tests include:')
console.log('- All primitive kinds (box, sphere, cylinder, cone, torus, plane)')
console.log('- Size property changes')
console.log('- Color property changes') 
console.log('- Transform animations (position, rotation, scale)')
console.log('- Shadow properties (castShadow, receiveShadow)')
console.log('- Active property toggling')
console.log('- Clone method')
console.log('- Hierarchy (parent/child relationships)')
console.log('- Null color (default material)')
console.log('- Kind property changes (rebuilding geometry)')
console.log('\nEnd of test script.')