# Scripts

## IMPORTANT

As Hyperfy is in alpha, the scripting API is likely to evolve fast with breaking changes.
This means your apps can and will break as you upgrade worlds.
Once scripting is stable we'll move toward a forward compatible model, which will allow apps to be shared/traded with more confidence that they will continue to run correctly.

## Lifecycle

TODO: explain the object lifecycle across client and server

## Objects

[Objects](./object/Object.md) power Hyperfy's content. You can think of them as a combination of a model and a script. They can talk to eachother, and run both on the client and the server. Objects have a UI to configure [properties](./object/Props.md) in the scripts, and can load additional models inside of them.

## Nodes

Objects are made up of a hierarchy of [nodes](./nodes/Node.md) that you can view and modify within the object runtime using scripts.

The gltf model that each object is based on is automatically converted into nodes and inserted into the object runtime for you to interact with.

Certain node [types](./nodes/types/) can also be created and used on the fly using `object.create(nodeName)`.

## World

The [World](./world/World.md) API access methods and properties outside of the Objects, like players, networking or managing nodes outside of the local hierarchy. 

## Utils 

The [Utils](./utils.md) documentation provides a set of miscellaneous globals available in the scripting environment, like a random number generator and access to some `three.js` methods.

## Networking

Hyperfy [Networking](./Networking.md) happens inside of Objects, using methods from both the `Object` and `World` APIs. You can either send events between the client and server on the same object, or send messages to external apps on the server. 

## Globals

- [object](./object/Object.md)
- [world](./world/World.md)
- [props](./object/Props.md)
- [utils](./utils.md)