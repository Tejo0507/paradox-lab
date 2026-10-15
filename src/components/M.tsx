import { Fragment, type ReactNode } from 'react';

/**
 * Tiny notation renderer: `a^n b^{2n}`, `Z_0`, `q_1`.
 * ^x / ^{...} → superscript, _x / _{...} → subscript. Everything else is literal.
 * Keeps maths in one typeface instead of relying on Unicode super/subscript glyphs.
 */
export function renderNotation(src: string): ReactNode[] {
  const out: ReactNode[] = [];
  let buf = '';
  let key = 0;
  const flush = () => {
    if (buf) out.push(<Fragment key={key++}>{buf}</Fragment>);
    buf = '';
  };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if ((ch === '^' || ch === '_') && i + 1 < src.length) {
      flush();
      let body: string;
      if (src[i + 1] === '{') {
        const end = src.indexOf('}', i + 2);
        body = src.slice(i + 2, end === -1 ? undefined : end);
        i = end === -1 ? src.length : end;
      } else {
        body = src[i + 1];
        i += 1;
      }
      out.push(ch === '^' ? <sup key={key++}>{body}</sup> : <sub key={key++}>{body}</sub>);
    } else {
      buf += ch;
    }
  }
  flush();
  return out;
}

export function M({ children, block = false }: { children: string; block?: boolean }) {
  const Tag = block ? 'div' : 'span';
  return <Tag className={block ? 'math math--block' : 'math'}>{renderNotation(children)}</Tag>;
}

/** Renders a stack symbol, turning Z₀ into Z with a real subscript. */
export function StackSymbol({ symbol }: { symbol: string }) {
  if (symbol === 'Z₀') {
    return (
      <span className="stack-sym">
        Z<sub>0</sub>
      </span>
    );
  }
  return <span className="stack-sym">{symbol}</span>;
}

/** Renders a whole stack word like "XXZ₀" with proper subscripts. */
export function StackWord({ word }: { word: string }) {
  return <span className="math">{renderNotation(word.replace(/Z₀/g, 'Z_0'))}</span>;
}
