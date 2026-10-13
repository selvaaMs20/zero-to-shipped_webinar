import { useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import Scanner from './components/Scanner.jsx';
import Results from './components/Results.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import { SCAN_STEPS, MAX_BYTES, scanResume } from './lib/api.js';

const STEP_MS = 420;

export default function App() {
  // 'idle' | 'scanning' | 'done'
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState(null);

  // The two documents. The resume is always a file; the job description is
  // either pasted text or a file, so the form carries both.
  const [resumeFile, setResumeFile] = useState(null);
  const [jobFile, setJobFile] = useState(null);
  const [jobText, setJobText] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);
  // Lets Cancel/Start over abandon a scan whose fetch is still in flight.
  const runId = useRef(0);

  /** Both documents share the same "is this a PDF under the size cap" rules. */
  const readFile = useCallback((file, label) => {
    if (!file) return null;

    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!isPdf) {
      setError(`That ${label} is not a PDF. Export it as a PDF and try again.`);
      return null;
    }
    if (file.size > MAX_BYTES) {
      setError(`That ${label} is over 5 MB. Try a smaller export.`);
      return null;
    }

    setError('');
    return file;
  }, []);

  const onResumeFile = useCallback(
    (file) => {
      const accepted = readFile(file, 'resume');
      if (accepted) setResumeFile(accepted);
    },
    [readFile],
  );

  const onJobFile = useCallback(
    (file) => {
      const accepted = readFile(file, 'job description');
      if (accepted) {
        setJobFile(accepted);
        setJobText('');
      }
    },
    [readFile],
  );

  // While the request is in flight the UI advances through the step labels.
  // This is theatre, but it is honest theatre: the fetch really is running,
  // and a stalled progress bar reads as a hang.
  useEffect(() => {
    if (status !== 'scanning') return undefined;

    const timer = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, SCAN_STEPS.length - 1));
    }, STEP_MS);

    return () => clearInterval(timer);
  }, [status]);

  const submit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!resumeFile) {
        setError('Attach a resume PDF first.');
        return;
      }
      if (!jobFile && !jobText.trim()) {
        setError('Paste the job description or attach it as a PDF.');
        return;
      }

      const id = ++runId.current;
      setError('');
      setResult(null);
      setStepIndex(0);
      setStatus('scanning');

      try {
        const data = await scanResume({ resumeFile, jobFile, jobText, jobTitle });
        // A scan that was cancelled while awaiting must not overwrite state.
        if (id !== runId.current) return;
        setResult(data);
        setStatus('done');
      } catch (err) {
        if (id !== runId.current) return;
        setError(err.message);
        setStatus('idle');
      }
    },
    [resumeFile, jobFile, jobText, jobTitle],
  );

  const reset = useCallback(() => {
    // Bumping the id orphans any in-flight response from a cancelled scan.
    runId.current += 1;
    setStatus('idle');
    setResult(null);
    setResumeFile(null);
    setJobFile(null);
    setJobText('');
    setJobTitle('');
    setError('');
    setStepIndex(0);
    dragDepth.current = 0;
    setIsDragging(false);
  }, []);

  // `dragenter`/`dragleave` fire again for every child element, so we count
  // depth instead of toggling on each event — otherwise the highlight strobes.
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
      onResumeFile(e.dataTransfer.files[0]);
    },
  };

  const progress = Math.min((stepIndex + 1) / SCAN_STEPS.length, 1) * 100;
  const stepLabel = SCAN_STEPS[Math.min(stepIndex, SCAN_STEPS.length - 1)];

  return (
    <>
      <Header />

      <main id="top">
        <section className="hero wrap">
          <h1>Tired of guessing why your resume gets skipped?</h1>
          <p className="lede">
            Drop in your resume and the job description you&rsquo;re targeting.
            You&rsquo;ll get a score out of 100, the skills we found, and the ones
            the role expects that your resume never mentions.
          </p>

          <Scanner
            status={status}
            error={error}
            resumeFile={resumeFile}
            jobFile={jobFile}
            jobText={jobText}
            jobTitle={jobTitle}
            progress={progress}
            stepLabel={stepLabel}
            isDragging={isDragging}
            onResumeFile={onResumeFile}
            onJobFile={onJobFile}
            onJobText={(value) => {
              setJobText(value);
              if (value) setJobFile(null);
            }}
            onJobTitle={setJobTitle}
            dragHandlers={dragHandlers}
            onSubmit={submit}
            onReset={reset}
          />

          {status === 'done' && result && (
            <Results result={result} resumeFile={resumeFile} onReset={reset} />
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
