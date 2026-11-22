/** Dates are plain 'YYYY-MM-DD' strings in the household's local time. */
export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0)
}

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000)
}

/** Monday of the week containing the date. */
export function startOfWeek(iso: string): string {
  const d = parseISO(iso)
  const diff = (d.getDay() + 6) % 7
  return addDays(iso, -diff)
}

export function weekDays(startIso: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(startIso, i))
}

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function shortDay(iso: string): string {
  const d = parseISO(iso)
  return `${DAY[d.getDay()]} ${d.getDate()} ${MONTH[d.getMonth()]}`
}

export function weekdayName(iso: string): string {
  return DAY[parseISO(iso).getDay()]
}

export function longDate(iso: string): string {
  const d = parseISO(iso)
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  return `${names[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

export function todayISO(now: Date = new Date()): string {
  return toISO(now)
}

export function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function ageFromBirthYear(birthYear: number, now: Date = new Date()): number {
  return now.getFullYear() - birthYear
}
