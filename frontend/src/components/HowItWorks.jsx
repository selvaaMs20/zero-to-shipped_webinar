export default function HowItWorks() {
  return (
    <section className="how wrap" id="how">
      <h2>How it works</h2>
      <ol className="steps">
        <li>
          <strong>Upload</strong> your resume as a PDF, and paste in the job
          description you&rsquo;re going for.
        </li>
        <li>
          <strong>We read both</strong> — the text layer of the PDF, and the
          skills named in the job ad — and compare them.
        </li>
        <li>
          <strong>You get</strong> a score, the skills that matched, and the ones
          the role expects that your resume never mentions.
        </li>
      </ol>
      <p className="disclaimer">
        The score weighs skill coverage most heavily, then keyword overlap and how
        skimmable the document is. Nothing is stored except the text we scored — the
        PDFs themselves are never saved.
      </p>
    </section>
  );
}
