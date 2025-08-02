import * as THREE from '../extras/three'
import { isBoolean, isNumber, isString, isArray, isObject } from 'lodash-es'

import { Node, secureRef } from './Node'
import { getTrianglesFromGeometry } from '../extras/getTrianglesFromGeometry'
import { getTextureBytesFromMaterial } from '../extras/getTextureBytesFromMaterial'
import { Layers } from '../extras/Layers'

const defaults = {
  kind: 'box',
  size: [1, 1, 1],
  color: '#ffffff',
  emissive: null,
  castShadow: true,
  receiveShadow: true,
  physics: null,
}

const physicsDefaults = {
  type: 'static',
  mass: 1,
  linearDamping: 0,
  angularDamping: 0.05,
  staticFriction: 0.6,
  dynamicFriction: 0.6,
  restitution: 0,
  layer: 'environment',
  trigger: false,
}

const _v1 = new THREE.Vector3()
const _v2 = new THREE.Vector3()
const _q1 = new THREE.Quaternion()
const _m1 = new THREE.Matrix4()
const _m2 = new THREE.Matrix4()
const _m3 = new THREE.Matrix4()
const _defaultScale = new THREE.Vector3(1, 1, 1)

const kinds = ['box', 'sphere', 'cylinder', 'cone', 'torus', 'plane']

// Geometry cache
let geometryCache = new Map()

const getGeometry = (kind) => {
  // All primitives of the same kind share one unit-sized geometry
  if (!geometryCache.has(kind)) {
    let geometry
    
    switch (kind) {
      case 'box':
        geometry = new THREE.BoxGeometry(1, 1, 1)
        // Translate geometry so bottom is at y=0
        geometry.translate(0, 0.5, 0)
        break
      case 'sphere':
        geometry = new THREE.SphereGeometry(1, 16, 12)
        // Translate geometry so bottom is at y=0
        geometry.translate(0, 1, 0)
        break
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(1, 1, 1, 16)
        // Translate geometry so bottom is at y=0
        geometry.translate(0, 0.5, 0)
        break
      case 'cone':
        geometry = new THREE.ConeGeometry(1, 1, 16)
        // Translate geometry so bottom is at y=0
        geometry.translate(0, 0.5, 0)
        break
      case 'torus':
        geometry = new THREE.TorusGeometry(1, 0.3, 12, 16) // Default tube ratio
        // Translate geometry so bottom is at y=0
        // Bottom of torus is at -(majorRadius + tubeRadius) = -(1 + 0.3) = -1.3
        geometry.translate(0, 1.3, 0)
        break
      case 'plane':
        geometry = new THREE.PlaneGeometry(1, 1)
        // Keep plane centered
        break
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1)
        geometry.translate(0, 0.5, 0)
    }
    
    geometryCache.set(kind, geometry)
  }
  
  return geometryCache.get(kind)
}

// Material cache - always returns white material for instancing
let defaultMaterial = null

const getMaterial = () => {
  if (!defaultMaterial) {
    defaultMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'),
      roughness: 0.8,
      metalness: 0.2,
    })
  }
  return defaultMaterial
}

export class Prim extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'prim'
    
    this.kind = data.kind
    this.size = data.size
    this.color = data.color !== undefined ? data.color : defaults.color
    this.emissive = data.emissive !== undefined ? data.emissive : defaults.emissive
    this.castShadow = data.castShadow
    this.receiveShadow = data.receiveShadow
    this.physics = data.physics
    
    // Physics state
    this.shapes = new Set()
    this._tm = null
    this.tempVec3 = new THREE.Vector3()
    this.tempQuat = new THREE.Quaternion()
  }
  
  mount() {
    this.needsRebuild = false
    
    // Get unit-sized geometry for this kind
    const geometry = getGeometry(this._kind)
    
    // Apply size via scale
    this.updateScaleFromSize()
    
    // Always use instance colors
    const material = getMaterial()
    
    // Create mesh
    this.handle = this.ctx.world.stage.insertPrimitive({
      geometry,
      material,
      castShadow: this._castShadow,
      receiveShadow: this._receiveShadow,
      matrix: this.matrixWorld,
      node: this,
      color: this._color,
      emissive: this._emissive,
    })
    
    // Create physics if enabled
    if (this._physics && !this.ctx.moving) {
      this.mountPhysics()
    }
  }
  
  updateScaleFromSize() {
    // Apply size as scale transformation
    if (this._kind === 'sphere') {
      // Sphere uses uniform scale
      const radius = this._size[0]
      this.scale.set(radius, radius, radius)
    } else if (this._kind === 'torus') {
      // Torus: major radius as uniform scale, tube ratio handled in geometry
      const radius = this._size[0]
      this.scale.set(radius, radius, radius)
    } else if (this._kind === 'cylinder' || this._kind === 'cone') {
      // Cylinder/cone: radius for X/Z, height for Y
      const radius = this._size[0]
      const height = this._size[1]
      this.scale.set(radius, height, radius)
    } else {
      // Box/plane: direct mapping
      this.scale.set(this._size[0], this._size[1], this._size[2])
    }
  }
  
  mountPhysics() {
    if (!PHYSX) return
    
    const config = this._physics === true ? {} : this._physics
    const type = config.type || physicsDefaults.type
    const mass = config.mass !== undefined ? config.mass : physicsDefaults.mass
    const linearDamping = config.linearDamping !== undefined ? config.linearDamping : physicsDefaults.linearDamping
    const angularDamping = config.angularDamping !== undefined ? config.angularDamping : physicsDefaults.angularDamping
    const trigger = config.trigger !== undefined ? config.trigger : physicsDefaults.trigger
    
    // Create transform
    this.matrixWorld.decompose(_v1, _q1, _v2)
    if (!this._tm) this._tm = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    _v1.toPxTransform(this._tm)
    _q1.toPxTransform(this._tm)
    
    // Create actor
    if (type === 'static') {
      this.actor = this.ctx.world.physics.physics.createRigidStatic(this._tm)
    } else if (type === 'kinematic') {
      this.actor = this.ctx.world.physics.physics.createRigidDynamic(this._tm)
      this.actor.setRigidBodyFlag(PHYSX.PxRigidBodyFlagEnum.eKINEMATIC, true)
      PHYSX.PxRigidBodyExt.prototype.setMassAndUpdateInertia(this.actor, mass)
    } else if (type === 'dynamic') {
      this.actor = this.ctx.world.physics.physics.createRigidDynamic(this._tm)
      PHYSX.PxRigidBodyExt.prototype.setMassAndUpdateInertia(this.actor, mass)
      this.actor.setLinearDamping(linearDamping)
      this.actor.setAngularDamping(angularDamping)
    }
    
    // Create collider shape
    const offset = this.getColliderOffset()
    let geometry
    
    if (this._kind === 'sphere') {
      geometry = new PHYSX.PxSphereGeometry(this._size[0])
    } else if (this._kind === 'plane') {
      // Plane uses thin box
      geometry = new PHYSX.PxBoxGeometry(this._size[0] / 2, this._size[1] / 2, 0.05)
    } else {
      // Box approximation for other shapes
      const boxSize = this.getColliderSize()
      geometry = new PHYSX.PxBoxGeometry(boxSize[0] / 2, boxSize[1] / 2, boxSize[2] / 2)
    }
    
    // Get material
    const staticFriction = config.staticFriction !== undefined ? config.staticFriction : physicsDefaults.staticFriction
    const dynamicFriction = config.dynamicFriction !== undefined ? config.dynamicFriction : physicsDefaults.dynamicFriction
    const restitution = config.restitution !== undefined ? config.restitution : physicsDefaults.restitution
    const material = this.ctx.world.physics.getMaterial(staticFriction, dynamicFriction, restitution)
    
    // Create shape flags
    const flags = new PHYSX.PxShapeFlags()
    if (trigger) {
      flags.raise(PHYSX.PxShapeFlagEnum.eTRIGGER_SHAPE)
    } else {
      flags.raise(PHYSX.PxShapeFlagEnum.eSCENE_QUERY_SHAPE | PHYSX.PxShapeFlagEnum.eSIMULATION_SHAPE)
    }
    
    // Create shape
    this.shape = this.ctx.world.physics.physics.createShape(geometry, material, true, flags)
    
    // Set filter data
    const layerName = config.layer || physicsDefaults.layer
    const layer = Layers[layerName]
    let pairFlags = PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_FOUND | PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_LOST
    if (!trigger) {
      pairFlags |= PHYSX.PxPairFlagEnum.eNOTIFY_CONTACT_POINTS
    }
    const filterData = new PHYSX.PxFilterData(layer.group, layer.mask, pairFlags, 0)
    this.shape.setQueryFilterData(filterData)
    this.shape.setSimulationFilterData(filterData)
    
    // Set local pose with offset
    const pose = new PHYSX.PxTransform()
    _v1.set(offset[0], offset[1], offset[2])
    _v1.toPxTransform(pose)
    _q1.set(0, 0, 0, 1).toPxTransform(pose)
    this.shape.setLocalPose(pose)
    
    // Attach shape to actor
    this.actor.attachShape(this.shape)
    this.shapes.add(this.shape)
    
    // Add to physics world
    const self = this
    const playerId = this.ctx.entity?.isPlayer ? this.ctx.entity.data.id : null
    this.actorHandle = this.ctx.world.physics.addActor(this.actor, {
      onInterpolate: type === 'kinematic' || type === 'dynamic' ? this.onInterpolate : null,
      node: this,
      get tag() {
        return config.tag || null
      },
      get playerId() {
        return playerId
      },
      get onContactStart() {
        return config.onContactStart || null
      },
      get onContactEnd() {
        return config.onContactEnd || null
      },
      get onTriggerEnter() {
        return config.onTriggerEnter || null
      },
      get onTriggerLeave() {
        return config.onTriggerLeave || null
      },
    })
    
    // Clean up
    PHYSX.destroy(geometry)
  }
  
  unmountPhysics() {
    if (this.actor) {
      this.actorHandle?.destroy()
      this.actorHandle = null
      this.shapes.clear()
      this.shape?.release()
      this.shape = null
      this.actor.release()
      this.actor = null
    }
  }
  
  onInterpolate = (position, quaternion) => {
    if (this.parent) {
      _m1.compose(position, quaternion, _defaultScale)
      _m2.copy(this.parent.matrixWorld).invert()
      _m3.multiplyMatrices(_m2, _m1)
      _m3.decompose(this.position, this.quaternion, _v1)
    } else {
      this.position.copy(position)
      this.quaternion.copy(quaternion)
    }
  }
  
  getColliderOffset() {
    // Returns the offset needed for colliders to match the visual geometry
    switch (this._kind) {
      case 'box':
        return [0, this._size[1] * 0.5, 0]
      case 'sphere':
        return [0, this._size[0], 0]
      case 'cylinder':
        return [0, this._size[1] * 0.5, 0]
      case 'cone':
        return [0, this._size[1] * 0.5, 0]
      case 'torus':
        const majorRadius = this._size[0]
        const tubeRadius = this._size[1] || this._size[0] * 0.3
        return [0, majorRadius + tubeRadius, 0]
      case 'plane':
        return [0, 0, 0]
      default:
        return [0, 0, 0]
    }
  }
  
  getColliderSize() {
    // Returns appropriate collider dimensions
    switch (this._kind) {
      case 'cylinder':
        return [this._size[0] * 2, this._size[1], this._size[0] * 2]
      case 'cone':
        return [this._size[0] * 2, this._size[1], this._size[0] * 2]
      case 'torus':
        const diameter = (this._size[0] + (this._size[1] || this._size[0] * 0.3)) * 2
        return [diameter, (this._size[1] || this._size[0] * 0.3) * 2, diameter]
      default:
        return [...this._size]
    }
  }
  
  commit(didMove) {
    if (this.needsRebuild) {
      this.unmount()
      this.mount()
      return
    }
    if (didMove) {
      if (this.handle) {
        this.handle.move(this.matrixWorld)
      }
      if (this.actorHandle) {
        this.actorHandle.move(this.matrixWorld)
      }
    }
  }
  
  unmount() {
    this.handle?.destroy()
    this.handle = null
    this.unmountPhysics()
  }
  
  copy(source, recursive) {
    super.copy(source, recursive)
    this._kind = source._kind
    this._size = [...source._size]
    this._color = source._color
    this._emissive = source._emissive
    this._castShadow = source._castShadow
    this._receiveShadow = source._receiveShadow
    this._physics = source._physics ? { ...source._physics } : null
    return this
  }
  
  applyStats(stats) {
    const geometry = getGeometry(this._kind)
    if (geometry && !stats.geometries.has(geometry.uuid)) {
      stats.geometries.add(geometry.uuid)
      stats.triangles += getTrianglesFromGeometry(geometry)
    }
    const material = getMaterial()
    if (material && !stats.materials.has(material.uuid)) {
      stats.materials.add(material.uuid)
      stats.textureBytes += getTextureBytesFromMaterial(material)
    }
  }
  
  get kind() {
    return this._kind
  }
  
  set kind(value = defaults.kind) {
    if (!isString(value) || !kinds.includes(value)) {
      throw new Error('[prim] kind invalid')
    }
    if (this._kind === value) return
    this._kind = value
    if (this.handle) {
      this.needsRebuild = true
      this.setDirty()
    }
  }
  
  get size() {
    return this._size
  }
  
  set size(value = defaults.size) {
    if (!isArray(value) || value.length < 1 || value.length > 3) {
      throw new Error('[prim] size must be array of 1-3 numbers')
    }
    // Normalize size array
    const normalized = [
      value[0] || 1,
      value[1] || value[0] || 1,
      value[2] || value[0] || 1
    ]
    if (this._size && this._size[0] === normalized[0] && this._size[1] === normalized[1] && this._size[2] === normalized[2]) return
    this._size = normalized
    
    // Update scale instead of rebuilding
    if (this.handle) {
      this.updateScaleFromSize()
      this.setDirty()
    }
  }
  
  get color() {
    return this._color
  }
  
  set color(value = defaults.color) {
    if (!isString(value)) {
      throw new Error('[prim] color must be string')
    }
    if (this._color === value) return
    this._color = value
    if (this.handle) {
      // Update color directly via instance attributes
      if (this.handle.setColor) {
        this.handle.setColor(new THREE.Color(value))
      }
    }
  }
  
  get emissive() {
    return this._emissive
  }
  
  set emissive(value = defaults.emissive) {
    if (value !== null && !isString(value) && (!value || typeof value !== 'object')) {
      throw new Error('[prim] emissive must be string, object with {color, intensity}, or null')
    }
    if (this._emissive === value) return
    this._emissive = value
    if (this.handle) {
      // Update emissive directly via instance attributes
      if (this.handle.setEmissive && value) {
        if (isString(value)) {
          this.handle.setEmissive(new THREE.Color(value), 1.0)
        } else if (value && typeof value === 'object') {
          const color = new THREE.Color(value.color || '#ffffff')
          const intensity = value.intensity !== undefined ? value.intensity : 1.0
          this.handle.setEmissive(color, intensity)
        }
      }
    }
  }
  
  get castShadow() {
    return this._castShadow
  }
  
  set castShadow(value = defaults.castShadow) {
    if (!isBoolean(value)) {
      throw new Error('[prim] castShadow not a boolean')
    }
    if (this._castShadow === value) return
    this._castShadow = value
    if (this.handle) {
      this.needsRebuild = true
      this.setDirty()
    }
  }
  
  get receiveShadow() {
    return this._receiveShadow
  }
  
  set receiveShadow(value = defaults.receiveShadow) {
    if (!isBoolean(value)) {
      throw new Error('[prim] receiveShadow not a boolean')
    }
    if (this._receiveShadow === value) return
    this._receiveShadow = value
    if (this.handle) {
      this.needsRebuild = true
      this.setDirty()
    }
  }
  
  get physics() {
    return this._physics
  }
  
  set physics(value = defaults.physics) {
    if (value !== null && value !== true && !isObject(value)) {
      throw new Error('[prim] physics must be true, object, or null')
    }
    if (this._physics === value) return
    this._physics = value
    if (this.handle) {
      this.needsRebuild = true
      this.setDirty()
    }
  }
  
  getProxy() {
    if (!this.proxy) {
      const self = this
      let proxy = {
        get kind() {
          return self.kind
        },
        set kind(value) {
          self.kind = value
        },
        get size() {
          return [...self.size]
        },
        set size(value) {
          self.size = value
        },
        get color() {
          return self.color
        },
        set color(value) {
          self.color = value
        },
        get emissive() {
          return self.emissive
        },
        set emissive(value) {
          self.emissive = value
        },
        get castShadow() {
          return self.castShadow
        },
        set castShadow(value) {
          self.castShadow = value
        },
        get receiveShadow() {
          return self.receiveShadow
        },
        set receiveShadow(value) {
          self.receiveShadow = value
        },
        get physics() {
          return self.physics
        },
        set physics(value) {
          self.physics = value
        },
      }
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy())) // inherit Node properties
      this.proxy = proxy
    }
    return this.proxy
  }
}