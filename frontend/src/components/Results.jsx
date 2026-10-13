function tierFor(score) {
  if (score >= 75) return 'high';
  if (score >= 50) return 'mid';
  return 'low';
}

function SkillList({ items, emptyText }) {
  if (!items.length) {
    return (
      <ul className="chips">
        <li className="empty">{emptyText}</li>
      </ul>
    );
  }
  return (
    <ul className="chips">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/** One labelled bar from the score breakdown the API returns. */
function Breakdown({ label, value }) {
  return (
    <div className="breakdown-row">
      <span className="breakdown-label">{label}</span>
      <div className="breakdown-track">
        <div className="breakdown-fill" style={{ width: `${value}%` }} />
      </div>
      <span className="breakdown-value">{value}%</span>
    </div>
  );
}

export default function Results({ result, resumeFile, onReset }) {
  const { score, verdict, matched, missing, breakdown, warning, pages } = result;

  return (
    <section className="results" aria-live="polite">
      <div className="results-head">
        <div
          className="score-ring"
          data-tier={tierFor(score)}
          style={{ '--score': score }}
        >
          <div className="score-ring-inner">
            <span className="score-value">{score}</span>
            <span className="score-out">/ 100</span>
          </div>
        </div>
        <div className="results-summary">
          <h2>{verdict}</h2>
          <p className="file-name">
            {resumeFile?.name}
            {pages ? ` · ${pages} page${pages === 1 ? '' : 's'}` : ''}
          </p>
          <p>
            Your resume matches {matched.length} of the {matched.length + missing.length}{' '}
            skills this role asks for. The gaps below are the fastest points to win.
          </p>
        </div>
        <button className="btn ghost" type="button" onClick={onReset}>
          Start over
        </button>
      </div>

      {warning && <p className="notice">{warning}</p>}

      <div className="breakdown">
        <Breakdown label="Skill coverage" value={breakdown.coverage} />
        <Breakdown label="Keyword overlap" value={breakdown.density} />
        <Breakdown label="Structure" value={breakdown.structure} />
      </div>

      <div className="skill-columns">
        <div className="skill-panel found">
          <h3>
            Skills we found <span className="count">{matched.length}</span>
          </h3>
          <SkillList items={matched} emptyText="No matching skills found." />
        </div>
        <div className="skill-panel missing">
          <h3>
            Skills you&rsquo;re missing <span className="count">{missing.length}</span>
          </h3>
          <SkillList items={missing} emptyText="Nothing missing — nice." />
          {missing.length > 0 && (
            <p className="hint">
              Add the ones you genuinely have — name the tool, and say where you
              used it.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
