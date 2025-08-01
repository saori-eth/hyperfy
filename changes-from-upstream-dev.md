# Changes from upstream/dev

## Summary

This branch introduces a new **Prim** node type for creating primitive 3D shapes in Hyperfy with optimized geometry caching and instancing support.

## New Files

### 1. `src/core/nodes/Prim.js`
A new node class that creates primitive 3D shapes with the following features:
- **Supported shapes**: box, sphere, cylinder, cone, torus, plane
- **Geometry caching**: All primitives of the same type share a single unit-sized geometry
- **Instance rendering**: Uses THREE.js instanced rendering for optimal performance
- **Per-instance colors**: Each primitive can have its own color via instance attributes
- **Emissive support**: Primitives can glow with configurable color and intensity
- **Size via scaling**: Geometry is unit-sized, with dimensions applied through transform scaling

Key properties:
- `kind`: The type of primitive shape
- `size`: Array of dimensions (varies by shape type)
- `color`: Hex color string
- `emissive`: Can be null, a color string, or an object with `{color, intensity}`
- `castShadow` / `receiveShadow`: Shadow configuration

### 2. `docs/scripting/nodes/types/Prim.md`
Comprehensive documentation for the Prim node including:
- Detailed property descriptions
- Usage examples for all primitive types
- Examples of emissive/glowing objects
- Animation examples
- Performance notes about geometry sharing

### 3. `prim-stress-test.js`
A performance test script that:
- Creates 1000 random primitives with even distribution across all shape types
- Randomly positions them in 3D space
- Assigns random colors using HSL color space
- 20% of shapes have emissive properties with varying intensities
- Useful for testing the instanced rendering performance

## Modified Files

### 1. `src/core/nodes/index.js`
- Added export for the new Prim node: `export { Prim as prim } from './Prim.js'`

### 2. `src/core/systems/Stage.js`
- Added `insertPrimitive()` method to handle primitive-specific rendering
- Created new `Primitive` class that extends `Model` with:
  - Instance color support via custom shader modifications
  - Instance emissive support with intensity control
  - Dynamic buffer resizing for efficient memory usage
  - Custom vertex/fragment shader modifications to apply per-instance colors and emissive values

## Technical Implementation Details

The implementation uses an advanced instancing approach:
1. **Shared Geometry**: All primitives of the same type share one geometry instance
2. **Instance Attributes**: Colors and emissive values are stored as instance attributes
3. **Shader Modifications**: The standard material shader is modified to support per-instance colors and emissive values
4. **Dynamic Buffers**: Instance buffers grow dynamically as needed (in increments of 100)
5. **Efficient Updates**: Only dirty instances are updated, minimizing GPU transfers

This architecture allows rendering thousands of primitives with minimal draw calls while maintaining per-instance visual properties.