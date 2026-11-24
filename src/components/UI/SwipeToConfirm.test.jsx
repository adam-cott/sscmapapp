import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { STORAGE_KEYS } from '../../constants/storageKeys'
import SwipeToConfirm from './SwipeToConfirm'
import SettingsTab from '../Tabs/SettingsTab'

beforeEach(() => localStorage.clear())

describe('Accessibility options', () => {
  it('no tap button unless the switch is on', () => {
    render(<SwipeToConfirm onConfirm={vi.fn()} />)
    expect(screen.queryByText('Tap to redeem')).toBeNull()
  })

  it('Settings switch turns the tap button on, and it redeems only on the second tap', () => {
    render(<SettingsTab />)
    const toggle = screen.getByRole('switch', { name: /accessibility options/i })
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-checked')).toBe('true')
    expect(localStorage.getItem(STORAGE_KEYS.accessibility)).toBe('1')

    const onConfirm = vi.fn()
    render(<SwipeToConfirm onConfirm={onConfirm} />)
    fireEvent.click(screen.getByText('Tap to redeem'))
    expect(onConfirm).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('Tap again to confirm'))
    fireEvent.click(screen.getByText('Tap again to confirm'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('no tap button on a used-up deal', () => {
    localStorage.setItem(STORAGE_KEYS.accessibility, '1')
    render(<SwipeToConfirm onConfirm={vi.fn()} disabled />)
    expect(screen.queryByText('Tap to redeem')).toBeNull()
  })
})
