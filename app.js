/* ---------------------------------------------------------------
   0 to Shipped — Resume Parser (front-end mock)

   No server, so nothing here can read the PDF. `analyseResume()` is
   the only function that pretends: it hashes the filename and picks a
   deterministic skill set from it. Same file in, same score out.

   To go real later, replace ONLY that function's body with a call
   that extracts the PDF text (pdf.js in the browser, or your own
   back end) and returns the same shape:
       { score: Number, found: String[], missing: String[], verdict: String }
   --------------------------------------------------------------- */

/* The skills the "target role" expects. Half of these will land in
   the resume, half won't — that's what makes the mock readable. */
const ROLE_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'HTML', 'CSS',
  'Git', 'REST APIs', 'Node.js', 'Testing', 'SQL',
  'Accessibility', 'Performance'
];

const SCAN_STEPS = [
  'Reading document…',
  'Extracting text…',
  'Matching skills…',
  'Scoring…'
];

/* ---------- element handles ---------- */
const dropzone    = document.getElementById('dropzone');
const fileInput   = document.getElementById('fileInput');
const errorBox    = document.getElementById('error');
const scanningBox = document.getElementById('scanning');
const scanningFile  = document.getElementById('scanningFile');
const scanningStep  = document.getElementById('scanningStep');
const progressBar   = document.getElementById('progressBar');
const results     = document.getElementById('results');
const scoreRing   = document.getElementById('scoreRing');
const scoreValue  = document.getElementById('scoreValue');
const verdictEl   = document.getElementById('verdict');
const verdictNote = document.getElementById('verdictNote');
const fileNameEl  = document.getElementById('fileName');
const foundList   = document.getElementById('foundList');
const missingList = document.getElementById('missingList');
const foundCount  = document.getElementById('foundCount');
const missingCount= document.getElementById('missingCount');
const missingHint = document.getElementById('missingHint');
const resetBtn    = document.getElementById('resetBtn');

/* ---------- the mock analyser ---------- */

/* FNV-1a: tiny, stable string hash. Same input → same number, which is
   what makes the demo feel real (no result flickering between runs). */
function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function analyseResume(fileName) {
  const seed = hashString(fileName.toLowerCase());

  // Decide each skill by flipping one bit of the seed. Using a shift
  // and a multiplier keeps neighbouring filenames from giving
  // near-identical results.
  const found = [];
  const missing = [];
  ROLE_SKILLS.forEach((skill, i) => {
    const bit = (seed >>> (i % 24)) & 1;
    const jitter = hashString(skill + seed) % 5;
    (bit ^ (jitter > 3 ? 1 : 0) ? found : missing).push(skill);
  });

  // Never show a lopsided or empty result — it reads as broken.
  while (found.length < 4) found.push(missing.pop());
  while (missing.length < 3) missing.push(found.pop());

  // Score: mostly how many skills matched, nudged by the seed so two
  // resumes with equal matches don't tie exactly.
  const coverage = found.length / ROLE_SKILLS.length;
  const score = Math.min(97, Math.max(28, Math.round(coverage * 82 + (seed % 15))));

  return { score, found, missing, verdict: verdictFor(score) };
}

function verdictFor(score) {
  if (score >= 80) return 'Strong match';
  if (score >= 60) return 'Good start';
  if (score >= 45) return 'Needs work';
  return 'Missing key skills';
}

/* ---------- rendering ---------- */

function render(result, fileName) {
  scoreRing.style.setProperty('--score', result.score);
  scoreRing.dataset.tier = result.score >= 75 ? 'high' : result.score >= 50 ? 'mid' : 'low';
  scoreValue.textContent = result.score;
  verdictEl.textContent = result.verdict;
  fileNameEl.textContent = fileName;

  const total = ROLE_SKILLS.length;
  verdictNote.textContent =
    `Your resume covers ${result.found.length} of the ${total} skills this role expects. ` +
    `The gaps below are the fastest points to win.`;

  fillList(foundList, result.found, 'No matching skills found.');
  fillList(missingList, result.missing, 'Nothing missing — nice.');

  foundCount.textContent = result.found.length;
  missingCount.textContent = result.missing.length;

  missingHint.textContent = result.missing.length
    ? 'Add the ones you genuinely have — name the tool, and say where you used it.'
    : '';

  results.hidden = false;
}

function fillList(listEl, items, emptyText) {
  listEl.innerHTML = '';
  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = emptyText;
    listEl.appendChild(li);
    return;
  }
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    listEl.appendChild(li);
  });
}

/* ---------- flow: validate → fake scan → render ---------- */

function handleFile(file) {
  if (!file) return;

  const isPdf =
    file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (!isPdf) {
    showError('That is not a PDF. Export your resume as a PDF and try again.');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showError('That file is over 5 MB. Try a smaller export.');
    return;
  }

  hideError();
  runScan(file);
}

function runScan(file) {
  results.hidden = true;
  scanningFile.textContent = file.name;
  scanningBox.hidden = false;

  // Walk the progress bar, then hand over to the mock analyser. The
  // delay is theatre, but it also gives the UI a state to be in while
  // a real parse would be running.
  let step = 0;
  progressBar.style.width = '0%';

  const timer = setInterval(() => {
    step += 1;
    progressBar.style.width = `${(step / SCAN_STEPS.length) * 100}%`;
    scanningStep.textContent = SCAN_STEPS[Math.min(step, SCAN_STEPS.length - 1)];

    if (step >= SCAN_STEPS.length) {
      clearInterval(timer);
      setTimeout(() => {
        scanningBox.hidden = true;
        render(analyseResume(file.name), file.name);
      }, 350);
    }
  }, 420);
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function hideError() {
  errorBox.hidden = true;
  errorBox.textContent = '';
}

function reset() {
  results.hidden = true;
  scanningBox.hidden = true;
  progressBar.style.width = '0%';
  fileInput.value = ''; // lets the same file be re-selected
  hideError();
}

/* ---------- events ---------- */

dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});

fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

// dragover/dragleave fire for every child element, so we track depth
// instead of toggling the class directly — otherwise the highlight
// strobes as the cursor moves across the icon and the text.
let dragDepth = 0;

dropzone.addEventListener('dragenter', (e) => {
  e.preventDefault();
  dragDepth += 1;
  dropzone.classList.add('is-dragging');
});

dropzone.addEventListener('dragover', (e) => e.preventDefault());

dropzone.addEventListener('dragleave', () => {
  dragDepth -= 1;
  if (dragDepth <= 0) {
    dragDepth = 0;
    dropzone.classList.remove('is-dragging');
  }
});

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dragDepth = 0;
  dropzone.classList.remove('is-dragging');
  handleFile(e.dataTransfer.files[0]);
});

resetBtn.addEventListener('click', reset);
