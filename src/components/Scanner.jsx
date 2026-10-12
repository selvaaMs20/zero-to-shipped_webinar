import { useRef } from 'react';

export default function Scanner({
  status,
  error,
  fileName,
  progress,
  stepLabel,
  isDragging,
  onFile,
  dragHandlers,
  onReset,
}) {
  const fileInput = useRef(null);

  const openPicker = () => fileInput.current?.click();

  return (
    <div className="scanner" id="scanner">
      <div
        className={`dropzone${isDragging ? ' is-dragging' : ''}`}
        tabIndex={0}
        role="button"
        aria-label="Upload a resume PDF"
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openPicker();
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
        <p className="dropzone-title">Drag your resume here</p>
        <p className="dropzone-sub">
          or <span className="link-like">browse files</span> — PDF only
        </p>
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf,.pdf"
          hidden
          onChange={(e) => {
            onFile(e.target.files[0]);
            // Reset the input so picking the same file again re-fires change.
            e.target.value = '';
          }}
        />
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {status === 'scanning' && (
        <>
          <div className="scanning">
            <p className="scanning-file">{fileName}</p>
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
      )}
    </div>
  );
}
