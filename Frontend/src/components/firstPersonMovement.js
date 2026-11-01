export function getWASDAxes(keys) {
  let x = 0
  let z = 0

  if (keys.has('a')) x -= 1
  if (keys.has('d')) x += 1
  if (keys.has('w')) z -= 1
  if (keys.has('s')) z += 1

  const length = Math.hypot(x, z)
  return length ? { x: x / length, z: z / length } : { x: 0, z: 0 }
}
