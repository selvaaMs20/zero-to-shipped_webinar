export default function Header() {
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <a className="brand" href="#top">
          <span className="brand-mark">
            0<span className="brand-arrow">→</span>1
          </span>
          <span className="brand-name">
            0 to Shipped <em>Resume Parser</em>
          </span>
        </a>
        <nav className="site-nav">
          <a href="#how">How it works</a>
          <a href="#scanner">Score my resume</a>
        </nav>
      </div>
    </header>
  );
}
