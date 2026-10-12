export default function HowItWorks() {
  return (
    <section className="how wrap" id="how">
      <h2>How it works</h2>
      <ol className="steps">
        <li>
          <strong>Upload</strong> your resume as a PDF.
        </li>
        <li>
          <strong>We match</strong> it against the skills of the role you&rsquo;re
          aiming at.
        </li>
        <li>
          <strong>You get</strong> a score, what&rsquo;s working, and what&rsquo;s
          missing.
        </li>
      </ol>
      <p className="disclaimer">
        This build is a front-end mock: scoring is simulated in the browser, so no
        file is uploaded anywhere. The real version would extract text from the PDF
        and compare it against a role&rsquo;s skill list.
      </p>
    </section>
  );
}
