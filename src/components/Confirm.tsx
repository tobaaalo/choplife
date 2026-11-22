import type { ReactNode } from 'react'
import { Sheet } from './Sheet'

interface Props {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  children?: ReactNode
}

/** For the few actions that cannot be undone. Everything else uses an undo toast. */
export function Confirm({ open, title, body, confirmLabel, onConfirm, onCancel, children }: Props) {
  return (
    <Sheet
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p>{body}</p>
      {children}
    </Sheet>
  )
}
