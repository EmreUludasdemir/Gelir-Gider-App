import { renderHook, act } from '@testing-library/react'
import { useBulkSelection } from '../useBulkSelection'

describe('useBulkSelection', () => {
  const mockItems = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    { id: '3', name: 'Item 3' },
  ]

  const getItemId = (item: typeof mockItems[0]) => item.id

  it('should initialize with no selections', () => {
    const { result } = renderHook(() =>
      useBulkSelection({
        items: mockItems,
        getItemId,
      })
    )

    expect(result.current.selectedCount).toBe(0)
    expect(result.current.isAllSelected).toBe(false)
  })

  it('should select single item', () => {
    const { result } = renderHook(() =>
      useBulkSelection({
        items: mockItems,
        getItemId,
      })
    )

    act(() => {
      result.current.toggle('1')
    })

    expect(result.current.isSelected('1')).toBe(true)
    expect(result.current.selectedCount).toBe(1)
  })

  it('should toggle selection', () => {
    const { result } = renderHook(() =>
      useBulkSelection({
        items: mockItems,
        getItemId,
      })
    )

    act(() => {
      result.current.toggle('1')
    })

    expect(result.current.isSelected('1')).toBe(true)

    act(() => {
      result.current.toggle('1')
    })

    expect(result.current.isSelected('1')).toBe(false)
  })

  it('should select all items', () => {
    const { result } = renderHook(() =>
      useBulkSelection({
        items: mockItems,
        getItemId,
      })
    )

    act(() => {
      result.current.selectAll()
    })

    expect(result.current.selectedCount).toBe(3)
    expect(result.current.isAllSelected).toBe(true)
    expect(result.current.isSelected('1')).toBe(true)
    expect(result.current.isSelected('2')).toBe(true)
    expect(result.current.isSelected('3')).toBe(true)
  })

  it('should deselect all items', () => {
    const { result } = renderHook(() =>
      useBulkSelection({
        items: mockItems,
        getItemId,
      })
    )

    act(() => {
      result.current.selectAll()
    })

    expect(result.current.selectedCount).toBe(3)

    act(() => {
      result.current.deselectAll()
    })

    expect(result.current.selectedCount).toBe(0)
    expect(result.current.isAllSelected).toBe(false)
  })

  it('should get selected items', () => {
    const { result } = renderHook(() =>
      useBulkSelection({
        items: mockItems,
        getItemId,
      })
    )

    act(() => {
      result.current.toggle('1')
      result.current.toggle('2')
    })

    const selected = result.current.getSelectedItems()

    expect(selected).toHaveLength(2)
    expect(selected).toContainEqual(mockItems[0])
    expect(selected).toContainEqual(mockItems[1])
  })

  it('should call onSelectionChange callback', () => {
    const onSelectionChange = jest.fn()

    const { result } = renderHook(() =>
      useBulkSelection({
        items: mockItems,
        getItemId,
        onSelectionChange,
      })
    )

    act(() => {
      result.current.toggle('1')
    })

    expect(onSelectionChange).toHaveBeenCalledWith(['1'])

    act(() => {
      result.current.toggle('2')
    })

    expect(onSelectionChange).toHaveBeenCalledWith(['1', '2'])
  })

  it('should handle item list changes', () => {
    const { result, rerender } = renderHook(
      ({ items }) =>
        useBulkSelection({
          items,
          getItemId,
        }),
      {
        initialProps: { items: mockItems },
      }
    )

    act(() => {
      result.current.selectAll()
    })

    expect(result.current.selectedCount).toBe(3)

    // Update items list
    const newItems = [
      { id: '1', name: 'Item 1' },
      { id: '4', name: 'Item 4' },
    ]

    rerender({ items: newItems })

    // Selection should still work with new items
    expect(result.current.isSelected('1')).toBe(true)
    expect(result.current.isSelected('2')).toBe(false) // Not in new list
  })
})
