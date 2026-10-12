import { useCallback, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import Scanner from './components/Scanner.jsx';
import Results from './components/Results.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import { SCAN_STEPS, analyseResume } from './lib/analyser.js';

const MAX_BYTES = 5 * 1024 * 1024;
const STEP_MS = 420;

export default function App() {
  // 'idle' | 'scanning' | 'done'
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [fileName, setFileName] = useState('');

  // Timer ids and the depth counter are not render data: changing them
  // should never trigger a re-render, so they live in refs.
  const timers = useRef([]);
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const handleFile = useCallback((file) => {
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!isPdf) {
      setError('That is not a PDF. Export your resume as a PDF and try again.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('That file is over 5 MB. Try a smaller export.');
      return;
    }

    setError('');
    setFileName(file.name);
    setResult(null);
    setStatus('scanning');
    setStepIndex(0);

    // The delay is theatre, but it also gives the UI a state to sit in
    // while a real parse would be running.
    clearTimers();
    SCAN_STEPS.forEach((_, i) => {
      timers.current.push(
        setTimeout(() => setStepIndex(i + 1), STEP_MS * (i + 1)),
      );
    });
    timers.current.push(
      setTimeout(() => {
        setResult(analyseResume(file.name));
        setStatus('done');
      }, STEP_MS * SCAN_STEPS.length + 350),
    );
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setStatus('idle');
    setResult(null);
    setFileName('');
    setError('');
    setStepIndex(0);
    dragDepth.current = 0;
    setIsDragging(false);
  }, []);

  // Shared by the dropzone's drag events. `dragenter`/`dragleave` fire
  // again for every child element, so we count depth instead of toggling
  // on each event — otherwise the highlight strobes.
  const dragHandlers = {
    onDragEnter: (e) => {
      e.preventDefault();
      dragDepth.current += 1;
      setIsDragging(true);
    },
    onDragOver: (e) => e.preventDefault(),
    onDragLeave: () => {
      dragDepth.current -= 1;
      if (dragDepth.current <= 0) {
        dragDepth.current = 0;
        setIsDragging(false);
      }
    },
    onDrop: (e) => {
      e.preventDefault();
      dragDepth.current = 0;
      setIsDragging(false);
      handleFile(e.dataTransfer.files[0]);
    },
  };

  const progress = Math.min(stepIndex / SCAN_STEPS.length, 1) * 100;
  const stepLabel = SCAN_STEPS[Math.min(stepIndex, SCAN_STEPS.length - 1)];

  return (
    <>
      <Header />

      <main id="top">
        <section className="hero wrap">
          <p className="eyebrow">Mock demo — no data leaves your browser</p>
          <h1>Tired of guessing why your resume gets skipped?</h1>
          <p className="lede">
            Drop in your PDF and get a score out of 100, the skills we can see in
            it, and the ones your target role expects but your resume never
            mentions.
          </p>

          <Scanner
            status={status}
            error={error}
            fileName={fileName}
            progress={progress}
            stepLabel={stepLabel}
            isDragging={isDragging}
            onFile={handleFile}
            dragHandlers={dragHandlers}
            onReset={reset}
          />

          {status === 'done' && result && (
            <Results result={result} fileName={fileName} onReset={reset} />
          )}
        </section>

        <HowItWorks />
      </main>

      <footer className="site-footer">
        <div className="wrap">
          <p>0 to Shipped Resume Parser — a Dev Labs build.</p>
        </div>
      </footer>
    </>
  );
}
