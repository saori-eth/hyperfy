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

### `.emissive`: String | null

The emissive (glow) color of the primitive. Defaults to `null` (no glow).

### `.emissiveIntensity`: Number

The intensity of the emissive glow. Defaults to `1`.

### `.metalness`: Number

How metallic the material appears, from 0.0 (non-metallic) to 1.0 (fully metallic). Defaults to `0.2`.

### `.roughness`: Number

How rough the material appears, from 0.0 (smooth/reflective) to 1.0 (rough/diffuse). Defaults to `0.8`.

### `.opacity`: Number

The opacity of the primitive, from 0.0 (fully transparent) to 1.0 (fully opaque). Defaults to `1`.

### `.transparent`: Boolean

Whether the primitive should be rendered with transparency. Must be `true` for opacity values less than 1 to take effect. Defaults to `false`.

### `.texture`: String | null

URL or path to a texture image to apply to the primitive. The texture will be loaded asynchronously and cached for reuse. Supports common image formats (PNG, JPG, etc.). Defaults to `null`.

### `.castShadow`: Boolean

Whether the primitive should cast shadows. Defaults to `true`.

### `.receiveShadow`: Boolean

Whether the primitive should receive shadows from other objects. Defaults to `true`.

### `.{...Node}`

Inherits all [Node](/docs/scripting/nodes/Node.md) properties

## Examples

```javascript
// Create various primitives with different materials
const box = app.create('prim', {
  kind: 'box',
  size: [2, 1, 3],
  position: [0, 1, 0],
  color: '#ff0000',
  metalness: 0.8,
  roughness: 0.2
})

const sphere = app.create('prim', {
  kind: 'sphere',
  size: [0.5],
  position: [3, 1, 0],
  color: '#0000ff',
  emissive: '#00ff00', // Green glow
  emissiveIntensity: 2.0
})

// Transparent glass-like cylinder
const cylinder = app.create('prim', {
  kind: 'cylinder',
  size: [0.3, 2],
  position: [-3, 1, 0],
  color: '#ffffff',
  transparent: true,
  opacity: 0.5,
  metalness: 0,
  roughness: 0
})

// Animated torus
const torus = app.create('prim', {
  kind: 'torus',
  size: [1, 0.3],
  position: [0, 3, 0],
  color: '#ffff00'
})

// Textured plane
const texturedPlane = app.create('prim', {
  kind: 'plane',
  size: [2, 2],
  position: [0, 1, -3],
  rotation: [-Math.PI/2, 0, 0],
  texture: 'https://example.com/texture.jpg'
})

app.add(box)
app.add(sphere)
app.add(cylinder)
app.add(torus)
app.add(texturedPlane)

// Animate emissive intensity
app.on('update', (dt) => {
  torus.rotation.y += 0.01
  torus.emissiveIntensity = Math.sin(Date.now() * 0.002) + 1.5
})
```

## Notes

- Primitives with identical material properties are automatically instanced for optimal performance
- Material properties (color, emissive, metalness, etc.) determine which primitives can be instanced together
- Changing material properties requires rebuilding the primitive instance
- For physics collision, primitives work best with `box` and `sphere` shapes
- Textures are loaded asynchronously and cached - multiple primitives using the same texture URL will share the loaded texture