function EventList({ events, selectedRun, onEventSelect, isLoading }) {
  if (!selectedRun) {
    return (
      <div className="event-list">
        <div className="event-list-placeholder">
          <p>Select a run to view events</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="event-list">
        <div className="event-list-placeholder">
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="event-list">
        <div className="event-list-placeholder">
          <p>No events found for this run</p>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const value = e.target.value;
    if (value === "" || value === null || value === undefined) {
      onEventSelect(null);
      return;
    }
    
    const selectedIndex = parseInt(value, 10);
    if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < events.length) {
      const selectedEvent = events[selectedIndex];
      if (selectedEvent) {
        onEventSelect(selectedEvent);
      } else {
        console.error('Selected event not found at index:', selectedIndex);
        onEventSelect(null);
      }
    } else {
      console.error('Invalid selection index:', selectedIndex);
      onEventSelect(null);
    }
  };

  return (
    <div className="event-list">
      <h2>Events for {selectedRun}</h2>
      <p className="event-list-help">Select an event...</p>
      <select
        className="event-list-select"
        size="10"
        onChange={handleChange}
      >
        {events.map((event, index) => (
          <option
            key={event.graceid || event.name || index}
            value={index}
          >
            {event.graceid || event.name || 'Unknown Event'}
          </option>
        ))}
      </select>
    </div>
  );
}

export default EventList;

