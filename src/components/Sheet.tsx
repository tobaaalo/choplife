import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { Icon } from './Icon'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

/** A native dialog: gives us the focus trap, Escape to close and a backdrop for free. */
export function Sheet({ open, title, onClose, children, footer }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  // Click on the backdrop (the dialog element itself) closes the sheet.
  useEffect(() => {
    const d = ref.current
    if (!d) return
    const onClick = (e: MouseEvent) => {
      if (e.target === d) onClose()
    }
    d.addEventListener('click', onClick)
    return () => d.removeEventListener('click', onClick)
  }, [onClose])

  return (
    <dialog ref={ref} className="sheet" aria-labelledby={titleId} onClose={onClose}>
      {open && (
        <>
          <div className="sheet-head">
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              <Icon name="x" />
            </button>
          </div>
          <div className="sheet-body">{children}</div>
          {footer && <div className="sheet-foot">{footer}</div>}
        </>
      )}
    </dialog>
  )
}
