import { describe, it, expect } from 'vitest'
import { myFunction } from './index'

describe('myFunction', () => {
  it('should return text "Hello World"', () => {
    expect(myFunction()).toBe('Hello World change')
  })
})
