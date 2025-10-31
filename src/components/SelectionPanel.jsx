function SelectionPanel({ runs, selectedRun, onRunChange, isLoading }) {
  return (
    <div className="selection-panel">
      <h2>Select Run</h2>
      <div className="select-wrapper">
        <select
          value={selectedRun || ''}
          onChange={(e) => onRunChange(e.target.value)}
          disabled={isLoading}
          className="select-input"
        >
          <option value="">-- Select a run --</option>
          {runs.map((run) => (
            <option key={run} value={run}>
              {run}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default SelectionPanel;

