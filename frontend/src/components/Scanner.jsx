import { useRef } from 'react';

export default function Scanner({
  status,
  error,
  resumeFile,
  jobFile,
  jobText,
  jobTitle,
  progress,
  stepLabel,
  isDragging,
  onResumeFile,
  onJobFile,
  onJobText,
  onJobTitle,
  dragHandlers,
  onSubmit,
  onReset,
}) {
  const resumeInput = useRef(null);
  const jobInput = useRef(null);
  const busy = status === 'scanning';

  return (
    <div className="scanner" id="scanner">
      <form onSubmit={onSubmit}>
        <div className="field">
          <label className="field-label" htmlFor="resume-drop">
            Your resume
          </label>
          <div
            id="resume-drop"
            className={`dropzone${isDragging ? ' is-dragging' : ''}`}
            tabIndex={0}
            role="button"
            aria-label="Upload a resume PDF"
            onClick={() => resumeInput.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                resumeInput.current?.click();
              }
            }}
            {...dragHandlers}
          >
            <svg className="dropzone-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <p className="dropzone-title">
              {resumeFile ? resumeFile.name : 'Drag your resume here'}
            </p>
            <p className="dropzone-sub">
              or <span className="link-like">browse files</span> — PDF, up to 5 MB
            </p>
            <input
              ref={resumeInput}
              type="file"
              accept="application/pdf,.pdf"
              hidden
              onChange={(e) => {
                onResumeFile(e.target.files[0]);
                // Reset the input so picking the same file again re-fires change.
                e.target.value = '';
              }}
            />
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="job-title">
            Target role <span className="optional">optional</span>
          </label>
          <input
            id="job-title"
            className="text-input"
            type="text"
            placeholder="Frontend Engineer"
            maxLength={120}
            value={jobTitle}
            onChange={(e) => onJobTitle(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="job-text">
            Job description
          </label>
          <textarea
            id="job-text"
            className="text-area"
            rows={6}
            placeholder="Paste the job description here, or attach it as a PDF below."
            value={jobText}
            onChange={(e) => onJobText(e.target.value)}
          />
          <div className="or-row">
            <span>or</span>
            <button
              className="btn ghost"
              type="button"
              onClick={() => jobInput.current?.click()}
            >
              {jobFile ? jobFile.name : 'Attach the JD as a PDF'}
            </button>
            <input
              ref={jobInput}
              type="file"
              accept="application/pdf,.pdf"
              hidden
              onChange={(e) => {
                onJobFile(e.target.files[0]);
                e.target.value = '';
              }}
            />
          </div>
        </div>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {busy ? (
          <>
            <div className="scanning">
              <p className="scanning-file">{resumeFile?.name}</p>
              <div className="progress">
                <div className="progress-bar" style={{ width: `${progress}%` }} />
              </div>
              <p className="scanning-step">{stepLabel}</p>
            </div>
            <div className="scanner-actions">
              <button className="btn ghost" type="button" onClick={onReset}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="scanner-actions">
            <button className="btn primary" type="submit">
              Score my resume
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
