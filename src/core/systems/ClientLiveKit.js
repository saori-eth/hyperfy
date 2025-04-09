import { Participant, Room, RoomEvent, Track } from 'livekit-client'
import * as THREE from '../extras/three'

import { System } from './System'
import { isBoolean } from 'lodash-es'

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const q1 = new THREE.Quaternion()

export class ClientLiveKit extends System {
  constructor(world) {
    super(world)
    this.room = null
    this.status = {
      connected: false,
      mic: false,
    }
    this.playerVoices = new Map() // playerId -> PlayerVoice
  }

  async deserialize(opts) {
    if (!opts) return
    // console.log(opts)
    this.room = new Room({ webAudioMix: { audioContext: this.world.audio.ctx } })
    this.room.on(RoomEvent.TrackMuted, this.onTrackMuted)
    this.room.on(RoomEvent.TrackUnmuted, this.onTrackUnmuted)
    this.room.on(RoomEvent.LocalTrackPublished, this.onLocalTrackPublished)
    this.room.on(RoomEvent.LocalTrackUnpublished, this.onLocalTrackUnpublished)
    this.room.on(RoomEvent.TrackSubscribed, this.onTrackSubscribed)
    this.room.on(RoomEvent.TrackUnsubscribed, this.onTrackUnsubscribed)
    this.world.audio.requireGesture(async () => {
      await this.room.connect(opts.wsUrl, opts.token)
      this.status.connected = true
      this.emit('status', this.status)
    })
  }

  lateUpdate(delta) {
    this.playerVoices.forEach(voice => {
      voice.lateUpdate(delta)
    })
  }

  toggleMic(value) {
    value = isBoolean(value) ? value : !this.room.localParticipant.isMicrophoneEnabled
    if (this.status.mic === value) return
    this.room.localParticipant.setMicrophoneEnabled(value)
  }

  onTrackMuted = track => {
    // console.log('onTrackMuted', track)
    if (track.isLocal && track.source === 'microphone') {
      this.status.mic = false
      this.emit('status', this.status)
    }
  }

  onTrackUnmuted = track => {
    // console.log('onTrackUnmuted', track)
    if (track.isLocal && track.source === 'microphone') {
      this.status.mic = true
      this.emit('status', this.status)
    }
  }

  onLocalTrackPublished = pub => {
    // console.log('onLocalTrackPublished', pub)
    if (pub.source === 'microphone') {
      this.status.mic = true
      this.emit('status', this.status)
    }
  }

  onLocalTrackUnpublished = pub => {
    // console.log('onLocalTrackUnpublished', pub)
    if (pub.source === 'microphone') {
      this.status.mic = false
      this.emit('status', this.status)
    }
  }

  onTrackSubscribed = (track, publication, participant) => {
    // console.log('onTrackSubscribed', track, publication, participant)
    if (track.kind === Track.Kind.Audio) {
      const playerId = participant.identity
      const player = this.world.entities.getPlayer(playerId)
      if (!player) return console.error('onTrackSubscribed failed: no player')
      const voice = new PlayerVoice(this.world, player, track)
      this.playerVoices.set(playerId, voice)
    }
  }

  onTrackUnsubscribed = (track, publication, participant) => {
    // console.log('onTrackUnsubscribed todo')
    if (track.kind === Track.Kind.Audio) {
      const playerId = participant.identity
      const voice = this.playerVoices.get(playerId)
      voice?.destroy()
      this.playerVoices.delete(playerId)
    }
  }
}

class PlayerVoice {
  constructor(world, player, track) {
    this.world = world
    this.player = player
    this.track = track
    this.track.setAudioContext(world.audio.ctx)
    this.spatial = true // todo: switch to global
    this.panner = world.audio.ctx.createPanner()
    this.panner.panningModel = 'HRTF'
    this.panner.panningModel = 'HRTF'
    this.panner.distanceModel = 'inverse'
    this.panner.refDistance = 1
    this.panner.maxDistance = 40
    this.panner.rolloffFactor = 3
    this.panner.coneInnerAngle = 360
    this.panner.coneOuterAngle = 360
    this.panner.coneOuterGain = 0
    this.gain = world.audio.groupGains.voice
    this.panner.connect(this.gain)
    this.track.attach()
    this.track.setWebAudioPlugins([this.spatial ? this.panner : this.gain])
  }

  lateUpdate(delta) {
    const audio = this.world.audio
    const matrix = this.player.base.matrixWorld
    const pos = v1.setFromMatrixPosition(matrix)
    const qua = q1.setFromRotationMatrix(matrix)
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

  destroy() {
    this.track.detach()
  }
}
