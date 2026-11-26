import { expect, test } from 'vitest'
import { CREDITS_HTML } from '../src/ui/credits'

test('credits link both model licences and the source of the Portuguese names', () => {
  expect(CREDITS_HTML).toContain('href="https://creativecommons.org/licenses/by-sa/2.1/jp/')
  expect(CREDITS_HTML).toContain('href="https://creativecommons.org/licenses/by-sa/4.0/')
  expect(CREDITS_HTML).toContain('href="https://github.com/LluisV/Z-Anatomy"')
  expect(CREDITS_HTML).toContain('Translations0.txt')
})

test('credits link the public source code and state its licence', () => {
  expect(CREDITS_HTML).toContain('href="https://github.com/diofeher/human-body"')
  expect(CREDITS_HTML).toContain('O código do aplicativo')
  expect(CREDITS_HTML).not.toContain('antes de o site ir ao ar')
})

test('credits say the exercise models were animated and deformed', () => {
  expect(CREDITS_HTML).toMatch(/animação/)
  expect(CREDITS_HTML).toMatch(/deformados/)
})
