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

export const geocodePlaces = async (query) => {
  const params = new URLSearchParams({ query });
  const response = await fetch(`${BASE_URL}/geocode?${params.toString()}`);
  const { results } = await handleResponse(response);
  return results ?? [];
};

export const fetchAccessibility = async (stationId) => {
  const params = stationId ? `?stationId=${encodeURIComponent(stationId)}` : "";
  const response = await fetch(`${BASE_URL}/accessibility${params}`);
  return handleResponse(response);
};

export const fetchRouteShapes = async () => {
  const response = await fetch(`${BASE_URL}/route-shapes`);
  const { shapes } = await handleResponse(response);
  return shapes || {};
};

export const fetchRouteStops = async () => {
  const response = await fetch(`${BASE_URL}/route-stops`);
  const { routeStops, stopRoutes } = await handleResponse(response);
  return {
    routeStops: routeStops || {},
    stopRoutes: stopRoutes || {}
  };
};
