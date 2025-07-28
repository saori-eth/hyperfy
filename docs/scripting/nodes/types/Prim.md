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

### `.color`: String|null

The color of the primitive as a hex string (e.g., `#ff0000` for red). When set to `null`, uses the default material.

Defaults to `null`.

### `.material`: Material|null

A custom THREE.js material to use instead of the default. When provided, overrides the color property.

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
```

## Notes

- Geometries are cached internally based on shape type and size, improving performance when creating many primitives with the same dimensions
- When using the `color` property without a custom material, materials are cached by color value for better instancing performance
- When neither `color` nor `material` is specified, the Stage system's default material is used, allowing maximum instancing efficiency
- Changing the `kind` property after creation will trigger a rebuild of the geometry
- The `linked: true` setting enables automatic instancing via THREE.InstancedMesh for objects with matching geometry and material
- For physics collision, primitives work best with `box` and `sphere` shapes. Other shapes may require custom collider geometry or approximations