export const GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio'] as const
export type Group = (typeof GROUPS)[number]

export interface Exercise {
  name: string
  group: Group
  /** Cardio is logged as minutes in the reps box and 0 kg. */
  note?: string
}

export const EXERCISES: Exercise[] = [
  { name: 'Bench press', group: 'Chest' },
  { name: 'Incline dumbbell press', group: 'Chest' },
  { name: 'Dumbbell fly', group: 'Chest' },
  { name: 'Push-up', group: 'Chest' },
  { name: 'Cable crossover', group: 'Chest' },
  { name: 'Chest dip', group: 'Chest' },
  { name: 'Deadlift', group: 'Back' },
  { name: 'Barbell row', group: 'Back' },
  { name: 'Pull-up', group: 'Back' },
  { name: 'Lat pulldown', group: 'Back' },
  { name: 'Seated cable row', group: 'Back' },
  { name: 'One-arm dumbbell row', group: 'Back' },
  { name: 'Face pull', group: 'Back' },
  { name: 'Back squat', group: 'Legs' },
  { name: 'Front squat', group: 'Legs' },
  { name: 'Leg press', group: 'Legs' },
  { name: 'Romanian deadlift', group: 'Legs' },
  { name: 'Walking lunge', group: 'Legs' },
  { name: 'Bulgarian split squat', group: 'Legs' },
  { name: 'Leg curl', group: 'Legs' },
  { name: 'Leg extension', group: 'Legs' },
  { name: 'Calf raise', group: 'Legs' },
  { name: 'Hip thrust', group: 'Legs' },
  { name: 'Overhead press', group: 'Shoulders' },
  { name: 'Dumbbell shoulder press', group: 'Shoulders' },
  { name: 'Lateral raise', group: 'Shoulders' },
  { name: 'Rear delt fly', group: 'Shoulders' },
  { name: 'Upright row', group: 'Shoulders' },
  { name: 'Barbell curl', group: 'Arms' },
  { name: 'Hammer curl', group: 'Arms' },
  { name: 'Triceps pushdown', group: 'Arms' },
  { name: 'Skull crusher', group: 'Arms' },
  { name: 'Close-grip bench press', group: 'Arms' },
  { name: 'Plank', group: 'Core', note: 'Log seconds in the reps box' },
  { name: 'Hanging leg raise', group: 'Core' },
  { name: 'Cable crunch', group: 'Core' },
  { name: 'Russian twist', group: 'Core' },
  { name: 'Ab wheel rollout', group: 'Core' },
  { name: 'Treadmill run', group: 'Cardio', note: 'Log minutes in the reps box' },
  { name: 'Rowing machine', group: 'Cardio', note: 'Log minutes in the reps box' },
  { name: 'Cycling', group: 'Cardio', note: 'Log minutes in the reps box' },
  { name: 'Stairs', group: 'Cardio', note: 'Log minutes in the reps box' },
]

export const TEMPLATES: { name: string; exercises: string[] }[] = [
  {
    name: 'Push',
    exercises: [
      'Bench press',
      'Overhead press',
      'Incline dumbbell press',
      'Lateral raise',
      'Triceps pushdown',
    ],
  },
  {
    name: 'Pull',
    exercises: ['Deadlift', 'Pull-up', 'Barbell row', 'Face pull', 'Barbell curl'],
  },
  {
    name: 'Legs',
    exercises: ['Back squat', 'Romanian deadlift', 'Leg press', 'Leg curl', 'Calf raise'],
  },
  {
    name: 'Full body A',
    exercises: ['Back squat', 'Bench press', 'Barbell row', 'Plank'],
  },
  {
    name: 'Full body B',
    exercises: ['Deadlift', 'Overhead press', 'Lat pulldown', 'Walking lunge', 'Hammer curl'],
  },
  {
    name: 'Upper body',
    exercises: [
      'Bench press',
      'Barbell row',
      'Dumbbell shoulder press',
      'Lat pulldown',
      'Barbell curl',
      'Triceps pushdown',
    ],
  },
]
