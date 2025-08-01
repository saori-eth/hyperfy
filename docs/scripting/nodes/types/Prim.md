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

The emissive (glow) color of the primitive. Can be:
- **String**: Color with default intensity (1.0)
- **Object**: `{color: '#hex', intensity: 2.0}` for custom intensity
- **null**: No glow (default)

### `.castShadow`: Boolean

Whether the primitive should cast shadows. Defaults to `true`.

### `.receiveShadow`: Boolean

Whether the primitive should receive shadows from other objects. Defaults to `true`.

### `.{...Node}`

Inherits all [Node](/docs/scripting/nodes/Node.md) properties

## Examples

```javascript
// Create various primitives
const box = app.create('prim', {
  kind: 'box',
  size: [2, 1, 3],
  position: [0, 1, 0],
  color: '#ff0000'
})

const sphere = app.create('prim', {
  kind: 'sphere',
  size: [0.5],
  position: [3, 1, 0],
  color: '#0000ff',
  emissive: '#00ff00' // Green glow
})

// Animated torus with dynamic emissive
const torus = app.create('prim', {
  kind: 'torus',
  size: [1, 0.3],
  position: [0, 3, 0],
  color: '#ffff00'
})

app.add(box)
app.add(sphere)
app.add(torus)

let time = 0
app.on('update', (dt) => {
  torus.rotation.y += 0.01
  time += dt
  torus.emissive = {
    color: '#ffff00',
    intensity: Math.sin(time * 2) + 1.5
  }
})
```

## Notes

- All primitives of the same type share geometry and render together efficiently
- For physics collision, primitives work best with `box` and `sphere` shapes