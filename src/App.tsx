import { useState } from 'react';

const modules = [
  {
    code: 'ST2132',
    name: 'Mathematical statistics',
    formats: 'Proofs · Applied problems',
  },
  {
    code: 'CS2100',
    name: 'Computer organisation',
    formats: 'MIPS · Circuits · MCQ',
  },
] as const;

export function App() {
  const [selected, setSelected] = useState<string | null>(null);
  const module = modules.find(({ code }) => code === selected);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <a className="wordmark" href="#main" onClick={() => setSelected(null)}>
          <span className="brand-mark" aria-hidden="true">
            r.
          </span>
          Revision
        </a>
        <span className="preview-label">Starter workspace</span>
      </header>
      <main id="main" className="workspace">
        {module ? (
          <>
            <button className="back-link" onClick={() => setSelected(null)}>
              ← Modules
            </button>
            <p className="eyebrow">{module.code}</p>
            <h1>{module.name}</h1>
            <p className="lede">{module.formats}</p>
            <section className="empty-state" aria-labelledby="empty-heading">
              <span className="empty-symbol" aria-hidden="true">
                ＋
              </span>
              <h2 id="empty-heading">A fresh start.</h2>
              <p>Question import is coming next.</p>
            </section>
          </>
        ) : (
          <>
            <p className="eyebrow">Your workspace</p>
            <h1>Room to think.</h1>
            <p className="lede">
              Choose a module. Take it one question at a time.
            </p>
            <section className="module-list" aria-labelledby="modules-heading">
              <div className="section-heading">
                <h2 id="modules-heading">Modules</h2>
                <span>02</span>
              </div>
              {modules.map((item) => (
                <button
                  className="module-row"
                  key={item.code}
                  onClick={() => setSelected(item.code)}
                >
                  <span className="module-code">{item.code}</span>
                  <span className="module-details">
                    <span className="module-name">{item.name}</span>
                    <span className="module-formats">{item.formats}</span>
                  </span>
                  <span className="row-arrow" aria-hidden="true">
                    →
                  </span>
                </button>
              ))}
            </section>
          </>
        )}
      </main>
    </>
  );
}
