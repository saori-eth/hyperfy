import * as THREE from '../extras/three'
import { isNumber } from 'lodash-es'

import { System } from './System'
import { LooseOctree } from '../extras/LooseOctree'

const vec2 = new THREE.Vector2()

/**
 * Stage System
 *
 * - Runs on both the server and client.
 * - Allows inserting meshes etc into the world, and providing a handle back.
 * - Automatically handles instancing/batching.
 * - This is a logical scene graph, no rendering etc is handled here.
 *
 */
export class Stage extends System {
  constructor(world) {
    super(world)
    this.scene = new THREE.Scene()
    this.models = new Map() // id -> Model
    this.octree = new LooseOctree({
      scene: this.scene,
      center: new THREE.Vector3(0, 0, 0),
      size: 10,
    })
    this.defaultMaterial = null
    this.raycaster = new THREE.Raycaster()
    this.raycaster.firstHitOnly = true
    this.raycastHits = []
    this.maskNone = new THREE.Layers()
    this.maskNone.enableAll()
    this.dirtyNodes = new Set()
  }

  init({ viewport }) {
    this.viewport = viewport
    this.scene.add(this.world.rig)
  }

  update(delta) {
    this.models.forEach(model => model.clean())
  }

  postUpdate() {
    this.clean() // after update all matrices should be up to date for next step
  }

  postLateUpdate() {
    this.clean() // after lateUpdate all matrices should be up to date for next step
  }

  getDefaultMaterial() {
    if (!this.defaultMaterial) {
      this.defaultMaterial = this.createMaterial()
    }
    return this.defaultMaterial
  }

  clean() {
    for (const node of this.dirtyNodes) {
      node.clean()
    }
    this.dirtyNodes.clear()
  }

  insert(options) {
    if (options.linked) {
      return this.insertLinked(options)
    } else {
      return this.insertSingle(options)
    }
  }

  insertLinked({ geometry, material, castShadow, receiveShadow, node, matrix }) {
    const id = `${geometry.uuid}/${material.uuid}/${castShadow}/${receiveShadow}`
    if (!this.models.has(id)) {
      const model = new Model(this, geometry, material, castShadow, receiveShadow)
      this.models.set(id, model)
    }
    return this.models.get(id).create(node, matrix)
  }
  
  insertPrimitive({ geometry, material, castShadow, receiveShadow, node, matrix, color, emissive }) {
    const id = `${geometry.uuid}/${material ? material.uuid : 'default'}/${castShadow}/${receiveShadow}/primitive`
    if (!this.models.has(id)) {
      const primitive = new Primitive(this, geometry, material, castShadow, receiveShadow)
      this.models.set(id, primitive)
    }
    const colorObj = color ? new THREE.Color(color) : null
    let emissiveObj = null
    let emissiveIntensity = 1.0
    if (emissive) {
      if (typeof emissive === 'string') {
        emissiveObj = new THREE.Color(emissive)
      } else if (typeof emissive === 'object') {
        emissiveObj = new THREE.Color(emissive.color || '#ffffff')
        emissiveIntensity = emissive.intensity !== undefined ? emissive.intensity : 1.0
      }
    }
    return this.models.get(id).create(node, matrix, colorObj, emissiveObj, emissiveIntensity)
  }

  insertSingle({ geometry, material, castShadow, receiveShadow, node, matrix }) {
    material = this.createMaterial({ raw: material })
    const mesh = new THREE.Mesh(geometry, material.raw)
    mesh.castShadow = castShadow
    mesh.receiveShadow = receiveShadow
    mesh.matrixWorld.copy(matrix)
    mesh.matrixAutoUpdate = false
    mesh.matrixWorldAutoUpdate = false
    const sItem = {
      matrix,
      geometry,
      material: material.raw,
      getEntity: () => node.ctx.entity,
      node,
    }
    this.scene.add(mesh)
    this.octree.insert(sItem)
    return {
      material: material.proxy,
      move: matrix => {
        mesh.matrixWorld.copy(matrix)
        this.octree.move(sItem)
      },
      destroy: () => {
        this.scene.remove(mesh)
        this.octree.remove(sItem)
      },
    }
  }

  createMaterial(options = {}) {
    const self = this
    const material = {}
    let raw
    if (options.raw) {
      raw = options.raw.clone()
      raw.onBeforeCompile = options.raw.onBeforeCompile
    } else if (options.unlit) {
      raw = new THREE.MeshBasicMaterial({
        color: options.color || 'white',
      })
    } else {
      raw = new THREE.MeshStandardMaterial({
        color: options.color || 'white',
        metalness: isNumber(options.metalness) ? options.metalness : 0,
        roughness: isNumber(options.roughness) ? options.roughness : 1,
      })
    }
    raw.shadowSide = THREE.BackSide // fix csm shadow banding
    const textures = []
    if (raw.map) {
      raw.map = raw.map.clone()
      textures.push(raw.map)
    }
    if (raw.emissiveMap) {
      raw.emissiveMap = raw.emissiveMap.clone()
      textures.push(raw.emissiveMap)
    }
    if (raw.normalMap) {
      raw.normalMap = raw.normalMap.clone()
      textures.push(raw.normalMap)
    }
    if (raw.bumpMap) {
      raw.bumpMap = raw.bumpMap.clone()
      textures.push(raw.bumpMap)
    }
    if (raw.roughnessMap) {
      raw.roughnessMap = raw.roughnessMap.clone()
      textures.push(raw.roughnessMap)
    }
    if (raw.metalnessMap) {
      raw.metalnessMap = raw.metalnessMap.clone()
      textures.push(raw.metalnessMap)
    }
    this.world.setupMaterial(raw)
    const proxy = {
      get id() {
        return raw.uuid
      },
      get textureX() {
        return textures[0]?.offset.x
      },
      set textureX(val) {
        for (const tex of textures) {
          tex.offset.x = val
        }
        raw.needsUpdate = true
      },
      get textureY() {
        return textures[0]?.offset.y
      },
      set textureY(val) {
        for (const tex of textures) {
          tex.offset.y = val
        }
        raw.needsUpdate = true
      },
      get color() {
        return raw.color
      },
      set color(val) {
        if (typeof val !== 'string') {
          throw new Error('[material] color must be a string (e.g. "red", "#ff0000", "rgb(255,0,0)")')
        }
        raw.color.set(val)
        raw.needsUpdate = true
      },
      get emissiveIntensity() {
        return raw.emissiveIntensity
      },
      set emissiveIntensity(value) {
        if (!isNumber(value)) {
          throw new Error('[material] emissiveIntensity not a number')
        }
        raw.emissiveIntensity = value
        raw.needsUpdate = true
      },
      get fog() {
        return raw.fog
      },
      set fog(value) {
        raw.fog = value
        raw.needsUpdate = true
      },
      // TODO: not yet
      // clone() {
      //   return self.createMaterial(options).proxy
      // },
      get _ref() {
        if (world._allowMaterial) return material
      },
    }
    material.raw = raw
    material.proxy = proxy
    return material
  }

  raycastPointer(position, layers = this.maskNone, min = 0, max = Infinity) {
    if (!this.viewport) throw new Error('no viewport')
    const rect = this.viewport.getBoundingClientRect()
    vec2.x = ((position.x - rect.left) / rect.width) * 2 - 1
    vec2.y = -((position.y - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(vec2, this.world.camera)
    this.raycaster.layers = layers
    this.raycaster.near = min
    this.raycaster.far = max
    this.raycastHits.length = 0
    this.octree.raycast(this.raycaster, this.raycastHits)
    return this.raycastHits
  }

  raycastReticle(layers = this.maskNone, min = 0, max = Infinity) {
    if (!this.viewport) throw new Error('no viewport')
    vec2.x = 0
    vec2.y = 0
    this.raycaster.setFromCamera(vec2, this.world.camera)
    this.raycaster.layers = layers
    this.raycaster.near = min
    this.raycaster.far = max
    this.raycastHits.length = 0
    this.octree.raycast(this.raycaster, this.raycastHits)
    return this.raycastHits
  }

  destroy() {
    this.models.clear()
  }
}

class Model {
  constructor(stage, geometry, material, castShadow, receiveShadow) {
    material = stage.createMaterial({ raw: material })

    this.stage = stage
    this.geometry = geometry
    this.material = material
    this.castShadow = castShadow
    this.receiveShadow = receiveShadow

    if (!this.geometry.boundsTree) this.geometry.computeBoundsTree()
      
    // this.mesh = mesh.clone()
    // this.mesh.geometry.computeBoundsTree() // three-mesh-bvh
    // // this.mesh.geometry.computeBoundingBox() // spatial octree
    // // this.mesh.geometry.computeBoundingSphere() // spatial octree
    // this.mesh.material.shadowSide = THREE.BackSide // fix csm shadow banding
    // this.mesh.castShadow = true
    // this.mesh.receiveShadow = true
    // this.mesh.matrixAutoUpdate = false
    // this.mesh.matrixWorldAutoUpdate = false

    this.iMesh = new THREE.InstancedMesh(this.geometry, this.material.raw, 10)
    // this.iMesh.name = this.mesh.name
    this.iMesh.castShadow = this.castShadow
    this.iMesh.receiveShadow = this.receiveShadow
    this.iMesh.matrixAutoUpdate = false
    this.iMesh.matrixWorldAutoUpdate = false
    this.iMesh.frustumCulled = false
    this.iMesh.getEntity = this.getEntity.bind(this)
    this.items = [] // { matrix, node }
    this.dirty = true
  }

  create(node, matrix) {
    const item = {
      idx: this.items.length,
      node,
      matrix,
      // octree
    }
    this.items.push(item)
    this.iMesh.setMatrixAt(item.idx, item.matrix) // silently fails if too small, gets increased in clean()
    this.dirty = true
    const sItem = {
      matrix,
      geometry: this.geometry,
      material: this.material.raw,
      getEntity: () => this.items[item.idx]?.node.ctx.entity,
      node,
    }
    this.stage.octree.insert(sItem)
    return {
      material: this.material.proxy,
      move: matrix => {
        this.move(item, matrix)
        this.stage.octree.move(sItem)
      },
      destroy: () => {
        this.destroy(item)
        this.stage.octree.remove(sItem)
      },
    }
  }

  move(item, matrix) {
    item.matrix.copy(matrix)
    this.iMesh.setMatrixAt(item.idx, matrix)
    this.dirty = true
  }

  destroy(item) {
    const last = this.items[this.items.length - 1]
    const isOnly = this.items.length === 1
    const isLast = item === last
    if (isOnly) {
      this.items = []
      this.dirty = true
    } else if (isLast) {
      // this is the last instance in the buffer, pop it off the end
      this.items.pop()
      this.dirty = true
    } else {
      // there are other instances after this one in the buffer, swap it with the last one and pop it off the end
      this.iMesh.setMatrixAt(item.idx, last.matrix)
      last.idx = item.idx
      this.items[item.idx] = last
      this.items.pop()
      this.dirty = true
    }
  }

  clean() {
    if (!this.dirty) return
    const size = this.iMesh.instanceMatrix.array.length / 16
    const count = this.items.length
    if (size < this.items.length) {
      const newSize = count + 100
      // console.log('increase', this.mesh.name, 'from', size, 'to', newSize)
      this.iMesh.resize(newSize)
      for (let i = size; i < count; i++) {
        this.iMesh.setMatrixAt(i, this.items[i].matrix)
      }
    }
    this.iMesh.count = count
    if (this.iMesh.parent && !count) {
      this.stage.scene.remove(this.iMesh)
      this.dirty = false
      return
    }
    if (!this.iMesh.parent && count) {
      this.stage.scene.add(this.iMesh)
    }
    this.iMesh.instanceMatrix.needsUpdate = true
    // this.iMesh.computeBoundingSphere()
    this.dirty = false
  }

  getEntity(instanceId) {
    console.warn('TODO: remove if you dont ever see this')
    return this.items[instanceId]?.node.ctx.entity
  }

  getTriangles() {
    const geometry = this.geometry
    if (geometry.index !== null) {
      return geometry.index.count / 3
    } else {
      return geometry.attributes.position.count / 3
    }
  }
}

class Primitive extends Model {
  constructor(stage, geometry, material, castShadow, receiveShadow) {
    super(stage, geometry, material, castShadow, receiveShadow)
    
    // Initialize instance color attributes
    const colors = new Float32Array(10 * 3) // RGB for each instance
    colors.fill(1) // Default to white
    this.instanceColors = colors
    const instanceColorAttribute = new THREE.InstancedBufferAttribute(colors, 3)
    this.iMesh.geometry.setAttribute('instanceColor', instanceColorAttribute)
    
    // Initialize instance emissive attributes
    const emissives = new Float32Array(10 * 4) // RGBA for each instance emissive (RGB + intensity)
    emissives.fill(0) // Default to no emission
    this.instanceEmissives = emissives
    const instanceEmissiveAttribute = new THREE.InstancedBufferAttribute(emissives, 4)
    this.iMesh.geometry.setAttribute('instanceEmissive', instanceEmissiveAttribute)
    
    // Modify material to support instance colors
    this.setupInstanceColorShader()
    
    // Mark material as needing update
    this.material.raw.needsUpdate = true
  }
  
  setInstanceColor(index, color) {
    if (!color) return
    
    const idx3 = index * 3
    this.instanceColors[idx3] = color.r
    this.instanceColors[idx3 + 1] = color.g
    this.instanceColors[idx3 + 2] = color.b
    this.iMesh.geometry.attributes.instanceColor.needsUpdate = true
  }
  
  setInstanceEmissive(index, emissive, intensity = 1.0) {
    if (!emissive) return
    
    const idx4 = index * 4
    this.instanceEmissives[idx4] = emissive.r
    this.instanceEmissives[idx4 + 1] = emissive.g
    this.instanceEmissives[idx4 + 2] = emissive.b
    this.instanceEmissives[idx4 + 3] = intensity
    this.iMesh.geometry.attributes.instanceEmissive.needsUpdate = true
  }
  
  setupInstanceColorShader() {
    const material = this.material.raw
    const originalOnBeforeCompile = material.onBeforeCompile
    
    material.onBeforeCompile = (shader) => {
      // Call original onBeforeCompile if it exists
      if (originalOnBeforeCompile) {
        originalOnBeforeCompile(shader)
      }
      
      // Store shader for debugging
      material.userData.shader = shader
      
      // Inject instance color and emissive attributes
      shader.vertexShader = `
        attribute vec3 instanceColor;
        attribute vec4 instanceEmissive;
        varying vec3 vInstanceColor;
        varying vec4 vInstanceEmissive;
      ` + shader.vertexShader
      
      // Pass instance color and emissive to fragment shader
      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
        vInstanceColor = instanceColor;
        vInstanceEmissive = instanceEmissive;`
      )
      
      // Apply instance color and emissive in fragment shader
      shader.fragmentShader = `
        varying vec3 vInstanceColor;
        varying vec4 vInstanceEmissive;
      ` + shader.fragmentShader
      
      // Apply color after the base color is set
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        diffuseColor.rgb *= vInstanceColor;`
      )
      
      // Add emissive - find where emissive is accumulated in the standard material
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += vInstanceEmissive.rgb * vInstanceEmissive.a;`
      )
    }
  }
  
  create(node, matrix, color = null, emissive = null, emissiveIntensity = 1.0) {
    const item = {
      idx: this.items.length,
      node,
      matrix,
      color,
      emissive,
      emissiveIntensity,
    }
    this.items.push(item)
    this.iMesh.setMatrixAt(item.idx, item.matrix)
    
    // Set instance color
    this.setInstanceColor(item.idx, color)
    
    // Set instance emissive
    this.setInstanceEmissive(item.idx, emissive, emissiveIntensity)
    
    this.dirty = true
    const sItem = {
      matrix,
      geometry: this.geometry,
      material: this.material.raw,
      getEntity: () => this.items[item.idx]?.node.ctx.entity,
      node,
    }
    this.stage.octree.insert(sItem)
    return {
      material: this.material.proxy,
      move: matrix => {
        this.move(item, matrix)
        this.stage.octree.move(sItem)
      },
      setColor: color => {
        if (color) {
          item.color = color
          this.setInstanceColor(item.idx, color)
        }
      },
      setEmissive: (emissive, intensity = 1.0) => {
        if (emissive) {
          item.emissive = emissive
          item.emissiveIntensity = intensity
          this.setInstanceEmissive(item.idx, emissive, intensity)
        }
      },
      destroy: () => {
        this.destroy(item)
        this.stage.octree.remove(sItem)
      },
    }
  }
  
  destroy(item) {
    const last = this.items[this.items.length - 1]
    const isOnly = this.items.length === 1
    const isLast = item === last
    if (isOnly) {
      this.items = []
      this.dirty = true
    } else if (isLast) {
      // this is the last instance in the buffer, pop it off the end
      this.items.pop()
      this.dirty = true
    } else {
      // there are other instances after this one in the buffer, swap it with the last one and pop it off the end
      this.iMesh.setMatrixAt(item.idx, last.matrix)
      
      // Swap colors
      if (last.color) {
        this.setInstanceColor(item.idx, last.color)
      }
      
      // Swap emissive
      if (last.emissive) {
        this.setInstanceEmissive(item.idx, last.emissive, last.emissiveIntensity || 1.0)
      }
      
      last.idx = item.idx
      this.items[item.idx] = last
      this.items.pop()
      this.dirty = true
    }
  }
  
  clean() {
    if (!this.dirty) return
    const size = this.iMesh.instanceMatrix.array.length / 16
    const count = this.items.length
    if (size < this.items.length) {
      const newSize = count + 100
      this.iMesh.resize(newSize)
      // Resize instance color buffer
      const newColors = new Float32Array(newSize * 3)
      newColors.set(this.instanceColors)
      newColors.fill(1, this.instanceColors.length) // Fill new slots with white
      this.instanceColors = newColors
      const instanceColorAttribute = new THREE.InstancedBufferAttribute(newColors, 3)
      this.iMesh.geometry.setAttribute('instanceColor', instanceColorAttribute)
      
      // Resize instance emissive buffer
      const newEmissives = new Float32Array(newSize * 4)
      newEmissives.set(this.instanceEmissives)
      newEmissives.fill(0, this.instanceEmissives.length) // Fill new slots with no emission
      this.instanceEmissives = newEmissives
      const instanceEmissiveAttribute = new THREE.InstancedBufferAttribute(newEmissives, 4)
      this.iMesh.geometry.setAttribute('instanceEmissive', instanceEmissiveAttribute)
      
      for (let i = size; i < count; i++) {
        this.iMesh.setMatrixAt(i, this.items[i].matrix)
        
        // Set color for new instances
        if (this.items[i].color) {
          this.setInstanceColor(i, this.items[i].color)
        }
        
        // Set emissive for new instances
        if (this.items[i].emissive) {
          this.setInstanceEmissive(i, this.items[i].emissive, this.items[i].emissiveIntensity || 1.0)
        }
      }
      
      this.iMesh.geometry.attributes.instanceColor.needsUpdate = true
      this.iMesh.geometry.attributes.instanceEmissive.needsUpdate = true
    }
    this.iMesh.count = count
    if (this.iMesh.parent && !count) {
      this.stage.scene.remove(this.iMesh)
      this.dirty = false
      return
    }
    if (!this.iMesh.parent && count) {
      this.stage.scene.add(this.iMesh)
    }
    this.iMesh.instanceMatrix.needsUpdate = true
    this.dirty = false
  }
}
