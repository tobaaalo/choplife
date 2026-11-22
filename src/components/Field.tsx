import { useId } from 'react'
import type { ComponentProps, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface Base {
  label: string
  hint?: string
  error?: string | null
}

function Wrap({ id, label, hint, error, children }: Base & { id: string; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && (
        <span className="hint" id={`${id}-h`}>
          {hint}
        </span>
      )}
      {error && (
        <span className="err" id={`${id}-e`} role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

export function TextField({ label, hint, error, ...rest }: Base & ComponentProps<'input'>) {
  const id = useId()
  return (
    <Wrap id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined}
        {...rest}
      />
    </Wrap>
  )
}

export function TextArea({
  label,
  hint,
  error,
  ...rest
}: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <Wrap id={id} label={label} hint={hint} error={error}>
      <textarea id={id} className="textarea" aria-invalid={error ? true : undefined} {...rest} />
    </Wrap>
  )
}

export function SelectField({
  label,
  hint,
  error,
  children,
  ...rest
}: Base & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId()
  return (
    <Wrap id={id} label={label} hint={hint} error={error}>
      <select id={id} className="select" {...rest}>
        {children}
      </select>
    </Wrap>
  )
}
