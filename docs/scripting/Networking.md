# Networking

**See also:** [Object API](/docs/scripting/object/Object.md) · [World API](/docs/scripting/world/World.md)

Objects in Hyperfy communicate using `object.send`, `object.on`, `object.emit`, and `world.on`.

Objects execute their scripts in every environment, eg on the server and on every client.

The `world.isServer` and `world.isClient` allows scripts to determine what environment they are running in.

* `object.send`: Sends an event to other instances of the same object. When called on a server is sent to all clients, and when called on a client is sent to the server.
* `object.on`: Listens for an event sent from an object (via `object.send`) in its counter-environment (server or clients).
* `object.emit`: Emits an event for any object to listen to, in the same environment it was called from (either a single client or the server).
* `world.on`: Listens for an event emitted from any object (via `object.emit`) in the same environment.

## Example

### Object 1

```js
if (world.isServer) {
  object.on('ping', () => {
    console.log('ping heard on server of original object');
    object.emit('cross-object-ping', {});
  });
  world.on('cross-object-pong', () => {
    object.send('end', {});
  });
}

if (world.isClient) {
  object.on('end', () => {
    console.log('full loop ended');
  });
  object.send('ping', {});
}
```

### Object 2

```js
if (world.isServer) {
  world.on('cross-object-ping', () => {
    console.log('ping heard on different object');
    object.emit('cross-object-pong', {});
  });
}
```

## Flow

1. Object 1 (client) sends ping via `object.send`.
2. Object 1 (server) receives ping via `object.on`, emits `cross-object-ping` to other apps.
3. Object 2 (server) listens for `cross-object-ping` via `world.on`, emits `cross-object-pong`.
4. Object 1 (server) listens for `cross-object-pong` via `world.on`, sends `end` to itself.
5. Object 1 (client) receives `end` via `object.on`, completing the loop.
