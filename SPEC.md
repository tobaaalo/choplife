# Choplife: Spec (v1.1, awaiting approval)

Name: **Choplife**. Owner: Toba. Written 21 Nov 2026, updated after review.

## 1. What it is

A web app for two people, Toba and his wife, who cook one meal but have opposite goals: he is gaining weight, she is losing it. The app plans the week, shows each person their own portion of the same meal, keeps a pantry and a shared shopping list, and nudges them before each meal. The aim is that nobody ever asks "what should we eat?" again.

It installs to the phone home screen (PWA) and each person has their own login. It is built for Toba and his wife first, but **any household can sign up**, and every household's data is private to it. It runs on Cloudflare.

It is an original app. It is inspired by features seen in a paid app, with no code or data taken from it.

## 2. Decisions from the interview

| Topic | Decision |
|---|---|
| Data and login | Cloudflare. Each person has their own account, and the two people in a household see the same plan. |
| Look | **Hand-crafted paper.** Recipe-card and kitchen-notebook feel. |
| Wife's target | Calculated from her stats, then she can overwrite it with her programme's numbers. Same for Toba. |
| Recipes | Added in the app by the user. Calories are typed in by the user. Reference dishes are pre-loaded as names only. |
| Planning | Auto-plan the week, then swap or move anything. |
| Portions | Each person's portion is scaled to their own per-meal target. |
| Extras in v1 | Pantry and "What can I cook now?", shared shopping list, meal reminders. |
| Not in v1 | Ask chat assistant (needs an API key and has running cost). |
| Food rules | Allergies and foods they won't eat, set per person. |
| Phones | Mobile first, installable. Desktop works but is secondary. |
| Name | **Choplife** |
| Households | Open to other households. Each household is two people with a private plan, pantry, list and recipes. Includes account management (section 6.8). |
| Starter dishes | All dishes from the reference lists, de-duplicated and pre-tagged, names only. Shared catalogue. Each household adds its own calories. |
| Recommendations | The app suggests meals and also takes a hint from the user: "What do you feel like?" with mood chips and a free-text hint (section 6.9). It is not a fixed list. |

## 3. Users

- **Toba** (goal: gain). **Wife** (goal: lose, follows a programme with its own numbers).
- Both are adults. The UI stays calm: one purpose per screen, normal-sized type, no flashing or game-like elements.
- Anyone can sign up and **create a household**, which gives them a **6-character invite code** for their partner. The second person signs up with the code. A household holds 2 people in v1, and there is no limit on households.
- Households cannot see each other. The only shared data is the read-only starter dishes catalogue.

Five-second test: opening the app shows today's meals with the two portions side by side and one obvious button per meal.

## 4. Core idea: one meal, two portions

- A recipe has calories (and optional protein, carbs, fat) for **one standard serving**.
- Each person has a daily target and a share per meal slot (default: breakfast 25%, lunch 35%, dinner 40%, adjustable, snacks off by default).
- **Portion multiplier = person's meal target divided by the recipe's calories per serving**, rounded to the nearest 0.25x and kept between 0.5x and 2.5x.
- If a meal cannot reach a person's target inside those limits, the card says so plainly (for example "Hits 70% of Toba's lunch target. Add a side?") rather than hiding it.
- Day totals are shown per person against their own target.

## 5. Calorie targets

- **Calculated:** Mifflin-St Jeor, times an activity factor (1.2, 1.375, 1.55, 1.725, 1.9), plus a goal adjustment: gain +400 kcal, lose -500 kcal, maintain 0. All three numbers are editable.
- **Override:** each person can type their own daily calories, and optionally protein, carbs and fat in grams. An override wins over the calculation and is labelled "From your programme".
- **Macros default:** protein 1.6 g per kg body weight, fat 25% of calories, carbs the rest.
- **Safety:** targets under 1,200 kcal show a quiet note suggesting the person checks it with their programme provider. It never blocks. A short "General food guidance, not medical advice" line sits in Settings.

## 6. Screens

Bottom navigation, five tabs: **Today, Week, Recipes, Kitchen, List**. Settings opens from the header.

### 6.1 First run
1. **Welcome:** one screen, "Plan the week together." Buttons: Start a household, Join with a code.
2. **Account:** name, email, password (min 8 characters). Errors explain the fix.
3. **Household:** creator sees the invite code to share. Joiner enters a code.
4. **About you (per person):** sex for the formula, birth year, height, weight, activity, goal.
5. **Your target:** shows the calculated number with a "Use my programme's numbers instead" option.
6. **Food rules:** allergies (common list plus free text) and foods you will not eat.
7. **Meal times:** which meals you eat and when.
8. **Starter dishes:** "We added [N] starter dishes. Add calories to the ones you cook, and they join the plan." Then lands on Today. The count is the real number after de-duplication.

Each step is skippable except account. The second person only sees steps 4 to 6 for themselves.

### 6.2 Today
- Date, and "Next up" with time.
- Two small progress rows: Toba and wife, each showing calories eaten against their target (and macros if set).
- One card per meal: dish, cook time, both portions side by side ("Toba 1.5x, wife 0.75x"), the pantry match ("3 of 5 ingredients at home").
- Actions per meal: **Cook** (recipe view), **Swap**, **Mark eaten**, **Skip**. Mark eaten is per person, since one of you may eat later.
- "We ate something else": log a custom item with calories.
- **What do you feel like?** button under the next meal opens the recommender (6.9).
- Empty: "Nothing planned today. Plan the week" with one button.

### 6.3 Week
- Seven days, three meal slots each, shown as a compact table.
- Button: **Plan my week** (auto-plan). After the first plan the button becomes **Re-plan unplanned meals**. Meals already eaten or marked locked are never changed.
- Tap a slot: swap (shows recommendations first, with the same mood chips as 6.9), clear, or lock.
- Day total chips show each person within or outside target.
- Undo for 6 seconds after any clear or re-plan.

### 6.4 Recipes
- List with search and filters: meal type, quick (under 30 min), uses my pantry, **needs calories**.
- Recipe editor: name, meal types, cook minutes, calories per serving (required to be plannable), optional macros, ingredients (name, amount, unit, aisle), steps, notes, tags such as swallow, soup, rice, beans.
- Dishes missing calories show a small "Add calories" marker and are left out of planning.
- **Add many at once:** paste a list of dish names, one per line.
- Duplicate and delete (with undo).

### 6.5 Kitchen (pantry)
- Add by typing, with quick-add chips for common items (including garri, palm oil, egusi, crayfish, yam, plantain, beans).
- **What can I cook now?** lists recipes ranked by how many ingredients are at home, with the missing ones named.
- Items can have an optional quantity. Ticked-off shopping items move here.

### 6.6 List (shopping)
- Built from the planned week, minus what is in the pantry, grouped by aisle.
- Quantities are summed across recipes.
- Tick to buy, and ticked items move into the pantry. Add your own items. Share as text to WhatsApp or copy.
- Both phones see the same list with ticks updating shortly after (checked again on focus and every 20 seconds while open).
- Empty: "Plan the week and your list builds itself."

### 6.7 Settings
- Profile and targets (per person), food rules, meal times.
- Reminders: toggle, one hour before each meal by default, plus a Saturday shopping nudge. Quiet hours.
- Household: invite code, members, sign out.
- Your data: export as JSON, delete my account.

### 6.8 Account management
- Sign up, log in, log out, stay signed in on this phone.
- **Forgot password:** emailed reset link that expires in 30 minutes. This needs an email-sending service (see section 13).
- Change name, email (re-verified), and password. Log out of other devices.
- Household: show and regenerate the invite code, remove the partner, leave the household, transfer who created it. A household with nobody left is deleted after 30 days.
- Export my data (JSON) and delete my account (type the email to confirm). Deleting the last member deletes the household's data.
- Privacy policy and terms pages linked from sign-up, with plain-language wording about what is stored.

### 6.9 What do you feel like? (recommendations)
Opened from Today, and used inside Swap. It has two ways in, and the user can mix them:

1. **Suggest for me:** the app shows 3 to 5 meals for the slot, ranked, each with the reason in plain words ("Spicy, 25 min, 4 of 6 ingredients at home, fits both of you") and both portions. A **Show me more** button gives the next batch.
2. **Tell it what you feel like:**
   - Mood chips (multi-select): **Spicy, Swallow and soup, Rice, Beans, Yam or plantain, Pasta or noodles, Quick (under 30 min), Light, Hearty, Something new, Use what I have**.
   - An optional hint box, for example "something with plantain" or "not too heavy". The hint is matched against dish names, tags and ingredients with plain keyword matching, so it costs nothing to run. A smarter free-text reading with AI is a possible later add-on.

Each recommendation has **Cook this** (puts it in the slot for the chosen day), **Not this** (hides it for 14 days) and a heart (**Love it**, ranks it higher later). These give the app its taste memory for the household.

**Ranking** combines: how well it fits both people's meal targets, how well it matches the chosen moods and hint, pantry match, how long since it was last eaten, loved and hidden marks, and allergy and "won't eat" rules (hard filter). If a mood has no matches, the screen says so and shows the nearest ones.

**Tags** the app needs on each dish: heat (mild, medium, hot), type (swallow, soup, rice, beans, yam, plantain, pasta, noodles, egg, bread), cook minutes, and calories. Starter dishes arrive pre-tagged. The recipe editor lets the household change them.

## 7. Auto-planner rules

1. Eligible recipes need calories, a matching meal type, and must not break either person's allergies or "won't eat" list. A recipe that breaks one person's rules is excluded from shared meals.
2. No dish repeats within 4 days. Avoid the same main ingredient tag (rice, beans, yam) in consecutive slots.
3. Prefer recipes that use what is in the pantry.
4. Choose so each person's day total lands within 10% of their target after portion scaling, where possible.
5. Lunch and dinner can reuse leftovers: an optional "makes extra" flag lets a dinner feed the next day's lunch.
6. The planner is deterministic given a seed, so Re-plan can offer a different result. It runs in the browser and is covered by unit tests.
7. The planner and the recommender share one scoring module, so a meal the app recommends is one it could also have planned.

## 8. States on every screen

| State | Treatment |
|---|---|
| Empty | Friendly line and one action. |
| Loading | Skeleton shapes in the final layout, no layout shift. |
| Error | What happened and how to fix it, with a Try again button. |
| Success | Short confirmation such as "Saved" or a stamp on Mark eaten. |
| Offline | Small banner. The last synced plan, recipes, pantry and list stay readable. Changes made offline queue and sync when back online. |
| Destructive | Delete, clear and re-plan give Undo for 6 seconds instead of a confirm dialog. Delete account needs typing the email. |

## 9. Design system: hand-crafted paper

**Concept:** a family recipe box on a kitchen table. Cream paper, soft ink, rubber stamps and masking tape. Calm, warm and tactile, with normal-sized type.

**Fonts (Google Fonts):**
- Display: **Gloock**, a warm high-contrast serif, for page titles and dish names.
- Body: **Atkinson Hyperlegible**, for everything else. It is highly readable on small screens.
- Labels: **Special Elite** (typewriter), small, for stamps, tags and meal-slot labels.

None of these are used by Reel or Game Night.

**Palette (CSS variables):**

| Token | Value | Use |
|---|---|---|
| `--paper` | `#f4ecdb` | page background |
| `--paper-2` | `#ece1c8` | cards |
| `--paper-edge` | `#d8c9a8` | borders, torn edges |
| `--ink` | `#2b2219` | main text |
| `--ink-soft` | `#5e5040` | secondary text |
| `--stamp` | `#c0421b` | the one signature accent: primary buttons, stamps, focus |
| `--toba` | `#1f5c55` | Toba's portion and progress |
| `--wife` | `#6b2f55` | wife's portion and progress |
| `--ok` | `#3f7a3a` | within target |
| `--warn` | `#a8650c` | outside target |

The two person colours are always paired with a text label and initial, never colour alone. All text pairs are checked for WCAG AA during verification, and any that fail are adjusted.

**Type scale:** 12, 14, 16, 18, 22, 28, 36 px. Body is 16 px. No oversized headings or icons.
**Spacing:** 4, 8, 12, 16, 24, 32, 48.
**Radius:** 2 px on cards (paper has near-square corners), 999 px on pills.
**Shadows:** one soft contact shadow, as if paper rests on a table.
**Texture:** subtle paper grain generated in CSS and inline SVG, no image files.

**Signature details:**
1. **Rubber stamp.** Mark eaten presses a slightly rotated, ink-textured "EATEN" stamp onto the meal card with a short thud animation.
2. **Torn-ticket portions.** Each person's portion is a small ticket stub with a perforated edge, in their own colour, showing their multiplier and calories.
3. **Masking-tape corners** on the active card.

**Motion:** page-load fade and rise, card press states, the stamp animation, smooth list reordering. All of it is removed under `prefers-reduced-motion`.

## 10. Usability and accessibility

- One primary action per screen, in the stamp colour, in thumb reach.
- Plain-language labels and microcopy ("Plan my week", "Add calories", "We ate something else").
- Tap targets at least 44 px. Usable one-handed at 375 px.
- WCAG AA contrast, visible focus ring in the stamp colour, full keyboard support, semantic HTML, ARIA labels, live regions for portion and total updates.
- Keyboard: Tab order follows visual order, Enter and Space activate, Esc closes sheets, arrow keys move between tabs.
- No layout shift: fixed-size skeletons, font preloading with metric-matched fallbacks.

## 11. Technical plan

- **Frontend:** Vite, React, TypeScript (strict). TypeScript is pinned to 6.0.x for typescript-eslint. Plain CSS with variables, no UI kit.
- **Backend:** Cloudflare **Pages Functions** with a **D1** database (SQLite), so the address ends in pages.dev like Reel.
- **Auth:** email and password. Passwords hashed with PBKDF2 through WebCrypto. Sessions are random tokens in an HttpOnly, Secure, SameSite cookie, stored in D1. Login, sign-up and reset attempts are rate limited per email and per IP.
- **Multi-household:** every table row carries a household id, and every query is scoped to the signed-in user's household in one shared data-access layer. There is a test that a user from household A gets nothing from household B.
- **Email:** password reset and email change use one email-sending service (Resend is the planned one, free tier). It is called with plain HTTPS requests, so it adds no library.
- **PWA:** web manifest, icons, and a service worker that caches the app shell and the last synced data. On iPhone it must be added to the home screen first.
- **Reminders:** Web Push. Cron Triggers do not run on Pages, so a second tiny **cron Worker** (workers.dev address disabled) shares the same D1 and sends the pushes. It uses one small library for Web Push encryption. That is the only runtime library beyond React.
- **Data model:** users, households, profiles (stats, targets, overrides, food rules, meal times), starter dishes catalogue (shared, read-only), recipes (per household, with ingredients and tags), recipe feedback (loved, hidden until), plan entries (date, slot, recipe, locked, per-person status), custom eaten items, pantry items, shopping items, push subscriptions, password reset tokens.
- **Logic modules (pure, unit tested):** calorie targets, portion scaling, planner and recommender scoring, mood and hint matching, shopping aggregation, pantry matching, allergy filtering.
- **Tests:** Vitest for the logic modules. Playwright for the key flows: first run and join, two households staying separate, add recipe, auto-plan, "What do you feel like?" with chips and a hint, swap, mark eaten per person, shopping tick moves to pantry, offline banner. Screenshots at 375, 768 and 1440 px.

## 12. Out of scope for v1

- Ask chat assistant and photo calorie calculator.
- Kids and households of more than 2 people.
- Paid plans, admin dashboard, and social features between households.
- Sign-in with Google or Apple (email and password only in v1).
- Ordering ingredients, eat-out suggestions, grocery delivery.
- "What kind of eater are you" quiz, Food Wrapped, group food vote, a favourites page, progress charts.
- Subscriptions and billing.
- Gym tracking and sport coaching (later phases in the same app).
- Barcode scanning and a built-in calorie database.

## 13. Limits to know about

- I can build and test the whole app locally here, but I cannot deploy to your Cloudflare account, and I cannot test push notifications on a real iPhone. I will give you the exact deploy steps, and the first reminder test will be on your phones.
- Password reset by email only works once you add an email-sending API key (a free Resend account). Until then, the reset screen explains that it is not set up yet.
- Opening it to other households means real people's data. I will build in privacy basics (private data per household, export, deletion, hashed passwords), and draft the privacy policy and terms in plain wording, but I am not a lawyer, so have them checked before you invite people beyond friends.
- Cloudflare's free plan comfortably covers a few hundred households. Beyond that, expect a small monthly cost, mostly for reminders and email.
- Calories come from what you type in, so the plan is only as accurate as those numbers.
- Starter dishes carry names and tags only. The planner and recommender ignore a dish until the household adds calories to it.

## 14. Done means

- `npm run build`, `npm run typecheck`, `npm run lint` and `npm test` pass, with the output shown.
- Screenshots at 375, 768 and 1440 px for: welcome, sign up, join, each setup step, Today (empty, planned, eaten), Week (empty, planned, swap sheet), Recipes (list, editor, needs calories), Kitchen, List, Settings, offline banner, and error states.
- Every feature clicked through in a real browser, with the bugs fixed before I say it is done, including signing up two separate households and confirming they cannot see each other's data.
- A fresh reviewer agent has checked the work against this spec and the brief, and the real issues are fixed.
- CLAUDE.md records the final fonts, palette and style.
