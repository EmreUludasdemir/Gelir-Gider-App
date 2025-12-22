'use client'

import { useEffect, useCallback, useRef } from 'react'

type KeyHandler = (event: KeyboardEvent) => void

interface ShortcutConfig {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean
  handler: KeyHandler
  description?: string
  preventDefault?: boolean
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean
  onShortcutTriggered?: (config: ShortcutConfig) => void
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, onShortcutTriggered } = options
  const shortcutsRef = useRef(shortcuts)

  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  const matchesShortcut = useCallback((event: KeyboardEvent, config: ShortcutConfig) => {
    const key = event.key.toLowerCase()
    const configKey = config.key.toLowerCase()

    // Check if key matches
    if (key !== configKey) return false

    // Check modifiers
    if (config.ctrl && !event.ctrlKey) return false
    if (!config.ctrl && event.ctrlKey) return false

    if (config.alt && !event.altKey) return false
    if (!config.alt && event.altKey) return false

    if (config.shift && !event.shiftKey) return false
    if (!config.shift && event.shiftKey) return false

    if (config.meta && !event.metaKey) return false
    if (!config.meta && event.metaKey) return false

    return true
  }, [])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      // Find matching shortcut
      const matchedShortcut = shortcutsRef.current.find((config) =>
        matchesShortcut(event, config)
      )

      if (matchedShortcut) {
        if (matchedShortcut.preventDefault !== false) {
          event.preventDefault()
        }

        matchedShortcut.handler(event)
        onShortcutTriggered?.(matchedShortcut)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, matchesShortcut, onShortcutTriggered])

  return {
    shortcuts: shortcutsRef.current,
  }
}

// Helper function to format shortcut for display
export function formatShortcut(config: ShortcutConfig): string {
  const parts: string[] = []

  if (config.ctrl) parts.push('Ctrl')
  if (config.alt) parts.push('Alt')
  if (config.shift) parts.push('Shift')
  if (config.meta) parts.push('⌘')

  parts.push(config.key.toUpperCase())

  return parts.join(' + ')
}

// Predefined shortcut templates
export const commonShortcuts = {
  save: (handler: KeyHandler): ShortcutConfig => ({
    key: 's',
    ctrl: true,
    handler,
    description: 'Kaydet',
  }),

  delete: (handler: KeyHandler): ShortcutConfig => ({
    key: 'Delete',
    handler,
    description: 'Sil',
  }),

  escape: (handler: KeyHandler): ShortcutConfig => ({
    key: 'Escape',
    handler,
    description: 'İptal / Kapat',
  }),

  new: (handler: KeyHandler): ShortcutConfig => ({
    key: 'n',
    ctrl: true,
    handler,
    description: 'Yeni Oluştur',
  }),

  search: (handler: KeyHandler): ShortcutConfig => ({
    key: 'k',
    ctrl: true,
    handler,
    description: 'Ara',
  }),

  selectAll: (handler: KeyHandler): ShortcutConfig => ({
    key: 'a',
    ctrl: true,
    handler,
    description: 'Tümünü Seç',
  }),

  copy: (handler: KeyHandler): ShortcutConfig => ({
    key: 'c',
    ctrl: true,
    handler,
    description: 'Kopyala',
    preventDefault: false, // Let browser handle
  }),

  paste: (handler: KeyHandler): ShortcutConfig => ({
    key: 'v',
    ctrl: true,
    handler,
    description: 'Yapıştır',
    preventDefault: false, // Let browser handle
  }),

  undo: (handler: KeyHandler): ShortcutConfig => ({
    key: 'z',
    ctrl: true,
    handler,
    description: 'Geri Al',
  }),

  redo: (handler: KeyHandler): ShortcutConfig => ({
    key: 'y',
    ctrl: true,
    handler,
    description: 'Yinele',
  }),

  refresh: (handler: KeyHandler): ShortcutConfig => ({
    key: 'r',
    ctrl: true,
    handler,
    description: 'Yenile',
  }),

  help: (handler: KeyHandler): ShortcutConfig => ({
    key: '?',
    shift: true,
    handler,
    description: 'Yardım',
  }),
}

// Hook to show keyboard shortcuts help modal
export function useShortcutHelp(shortcuts: ShortcutConfig[]) {
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const helpShortcut: ShortcutConfig = {
    key: '?',
    shift: true,
    handler: () => setIsHelpOpen(true),
    description: 'Klavye Kısayolları',
  }

  return {
    isHelpOpen,
    setIsHelpOpen,
    helpShortcut,
    shortcuts,
  }
}

// Add missing import
import { useState } from 'react'
