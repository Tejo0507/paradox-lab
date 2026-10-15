import { STACK_PROTOCOL } from '../../logic/stackProtocol';

const POS: Record<string, { x: number; y: number }> = {
  q0: { x: 60, y: 120 },
  q1: { x: 230, y: 120 },
  q2: { x: 400, y: 120 },
  q3: { x: 570, y: 120 },
};
const R = 30;

interface Props {
  current: string;
  /** Id of the transition that produced the current configuration. */
  lastTransition: string | null;
  halted: 'accepted' | 'rejected' | null;
}

/** State graph of the Stack Protocol PDA, drawn from its transition table. */
export function StateDiagram({ current, lastTransition, halted }: Props) {
  const label = (id: string) => {
    const t = STACK_PROTOCOL.transitions.find((x) => x.id === id)!;
    return `${t.read ?? 'ε'}, ${t.pop} → ${t.push.length ? t.push.join('') : 'ε'}`;
  };
  const edgeClass = (id: string) => `sd-edge${lastTransition === id ? ' is-active' : ''}`;

  return (
    <svg className="state-diagram" viewBox="0 0 640 210" role="img" aria-labelledby="sd-title sd-desc">
      <title id="sd-title">State diagram of the Stack Protocol automaton</title>
      <desc id="sd-desc">
        {`Four states q0, q1, q2, q3 in a row. Current state: ${current}.${lastTransition ? ` Last transition: ${lastTransition}.` : ''}${halted ? ` Machine halted: ${halted}.` : ''}`}
      </desc>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
        </marker>
      </defs>

      {/* start arrow */}
      <line x1="4" y1="120" x2={POS.q0.x - R - 2} y2="120" className="sd-edge" markerEnd="url(#arrow)" />

      {/* t1 q0 -> q1 */}
      <g className={edgeClass('t1')}>
        <line x1={POS.q0.x + R} y1="120" x2={POS.q1.x - R - 2} y2="120" markerEnd="url(#arrow)" />
        <text x={(POS.q0.x + POS.q1.x) / 2} y="108" textAnchor="middle">
          {label('t1')}
        </text>
      </g>
      {/* t2 loop on q1 */}
      <g className={edgeClass('t2')}>
        <path d={`M ${POS.q1.x - 16} ${120 - R + 4} C ${POS.q1.x - 40} 30, ${POS.q1.x + 40} 30, ${POS.q1.x + 16} ${120 - R + 4}`} fill="none" markerEnd="url(#arrow)" />
        <text x={POS.q1.x} y="34" textAnchor="middle">
          {label('t2')}
        </text>
      </g>
      {/* t3 q1 -> q2 */}
      <g className={edgeClass('t3')}>
        <line x1={POS.q1.x + R} y1="120" x2={POS.q2.x - R - 2} y2="120" markerEnd="url(#arrow)" />
        <text x={(POS.q1.x + POS.q2.x) / 2} y="108" textAnchor="middle">
          {label('t3')}
        </text>
      </g>
      {/* t4 loop on q2 */}
      <g className={edgeClass('t4')}>
        <path d={`M ${POS.q2.x - 16} ${120 - R + 4} C ${POS.q2.x - 40} 30, ${POS.q2.x + 40} 30, ${POS.q2.x + 16} ${120 - R + 4}`} fill="none" markerEnd="url(#arrow)" />
        <text x={POS.q2.x} y="34" textAnchor="middle">
          {label('t4')}
        </text>
      </g>
      {/* t5 q2 -> q3 */}
      <g className={edgeClass('t5')}>
        <line x1={POS.q2.x + R} y1="120" x2={POS.q3.x - R - 2} y2="120" markerEnd="url(#arrow)" />
        <text x={(POS.q2.x + POS.q3.x) / 2} y="108" textAnchor="middle">
          {label('t5')}
        </text>
      </g>

      {STACK_PROTOCOL.states.map((q) => {
        const { x, y } = POS[q];
        const active = q === current;
        const accepting = STACK_PROTOCOL.accepting.includes(q);
        return (
          <g key={q} className={`sd-state${active ? ' is-current' : ''}${active && halted ? ` is-${halted}` : ''}`}>
            <circle cx={x} cy={y} r={R} />
            {accepting && <circle cx={x} cy={y} r={R - 5} className="sd-inner" />}
            <text x={x} y={y + 6} textAnchor="middle" className="sd-name">
              q{q.slice(1)}
            </text>
            {active && (
              <text x={x} y={y + R + 22} textAnchor="middle" className="sd-here">
                {halted === 'rejected' ? 'stuck' : halted === 'accepted' ? 'accept' : 'here'}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
