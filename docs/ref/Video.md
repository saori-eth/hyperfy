# Video

Renders a video into the world, either on a simple plane or onto geometry.

## Properties

### `.src`: String

A url to a video file, or an asset url from a video prop.

Currently only `mp4` and `m3u8` (HLS streams) are supported.

### `.linked`: Number|String

By default, videos are not linked and each node spawns a new video player with its own state and control.

If you plan to show a video multiple times throughout the world and require the state and controls to be synchronized, you can set this property to `true` or use a string ID to link video nodes together. This is allows you to have potentially hundreds of instances of a single video playing within the world all with individual audio emitters with very little overhead.

### `.loop`: Boolean

Whether the video should loop. Defaults to `false`.

### `.visible`: Boolean

Whether the video should be displayed. Defaults to `true`.

This can be used if you just want to play audio headlessly with more control over the audio position.

### `.color`: String

The color of the mesh before the video is playing. Defaults to `black`.

### `.lit`: Boolean

Whether the mesh material is lit (reacts to lighting) or not. Defaults to `false`.

### `.doubleside`: Boolean

Whether the video should play on both sides of the plane. Does not apply to custom geometry. Defaults to `true`.

### `.castShadow`: Boolean

Whether the mesh should cast a shadow. Defaults to `false`.

### `.receiveShadow`: Boolean

Whether the video should receive shadows. Defaults to `false`.

### `.width`: Number|null

The fixed width of the plane when not using a custom geometry. Can be set to `null` to be automatic. When automatic, the width will match the `.ratio` value until the video begins playback and will then resize to match the video dimensions. Defaults to `null`.

### `.height`: Number|null

The fixed height of the plane when not using a custom geometry. Can be set to `null` to be automatic. When automatic, the height will match the `.ratio` value until the video begins playback and will then resize to match the video dimensions. Defaults to `null`.

### `.ratio`: Number

The ratio of the plane before video begins playback, when not using a custom geometry. This works with the `width` and `height` values to allow automatic resizing based on video dimensions. Defaults to `16 / 9` (1.7777777778).

### `.geometry`: Geometry

The custom geometry to use instead of a plane. Geometry can be extracted from a `Mesh` node's `.geometry` property.

### `.cover`: Boolean

Whether the video projected onto custom geometry should expand to cover the entirety of a full UV texture space. This allows you to project a video with any dimensions onto a geometry while ensuring it covers the entire surface, similar to the css `objectFit = "cover"` behavior. Defaults to `true`.

### `.volume`: Number

The volume of the videos audio. Defaults to `1`.

### `.group`: String

The audio group this music belongs to. Players can adjust the volume of these groups individually. Must be `music` or `sfx` (`voice` not allowed). Defaults to `music`.

### `.spatial`: Boolean

Whether music should be played spatially and heard by players nearby. Defaults to `true`.

### `.distanceModel`: Enum('linear', 'inverse', 'expontential')

When spatial is enabled, the distance model to use. Defaults to `inverse`.

### `.refDistance`: Number

When spatial is enabled, the reference distance to use. Defaults to `1`.

### `.maxDistance`: Number

When spatial is enabled, the max distance to use. Defaults to `40`.

### `.rolloffFactor`: Number

When spatial is enabled, the rolloff factor to use. Defaults to `3`.

### `.coneInnerAngle`: Number

When spatial is enabled, the cone inner angle to use. Defaults to `360`.

### `.coneOuterAngle`: Number

When spatial is enabled, the cone inner angle to use. Defaults to `360`.

### `.coneOuterGain`: Number

When spatial is enabled, the cone inner angle to use. Defaults to `0`.

### `.isPlaying`: Boolean

Whether the video is currently playing. Read-only.

### `.currentTime`: Number

The current time of the video. Can be used to read and update the current time of the video.

### `.{...Node}`

Inherits all [Node](/docs/ref/Node.md) properties

## Methods

### `.play()`

Plays the audio. 

### `.pause()`

Pauses the audio, retaining the current time.

### `.stop()`

Stops the audio and resets the time back to zero.
