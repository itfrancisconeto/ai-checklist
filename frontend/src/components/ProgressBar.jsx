import React from "react";

function ProgressBar({ items }) {
  const total = items.length;
  const done = items.filter((item) => item.done).length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="progress-wrapper" aria-label={`Progresso: ${percent}%`}>
      <div className="progress-info">
        <strong>Progresso</strong>
        <span>{percent}%</span>
      </div>
      <div className="progress">
        <div className="bar" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default ProgressBar;
