const API_BASE_URL = 'https://gwosc.org/api/v2';

/**
 * Fetches all available runs from GWOSC API
 * @returns {Promise<Array>} Array of run objects
 */
export async function fetchRuns() {
  try {
    const response = await fetch(`${API_BASE_URL}/runs`);
    if (!response.ok) {
      throw new Error(`Failed to fetch runs: ${response.statusText}`);
    }
    const data = await response.json();
    // Handle pagination if present
    return Array.isArray(data) ? data : (data.results || []);
  } catch (error) {
    console.error('Error fetching runs:', error);
    throw error;
  }
}

/**
 * Fetches events for a specific run
 * @param {string} runId - The run identifier
 * @returns {Promise<Array>} Array of event objects
 */
export async function fetchEvents(runId) {
  try {
    const response = await fetch(`${API_BASE_URL}/runs/${runId}/events`);
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }
    const data = await response.json();
    // Handle pagination if present
    return Array.isArray(data) ? data : (data.results || []);
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}

/**
 * Fetches detailed information about a specific event
 * @param {string} eventId - The event identifier
 * @returns {Promise<Object>} Event details object with versions and parameters
 */
export async function fetchEventDetails(eventId) {
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch event details: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching event details:', error);
    throw error;
  }
}

/**
 * Fetches version-specific details for an event
 * @param {string} eventIdWithVersion - The event identifier with version suffix (e.g., "GW150914-v2")
 * @returns {Promise<Object>} Version details object with parameters_url, strain_files_url, and timelines_url
 */
export async function fetchVersionDetails(eventIdWithVersion) {
  try {
    const response = await fetch(`${API_BASE_URL}/event-versions/${eventIdWithVersion}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch version details: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching version details:', error);
    throw error;
  }
}

/**
 * Fetches strain files from a strain files URL
 * @param {string} strainFilesUrl - The URL to fetch strain files from
 * @returns {Promise<Array>} Array of strain file objects with detector, gps_start, sample_rate_kHz, duration, file_format, and download_url
 */
export async function fetchStrainFiles(strainFilesUrl) {
  try {
    const response = await fetch(strainFilesUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch strain files: ${response.statusText}`);
    }
    const data = await response.json();
    // Handle pagination if present
    return Array.isArray(data) ? data : (data.results || []);
  } catch (error) {
    console.error('Error fetching strain files:', error);
    throw error;
  }
}

