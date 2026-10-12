import { ROLE_SKILLS } from '../lib/analyser.js';

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

export default function Results({ result, fileName, onReset }) {
  const { score, found, missing, verdict } = result;

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
          <p className="file-name">{fileName}</p>
          <p>
            Your resume covers {found.length} of the {ROLE_SKILLS.length} skills
            this role expects. The gaps below are the fastest points to win.
          </p>
        </div>
        <button className="btn ghost" type="button" onClick={onReset}>
          Start over
        </button>
      </div>

      <div className="skill-columns">
        <div className="skill-panel found">
          <h3>
            Skills we found <span className="count">{found.length}</span>
          </h3>
          <SkillList items={found} emptyText="No matching skills found." />
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
