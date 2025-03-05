import { getRef } from '../nodes/Node'
import { clamp } from '../utils'
import * as THREE from './three'

const HEALTH_MAX = 100

export function createPlayerProxy(player) {
  const world = player.world
  const position = new THREE.Vector3()
  const rotation = new THREE.Euler()
  const quaternion = new THREE.Quaternion()
  return {
    get networkId() {
      return player.data.owner
    },
    get entityId() {
      return player.data.id
    },
    get id() {
      return player.data.userId
    },
    get name() {
      return player.data.name
    },
    get health() {
      return player.data.health
    },
    get position() {
      return position.copy(player.base.position)
    },
    get rotation() {
      return rotation.copy(player.base.rotation)
    },
    get quaternion() {
      return quaternion.copy(player.base.quaternion)
    },
    teleport(position, rotationY) {
      if (player.data.owner === world.network.id) {
        // if player is local we can set directly
        world.network.enqueue('onPlayerTeleport', { position: position.toArray(), rotationY })
      } else if (world.network.isClient) {
        // if we're a client we need to notify server
        world.network.send('playerTeleport', { networkId: player.data.owner, position: position.toArray(), rotationY })
      } else {
        // if we're the server we need to notify the player
        world.network.sendTo(player.data.owner, 'playerTeleport', { position: position.toArray(), rotationY })
      }
    },
    getBoneTransform(boneName) {
      return player.avatar?.getBoneTransform?.(boneName)
    },
    setSessionAvatar(url) {
      const avatar = url
      if (player.data.owner === world.network.id) {
        // if player is local we can set directly
        world.network.enqueue('onPlayerSessionAvatar', { avatar })
      } else if (world.network.isClient) {
        // if we're a client we need to notify server
        world.network.send('playerSessionAvatar', { networkId: player.data.owner, avatar })
      } else {
        // if we're the server we need to notify the player
        world.network.sendTo(player.data.owner, 'playerSessionAvatar', { avatar })
      }
    },
    damage(amount) {
      const health = clamp(player.data.health - amount, 0, HEALTH_MAX)
      // do nothing if it hasn't changed
      if (player.data.health === health) return
      // if local player, update locally (not synced)
      if (player.data.owner === world.network.id) {
        player.modify({ health })
      }
      // if client player, update locally (not synced)
      else if (world.network.isClient) {
        player.modify({ health })
      }
      // if we're the server, update and notify all clients
      else {
        player.modify({ health })
        world.network.send('entityModified', { id: player.data.id, health })
      }
    },
  }
}
