import { formatNumber, Molar, useDental, useLang, useMessages } from '../arcade';
import { colorForValue } from '../logic/constants';
import { MESSAGES } from '../i18n';

const TILE = 52;

function DiagramTile({ x, value, dental }: { x: number; value: number; dental: boolean }) {
  const { bg, fg } = colorForValue(value);
  return (
    <g transform={`translate(${x} 14)`} data-dental={dental}>
      <rect width={TILE} height={TILE} rx="8" fill={bg} stroke="currentColor" strokeWidth="2" />
      {dental && (
        <g transform={`translate(${TILE / 2 - 9} 4)`}>
          <Molar size={18} />
        </g>
      )}
      <text
        x={TILE / 2}
        y={dental ? 42 : 34}
        textAnchor="middle"
        fontSize={dental ? 17 : 22}
        fontWeight="800"
        fill={fg}
        stroke="#3c3a32"
        strokeWidth="0.6"
        paintOrder="stroke"
      >
        {value}
      </text>
    </g>
  );
}

/** Rules diagram: 8 + 8 → 16 (+16 points). Shapes and numbers carry the meaning, not colour. */
export function MergeDiagram() {
  const t = useMessages(MESSAGES);
  const [lang] = useLang();
  const [dental] = useDental();
  return (
    <svg
      role="img"
      aria-label={t('diagramLabel')}
      viewBox="0 0 280 80"
      width="280"
      style={{ display: 'block', margin: '8px auto', color: 'var(--text-dim)' }}
    >
      <DiagramTile x={4} value={8} dental={dental} />
      <text x="68" y="48" textAnchor="middle" fontSize="22" fontWeight="700" fill="currentColor">
        +
      </text>
      <DiagramTile x={80} value={8} dental={dental} />
      <path d="M142 40h34m-9-9 9 9-9 9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <DiagramTile x={186} value={16} dental={dental} />
      <text x="212" y="76" textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor">
        {t('diagramPoints', { points: formatNumber(16, lang) })}
      </text>
    </svg>
  );
}
