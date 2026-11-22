import type { Goal, Level, Sport, SportSession } from './types'
import { LEVELS } from './types'

export interface Drill {
  id: string
  sport: Sport
  name: string
  focus: string
  level: Level
  minutes: number
  steps: string[]
  tip: string
}

const d = (
  id: string,
  sport: Sport,
  name: string,
  focus: string,
  level: Level,
  minutes: number,
  steps: string[],
  tip: string,
): Drill => ({ id, sport, name, focus, level, minutes, steps, tip })

export const DRILLS: Drill[] = [
  // ---------- Tennis ----------
  d(
    't-mini',
    'tennis',
    'Mini tennis rally',
    'Touch',
    'beginner',
    8,
    [
      'Stand inside the service boxes, one each side of the net.',
      'Rally softly with easy, slow strokes.',
      'Count how many in a row you can keep going, then beat it.',
    ],
    'Keep your racket head up and your feet moving in tiny steps.',
  ),
  d(
    't-shadow',
    'tennis',
    'Shadow swings',
    'Technique',
    'beginner',
    6,
    [
      'Stand in a ready position, knees bent.',
      'Do 10 forehands slowly, turning your shoulders first.',
      'Do 10 backhands, then 10 of each again a little faster.',
    ],
    'Finish each swing high over the opposite shoulder.',
  ),
  d(
    't-fh-cross',
    'tennis',
    'Cross-court forehands',
    'Forehand',
    'beginner',
    10,
    [
      'Both players stay on the same side, rally cross-court.',
      'Aim to land every ball past the service line.',
      'Swap sides after 5 minutes.',
    ],
    'Cross-court is the longest and safest shot because the net is lowest in the middle.',
  ),
  d(
    't-bh-cross',
    'tennis',
    'Cross-court backhands',
    'Backhand',
    'beginner',
    10,
    [
      'Rally cross-court on your backhand side only.',
      'Turn your shoulders early, before the ball bounces.',
      'Go for 10 balls in a row, then reset.',
    ],
    'Hit through the ball rather than slapping at it.',
  ),
  d(
    't-serve-box',
    'tennis',
    'Serve to targets',
    'Serve',
    'beginner',
    12,
    [
      'Place a towel or cone in each corner of the service box.',
      'Hit 10 serves to each target.',
      'Write down how many land in the box.',
    ],
    'Toss the ball slightly in front of you, not over your head.',
  ),
  d(
    't-volley',
    'tennis',
    'Volley wall',
    'Net play',
    'improver',
    8,
    [
      'Stand 3 metres from a wall.',
      'Volley the ball back without letting it bounce, forehand then backhand.',
      'Take two steps back each time you reach 20 in a row.',
    ],
    'Punch the ball with a short motion and keep the racket in front.',
  ),
  d(
    't-approach',
    'tennis',
    'Approach and volley',
    'Net play',
    'improver',
    12,
    [
      'Your partner feeds a short ball.',
      'Hit it deep and move forward to the net.',
      'Finish the point with a volley.',
    ],
    'Split-step just as your partner hits the ball.',
  ),
  d(
    't-footwork',
    'tennis',
    'Baseline side-to-side',
    'Footwork',
    'improver',
    8,
    [
      'Shuffle from one singles sideline to the other for 30 seconds.',
      'Rest 30 seconds and repeat 6 times.',
      'Touch each line with your racket hand.',
    ],
    'Stay low and keep your steps small and quick.',
  ),
  d(
    't-second',
    'tennis',
    'Second serve with spin',
    'Serve',
    'advanced',
    12,
    [
      'Brush up the back of the ball to add topspin.',
      'Hit 20 second serves aiming 2 metres above the net.',
      'Keep a score: 15 or more in is a pass.',
    ],
    'Spin gives you margin, so the ball dips into the box.',
  ),
  d(
    't-pattern',
    'tennis',
    'Serve plus one',
    'Tactics',
    'advanced',
    15,
    [
      'Serve wide, then hit your first ball to the open court.',
      'Play out 10 points starting this way.',
      'Swap and repeat with a serve down the middle.',
    ],
    'Decide where the first ball goes before you toss.',
  ),

  // ---------- Badminton ----------
  d(
    'b-grip',
    'badminton',
    'Grip and wrist warm-up',
    'Technique',
    'beginner',
    5,
    [
      'Hold the racket like a handshake.',
      'Flick the shuttle up and down with just your wrist, 20 times.',
      'Switch to backhand grip and repeat.',
    ],
    'A loose grip gives more wrist speed. Squeeze only at impact.',
  ),
  d(
    'b-clear',
    'badminton',
    'Clears to the back',
    'Clear',
    'beginner',
    10,
    [
      'Stand at the back of the court with a partner.',
      'Hit high clears so the shuttle drops near the opposite baseline.',
      'Aim for 10 good clears in a row.',
    ],
    'Reach up and hit the shuttle at the highest point you can.',
  ),
  d(
    'b-drop',
    'badminton',
    'Drop shots',
    'Net play',
    'beginner',
    10,
    [
      'From mid-court, play a soft drop shot over the net.',
      'Your partner lifts it back, then you repeat.',
      'Try to land it just past the net tape.',
    ],
    'Use the same swing as a clear, then slow it down at the end.',
  ),
  d(
    'b-serve',
    'badminton',
    'Short serve accuracy',
    'Serve',
    'beginner',
    8,
    [
      'Put a towel just behind the short service line.',
      'Hit 20 short serves aiming at the towel.',
      'Repeat with a long, high serve to the back line.',
    ],
    'Keep the shuttle below your waist when you hit it.',
  ),
  d(
    'b-footwork',
    'badminton',
    'Six-corner footwork',
    'Footwork',
    'improver',
    8,
    [
      'Place cones in the six corners of your half of the court.',
      'Start in the middle, move to a corner and swing, then return to the middle.',
      'Go around all six corners, 4 times, resting 30 seconds between rounds.',
    ],
    'Always push back to the centre, the base position, after every shot.',
  ),
  d(
    'b-smash',
    'badminton',
    'Smash and defend',
    'Smash',
    'improver',
    12,
    [
      'Your partner lifts, you smash straight.',
      'Your partner defends with a block to the net.',
      'Swap roles after 10 smashes.',
    ],
    'Rotate your forearm at impact and snap the wrist down.',
  ),
  d(
    'b-net',
    'badminton',
    'Net spin and tumble',
    'Net play',
    'advanced',
    10,
    [
      'Play only at the net with a partner, 3 metres apart.',
      'Brush the shuttle so it tumbles over the tape.',
      'Count 15 in a row, then add cross-court variations.',
    ],
    'Cut under the shuttle with a small fingertip motion.',
  ),
  d(
    'b-multi',
    'badminton',
    'Multi-shuttle feed',
    'Stamina',
    'advanced',
    10,
    [
      'Your partner feeds 20 shuttles quickly to different corners.',
      'Return every shuttle with control, not just power.',
      'Rest 60 seconds and do 3 rounds.',
    ],
    'Breathe out on every shot to stay relaxed when tired.',
  ),
  d(
    'b-double',
    'badminton',
    'Doubles rotation',
    'Tactics',
    'improver',
    12,
    [
      'Play half-court doubles, front and back.',
      'Attack with side-by-side when you have the lift, and front-and-back when defending.',
      'Call "mine" or "yours" every time.',
    ],
    'Talking to your partner wins more points than hitting harder.',
  ),

  // ---------- Swimming ----------
  d(
    's-float',
    'swimming',
    'Float and kick',
    'Technique',
    'beginner',
    8,
    [
      'Hold the wall and put your face in the water, breathing out slowly.',
      'Push off and glide on your front with a float, kicking gently.',
      'Do 4 lengths of 25 metres with 20 seconds rest between.',
    ],
    'Kick from your hips with loose ankles, not from your knees.',
  ),
  d(
    's-breath',
    'swimming',
    'Side breathing',
    'Breathing',
    'beginner',
    10,
    [
      'Swim freestyle and turn your head to the side every 3 strokes.',
      'Breathe out under water, in above it.',
      'Do 6 x 25 metres with 20 seconds rest.',
    ],
    'Keep one goggle in the water when you turn to breathe.',
  ),
  d(
    's-catchup',
    'swimming',
    'Catch-up freestyle',
    'Technique',
    'beginner',
    10,
    [
      'Swim freestyle, but keep one hand stretched out until the other touches it.',
      'Then switch arms.',
      'Do 6 x 25 metres with 20 seconds rest.',
    ],
    'Stretch long and reach forward for every stroke.',
  ),
  d(
    's-pull',
    'swimming',
    'Pull buoy set',
    'Strength',
    'beginner',
    10,
    [
      'Put a pull buoy between your thighs.',
      'Swim 4 x 50 metres using only your arms.',
      'Rest 30 seconds between lengths.',
    ],
    'Keep your hips high and pull with a bent elbow.',
  ),
  d(
    's-steady',
    'swimming',
    'Steady 400',
    'Stamina',
    'improver',
    12,
    [
      'Swim 400 metres continuously at an easy pace.',
      'Count strokes per length and try to keep it the same.',
      'Rest 1 minute, then swim 200 metres a little faster.',
    ],
    'Pace yourself: you should be able to say a short sentence at the wall.',
  ),
  d(
    's-intervals',
    'swimming',
    'Interval 8 x 50',
    'Stamina',
    'improver',
    15,
    [
      'Swim 8 x 50 metres, leaving every 1 minute 10 seconds.',
      'Rest in the time left over before each push-off.',
      'Finish with 100 metres easy.',
    ],
    'Check your first and last 50 times. They should be close.',
  ),
  d(
    's-back',
    'swimming',
    'Backstroke basics',
    'Technique',
    'improver',
    10,
    [
      'Lie flat with your ears under water and look up at the ceiling.',
      'Swim 4 x 25 metres with a steady kick.',
      'Rotate your shoulders with each arm pull.',
    ],
    'Keep your hips up by pressing your chest toward the water.',
  ),
  d(
    's-breast',
    'swimming',
    'Breaststroke timing',
    'Technique',
    'improver',
    10,
    [
      'Pull, breathe, kick, glide.',
      'Say the four words out loud as you swim.',
      'Do 6 x 25 metres focusing on a long glide.',
    ],
    'Glide for a full second before starting the next pull.',
  ),
  d(
    's-1k',
    'swimming',
    'Non-stop 1 km',
    'Stamina',
    'advanced',
    25,
    [
      'Swim 1000 metres without stopping at the wall for more than 5 seconds.',
      'Count your laps on your fingers or use a lap counter.',
      'Aim to beat your last time.',
    ],
    'Start slower than you think you should.',
  ),
  d(
    's-tumble',
    'swimming',
    'Flip turns',
    'Technique',
    'advanced',
    10,
    [
      'Practise at the shallow end: swim in, tuck and roll.',
      'Push off on your side and rotate to your front under water.',
      'Do 8 turns in a row, then add them to a 50-metre swim.',
    ],
    'Tuck your chin and keep your arms close to your head.',
  ),
]

export const WARMUP: Record<Sport, string[]> = {
  tennis: [
    'Jog around the court twice',
    'Arm circles and shoulder rolls, 30 seconds',
    'Mini tennis for 3 minutes',
  ],
  badminton: [
    'Skip or jog on the spot for 2 minutes',
    'Shoulder and wrist circles',
    'Gentle clears with a partner for 3 minutes',
  ],
  swimming: [
    'Easy 100 metres of any stroke',
    'Arm swings out of the water',
    '4 x 25 metres at a relaxed pace',
  ],
}
export const COOLDOWN: Record<Sport, string[]> = {
  tennis: ['Walk for 2 minutes', 'Stretch your shoulders, calves and wrists, 20 seconds each'],
  badminton: ['Walk for 2 minutes', 'Stretch your shoulders, quads and calves, 20 seconds each'],
  swimming: ['Easy 100 metres of backstroke', 'Stretch your shoulders and chest, 20 seconds each'],
}

const levelIndex = (l: Level) => LEVELS.indexOf(l)

export function drillsFor(sport: Sport): Drill[] {
  return DRILLS.filter((x) => x.sport === sport)
}

export interface CoachPlan {
  warmup: string[]
  drills: Drill[]
  cooldown: string[]
  minutes: number
  why: string
}

/**
 * Picks 3 drills for today: ones that suit your level, favouring skills you
 * have practised least in the last 30 days, with one tougher drill when you
 * have already trained recently. Plain rules, no AI service.
 */
export function coachPlan(
  sport: Sport,
  level: Level,
  sessions: SportSession[],
  goals: Goal[],
  today: string,
): CoachPlan {
  const since = new Date(`${today}T12:00:00Z`)
  since.setUTCDate(since.getUTCDate() - 30)
  const cutoff = since.toISOString().slice(0, 10)
  const recent = sessions.filter((s) => s.sport === sport && s.date >= cutoff)
  const done = new Map<string, number>()
  for (const s of recent) for (const id of s.drills) done.set(id, (done.get(id) ?? 0) + 1)

  const all = drillsFor(sport)
  const allowed = all.filter((x) => levelIndex(x.level) <= levelIndex(level))
  const focusCount = new Map<string, number>()
  for (const x of all) focusCount.set(x.focus, 0)
  for (const x of allowed)
    focusCount.set(x.focus, (focusCount.get(x.focus) ?? 0) + (done.get(x.id) ?? 0))

  const goalText = goals
    .filter((g) => !g.done)
    .map((g) => g.text.toLowerCase())
    .join(' ')
  const wanted = (x: Drill) => (goalText.includes(x.focus.toLowerCase()) ? -1 : 0)

  const ranked = [...allowed].sort(
    (a, b) =>
      (focusCount.get(a.focus) ?? 0) +
        (done.get(a.id) ?? 0) +
        wanted(a) -
        ((focusCount.get(b.focus) ?? 0) + (done.get(b.id) ?? 0) + wanted(b)) ||
      a.id.localeCompare(b.id),
  )
  const picked: Drill[] = []
  const usedFocus = new Set<string>()
  for (const x of ranked) {
    if (picked.length >= 3) break
    if (usedFocus.has(x.focus)) continue
    picked.push(x)
    usedFocus.add(x.focus)
  }
  const trainedRecently = recent.length >= 3
  if (trainedRecently && level !== 'advanced') {
    const next = LEVELS[levelIndex(level) + 1]
    const stretch = all.find((x) => x.level === next && !picked.includes(x))
    if (stretch) picked[picked.length - 1] = stretch
  }
  const minutes = picked.reduce((n, x) => n + x.minutes, 0) + 10
  const first = picked[0]
  const why =
    recent.length === 0
      ? `A first session at ${level} level. Start easy and focus on good form. Today leads with ${first?.focus.toLowerCase() ?? 'technique'}.`
      : trainedRecently && level !== 'advanced'
        ? `You trained ${recent.length} times in the last 30 days, so one drill is a step up. The others cover skills you have practised least.`
        : `Picked from the skills you have practised least in the last 30 days, starting with ${first?.focus.toLowerCase() ?? 'technique'}.`
  return { warmup: WARMUP[sport], drills: picked, cooldown: COOLDOWN[sport], minutes, why }
}
