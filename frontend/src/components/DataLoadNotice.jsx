import React from 'react';

export default function DataLoadNotice({ loading, error, empty, period, onRetry }) {
  if (!loading && !error && !empty) return null;
  const style = {
    padding: '14px', borderRadius: '12px', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between', gap: '12px',
    backgroundColor: error ? '#450a0a' : '#172554',
    color: error ? '#fecaca' : '#bfdbfe',
    border: `1px solid ${error ? '#ef4444' : '#3b82f6'}`,
  };
  return (
    <div role={error ? 'alert' : 'status'} style={style}>
      <span>
        {loading ? `Loading data for ${period}. The server may take a moment to start…`
          : error ? `Could not load data for ${period}. ${error}`
          : `No saved data was found for ${period}.`}
      </span>
      {!loading && error && (
        <button type="button" onClick={onRetry} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #fca5a5', backgroundColor: '#7f1d1d', color: '#ffffff', cursor: 'pointer' }}>
          Retry
        </button>
      )}
    </div>
  );
}
