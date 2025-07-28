import * as THREE from '../extras/three'
import { isBoolean, isNumber, isString, isArray } from 'lodash-es'

import { Node, secureRef } from './Node'
import { getTrianglesFromGeometry } from '../extras/getTrianglesFromGeometry'
import { getTextureBytesFromMaterial } from '../extras/getTextureBytesFromMaterial'

const defaults = {
  kind: 'box',
  size: [1, 1, 1],
  color: '#ffffff',
  material: null,
  castShadow: true,
  receiveShadow: true,
}

const kinds = ['box', 'sphere', 'cylinder', 'cone', 'torus', 'plane']

// Geometry cache
let geometryCache = new Map()

const getGeometry = (kind, size) => {
  const key = `${kind}:${size.join(',')}`
  
  if (!geometryCache.has(key)) {
    let geometry
    
    switch (kind) {
      case 'box':
        geometry = new THREE.BoxGeometry(size[0], size[1], size[2])
        break
      case 'sphere':
        geometry = new THREE.SphereGeometry(size[0], 16, 12)
        break
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(size[0], size[0], size[1], 16)
        break
      case 'cone':
        geometry = new THREE.ConeGeometry(size[0], size[1], 16)
        break
      case 'torus':
        geometry = new THREE.TorusGeometry(size[0], size[1], 12, 16)
        break
      case 'plane':
        geometry = new THREE.PlaneGeometry(size[0], size[1])
        break
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1)
    }
    
    geometryCache.set(key, geometry)
  }
  
  return geometryCache.get(key)
}

// Material cache
let materialCache = new Map()

const getMaterial = (color, material) => {
  if (material) return material
  
  const key = color
  
  if (!materialCache.has(key)) {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.8,
      metalness: 0.2,
    })
    materialCache.set(key, mat)
  }
  
  return materialCache.get(key)
}

export class Prim extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'prim'
    
    this.kind = data.kind
    this.size = data.size
    this.color = data.color
    this.material = data.material
    this.castShadow = data.castShadow
    this.receiveShadow = data.receiveShadow
  }
  
  mount() {
    this.needsRebuild = false
    
    const geometry = getGeometry(this._kind, this._size)
    const material = getMaterial(this._color, this._material)
    
    // Create mesh
    this.handle = this.ctx.world.stage.insert({
      geometry,
      material,
      linked: true,
      castShadow: this._castShadow,
      receiveShadow: this._receiveShadow,
      matrix: this.matrixWorld,
      node: this,
    })
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
    }
  }
  
  unmount() {
    this.handle?.destroy()
    this.handle = null
  }
  
  copy(source, recursive) {
    super.copy(source, recursive)
    this._kind = source._kind
    this._size = [...source._size]
    this._color = source._color
    this._material = source._material
    this._castShadow = source._castShadow
    this._receiveShadow = source._receiveShadow
    return this
  }
  
  applyStats(stats) {
    const geometry = getGeometry(this._kind, this._size)
    if (geometry && !stats.geometries.has(geometry.uuid)) {
      stats.geometries.add(geometry.uuid)
      stats.triangles += getTrianglesFromGeometry(geometry)
    }
    const material = getMaterial(this._color, this._material)
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
    if (this.handle) {
      this.needsRebuild = true
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
    if (this.handle && !this._material) {
      this.needsRebuild = true
      this.setDirty()
    }
  }
  
  
  get material() {
    return secureRef({}, () => this._material)
  }
  
  set material(value = defaults.material) {
    if (value && !value.isMaterial) {
      throw new Error('[prim] material invalid')
    }
    if (this._material === value) return
    this._material = value
    this.needsRebuild = true
    this.setDirty()
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
        get material() {
          return self.material
        },
        set material(value) {
          self.material = value
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
      }
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy())) // inherit Node properties
      this.proxy = proxy
    }
    return this.proxy
  }
}