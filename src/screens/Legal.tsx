import { Link } from '../components/Shell'

export function Privacy() {
  return (
    <div className="welcome" style={{ maxWidth: 680 }}>
      <Link to="/" className="small">
        Back
      </Link>
      <h1>Privacy</h1>
      <p className="banner">Draft for review. This text has not been checked by a lawyer yet.</p>
      <h2>What we keep</h2>
      <p>
        Your name, email, a hashed password, your body details and calorie targets, your dishes,
        plan, meal history, kitchen items and shopping list. Your partner in the same household can
        see the shared parts.
      </p>
      <h2>What we do not do</h2>
      <p>
        We do not sell your data, show ads, or use it to train anything. Calorie targets are
        estimates and not medical advice.
      </p>
      <h2>Where it lives</h2>
      <p>
        On Cloudflare’s servers. Reminder messages go through your device’s own push service.
        Password reset emails are sent through Resend.
      </p>
      <h2>Your choices</h2>
      <p>
        Download everything or delete your account any time from Account. Deleting removes your
        data. If you are the last person in a household, the household goes too.
      </p>
    </div>
  )
}

export function Terms() {
  return (
    <div className="welcome" style={{ maxWidth: 680 }}>
      <Link to="/" className="small">
        Back
      </Link>
      <h1>Terms</h1>
      <p className="banner">Draft for review. This text has not been checked by a lawyer yet.</p>
      <h2>Using Choplife</h2>
      <p>
        Choplife is a meal planning tool. It is free to use and provided as it is. Keep your
        password safe and use the app lawfully.
      </p>
      <h2>Not medical advice</h2>
      <p>
        Calorie and portion numbers are estimates. Allergy checks look at dish names and ingredients
        you list, so always check labels yourself. Talk to a doctor or dietitian before changing
        your diet, especially if you have a health condition.
      </p>
      <h2>Your content</h2>
      <p>
        The dishes and notes you add belong to you. We may remove accounts that abuse the service.
      </p>
    </div>
  )
}
