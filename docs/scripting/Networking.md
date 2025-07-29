# Networking

**See also:** [App API](/docs/scripting/app/App.md) · [World API](/docs/scripting/world/World.md)

Apps in Hyperfy communicate using `app.send`, `app.on`, `app.emit`, and `world.on`.

* `app.send` / `app.on`: Send/receive events within the same app.
* `app.emit`: Server-only, sends events to other apps.
* `world.on`: Listens for events from other apps.

## Example

### App 1

```ts
if (world.isServer) {
  app.on('ping', () => {
    console.log('ping heard on server of original app');
    app.emit('cross-app-ping', {});
  });
  world.on('cross-app-pong', () => {
    app.send('end', {});
  });
}

if (world.isClient) {
  app.on('end', () => {
    console.log('full loop ended');
  });
  app.send('ping', {});
}
```

### App 2

```ts
if (world.isServer) {
  world.on('cross-app-ping', () => {
    console.log('ping heard on different app');
    app.emit('cross-app-pong', {});
  });
}
```

## Flow

1. App 1 (client) sends ping via `app.send`.
2. App 1 (server) receives ping via `app.on`, emits `cross-app-ping` to other apps.
3. App 2 (server) listens for `cross-app-ping` via `world.on`, emits `cross-app-pong`.
4. App 1 (server) listens for `cross-app-pong` via `world.on`, sends `end` to itself.
5. App 1 (client) receives `end` via `app.on`, completing the loop.
