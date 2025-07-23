import { isBoolean } from 'lodash-es'
import { System } from './System'

export class Settings extends System {
  constructor(world) {
    super(world)

    this.title = null
    this.desc = null
    this.image = null
    this.avatar = null
    this.voice = null
    this.public = null
    this.playerLimit = null
    this.ao = null

    this.changes = null
  }

  deserialize(data) {
    this.title = data.title
    this.desc = data.desc
    this.image = data.image
    this.avatar = data.avatar
    this.voice = data.voice
    this.public = data.public
    this.playerLimit = data.playerLimit
    this.ao = data.ao
    this.emit('change', {
      title: { value: this.title },
      desc: { value: this.desc },
      image: { value: this.image },
      avatar: { value: this.avatar },
      voice: { value: this.voice },
      public: { value: this.public },
      playerLimit: { value: this.playerLimit },
      ao: { value: this.ao },
    })
  }

  serialize() {
    return {
      desc: this.desc,
      title: this.title,
      image: this.image,
      avatar: this.avatar,
      voice: this.voice,
      public: this.public,
      playerLimit: this.playerLimit,
      ao: this.ao,
    }
  }

  preFixedUpdate() {
    if (!this.changes) return
    this.emit('change', this.changes)
    this.changes = null
  }

  modify(key, value) {
    if (this[key] === value) return
    const prev = this[key]
    this[key] = value
    if (!this.changes) this.changes = {}
    if (!this.changes[key]) this.changes[key] = { prev, value: null }
    this.changes[key].value = value
  }

  set(key, value, broadcast) {
    this.modify(key, value)
    if (broadcast) {
      this.world.network.send('settingsModified', { key, value })
    }
  }
}
