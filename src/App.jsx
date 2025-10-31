import { useState, useEffect } from 'react';
import SelectionPanel from './components/SelectionPanel';
import EventList from './components/EventList';
import DetailPanel from './components/DetailPanel';
import { fetchRuns, fetchEvents, fetchEventDetails } from './services/api';
import './styles/main.css';
import './styles/components.css';

function App() {
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState(null);

  // Fetch runs on component mount
  useEffect(() => {
    const loadRuns = async () => {
      setLoadingRuns(true);
      setError(null);
      try {
        const runsData = await fetchRuns();
        // Extract run names/IDs from the API response
        // The API might return objects with a 'name' or 'id' field, or just strings
        const runNames = runsData.map(run => 
          typeof run === 'string' ? run : (run.name || run.id || run.run_name || JSON.stringify(run))
        );
        setRuns(runNames);
      } catch (err) {
        setError(err.message);
        console.error('Failed to load runs:', err);
      } finally {
        setLoadingRuns(false);
      }
    };

    loadRuns();
  }, []);

  // Fetch events when run is selected
  useEffect(() => {
    if (!selectedRun) {
      setEvents([]);
      setSelectedEvent(null);
      setEventDetails(null);
      return;
    }

    const loadEvents = async () => {
      setLoadingEvents(true);
      setError(null);
      setSelectedEvent(null);
      setEventDetails(null);
      try {
        const eventsData = await fetchEvents(selectedRun);
        setEvents(eventsData);
      } catch (err) {
        setError(err.message);
        console.error('Failed to load events:', err);
        setEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    };

    loadEvents();
  }, [selectedRun]);

  // Fetch event details when event is selected
  useEffect(() => {
    if (!selectedEvent) {
      setEventDetails(null);
      return;
    }

    const loadEventDetails = async () => {
      setLoadingDetails(true);
      setError(null);
      try {
        const eventId = selectedEvent.graceid || selectedEvent.name || selectedEvent.id;
        if (!eventId) {
          throw new Error('Event ID not found');
        }
        const details = await fetchEventDetails(eventId);
        setEventDetails(details);
      } catch (err) {
        setError(err.message);
        console.error('Failed to load event details:', err);
        setEventDetails(null);
      } finally {
        setLoadingDetails(false);
      }
    };

    loadEventDetails();
  }, [selectedEvent]);

  const handleRunChange = (runId) => {
    setSelectedRun(runId || null);
  };

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <SelectionPanel
          runs={runs}
          selectedRun={selectedRun}
          onRunChange={handleRunChange}
          isLoading={loadingRuns}
        />
        <EventList
          events={events}
          selectedRun={selectedRun}
          onEventSelect={handleEventSelect}
          isLoading={loadingEvents}
        />
      </div>
      <DetailPanel
        eventDetails={eventDetails}
        isLoading={loadingDetails}
      />
      {error && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 20px',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          border: '1px solid #fca5a5',
          borderRadius: '6px',
          fontSize: '0.875rem'
        }}>
          Error: {error}
        </div>
      )}
    </div>
  );
}

export default App;
