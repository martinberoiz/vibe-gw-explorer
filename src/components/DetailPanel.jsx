function DetailPanel({ eventDetails, isLoading }) {
  if (!eventDetails) {
    return (
      <div className="detail-panel">
        <div className="detail-panel-placeholder">
          <p>Select an event to view details</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="detail-panel">
        <div className="detail-panel-placeholder">
          <p>Loading details...</p>
        </div>
      </div>
    );
  }

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const renderParameters = (params) => {
    if (!params || typeof params !== 'object') return null;

    return (
      <div className="parameters-section">
        <h3>Parameters</h3>
        <dl className="parameters-list">
          {Object.entries(params).map(([key, value]) => (
            <div key={key} className="parameter-item">
              <dt>{key}</dt>
              <dd>{formatValue(value)}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  };

  const renderVersions = (versions) => {
    if (!versions || !Array.isArray(versions)) return null;

    return (
      <div className="versions-section">
        <h3>Versions</h3>
        <ul className="versions-list">
          {versions.map((version, index) => (
            <li key={index}>{version}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="detail-panel">
      <h2>Event Details</h2>
      <div className="detail-panel-content">
        <div className="event-header">
          <h3>{eventDetails.graceid || eventDetails.name || 'Unknown Event'}</h3>
        </div>

        {eventDetails.versions && renderVersions(eventDetails.versions)}

        {eventDetails.parameters && renderParameters(eventDetails.parameters)}

        {/* Display other metadata */}
        <div className="metadata-section">
          <h3>Metadata</h3>
          <dl className="metadata-list">
            {Object.entries(eventDetails)
              .filter(([key]) => !['versions', 'parameters'].includes(key))
              .map(([key, value]) => (
                <div key={key} className="metadata-item">
                  <dt>{key}</dt>
                  <dd>{formatValue(value)}</dd>
                </div>
              ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

export default DetailPanel;

