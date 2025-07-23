import { Matrix4 } from 'three'
const _m1 = new Matrix4()
export function makeTrimesh(app, body) {
  const appInverseMatrix = app.matrixWorld.clone().invert()
  app.traverse(node => {
    if (node.name === 'mesh') {
      const collider = app.create('collider')
      collider.type = 'geometry'
      collider.geometry = node.geometry
      _m1
        .copy(node.matrixWorld)
        .premultiply(appInverseMatrix)
        .decompose(collider.position, collider.quaternion, collider.scale)
      body.add(collider)
    }
  })
  body.position.copy(app.position)
  body.quaternion.copy(app.quaternion)
  body.scale.copy(app.scale)
  return body
}
