# WebView Feature Implementation - Branch Diff

This document contains all changes made in the `iframe` branch compared to `main`.

## Overview

This branch implements the **WebView node** feature, which allows embedding interactive iframes in both 3D world space and 2D screen space. The implementation uses CSS3D rendering with proper depth occlusion for world space, and CSS absolute positioning for screen space.

---

## Files Added

### 1. `src/core/systems/ClientCSS.js` (New File)

**Purpose:** CSS3D rendering system for WebView nodes in world space.

**Key Features:**
- Manages CSS3DRenderer for positioning iframes in 3D space
- Synchronizes CSS3DObject transforms with target meshes
- Handles resize events
- Renders CSS layer before WebGL for proper occlusion

**Full Implementation:**
```javascript
import * as THREE from '../extras/three'
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js'

import { System } from './System'

const v1 = new THREE.Vector3()

/**
 * ClientCSS System
 *
 * - Runs on the client
 * - Manages CSS3D rendering for WebView nodes (iframes in 3D space)
 * - Renders behind the WebGL canvas to create the cutout effect
 *
 */
export class ClientCSS extends System {
  constructor(world) {
    super(world)
    this.scene = new THREE.Scene()
    this.renderer = null
    this.elem = null
  }

  async init({ cssLayer }) {
    if (!cssLayer) return
    this.elem = cssLayer
    this.renderer = new CSS3DRenderer({ element: this.elem })
  }

  start() {
    if (!this.elem) return
    this.world.graphics.on('resize', this.onResize)
    this.resize(this.world.graphics.width, this.world.graphics.height)
  }

  onResize = () => {
    this.resize(this.world.graphics.width, this.world.graphics.height)
  }

  resize(width, height) {
    if (!this.renderer) return
    this.renderer.setSize(width, height)
  }

  add(object3d) {
    this.scene.add(object3d)
  }

  remove(object3d) {
    this.scene.remove(object3d)
  }

  // Sync CSS objects to their target meshes after all transforms updated
  lateUpdate(delta) {
    if (!this.renderer) return
    for (const objectCSS of this.scene.children) {
      if (objectCSS.interacting) continue // interaction stabilization
      objectCSS.target.matrixWorld.decompose(
        objectCSS.position,
        objectCSS.quaternion,
        v1
      )
    }
  }

  // Render before WebGL (called from ClientGraphics.commit)
  render() {
    if (!this.renderer) return
    this.renderer.render(this.scene, this.world.camera)
  }

  destroy() {
    if (this.elem) {
      this.world.graphics.off('resize', this.onResize)
    }
  }
}
```

---

### 2. `src/core/nodes/WebView.js` (New File)

**Purpose:** WebView node implementation supporting both world and screen space rendering.

**Properties:**
- `space: 'world' | 'screen'` - Rendering mode (default: 'world')
- `src: string` - URL to load in iframe
- `html: string` - Raw HTML content for srcdoc
- `width: number` - Width (meters for world, pixels for screen)
- `height: number` - Height (meters for world, pixels for screen)
- `factor: number` - Resolution scaling for world space (default: 100)
- `doubleside: boolean` - Render on both sides (world space only, default: false)
- `onPointerDown: function` - Click handler (world space only)

**Key Features:**
- **World Space Mode:**
  - CSS3D rendering with black mesh masking (NoBlending)
  - Proper depth occlusion with 3D objects
  - Pointer unlock on click (except in build mode)
  - Desktop: pointer events on mouseenter, stabilization when interacting
  - Mobile: pointer events always enabled

- **Screen Space Mode:**
  - CSS absolute positioning with transform offset
  - Position uses percentages (0-1) as anchor points
  - Always interactive, no pointer unlock needed
  - Z-index controlled via position.z

**Full Implementation:** (432 lines - see file in repo)

Key methods:
- `build()` - Dispatches to buildWorld() or buildScreen()
- `buildWorld()` - Creates CSS3DObject + black mesh for 3D positioning
- `buildScreen()` - Creates DOM element with CSS positioning
- `unbuild()` - Cleanup for both modes

---

### 3. `docs/scripting/nodes/types/WebView.md` (New File)

**Purpose:** Complete documentation for the WebView node.

**Contents:**
- Property descriptions for all WebView properties
- Detailed explanation of world vs screen space modes
- Multiple usage examples:
  - Basic website embed
  - TradingView widget (using HTML)
  - High-resolution dashboard
  - Interactive portal wall
  - Double-sided display
  - Screen space HUD
  - Screen space fullscreen
  - Switching between space modes
- Important notes about behavior and performance

---

## Files Modified

### 1. `src/client/world-client.js`

**Changes:**
- Added `cssLayerRef` for CSS3D rendering layer
- Pass `cssLayer` to world.init()
- Added CSS layer styles with z-index stacking

**Diff:**
```diff
 export function Client({ wsUrl, onSetup }) {
   const viewportRef = useRef()
+  const cssLayerRef = useRef()
   const uiRef = useRef()

   useEffect(() => {
     const init = async () => {
       const viewport = viewportRef.current
+      const cssLayer = cssLayerRef.current
       const ui = uiRef.current
       // ...
-      const config = { viewport, ui, wsUrl, baseEnvironment }
+      const config = { viewport, cssLayer, ui, wsUrl, baseEnvironment }
       onSetup?.(world, config)
       world.init(config)
     }
   }, [])

   return (
     <div className='App'>
       <style>
         {`
           .App__viewport {
             position: absolute;
             inset: 0;
           }
+          .App__cssLayer {
+            position: absolute;
+            inset: 0;
+            z-index: 0;
+            pointer-events: none;
+          }
           .App__ui {
             position: absolute;
             inset: 0;
+            z-index: 2;
             pointer-events: none;
             user-select: none;
           }
         `}
       </style>
       <div className='App__viewport' ref={viewportRef}>
+        <div className='App__cssLayer' ref={cssLayerRef} />
         <div className='App__ui' ref={uiRef}>
           <CoreUI world={world} />
         </div>
       </div>
     </div>
   )
 }
```

**Z-Index Stacking:**
- CSS layer: `z-index: 0` (behind)
- WebGL canvas: `z-index: 1` (middle, set in ClientGraphics)
- UI layer: `z-index: 2` (front)

---

### 2. `src/core/createClientWorld.js`

**Changes:**
- Import ClientCSS system
- Register CSS system before graphics

**Diff:**
```diff
+ import { ClientCSS } from './systems/ClientCSS'
  import { ClientGraphics } from './systems/ClientGraphics'

  export function createClientWorld() {
    // ...
    world.register('controls', ClientControls)
    world.register('network', ClientNetwork)
    world.register('loader', ClientLoader)
+   world.register('css', ClientCSS)
    world.register('graphics', ClientGraphics)
    // ...
  }
```

---

### 3. `src/core/systems/ClientGraphics.js`

**Changes:**
- Enable alpha transparency in WebGLRenderer
- Set canvas z-index to 1
- Call CSS render before WebGL render

**Diff:**
```diff
  function getRenderer() {
    renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
+     alpha: true, // Required for CSS3D WebView occlusion
    })
  }

  start() {
    // ...
    this.viewport.appendChild(this.renderer.domElement)
+   // Ensure canvas is above CSS3D layer for WebView occlusion
+   this.renderer.domElement.style.position = 'relative'
+   this.renderer.domElement.style.zIndex = '1'
    this.resizer.observe(this.viewport)
  }

  render() {
+   // Render CSS3D layer first (behind WebGL)
+   this.world.css?.render()
+   // Then render WebGL
    if (this.renderer.xr.isPresenting || !this.usePostprocessing) {
      this.renderer.render(this.world.stage.scene, this.world.camera)
    } else {
      // postprocessing...
    }
  }
```

---

### 4. `src/core/nodes/index.js`

**Changes:**
- Export WebView node as 'webview'

**Diff:**
```diff
  export { Video as video } from './Video.js'
+ export { WebView as webview } from './WebView.js'
  export { Image as image } from './Image.js'
```

---

### 5. `src/core/entities/App.js`

**Changes:**
- Added null checks for `blueprint.model` to prevent crashes

**Diff:**
```diff
  // otherwise we can load the model and script
  else {
    try {
+     if (!blueprint.model) {
+       throw new Error('App blueprint missing model property')
+     }
      const type = blueprint.model.endsWith('vrm') ? 'avatar' : 'model'
      let glb = this.world.loader.get(type, blueprint.model)
      if (!glb) glb = await this.world.loader.load(type, blueprint.model)
      root = glb.toNodes()
    } catch (err) {
      console.error(err)
      crashed = true
      // no model, will use crash block below
    }

  getNodes() {
    // note: this is currently just used in the nodes tab in the app inspector
    // to get a clean hierarchy
    if (!this.blueprint) return
+   if (!this.blueprint.model) return
    const type = this.blueprint.model.endsWith('vrm') ? 'avatar' : 'model'
    let glb = this.world.loader.get(type, this.blueprint.model)
    if (!glb) return
    return glb.toNodes()
  }
```

---

## Technical Architecture

### CSS3D + Black Mesh Masking (World Space)

The world space WebView uses a clever technique for proper depth occlusion:

1. **CSS Layer** (z-index: 0): Contains CSS3DRenderer with iframes positioned behind WebGL
2. **WebGL Canvas** (z-index: 1): Rendered with `alpha: true` transparency
3. **Black Mesh**: PlaneGeometry with `THREE.NoBlending` creates a "cutout" in WebGL
4. **Result**: The black mesh "punches through" the WebGL canvas, revealing the CSS layer behind it. 3D objects render normally and occlude both the black mesh and the iframe.

### Screen Space Positioning

Screen space WebViews use CSS absolute positioning with transform offset:
- `left: x%` and `top: y%` position the element
- `transform: translate(-x%, -y%)` offsets it so position acts as anchor point
- Position `[0, 0]` = top-left, `[1, 1]` = bottom-right, `[0.5, 0.5]` = center

### Render Pipeline

```
Frame tick:
1. lateUpdate() - ClientCSS syncs CSS3DObject transforms to target meshes
2. render():
   a. world.css.render() - Renders CSS3D layer (behind)
   b. WebGL render - Renders 3D scene with black cutout meshes (front)
```

### Interaction Handling

**World Space (Desktop):**
- Pointer events disabled by default (fixes Chrome drag-and-drop bug)
- `mouseenter` → enable pointer events + set `interacting = true`
- `mouseleave` → disable pointer events + set `interacting = false`
- `interacting` flag stops CSS3D position updates (stabilizes clicks)
- Click unlocks pointer (except in build mode)

**World Space (Mobile):**
- Pointer events always enabled
- No mouseenter/mouseleave handling

**Screen Space:**
- Pointer events always enabled
- No pointer unlock needed
- Works like standard DOM element

---

## Usage Examples

### World Space - 3D Positioned

```javascript
const chart = app.create('webview', {
  space: 'world',
  html: `<!DOCTYPE html>...TradingView widget...`,
  width: 3.2,      // meters
  height: 1.8,     // meters
  position: [0, 1.5, 0],
  factor: 200,     // High resolution
  doubleside: false,
})
app.add(chart)
```

### Screen Space - HUD Overlay

```javascript
const hud = app.create('webview', {
  space: 'screen',
  src: 'https://example.com/stats',
  width: 400,      // pixels
  height: 300,     // pixels
  position: [0.98, 0.98, 100], // Bottom-right corner, z-index 100
})
app.add(hud)
```

### Switching Modes

```javascript
// Start in world space
const webview = app.create('webview', {
  space: 'world',
  src: 'https://example.com',
  width: 2,
  height: 1.5,
  position: [0, 1.5, 0],
})

// Later, switch to screen space
webview.space = 'screen'
webview.width = 800
webview.height = 600
webview.position.set(0.5, 0.5, 10) // Center screen, z-index 10
```

---

## Compliance with v1 Requirements

The implementation addresses the v1 migration critique requirements:

✅ **Use a `webview` node** (not `uiiframe`)
✅ **Independent of UI node paradigm**
✅ **Use CSS3DRenderer** for positioning iframe behind WebGL canvas
✅ **Use mask/punch-out area** (black mesh with NoBlending)
✅ **Properties to flip between world and screen space** (`space` property)

---

## Performance Considerations

- Avoid creating too many WebViews (>10) in a single scene
- Screen space WebViews are more performant than world space (no CSS3D sync)
- Content with heavy JavaScript/rendering may impact performance
- World space WebViews use more GPU memory due to higher resolution factors

---

## Browser Compatibility

- Requires WebGL support with alpha transparency
- CSS3DRenderer requires CSS 3D transforms
- iframe sandboxing follows standard browser security policies
- Some websites block iframe embedding via `X-Frame-Options` (use `html` property instead)

---

## Summary Statistics

**Files Added:** 3
- `src/core/systems/ClientCSS.js` (77 lines)
- `src/core/nodes/WebView.js` (432 lines)
- `docs/scripting/nodes/types/WebView.md` (265 lines)

**Files Modified:** 5
- `src/client/world-client.js` (+9 lines)
- `src/core/createClientWorld.js` (+2 lines)
- `src/core/systems/ClientGraphics.js` (+6 lines)
- `src/core/nodes/index.js` (+1 line)
- `src/core/entities/App.js` (+4 lines)

**Total Lines Added:** ~800 lines
