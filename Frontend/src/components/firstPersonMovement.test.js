import { describe, expect, it } from 'vitest'
import { getWASDAxes } from './firstPersonMovement.js'

describe('getWASDAxes', () => {
  it('maps WASD keys to horizontal movement', () => {
    expect(getWASDAxes(new Set(['w']))).toEqual({ x: 0, z: -1 })
    expect(getWASDAxes(new Set(['s']))).toEqual({ x: 0, z: 1 })
    expect(getWASDAxes(new Set(['a']))).toEqual({ x: -1, z: 0 })
    expect(getWASDAxes(new Set(['d']))).toEqual({ x: 1, z: 0 })
  })

  it('normalizes diagonal movement and returns zero for no keys', () => {
    const diagonal = getWASDAxes(new Set(['w', 'd']))
    expect(diagonal.x).toBeCloseTo(Math.SQRT1_2)
    expect(diagonal.z).toBeCloseTo(-Math.SQRT1_2)
    expect(getWASDAxes(new Set())).toEqual({ x: 0, z: 0 })
  })
})
