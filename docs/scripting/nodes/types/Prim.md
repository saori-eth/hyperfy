# Prim

Creates primitive 3D shapes with built-in geometry caching for optimal performance.

## Properties

### `.kind`: String

The type of primitive shape to create. 

Available options: `box`, `sphere`, `cylinder`, `cone`, `torus`, `plane`.

Defaults to `box`.

### `.size`: Array

The dimensions of the primitive. The array length and meaning varies by shape:
- `box`: `[width, height, depth]` - all three dimensions
- `sphere`: `[radius]` - single radius value
- `cylinder`: `[radius, height]` - radius and height
- `cone`: `[radius, height]` - base radius and height
- `torus`: `[radius, tube]` - major radius and tube radius
- `plane`: `[width, height]` - width and height

If fewer values are provided than required, missing values default to the first value or 1.

Defaults to `[1, 1, 1]`.

### `.color`: String

The color of the primitive as a hex string (e.g., `#ff0000` for red).

Defaults to `#ffffff` (white).

### `.emissive`: String | Object | null

The emissive (glow) color of the primitive. Can be specified in three ways:

1. **As a color string**: The primitive will glow with this color at default intensity (1.0)
   ```javascript
   emissive: '#ff0000' // Red glow
   ```

2. **As an object with color and intensity**: Allows control over glow strength
   ```javascript
   emissive: {
     color: '#00ff00',  // Green glow
     intensity: 2.5     // 2.5x stronger than default
   }
   ```

3. **As null**: No emissive glow (default)

The emissive color is unaffected by lighting and adds to the final color output, making objects appear to emit light.

Defaults to `null`.

### `.castShadow`: Boolean

Whether the primitive should cast shadows. 

Defaults to `true`.

### `.receiveShadow`: Boolean

Whether the primitive should receive shadows from other objects.

Defaults to `true`.

### `.{...Node}`

Inherits all [Node](/docs/scripting/nodes/Node.md) properties

## Examples

```javascript
// Create a red box
const box = app.create('prim', {
  kind: 'box',
  size: [2, 1, 3],
  position: [0, 1, 0],
  color: '#ff0000'
})
app.add(box)

// Create a blue sphere
const sphere = app.create('prim', {
  kind: 'sphere',
  size: [0.5],
  position: [3, 1, 0],
  color: '#0000ff'
})
app.add(sphere)

// Create a cylinder without specifying color (uses default material)
const cylinder = app.create('prim', {
  kind: 'cylinder',
  size: [0.5, 2],
  position: [-3, 1, 0]
})
app.add(cylinder)

// Animate a torus
const torus = app.create('prim', {
  kind: 'torus',
  size: [1, 0.3],
  position: [0, 3, 0],
  color: '#ffff00'
})
app.add(torus)

app.on('update', () => {
  torus.rotation.y += 0.01
  torus.rotation.x += 0.005
})

// Create a glowing sphere
const glowingSphere = app.create('prim', {
  kind: 'sphere',
  size: [0.5],
  position: [0, 5, 0],
  color: '#ffffff',
  emissive: '#00ff00' // Green glow
})
app.add(glowingSphere)

// Create an intensely glowing box
const intenseBox = app.create('prim', {
  kind: 'box',
  size: [1, 1, 1],
  position: [3, 5, 0],
  color: '#ff0000',
  emissive: {
    color: '#ff0000',
    intensity: 3.0 // Very bright red glow
  }
})
app.add(intenseBox)

// Dynamically change emissive
const dynamicCone = app.create('prim', {
  kind: 'cone',
  size: [0.5, 1.5],
  position: [-3, 5, 0],
  color: '#0000ff'
})
app.add(dynamicCone)

// Pulse the emissive intensity
let time = 0
app.on('update', (dt) => {
  time += dt
  const intensity = Math.sin(time * 2) * 0.5 + 1.5 // Oscillates between 1.0 and 2.0
  dynamicCone.emissive = {
    color: '#0000ff',
    intensity: intensity
  }
})
```

## Notes

- All primitives of the same type share geometry and render together efficiently
- For physics collision, primitives work best with `box` and `sphere` shapes. Other shapes may require custom collider geometry or approximations