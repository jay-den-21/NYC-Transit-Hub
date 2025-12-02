const BASE_URL = "/api";

const handleResponse = async (response) => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return response.json();
};

export const fetchFeedList = async () => {
  const response = await fetch(`${BASE_URL}/feeds`);
  const { feeds } = await handleResponse(response);
  return feeds ?? [];
};

export const fetchFeedSnapshot = async (feedId) => {
  const response = await fetch(`${BASE_URL}/feeds/${feedId}`);
  return handleResponse(response);
};

export const fetchAllStops = async () => {
    const response = await fetch(`${BASE_URL}/stops`);
    return handleResponse(response);
};

export const fetchStationVehicles = async (stationId) => {
    const response = await fetch(`${BASE_URL}/stops/${stationId}/vehicles`);
    return handleResponse(response);
};
