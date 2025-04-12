import { isBoolean, isNumber, isString } from 'lodash-es'
import * as THREE from '../extras/three'

import { getRef, Node, secureRef } from './Node'
import { uuid } from '../utils'

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const q1 = new THREE.Quaternion()

const groups = ['music', 'sfx']
const distanceModels = ['linear', 'inverse', 'exponential']

const defaults = {
  src: null,
  linked: false,
  loop: false,

  visible: true,
  color: 'black',
  lit: false,
  doubleside: false,
  castShadow: false,
  receiveShadow: false,

  aspect: 16 / 9,

  width: null,
  height: 1,

  geometry: null,
  cover: true,

  volume: 1,
  group: 'music',
  spatial: true,
  distanceModel: 'inverse',
  refDistance: 1,
  maxDistance: 40,
  rolloffFactor: 3,
  coneInnerAngle: 360,
  coneOuterAngle: 360,
  coneOuterGain: 0,
}

export class Video extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'video'

    this.src = data.src
    this.linked = data.linked
    this.loop = data.loop

    this.visible = data.visible
    this.color = data.color
    this.lit = data.lit
    this.doubleside = data.doubleside
    this.castShadow = data.castShadow
    this.receiveShadow = data.receiveShadow

    this.aspect = data.aspect

    this.width = data.width
    this.height = data.height

    this.geometry = data.geometry
    this.cover = data.cover

    this.volume = data.volume
    this.group = data.group
    this.spatial = data.spatial
    this.distanceModel = data.distanceModel
    this.refDistance = data.refDistance
    this.maxDistance = data.maxDistance
    this.rolloffFactor = data.rolloffFactor
    this.coneInnerAngle = data.coneInnerAngle
    this.coneOuterAngle = data.coneOuterAngle
    this.coneOuterGain = data.coneOuterGain

    this.n = 0
  }

  async mount() {
    this.needsRebuild = false
    if (this.ctx.world.network.isServer) return

    const n = ++this.n

    // video sources are grouped by keys of similar configuration
    // and when linked can be instanced thousands of times all using the same video element and texture
    let key = `${this._loop}_${this._width}_${this._height}_${this._aspect}_${this._geometry?.uuid}_${this._cover}_`
    if (this._linked === true) {
      key += 'default'
    } else if (this._linked === false) {
      key += uuid()
    } else {
      key += this._linked
    }

    let factory
    if (this._src) {
      factory = this.ctx.world.loader.get('video', this._src)
      if (!factory) factory = await this.ctx.world.loader.load('video', this._src)
      if (this.n !== n) return
      this.instance = factory.get(key)
    }

    if (this._visible) {
      // material
      let material
      const color = this.instance?.ready ? 'white' : this._color || 'red' // TODO: color prop
      if (this._lit) {
        material = new THREE.MeshStandardMaterial({
          color,
          rougness: 1,
          metalness: 0,
          side: this._doubleside ? THREE.DoubleSide : THREE.FrontSide,
        })
      } else {
        material = new THREE.MeshBasicMaterial({
          color,
          side: this._doubleside ? THREE.DoubleSide : THREE.FrontSide,
        })
      }
      this.ctx.world.setupMaterial(material)

      let geometry
      // custom
      if (this._geometry) {
        geometry = this._geometry
      }
      // plane (initial)
      if (!this._geometry) {
        let width = this._width
        let height = this._height
        let preAspect = this._aspect
        if (width === null && height === null) {
          height = 0
          width = 0
        } else if (width !== null && height === null) {
          height = width / preAspect
        } else if (height !== null && width === null) {
          width = height * preAspect
        }
        geometry = new THREE.PlaneGeometry(width, height)
        geometry._oWidth = width
        geometry._oHeight = height
      }

      // mesh
      this.mesh = new THREE.Mesh(geometry, material)
      this.mesh.castShadow = this._castShadow
      this.mesh.receiveShadow = this._receiveShadow
      this.mesh.matrixWorld.copy(this.matrixWorld)
      this.mesh.matrixAutoUpdate = false
      this.mesh.matrixWorldAutoUpdate = false
      this.ctx.world.stage.scene.add(this.mesh)
      this.sItem = {
        matrix: this.matrixWorld,
        geometry,
        material,
        getEntity: () => this.ctx.entity,
        node: this,
      }
      this.ctx.world.stage.octree.insert(this.sItem)
    }

    if (!this.instance) return

    await this.instance.prepare
    if (this.n !== n) return

    this.instance.loop = this._loop
    this.gain = this.ctx.world.audio.ctx.createGain()
    this.gain.gain.value = this._volume
    this.gain.connect(this.ctx.world.audio.groupGains.music)
    if (this._spatial) {
      this.panner = this.ctx.world.audio.ctx.createPanner()
      this.panner.panningModel = 'HRTF'
      this.panner.distanceModel = this._distanceModel
      this.panner.refDistance = this._refDistance
      this.panner.maxDistance = this._maxDistance
      this.panner.rolloffFactor = this._rolloffFactor
      this.panner.coneInnerAngle = this._coneInnerAngle
      this.panner.coneOuterAngle = this._coneOuterAngle
      this.panner.coneOuterGain = this._coneOuterGain
      this.panner.connect(this.gain)
      this.instance.audio.connect(this.panner)
      this.updatePannerPosition()
    } else {
      this.instance.audio.connect(this.gain)
    }

    if (this._visible) {
      const geometry = this.mesh.geometry
      const material = this.mesh.material

      // custom
      if (this._geometry && this._cover) {
        // based on the video dimensions, textures are scaled and repeated to emulate `background-size: cover` from css.
        // the end result is a video that is scaled up until it "covers" the entire UV square (0,0 to 1,1), centered.
        let vidAspect = this.instance.width / this.instance.height
        let geoAspect = this._aspect
        let aspect = geoAspect / vidAspect
        let texture = this.instance.texture
        texture.center.set(0.5, 0.5)
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        if (aspect > 1) {
          // geometry is wider than the video.
          // fill horizontally => repeat.x = 1
          // crop top/bottom => repeat.y < 1
          texture.repeat.set(1, 1 / aspect)
        } else {
          // geometry is taller than the video.
          // fill vertically => repeat.y = 1
          // crop left/right => repeat.x < 1
          texture.repeat.set(aspect, 1)
        }
      }

      // plane
      if (!this._geometry) {
        let vidAspect = this.instance.width / this.instance.height
        let width = this._width
        let height = this._height
        if (width === null && height === null) {
          height = 0
          width = 0
        } else if (width !== null && height === null) {
          height = width / vidAspect
        } else if (height !== null && width === null) {
          width = height * vidAspect
        }
        // new geometry if changed
        if (geometry._oWidth !== width || geometry._oHeight !== height) {
          this.mesh.geometry = new THREE.PlaneGeometry(width, height)
          geometry.dispose()
        }
        // if the video aspect is different to the plane aspect we need to ensure the texture is scaled correctly.
        // this effect is identical to the `background-size: cover` css property.
        let geoAspect = width / height
        let aspect = geoAspect / vidAspect
        let texture = this.instance.texture
        texture.center.set(0.5, 0.5)
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        if (aspect > 1) {
          // geometry is wider than the video.
          // fill horizontally => repeat.x = 1
          // crop top/bottom => repeat.y < 1
          texture.repeat.set(1, 1 / aspect)
        } else {
          // geometry is taller than the video.
          // fill vertically => repeat.y = 1
          // crop left/right => repeat.x < 1
          texture.repeat.set(aspect, 1)
        }
      }

      material.color.set('white')
      material.map = this.instance.texture
      material.needsUpdate = true

      if (this.shouldPlay) {
        this.instance.play()
        this.shouldPlay = false
      }
    }
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.unmount()
      this.mount()
      return
    }
    if (didMove) {
      if (this.mesh) {
        this.mesh.matrixWorld.copy(this.matrixWorld)
      }
      if (this.sItem) {
        this.ctx.world.stage.octree.move(this.sItem)
      }
      if (this.panner) {
        this.updatePannerPosition()
      }
    }
  }

  unmount() {
    this.n++
    if (this.mesh) {
      this.ctx.world.stage.scene.remove(this.mesh)
      this.mesh.material.dispose()
      this.mesh.geometry.dispose()
      this.mesh = null
    }
    if (this.instance) {
      if (this.panner) {
        this.instance.audio.disconnect(this.panner)
      } else {
        this.instance.audio.disconnect(this.gain)
      }
      this.panner = null
      this.gain = null
      this.instance.release()
      this.instance = null
    }
    if (this.sItem) {
      this.ctx.world.stage.octree.remove(this.sItem)
      this.sItem = null
    }
  }

  updatePannerPosition() {
    const audio = this.ctx.world.audio
    const pos = v1.setFromMatrixPosition(this.matrixWorld)
    const qua = q1.setFromRotationMatrix(this.matrixWorld)
    const dir = v2.set(0, 0, -1).applyQuaternion(qua)
    if (this.panner.positionX) {
      const endTime = audio.ctx.currentTime + audio.lastDelta
      this.panner.positionX.linearRampToValueAtTime(pos.x, endTime)
      this.panner.positionY.linearRampToValueAtTime(pos.y, endTime)
      this.panner.positionZ.linearRampToValueAtTime(pos.z, endTime)
      this.panner.orientationX.linearRampToValueAtTime(dir.x, endTime)
      this.panner.orientationY.linearRampToValueAtTime(dir.y, endTime)
      this.panner.orientationZ.linearRampToValueAtTime(dir.z, endTime)
    } else {
      this.panner.setPosition(pos.x, pos.y, pos.z)
      this.panner.setOrientation(dir.x, dir.y, dir.z)
    }
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    this._src = source._src
    this._linked = source._linked
    this._loop = source._loop

    this._visible = source._visible
    this._color = source._color
    this._lit = source._lit
    this._doubleside = source._doubleside
    this._castShadow = source._castShadow
    this._receiveShadow = source._receiveShadow

    this._aspect = source._aspect

    this._width = source._width
    this._height = source._height

    this._geometry = source._geometry
    this._cover = source._cover

    this._volume = source._volume
    this._spatial = source._spatial
    this._group = source._group
    this._spatial = source._spatial
    this._distanceModel = source._distanceModel
    this._refDistance = source._refDistance
    this._maxDistance = source._maxDistance
    this._rolloffFactor = source._rolloffFactor
    this._coneInnerAngle = source._coneInnerAngle
    this._coneOuterAngle = source._coneOuterAngle
    this._coneOuterGain = source._coneOuterGain

    // this._color = source._color
    return this
  }

  get src() {
    return this._src
  }

  set src(value = defaults.src) {
    if (value !== null && !isString(value)) {
      throw new Error('[video] src not null or string')
    }
    if (this._src === value) return
    this._src = value
    this.needsRebuild = true
    this.setDirty()
  }

  get linked() {
    return this._linked
  }

  set linked(value = defaults.linked) {
    if (!isBoolean(value) && !isString(value)) {
      throw new Error('[video] linked not boolean or string')
    }
    if (this._linked === value) return
    this._linked = value
    this.needsRebuild = true
    this.setDirty()
  }

  get loop() {
    return this._loop
  }

  set loop(value = defaults.loop) {
    if (!isBoolean(value)) {
      throw new Error('[video] loop not boolean')
    }
    if (this._loop === value) return
    this._loop = value
    if (this.instance) {
      this.instance.loop = value
    }
  }

  get visible() {
    return this._visible
  }

  set visible(value = defaults.visible) {
    if (!isBoolean(value)) {
      throw new Error('[video] visible not a boolean')
    }
    if (this._visible === value) return
    this._visible = value
    this.needsRebuild = true
    this.setDirty()
  }

  get color() {
    return this._color
  }

  set color(value = defaults.color) {
    if (value !== null && !isString(value)) {
      throw new Error('[video] color not null or string')
    }
    if (this._color === value) return
    this._color = value
    this.needsRebuild = true
    this.setDirty()
  }

  get lit() {
    return this._lit
  }

  set lit(value = defaults.lit) {
    if (!isBoolean(value)) {
      throw new Error('[video] lit not boolean')
    }
    if (this._lit === value) return
    this._lit = value
    this.needsRebuild = true
    this.setDirty()
  }

  get doubleside() {
    return this._doubleside
  }

  set doubleside(value = defaults.doubleside) {
    if (!isBoolean(value)) {
      throw new Error('[video] doubleside not boolean')
    }
    if (this._doubleside === value) return
    this._doubleside = value
    if (this.mesh) {
      this.mesh.material.side = value ? THREE.DoubleSide : THREE.FrontSide
      this.mesh.material.needsUpdate = true
    }
  }

  get castShadow() {
    return this._castShadow
  }

  set castShadow(value = defaults.castShadow) {
    if (!isBoolean(value)) {
      throw new Error('[video] castShadow not boolean')
    }
    if (this._castShadow === value) return
    this._castShadow = value
    if (this.mesh) {
      this.mesh.castShadow = value
    }
  }

  get receiveShadow() {
    return this._receiveShadow
  }

  set receiveShadow(value = defaults.receiveShadow) {
    if (!isBoolean(value)) {
      throw new Error('[video] receiveShadow not boolean')
    }
    if (this._receiveShadow === value) return
    this._receiveShadow = value
    if (this.mesh) {
      this.mesh.receiveShadow = value
    }
  }

  get aspect() {
    return this._aspect
  }

  set aspect(value = defaults.aspect) {
    if (!isNumber(value)) {
      throw new Error('[video] aspect not a number')
    }
    if (this._aspect === value) return
    this._aspect = value
    this.needsRebuild = true
    this.setDirty()
  }

  get width() {
    return this._width
  }

  set width(value = defaults.width) {
    if (value !== null && !isNumber(value)) {
      throw new Error('[video] width not null or number')
    }
    if (this._width === value) return
    this._width = value
    this.needsRebuild = true
    this.setDirty()
  }

  get height() {
    return this._height
  }

  set height(value = defaults.height) {
    if (value !== null && !isNumber(value)) {
      throw new Error('[video] height not null or number')
    }
    if (this._height === value) return
    this._height = value
    this.needsRebuild = true
    this.setDirty()
  }

  get geometry() {
    return secureRef({}, () => this._geometry)
  }

  set geometry(value = defaults.geometry) {
    this._geometry = getRef(value)
    this.needsRebuild = true
    this.setDirty()
  }

  get cover() {
    return this._cover
  }

  set cover(value = defaults.cover) {
    if (!isBoolean(value)) {
      throw new Error('[video] cover not boolean')
    }
    if (this._cover === value) return
    this._cover = value
    this.needsRebuild = true
    this.setDirty()
  }

  get volume() {
    return this._volume
  }

  set volume(value = defaults.volume) {
    if (!isNumber(value)) {
      throw new Error('[video] volume not number')
    }
    if (this._volume === value) return
    this._volume = value
    if (this.gain) {
      this.gain.gain.value = value
    }
  }

  get group() {
    return this._group
  }

  set group(value = defaults.group) {
    if (!isGroup(value)) {
      throw new Error('[video] group not valid')
    }
    this._group = value
    this.needsRebuild = true
    this.setDirty()
  }

  get spatial() {
    return this._spatial
  }

  set spatial(value = defaults.spatial) {
    if (!isBoolean(value)) {
      throw new Error('[video] spatial not boolean')
    }
    if (this._spatial === value) return
    this._spatial = value
    this.needsRebuild = true
    this.setDirty()
  }

  get distanceModel() {
    return this._distanceModel
  }

  set distanceModel(value = defaults.distanceModel) {
    if (!isDistanceModel(value)) {
      throw new Error('[audio] distanceModel not valid')
    }
    this._distanceModel = value
    if (this.pannerNode) {
      this.pannerNode.distanceModel = this._distanceModel
    }
  }

  get refDistance() {
    return this._refDistance
  }

  set refDistance(value = defaults.refDistance) {
    if (!isNumber(value)) {
      throw new Error('[audio] refDistance not a number')
    }
    this._refDistance = value
    if (this.pannerNode) {
      this.pannerNode.refDistance = this._refDistance
    }
  }

  get maxDistance() {
    return this._maxDistance
  }

  set maxDistance(value = defaults.maxDistance) {
    if (!isNumber(value)) {
      throw new Error('[audio] maxDistance not a number')
    }
    this._maxDistance = value
    if (this.pannerNode) {
      this.pannerNode.maxDistance = this._maxDistance
    }
  }

  get rolloffFactor() {
    return this._rolloffFactor
  }

  set rolloffFactor(value = defaults.rolloffFactor) {
    if (!isNumber(value)) {
      throw new Error('[audio] rolloffFactor not a number')
    }
    this._rolloffFactor = value
    if (this.pannerNode) {
      this.pannerNode.rolloffFactor = this._rolloffFactor
    }
  }

  get coneInnerAngle() {
    return this._coneInnerAngle
  }

  set coneInnerAngle(value = defaults.coneInnerAngle) {
    if (!isNumber(value)) {
      throw new Error('[audio] coneInnerAngle not a number')
    }
    this._coneInnerAngle = value
    if (this.pannerNode) {
      this.pannerNode.coneInnerAngle = this._coneInnerAngle
    }
  }

  get coneOuterAngle() {
    return this._coneOuterAngle
  }

  set coneOuterAngle(value = defaults.coneOuterAngle) {
    if (!isNumber(value)) {
      throw new Error('[audio] coneOuterAngle not a number')
    }
    this._coneOuterAngle = value
    if (this.pannerNode) {
      this.pannerNode.coneOuterAngle = this._coneOuterAngle
    }
  }

  get coneOuterGain() {
    return this._coneOuterGain
  }

  set coneOuterGain(value = defaults.coneOuterGain) {
    if (!isNumber(value)) {
      throw new Error('[audio] coneOuterGain not a number')
    }
    this._coneOuterGain = value
    if (this.pannerNode) {
      this.pannerNode.coneOuterGain = this._coneOuterGain
    }
  }

  get isPlaying() {
    return this.instance ? this.instance.isPlaying : false
  }

  get currentTime() {
    return this.instance ? this.instance.currentTime : 0
  }

  set currentTime(value) {
    if (this.instance) {
      this.instance.currentTime = value
    }
  }

  play(restartIfPlaying) {
    if (this.instance) {
      this.instance.play(restartIfPlaying)
    } else {
      this.shouldPlay = true
    }
  }

  pause() {
    this.instance?.pause()
  }

  stop() {
    this.instance?.stop()
  }

  getProxy() {
    var self = this
    if (!this.proxy) {
      let proxy = {
        get src() {
          return self.src
        },
        set src(value) {
          self.src = value
        },
        get linked() {
          return self.linked
        },
        set linked(value) {
          self.linked = value
        },
        get loop() {
          return self.loop
        },
        set loop(value) {
          self.loop = value
        },
        get visible() {
          return self.visible
        },
        set visible(value) {
          self.visible = value
        },
        get color() {
          return self.color
        },
        set color(value) {
          self.color = value
        },
        get lit() {
          return self.lit
        },
        set lit(value) {
          self.lit = value
        },
        get doubleside() {
          return self.doubleside
        },
        set doubleside(value) {
          self.doubleside = value
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
        get aspect() {
          return self.aspect
        },
        set aspect(value) {
          self.aspect = value
        },
        get width() {
          return self.width
        },
        set width(value) {
          self.width = value
        },
        get height() {
          return self.height
        },
        set height(value) {
          self.height = value
        },
        get geometry() {
          return self.geometry
        },
        set geometry(value) {
          self.geometry = value
        },
        get cover() {
          return self.cover
        },
        set cover(value) {
          self.cover = value
        },
        get volume() {
          return self.volume
        },
        set volume(value) {
          self.volume = value
        },
        get group() {
          return self.group
        },
        set group(value) {
          self.group = value
        },
        get spatial() {
          return self.spatial
        },
        set spatial(value) {
          self.spatial = value
        },
        get distanceModel() {
          return self.distanceModel
        },
        set distanceModel(value) {
          self.distanceModel = value
        },
        get refDistance() {
          return self.refDistance
        },
        set refDistance(value) {
          self.refDistance = value
        },
        get maxDistance() {
          return self.maxDistance
        },
        set maxDistance(value) {
          self.maxDistance = value
        },
        get rolloffFactor() {
          return self.rolloffFactor
        },
        set rolloffFactor(value) {
          self.rolloffFactor = value
        },
        get coneInnerAngle() {
          return self.coneInnerAngle
        },
        set coneInnerAngle(value) {
          self.coneInnerAngle = value
        },
        get coneOuterAngle() {
          return self.coneOuterAngle
        },
        set coneOuterAngle(value) {
          self.coneOuterAngle = value
        },
        get coneOuterGain() {
          return self.coneOuterGain
        },
        set coneOuterGain(value) {
          self.coneOuterGain = value
        },
        get isPlaying() {
          return self.isPlaying
        },
        get currentTime() {
          return self.currentTime
        },
        set currentTime(value) {
          self.currentTime = value
        },
        play(restartIfPlaying) {
          self.play(restartIfPlaying)
        },
        pause() {
          self.pause()
        },
        stop() {
          self.stop()
        },
      }
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy())) // inherit Node properties
      this.proxy = proxy
    }
    return this.proxy
  }
}

function isDistanceModel(value) {
  return distanceModels.includes(value)
}

function isGroup(value) {
  return groups.includes(value)
}
