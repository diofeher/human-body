import { expect, test } from 'vitest'
import { CREDITS_HTML } from '../src/ui/credits'

test('credits link both model licences and the source of the Portuguese names', () => {
  expect(CREDITS_HTML).toContain('href="https://creativecommons.org/licenses/by-sa/2.1/jp/')
  expect(CREDITS_HTML).toContain('href="https://creativecommons.org/licenses/by-sa/4.0/')
  expect(CREDITS_HTML).toContain('href="https://github.com/LluisV/Z-Anatomy"')
  expect(CREDITS_HTML).toContain('Translations0.txt')
})
