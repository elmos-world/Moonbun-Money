# 🌙 Moonbun Money

A cute, moon-themed budget tracker web app.

- **Yutu the Jade Rabbit** (from the tale of Chang'e) runs your everyday budget. The moon fills up as you save toward your monthly target, and a full moon means you hit it.
- **Bao the treasure dragon** guards your savings goals. Their coin pile grows as you save.
- Track income, spending, and savings, set budgets per category, check the spending calendar, and collect mooncake badges.
- Syncs between your phone and laptop with Firebase. It also works offline and can be installed on your home screen.

This project is **completely separate** from the fish app: it has its own GitHub repo and its own Firebase project.

---

## Step 1: Put it on GitHub Pages

1. Go to <https://github.com/new> and create a new repository named `moonbun-money`. Set it to **Public** (free GitHub Pages needs a public repo). Don't add a README; this one is already included.
2. On the new repo page, click **"uploading an existing file"**. Drag in **everything inside** the `moonbun-money` folder (`index.html`, `css`, `js`, `icons`, `sw.js`, and the rest), then click **Commit changes**.
   - `.nojekyll` is a hidden file, so if your computer hides it, that's okay. The app works without it.
3. Go to **Settings → Pages**. Under *Build and deployment*, set **Source: Deploy from a branch**, **Branch: `main` / `(root)`**, then click **Save**.
4. After a minute your app will be live at `https://YOUR-USERNAME.github.io/moonbun-money/`.

At this point it runs in **demo mode**, which saves data only on that one device.

## Step 2: Create a new Firebase project (for syncing)

1. Go to <https://console.firebase.google.com> and click **Create a project**. Name it something like `moonbun-money`. **Don't reuse the fish app's project.** Google Analytics isn't needed.
2. On the project home page, click the **web icon `</>`** to add a web app. Give it a nickname (for example "Moonbun web") and skip Firebase Hosting.
3. Firebase will show a `firebaseConfig = { ... }` block. Copy those values into **`js/firebase-config.js`**, replacing the placeholder values.

## Step 3: Turn on sign-in and the database

1. **Build → Authentication → Get started.** Enable **Email/Password**. You can also enable **Google** if you want a "Continue with Google" option.
2. **Build → Firestore Database → Create database.** Pick a location close to you (for example `us-central`) and start in **production mode**.
3. Still in Firestore, open the **Rules** tab. Replace everything there with the contents of **`firestore.rules`** from this folder, then click **Publish**.
   This step matters: these rules make sure only *you* can read your money data.

## Step 4: Allow your GitHub site to sign in

Go to **Authentication → Settings → Authorized domains → Add domain** and add `YOUR-USERNAME.github.io`.

## Step 5: Upload the updated config

In your GitHub repo, open `js/firebase-config.js`, click the ✏️ pencil icon, paste in your config, and commit. Also open `sw.js` and change `moonbun-v1` to `moonbun-v2`, so devices that already loaded the app pick up the change.

Reload the site and you'll see the sign-in screen. Create an account and you're synced! 🎉

> The Firebase config values are meant to be public, so it's fine for them to be on GitHub. Your data is protected by the security rules, not by keeping the config secret.

## Install it like an app 📱

- **iPhone (Safari):** tap Share → **Add to Home Screen**.
- **Android (Chrome):** tap ⋮ → **Install app**.
- **Laptop (Chrome/Edge):** click the install icon in the address bar.

Tip: on iPhone, signing in with email and password works best in the installed app, because Google sign-in pop-ups can be unreliable there.

## Importing from your bank 🏦

Most banks let you download your transactions from their website as a **CSV** file, usually under *Statements* or *Activity → Download*.

1. In the app, go to **History → Import from bank** and choose the file.
2. Check that the Date, Description and Amount columns are right. Yutu guesses them for you.
3. Fix any categories, untick anything you don't want, then press **Import**.

Entries that look like ones you already imported are unticked automatically, so importing the same month twice won't double up.

## The Plan tab 📋

- **Bills**: rent, phone, subscriptions and free trials. Yutu reminds you on Home 3 days before they're due. "Paid ♡" logs the expense for you.
- **Paycheck**: split each paycheck into needs, wants and savings.
- **Wishlist**: a 48-hour cool-down before buying things. Skipping sends the money to Bao.
- **Challenges**: the 52-week challenge, no-spend weekends and round-ups.
- **Debts**: see when you'll be debt-free and how much paying extra saves.
- **Safety net**: an emergency fund of 1 to 3 months of your usual spending.

Goals can also have a **Needed by** date. Yutu then tells you how much to save each month.

Receipt photos are shrunk before saving so they fit in the database.

## Making changes later

Whenever you edit files, bump the version in `sw.js` (`moonbun-v2` → `moonbun-v3`, and so on) so phones load the new version.

| File | What it does |
|---|---|
| `index.html` | page structure and the add-entry dialog |
| `css/styles.css` | all the colors and cuteness |
| `js/app.js` | screens, charts, mascot reactions, badges |
| `js/mascots.js` | the drawings of Yutu, Bao, and the moon |
| `js/store.js` | saving data (Firebase, or this device in demo mode) |
| `js/firebase-config.js` | your Firebase keys |
| `firestore.rules` | database security rules (paste into Firebase) |

Note: data you enter in demo mode stays on that device and doesn't move into your account when you connect Firebase. Use **Export CSV** if you want to keep a copy.
