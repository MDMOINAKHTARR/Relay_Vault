export function ProgressBar({ label, percentage, color = 'var(--rv-purple-600)' }: { label?: string; percentage: number; color?: string }) {
  return (
    <div style={{ width: '100%', marginBottom: '12px' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--rv-font-mono)', fontSize: '12px', fontWeight: 800, marginBottom: '6px' }}>
          <span style={{ color: 'var(--rv-gray-600)' }}>{label}</span>
          <span style={{ color: 'var(--rv-black)' }}>
            {percentage.toFixed(1)}%
          </span>
        </div>
      )}
      <div style={{
        width: '100%',
        height: '10px',
        background: 'var(--rv-pure-white)',
        border: '1.5px solid var(--rv-black)',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          background: color,
          borderRight: percentage < 100 ? '1.5px solid var(--rv-black)' : 'none',
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }} />
      </div>
    </div>
  );
}
