import { useState } from 'react'
import { ALLERGY_OPTIONS, WONT_EAT_OPTIONS } from '../../shared/logic/rules'

interface Props {
  title: string
  kind: 'allergy' | 'wont'
  selected: string[]
  onChange: (next: string[]) => void
}

export function RulePicker({ title, kind, selected, onChange }: Props) {
  const options = kind === 'allergy' ? ALLERGY_OPTIONS : WONT_EAT_OPTIONS
  const [custom, setCustom] = useState('')
  const known = new Set(options.map((o) => o.key))
  const extras = selected.filter((s) => !known.has(s))

  const toggle = (key: string) =>
    onChange(selected.includes(key) ? selected.filter((s) => s !== key) : [...selected, key])

  function addCustom() {
    const v = custom.trim().toLowerCase()
    if (!v || selected.includes(v)) return
    onChange([...selected, v])
    setCustom('')
  }

  return (
    <fieldset className="stack tight" style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="label-row" style={{ fontWeight: 700, marginBottom: 8 }}>
        {title}
      </legend>
      <div className="chips">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            className="chip"
            aria-pressed={selected.includes(o.key)}
            onClick={() => toggle(o.key)}
          >
            {o.label}
          </button>
        ))}
        {extras.map((x) => (
          <button
            key={x}
            type="button"
            className="chip"
            aria-pressed="true"
            onClick={() => toggle(x)}
            aria-label={`Remove ${x}`}
          >
            {x} ✕
          </button>
        ))}
      </div>
      <div className="row">
        <input
          className="input"
          value={custom}
          placeholder="Something else…"
          aria-label={`Add to ${title.toLowerCase()}`}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addCustom()
            }
          }}
        />
        <button type="button" className="btn" onClick={addCustom} disabled={!custom.trim()}>
          Add
        </button>
      </div>
    </fieldset>
  )
}
