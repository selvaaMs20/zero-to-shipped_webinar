# 0 to Shipped — Resume Parser

A landing page where you upload a resume PDF and get a score out of 100, the
skills the parser found in it, and the skills it expected but didn't find.

Built as a **front-end mock**: React + Vite, no back end.

## Run it

```bash
npm install
npm run dev      # dev server with hot reload
npm run build    # production bundle into dist/
npm run preview  # serve the built bundle
```

Requires Node 22 or newer (Vite 8).

## Layout

```
index.html              # Vite entry — just mounts #root
src/
  main.jsx              # React root, imports styles.css
  App.jsx               # state, file validation, the scan timer
  styles.css            # all styling
  lib/
    analyser.js         # ROLE_SKILLS + the mock scoring function
  components/
    Header.jsx
    Scanner.jsx         # dropzone, file input, progress bar
    Results.jsx         # score ring + found/missing panels
    HowItWorks.jsx
DECISION.md             # the original brief
```

## How the mock works

A browser can't read a PDF without a parser library, so this build doesn't
pretend to. `analyseResume()` in `src/lib/analyser.js` hashes the **filename**
and uses that to pick which skills are present:

1. The name is lowercased and run through an **FNV-1a** hash, giving a stable
   integer seed.
2. Each skill in `ROLE_SKILLS` gets one bit of that seed, so it lands in
   `found` or `missing`.
3. The score comes from how much of the role's skill list matched, nudged by the
   seed so two resumes with equal coverage don't tie exactly.
4. Two guards keep the output readable: at least **4** found and at least **3**
   missing. A resume scoring "0 skills found" reads as a bug, not a low score.

Because the seed is a pure function of the filename, **the same file always
produces the same result** — re-uploading doesn't reshuffle the numbers, which
is what makes the demo feel real.

Verdict bands: `>= 80` Strong match · `>= 60` Good start · `>= 45` Needs work ·
below that, Missing key skills.

## Going real

`analyseResume()` is the single seam. Replace its body with something that
extracts the PDF's text — [pdf.js](https://mozilla.github.io/pdf.js/) in the
browser, or your own back end — and keep the return shape:

```js
{ score: Number, found: String[], missing: String[], verdict: String }
```

Keep it a plain function of its input: `App.jsx` calls it and stores the result
in state, and nothing else needs to change.

## Where to change things

- **The target role's skills** — `ROLE_SKILLS` in `src/lib/analyser.js`.
- **Scan steps and timing** — `SCAN_STEPS`, and `STEP_MS` in `src/App.jsx`.
- **Colours** — the `:root` custom properties at the top of `src/styles.css`.
- **Upload limit** — `MAX_BYTES` in `src/App.jsx`.

## Notes on the React version

- **The scan is a chain of `setTimeout`s, not an interval.** The ids live in a
  ref (`timers`) so `clearTimers()` can cancel a scan mid-flight — that's what
  the Cancel button and Start over both call. Changing them doesn't re-render,
  which is correct: they're not render data.
- **The dropzone reads `isDragging` from state but counts depth in a ref.**
  `dragenter`/`dragleave` fire again for every child element, so toggling on
  each event makes the highlight strobe as the cursor crosses the icon and text.
  The ref holds the count; state only tracks whether we're dragging at all.
- **The file input is cleared after each pick** (`e.target.value = ''`),
  otherwise selecting the same file twice fires no `change` event.
- Keyboard users can focus the dropzone and press <kbd>Enter</kbd> or
  <kbd>Space</kbd>. `prefers-reduced-motion` is respected.

## Status

`npm run build` passes (21 modules), and the analyser was checked to return the
same scores as the pre-React version. The page itself has not been opened in a
browser, so the rendered layout and drag-and-drop are unverified.
