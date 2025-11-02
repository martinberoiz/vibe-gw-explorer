import { useState, useEffect } from 'react';
import { fetchVersionDetails, fetchStrainFiles } from '../services/api';

function DetailPanel({ eventDetails, isLoading }) {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [versionDetails, setVersionDetails] = useState(null);
  const [loadingVersion, setLoadingVersion] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [strainFiles, setStrainFiles] = useState(null);
  const [loadingStrainFiles, setLoadingStrainFiles] = useState(false);

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
      setActiveTab(null);
      setStrainFiles(null);
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
              // Set default active tab to first available
              if (details.parameters_url) {
                setActiveTab('parameters');
              } else if (details.strain_files_url) {
                setActiveTab('strain-files');
              } else if (details.timelines_url) {
                setActiveTab('timelines');
              }
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
      setActiveTab(null);
      setStrainFiles(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventDetails, isLoading]);

  // Auto-fetch strain files when strain-files tab becomes active
  useEffect(() => {
    if (activeTab === 'strain-files' && versionDetails?.strain_files_url && !strainFiles && !loadingStrainFiles) {
      setLoadingStrainFiles(true);
      fetchStrainFiles(versionDetails.strain_files_url)
        .then(files => {
          setStrainFiles(files);
          setLoadingStrainFiles(false);
        })
        .catch(error => {
          console.error('Failed to load strain files:', error);
          setStrainFiles([]);
          setLoadingStrainFiles(false);
        });
    }
  }, [activeTab, versionDetails, strainFiles, loadingStrainFiles]);

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
      // Reset active tab and strain files when version changes
      setActiveTab(null);
      setStrainFiles(null);
      // Set default active tab to first available
      if (details.parameters_url) {
        setActiveTab('parameters');
      } else if (details.strain_files_url) {
        setActiveTab('strain-files');
      } else if (details.timelines_url) {
        setActiveTab('timelines');
      }
    } catch (error) {
      console.error('Failed to load version details:', error);
      setVersionDetails(null);
    } finally {
      setLoadingVersion(false);
    }
  };

  const handleTabClick = async (tabName) => {
    setActiveTab(tabName);
    
    // Fetch strain files when the strain files tab is clicked
    if (tabName === 'strain-files' && versionDetails?.strain_files_url && !strainFiles) {
      setLoadingStrainFiles(true);
      try {
        const files = await fetchStrainFiles(versionDetails.strain_files_url);
        setStrainFiles(files);
      } catch (error) {
        console.error('Failed to load strain files:', error);
        setStrainFiles([]);
      } finally {
        setLoadingStrainFiles(false);
      }
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

  const renderTabContent = () => {
    if (!versionDetails || !activeTab) return null;

    if (activeTab === 'parameters') {
      return (
        <div className="version-tab-content">
          {versionDetails.parameters_url ? (
            <a 
              href={versionDetails.parameters_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="version-link"
            >
              {versionDetails.parameters_url}
            </a>
          ) : (
            <p className="version-tab-empty">No parameters URL available</p>
          )}
        </div>
      );
    }

    if (activeTab === 'strain-files') {
      if (loadingStrainFiles) {
        return (
          <div className="version-tab-content">
            <div className="version-loading">Loading strain files...</div>
          </div>
        );
      }

      if (!strainFiles || strainFiles.length === 0) {
        return (
          <div className="version-tab-content">
            <p className="version-tab-empty">No strain files available</p>
          </div>
        );
      }

      return (
        <div className="version-tab-content">
          <div className="strain-files-grid">
            {strainFiles.map((file, index) => (
              <div key={index} className="strain-file-card">
                <h4 className="strain-file-card-title">{file.detector || 'Unknown Detector'}</h4>
                <div className="strain-file-card-body">
                  {file.gps_start && (
                    <div className="strain-file-field">
                      <span className="strain-file-label">GPS Start:</span>
                      <span className="strain-file-value">{file.gps_start}</span>
                    </div>
                  )}
                  {file.sample_rate_kHz !== undefined && (
                    <div className="strain-file-field">
                      <span className="strain-file-label">Sample Rate:</span>
                      <span className="strain-file-value">{file.sample_rate_kHz} kHz</span>
                    </div>
                  )}
                  {file.duration !== undefined && (
                    <div className="strain-file-field">
                      <span className="strain-file-label">Duration:</span>
                      <span className="strain-file-value">{file.duration} s</span>
                    </div>
                  )}
                  {file.file_format && (
                    <div className="strain-file-field">
                      <span className="strain-file-label">Format:</span>
                      <span className="strain-file-value">{file.file_format}</span>
                    </div>
                  )}
                  {file.download_url && (
                    <div className="strain-file-field">
                      <a 
                        href={file.download_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="strain-file-download"
                      >
                        Download
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'timelines') {
      return (
        <div className="version-tab-content">
          {versionDetails.timelines_url ? (
            <a 
              href={versionDetails.timelines_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="version-link"
            >
              {versionDetails.timelines_url}
            </a>
          ) : (
            <p className="version-tab-empty">No timelines URL available</p>
          )}
        </div>
      );
    }

    return null;
  };

  const renderVersionDetails = () => {
    if (!versionDetails) return null;

    const availableTabs = [];
    if (versionDetails.parameters_url) availableTabs.push('parameters');
    if (versionDetails.strain_files_url) availableTabs.push('strain-files');
    if (versionDetails.timelines_url) availableTabs.push('timelines');

    if (availableTabs.length === 0) return null;

    return (
      <div className="version-details-section">
        <h3>Version {selectedVersion} Details</h3>
        <div className="version-tabs-container">
          <nav className="version-tabs-nav">
            {availableTabs.map((tabName) => (
              <button
                key={tabName}
                className={`version-tab-button ${activeTab === tabName ? 'active' : ''}`}
                onClick={() => handleTabClick(tabName)}
              >
                {tabName === 'parameters' && 'Parameters'}
                {tabName === 'strain-files' && 'Strain Files'}
                {tabName === 'timelines' && 'Timelines'}
              </button>
            ))}
          </nav>
          <div className="version-tabs-content-wrapper">
            {renderTabContent()}
          </div>
        </div>
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

        {versionDetails && renderVersionDetails()}
      </div>
    </div>
  );
}

export default DetailPanel;

