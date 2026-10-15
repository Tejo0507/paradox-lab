import { useMemo, useState } from 'react';
import { useCaseLog } from '../app/caseLog';
import { href } from '../app/router';
import { Stamp } from '../components/Evidence';
import { renderNotation } from '../components/M';
import { type Block, buildCertificate, certificateText } from '../features/certificate/content';
import './certificate.css';

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'p':
      return (
        <p>
          {block.label && <strong>{block.label} </strong>}
          {renderNotation(block.text ?? '')}
        </p>
      );
    case 'qed':
      return (
        <p className="qed" aria-label="end of proof">
          ∎
        </p>
      );
    case 'ol':
      return (
        <ol className="cert__rules">
          {block.items!.map((it, k) => (
            <li key={k}>{renderNotation(it)}</li>
          ))}
        </ol>
      );
    case 'ul':
      return (
        <ul>
          {block.items!.map((it, k) => (
            <li key={k}>{renderNotation(it)}</li>
          ))}
        </ul>
      );
    case 'table':
      return (
        <figure className="cert__table">
          {block.label && <figcaption>{block.label}</figcaption>}
          <table className="ledger">
            <thead>
              <tr>
                {block.rows![0].map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows!.slice(1).map((r, k) => (
                <tr key={k}>
                  <td className="mono">{renderNotation(r[0])}</td>
                  <td className="mono">{renderNotation(r[1])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      );
  }
}

export function Certificate() {
  const { log, reset } = useCaseLog();
  const sections = useMemo(() => buildCertificate(log), [log]);
  const issued = useMemo(() => new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }), []);
  const text = useMemo(() => certificateText(sections, issued), [sections, issued]);
  const [copyState, setCopyState] = useState<string | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState('Copied as plain text.');
    } catch {
      setCopyState('Copy is blocked in this browser. Use “Download .txt” instead.');
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'paradox-lab-proof-certificate.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page certificate">
      <div className="cert__tools no-print" role="group" aria-label="Certificate actions">
        <button type="button" className="btn btn--ink" onClick={() => window.print()}>
          Print / save as PDF
        </button>
        <button type="button" className="btn" onClick={copy}>
          Copy as text
        </button>
        <button type="button" className="btn" onClick={download}>
          Download .txt
        </button>
        <button type="button" className="btn btn--small" onClick={reset}>
          Clear investigation record
        </button>
        <span className="hint-text" role="status">
          {copyState}
        </span>
      </div>

      <article className="cert">
        <header className="cert__head">
          <div>
            <p className="eyebrow">Paradox Lab · formal languages division</p>
            <h1 tabIndex={-1}>Proof Certificate</h1>
            <p className="cert__meta">
              Issued {issued} · Cases 01 &amp; 02
            </p>
          </div>
          <div className="cert__seals">
            <Stamp tone="reject">01 · not context-free</Stamp>
            <Stamp tone="accept">02 · machine verified</Stamp>
          </div>
        </header>

        {sections.map((s) => (
          <section key={s.id} className="cert__section" aria-labelledby={`cert-${s.id}`}>
            <h2 id={`cert-${s.id}`}>{renderNotation(s.heading)}</h2>
            {s.blocks.map((b, k) => (
              <BlockView key={k} block={b} />
            ))}
          </section>
        ))}

        <footer className="cert__foot no-print">
          <a href={href('pumping')}>← Re-examine Case 01</a>
          <a href={href('stack')}>Re-run Case 02 →</a>
        </footer>
      </article>
    </div>
  );
}
