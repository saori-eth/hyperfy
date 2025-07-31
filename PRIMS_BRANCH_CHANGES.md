## Changes

### 1. Prim.js Modifications
**Geometry Caching Optimization**
- Changed from caching by `kind:size` to caching by `kind` only
- All primitives now use unit-sized geometries (1x1x1)
- Size is applied via scale transformation instead of creating different geometries
- Result: Dramatically reduced geometry memory usage

**Material System Simplification**
- Now uses a single white material for all primitives
- Colors are applied via instance colors in the Stage system
- Removed per-color material caching

### 2. Stage.js Enhancements
**Instance Color Support**
- Added `supportsInstanceColor` parameter to `insertLinked()`
- Added `color` parameter for per-instance colors
- New `instanceColors` Float32Array buffer for RGB values
- Custom shader modifications to inject instance color attributes


**API Changes**:
- `insertLinked()` now accepts `supportsInstanceColor` and `color` parameters
- Added `setColor()` method to staged items for runtime color changes

### 3. Documentation Updates
**Prim.md Changes**:
- Updated default color from `null` to `#ffffff`
