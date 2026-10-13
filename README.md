# 0 to Shipped — Resume Parser

Upload a resume PDF and a job description, and get a score out of 100, the
skills the two documents share, and the skills the role asks for that the
resume never mentions.

React frontend, Express + MongoDB backend. The scoring is rules-based for now:
it reads the PDF's text layer and matches skills against a catalogue. The AI
comparison is the next piece, and it slots in behind the same service seam.

## Run it

Two processes, two terminals, one from each folder.

```bash
# terminal 1 — the API
cd backend
npm install
npm run dev            # http://localhost:3001

# terminal 2 — the frontend
cd frontend
npm install
npm run dev            # http://localhost:5173
```

The frontend proxies `/api` to port 3001 (see `frontend/vite.config.js`), so
open **http://localhost:5173**, not the API port.

Requires Node 22 or newer. MongoDB must be reachable at `MONGODB_URI`
(defaults to a local `mongodb://127.0.0.1:27017/zero-to-shipped`); the server
exits with a clear message if it cannot connect.

## Layout

```
frontend/
  index.html            # Vite entry — just mounts #root
  vite.config.js        # React plugin + the /api dev proxy
  src/
    main.jsx            # React root
    App.jsx             # state, file validation, the fetch
    styles.css          # all styling
    lib/api.js          # the only file that calls the API
    components/
      Header.jsx
      Scanner.jsx       # resume dropzone + JD textarea/file + submit
      Results.jsx       # score ring, breakdown bars, matched/missing panels
      HowItWorks.jsx

backend/
  server.js           # connect to Mongo, then listen
  app.js              # express app: routes + middleware, no scoring
  routes/             # URL -> controller
  controller/         # request in, response out
  service/            # core logic
    scanService.js    # read + score + save one scan
    extractPdfText.js # PDF buffer -> text
    analyse.js        # the scoring rules
    skills.js         # the skill catalogue and matcher
  middleware/         # multer upload config, 404, error handler
  models/             # Mongoose schemas
  config/             # env vars, Mongo connection
  utils.js            # shared helpers (clamp, redactUri, HttpError)
```

The rule of thumb: a route names a URL, a controller translates HTTP, and a
service does the work without knowing Express exists. `scanService.js` is the
whole scan feature, so it can be tested or reused without a server.

## API

| Method | Path         | Body                                              |
| ------ | ------------ | ------------------------------------------------- |
| POST   | `/api/scan`  | multipart: `resume` (PDF), `job` (text **or** PDF), `jobTitle` |
| GET    | `/api/scans` | — (20 most recent)                                |
| GET    | `/api/health`| —                                                 |

`POST /api/scan` returns `{ score, verdict, matched, missing, resumeSkills,
jdSkills, breakdown, pages, scanId, warning }`. Errors come back as
`{ error }` with a status that says whose fault it is — 400 for a bad request,
422 for a PDF with no text layer, 413 for a file over the limit.

## How the score works

Three parts, weighted (see `WEIGHTS` in `backend/service/analyse.js`):

1. **Coverage (65%)** — of the skills the JD names, how many appear on the
   resume. This is the part that moves the number most.
2. **Keyword overlap (20%)** — how much of the JD's vocabulary (words of 4+
   characters) the resume echoes.
3. **Structure (15%)** — does the text look skimmable? Bullets, dates and
   short heading lines all count.

Two guardrails: a JD naming more than 12 skills is cut to the ones it repeats
(so a kitchen-sink ad doesn't flatter a thin resume), and junior-friendly
signals — "senior", "8+ years" — shave the score a little rather than
pretending every posting is the same bar. Verdict bands: `>=80` Strong match,
`>=60` Good start, `>=45` Needs work, below that Missing key skills.

**Only PDFs with a text layer work.** A photographed or scanned resume is
pixels; the parser returns almost nothing and the API answers 422 telling you
so, rather than reporting "no skills found".

## Where to change things

- **The skill catalogue** — `SKILLS` and its aliases in `backend/service/skills.js`.
- **The scoring** — `WEIGHTS` and the helpers in `backend/service/analyse.js`.
- **Colours and type** — the `:root` custom properties in `frontend/src/styles.css`.
- **Upload limit** — `MAX_UPLOAD_BYTES` in `backend/config/env.js`, mirrored
  by `MAX_BYTES` in `frontend/src/lib/api.js`.

## Notes

- **The PDF is held in memory, never on disk.** `backend/middleware/upload.js` uses
  multer's memory storage; the buffer lives only for the request.
- **A scan still returns if the database write fails** — the response carries a
  `warning` and the score, so a Mongo outage degrades to "not saved" rather
  than a 500.
- **The progress steps are theatre, the fetch is not.** `App.jsx` advances the
  labels on an interval while the real request is in flight; a `runId` ref
  makes a cancelled scan unable to overwrite state when its response lands.
- **`redactUri`** keeps credentials out of logs — Mongo URIs carry them, and
  `server.js` prints one on connect and on failure.

## Status

`npx vite build` passes (21 modules) and every backend file passes
`node --check`. The API has not been exercised against a real PDF or a live
Mongo in this session — that is the next thing to verify.
