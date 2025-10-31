import EventItem from './EventItem';

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

  return (
    <div className="event-list">
      <h2>Events for {selectedRun}</h2>
      <div className="event-list-content">
        {events.map((event, index) => (
          <EventItem
            key={event.graceid || event.name || index}
            event={event}
            onSelect={onEventSelect}
          />
        ))}
      </div>
    </div>
  );
}

export default EventList;

