import { expect, test } from 'vitest'
import { createLayerStore } from '../src/state/layers'

function controllable() {
  const calls: { id: string; resolve: () => void; reject: (e: Error) => void }[] = []
  const load = (id: string) => new Promise<void>((resolve, reject) => { calls.push({ id, resolve, reject }) })
  return { calls, load }
}

test('a layer toggled off while loading stays off', async () => {
  const { calls, load } = controllable()
  const store = createLayerStore(load)
  const on = store.setVisible('musculos', true)
  const off = store.setVisible('musculos', false)
  calls[0].resolve()
  await Promise.all([on, off])
  expect(store.get('musculos')).toMatchObject({ visible: false, status: 'ready' })
})

test('a layer loads only once', async () => {
  const { calls, load } = controllable()
  const store = createLayerStore(load)
  const a = store.setVisible('nervoso', true)
  const b = store.setVisible('nervoso', true)
  calls[0].resolve()
  await Promise.all([a, b])
  await store.setVisible('nervoso', false)
  await store.setVisible('nervoso', true)
  expect(calls.length).toBe(1)
})

test('a failed layer can be retried and does not affect others', async () => {
  const { calls, load } = controllable()
  const store = createLayerStore(load)
  const ok = store.setVisible('esqueleto', true)
  const bad = store.setVisible('orgaos', true)
  calls[0].resolve()
  calls[1].reject(new Error('network'))
  await Promise.all([ok, bad])
  expect(store.get('orgaos').status).toBe('error')
  expect(store.get('esqueleto')).toMatchObject({ visible: true, status: 'ready' })
  const retry = store.setVisible('orgaos', true)
  calls[2].resolve()
  await retry
  expect(store.get('orgaos').status).toBe('ready')
})

test('subscribers hear about changes and opacity is clamped', () => {
  const store = createLayerStore(async () => {})
  let n = 0
  store.subscribe(() => n++)
  store.setOpacity('esqueleto', 2)
  expect(store.get('esqueleto').opacity).toBe(1)
  store.setOpacity('esqueleto', -1)
  expect(store.get('esqueleto').opacity).toBe(0)
  expect(n).toBe(2)
})
