import { expect, type Page } from '@playwright/test'

const IGNORED_CONSOLE_ERRORS = [
  'Failed to load resource: the server responded with a status of 404',
]

interface ConsoleMonitorOptions {
  ignoredPatterns?: (string | RegExp)[]
}

export function trackUnexpectedConsoleErrors(
  page: Page,
  options: ConsoleMonitorOptions = {},
) {
  const errors: string[] = []
  const ignoredPatterns = [...IGNORED_CONSOLE_ERRORS, ...(options.ignoredPatterns || [])]

  page.on('console', (message) => {
    if (message.type() !== 'error') {
      return
    }

    const text = message.text()
    const ignored = ignoredPatterns.some((candidate) =>
      typeof candidate === 'string' ? text.includes(candidate) : candidate.test(text)
    )

    if (!ignored) {
      errors.push(text)
    }
  })

  return {
    async assertClean() {
      expect(errors, `Unexpected browser console errors:\n${errors.join('\n')}`).toEqual([])
    },
  }
}
