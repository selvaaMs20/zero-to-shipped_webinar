# 0 to Shipped — Resume Parser

A landing page where you upload a resume PDF and get a score out of 100, the
skills the parser found in it, and the skills it expected but didn't find.

Built as a **front-end mock**: HTML, CSS and vanilla JavaScript, no build step,
no dependencies, no back end.

## Run it

There's nothing to install. Open `index.html` in a browser:

```
# either double-click index.html, or serve the folder:
npx serve .
```

Opening the file directly (`file://`) works fine — nothing here fetches over the
network.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The page: header, hero, upload card, results block, "How it works", footer. |
| `styles.css` | All styling. The score ring is a CSS `conic-gradient` — no canvas, no chart library. |
| `app.js` | Drag-and-drop wiring, validation, the scan animation, and the mock analyser. |
| `DECISION.md` | The original brief for the build. |

## How the mock works

A browser can't read a PDF without a parser library, so this build doesn't
pretend to. `analyseResume()` in `app.js` hashes the **filename** and uses that
to pick which skills are present:

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

Nothing else in `app.js` needs to change. The scan animation already exists to
give the UI a state to sit in while a real parse runs.

## Where to change things

- **The target role's skills** — the `ROLE_SKILLS` array at the top of `app.js`.
- **Scan step labels and timing** — `SCAN_STEPS`, and the `420` ms interval in
  `runScan()`.
- **Colours** — the `:root` custom properties at the top of `styles.css`.
- **Upload limits** — the `5 MB` check in `handleFile()`.

## Browser notes

- Drag-and-drop tracks a **depth counter** rather than toggling a class on
  `dragenter`/`dragleave`, because those events fire again for every child
  element — the naive version makes the dropzone highlight strobe as the cursor
  moves across the icon and text.
- Keyboard users can focus the dropzone and press <kbd>Enter</kbd> or
  <kbd>Space</kbd> to open the file picker.
- `prefers-reduced-motion` is respected.

## Status

The layout, drag-and-drop handling and scan animation have not been verified in
a browser. `node --check app.js` passes, and the analyser's logic was tested
standalone for stability and non-overlapping output.
