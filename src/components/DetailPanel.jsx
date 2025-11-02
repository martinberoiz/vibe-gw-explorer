import { useState, useEffect } from 'react';
import { fetchVersionDetails } from '../services/api';

function DetailPanel({ eventDetails, isLoading }) {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [versionDetails, setVersionDetails] = useState(null);
  const [loadingVersion, setLoadingVersion] = useState(false);

  // Helper function to extract version number from version data
  const extractVersionNumber = (version) => {
    if (typeof version === 'object' && version !== null) {
      return version.version || version;
    }
    return version;
  };

  // Helper function to find the latest version number
  const findLatestVersion = (versions) => {
    if (!versions || !Array.isArray(versions) || versions.length === 0) {
      return null;
    }

    // Extract all version numbers and convert to numbers for comparison
    const versionNumbers = versions.map(v => {
      const num = extractVersionNumber(v);
      const parsed = typeof num === 'string' ? parseFloat(num) : num;
      return isNaN(parsed) ? 0 : parsed;
    });

    // Find the maximum version number
    const maxVersion = Math.max(...versionNumbers);
    
    // Return the original version data that corresponds to the max
    return versions.find(v => {
      const num = extractVersionNumber(v);
      const parsed = typeof num === 'string' ? parseFloat(num) : num;
      return !isNaN(parsed) && parsed === maxVersion;
    }) || versions[versions.length - 1]; // Fallback to last item
  };

  // Reset version details when event changes and auto-load latest version
  // This hook must be called before any conditional returns
  useEffect(() => {
    // Reset state when loading or no event details
    if (!eventDetails || isLoading) {
      setSelectedVersion(null);
      setVersionDetails(null);
      return;
    }

    // Auto-load the latest version if versions are available
    if (eventDetails.versions && Array.isArray(eventDetails.versions) && eventDetails.versions.length > 0) {
      const latestVersion = findLatestVersion(eventDetails.versions);
      if (latestVersion && eventDetails.name) {
        // Capture event name to avoid stale closure issues
        const eventName = eventDetails.name;
        const versionNumber = String(extractVersionNumber(latestVersion));
        
        // Fetch the latest version details
        const eventIdWithVersion = `${eventName}-v${versionNumber}`;
        
        setSelectedVersion(versionNumber);
        setLoadingVersion(true);
        setVersionDetails(null);
        
        fetchVersionDetails(eventIdWithVersion)
          .then(details => {
            // Only update if we're still on the same event
            if (eventDetails && eventDetails.name === eventName) {
              setVersionDetails(details);
            }
            setLoadingVersion(false);
          })
          .catch(error => {
            console.error('Failed to load version details:', error);
            setVersionDetails(null);
            setLoadingVersion(false);
          });
      }
    } else {
      // No versions available, reset state
      setSelectedVersion(null);
      setVersionDetails(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventDetails, isLoading]);

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

  const formatMetadataValue = (key, value) => {
    if (value === null || value === undefined) return 'N/A';
    
    // Check if this is aliases field - handle both array and JSON string formats
    if (key === 'aliases') {
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            return parsed.join(', ');
          }
        } catch (e) {
          // If parsing fails, fall through to return string value
        }
      }
    }
    
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    
    const stringValue = String(value);
    
    // Check if this is a link field
    if ((key === 'gcn_notice' || key === 'gcn_circular') && stringValue) {
      return (
        <a href={stringValue} target="_blank" rel="noopener noreferrer" className="metadata-link">
          {stringValue}
        </a>
      );
    }
    
    // Check if this is grace_id field
    if (key === 'grace_id' && stringValue) {
      return (
        <a href={`https://gracedb.ligo.org/superevents/${stringValue}`} target="_blank" rel="noopener noreferrer" className="metadata-link">
          {stringValue}
        </a>
      );
    }
    
    return stringValue;
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

  const handleVersionClick = async (version) => {
    if (!eventDetails || !eventDetails.name) return;
    
    // Extract version number from version data
    const versionNumber = String(extractVersionNumber(version));
    
    // Don't reload if this version is already selected
    if (selectedVersion === versionNumber && versionDetails) {
      return;
    }
    
    // Construct version identifier (e.g., "GW150914-v2")
    const eventIdWithVersion = `${eventDetails.name}-v${versionNumber}`;
    
    setSelectedVersion(versionNumber);
    setLoadingVersion(true);
    setVersionDetails(null);
    
    try {
      const details = await fetchVersionDetails(eventIdWithVersion);
      setVersionDetails(details);
    } catch (error) {
      console.error('Failed to load version details:', error);
      setVersionDetails(null);
    } finally {
      setLoadingVersion(false);
    }
  };

  const renderVersions = (versions) => {
    if (!versions || !Array.isArray(versions)) return null;

    return (
      <div className="versions-section">
        <h3>Versions</h3>
        <div className="versions-list">
          {versions.map((version, index) => {
            // Use extractVersionNumber for consistency with handleVersionClick
            const versionNumber = String(extractVersionNumber(version));
            const isActive = selectedVersion === versionNumber;
            
            return (
              <button
                key={index}
                className={`version-button ${isActive ? 'active' : ''}`}
                onClick={() => handleVersionClick(version)}
                disabled={loadingVersion}
              >
                {versionNumber}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderVersionDetails = () => {
    if (!versionDetails) return null;

    return (
      <div className="version-details-section">
        <h3>Version {selectedVersion} Details</h3>
        <dl className="version-details-list">
          {versionDetails.parameters_url && (
            <div className="version-detail-item">
              <dt>Parameters</dt>
              <dd>
                <a 
                  href={versionDetails.parameters_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="version-link"
                >
                  {versionDetails.parameters_url}
                </a>
              </dd>
            </div>
          )}
          {versionDetails.strain_files_url && (
            <div className="version-detail-item">
              <dt>Strain Files</dt>
              <dd>
                <a 
                  href={versionDetails.strain_files_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="version-link"
                >
                  {versionDetails.strain_files_url}
                </a>
              </dd>
            </div>
          )}
          {versionDetails.timelines_url && (
            <div className="version-detail-item">
              <dt>Timelines</dt>
              <dd>
                <a 
                  href={versionDetails.timelines_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="version-link"
                >
                  {versionDetails.timelines_url}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>
    );
  };

  return (
    <div className="detail-panel">
      <h2>Event Details</h2>
      <div className="detail-panel-content">
        <div className="event-header">
          <h3>{ eventDetails.name }</h3>
        </div>

        {eventDetails.versions && renderVersions(eventDetails.versions)}

        {loadingVersion && !versionDetails && (
          <div className="version-details-section">
            <div className="version-loading">Loading version details...</div>
          </div>
        )}

        {versionDetails && renderVersionDetails()}

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
                  <dd>{formatMetadataValue(key, value)}</dd>
                </div>
              ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

export default DetailPanel;

