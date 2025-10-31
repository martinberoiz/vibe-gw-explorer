import { useState } from 'react';

function EventItem({ event, onSelect }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSelect = () => {
    onSelect(event);
  };

  return (
    <div className="event-item">
      <div className="event-item-header" onClick={handleToggle}>
        <span className="event-item-name">{event.graceid || event.name || 'Unknown Event'}</span>
        <span className="event-item-toggle">{isExpanded ? '−' : '+'}</span>
      </div>
      {isExpanded && (
        <div className="event-item-content">
          <div className="event-item-info">
            {event.graceid && <p><strong>GraceDB ID:</strong> {event.graceid}</p>}
            {event.name && <p><strong>Name:</strong> {event.name}</p>}
            {event.instruments && (
              <p><strong>Instruments:</strong> {Array.isArray(event.instruments) ? event.instruments.join(', ') : event.instruments}</p>
            )}
          </div>
          <button className="view-details-btn" onClick={handleSelect}>
            View Full Details
          </button>
        </div>
      )}
    </div>
  );
}

export default EventItem;

