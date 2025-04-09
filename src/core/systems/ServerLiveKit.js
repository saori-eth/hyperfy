import { AccessToken } from 'livekit-server-sdk'

import { System } from './System'
import { uuid } from '../utils'

export class ServerLiveKit extends System {
  constructor(world) {
    super(world)
    this.roomId = uuid()
    this.wsUrl = process.env.LIVEKIT_WS_URL
    this.apiKey = process.env.LIVEKIT_API_KEY
    this.apiSecret = process.env.LIVEKIT_API_SECRET
    this.enabled = this.wsUrl && this.apiKey && this.apiSecret
  }

  async getPlayerOpts(playerId) {
    if (!this.enabled) return null
    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: playerId,
    })
    const videoGrant = {
      room: this.roomId,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    }
    at.addGrant(videoGrant)
    const token = await at.toJwt()
    return {
      wsUrl: this.wsUrl,
      token,
    }
  }
}
