import React from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";

const DEFAULT_CENTER = [-17.8252, 31.0335];

const FitMapBounds = ({ riderLocation, destinationLocation }) => {
  const map = useMap();

  React.useEffect(() => {
    if (!destinationLocation && !riderLocation) {
      map.setView(DEFAULT_CENTER, 12);
      return;
    }

    if (destinationLocation && riderLocation) {
      map.fitBounds(
        L.latLngBounds(
          [riderLocation.latitude, riderLocation.longitude],
          [destinationLocation.latitude, destinationLocation.longitude],
        ),
        {
          padding: [36, 36],
        },
      );
      return;
    }

    const point = destinationLocation || riderLocation;
    map.setView([point.latitude, point.longitude], 15);
  }, [destinationLocation, map, riderLocation]);

  return null;
};

export const LiveRouteMap = ({ deliveryAddress, riderLocation }) => {
  const [destinationLocation, setDestinationLocation] = React.useState(null);
  const [routeCoordinates, setRouteCoordinates] = React.useState([]);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;

    const loadDestination = async () => {
      setError("");
      setDestinationLocation(null);

      if (!deliveryAddress) {
        return;
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(deliveryAddress)}`,
          {
            headers: {
              Accept: "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Unable to locate destination.");
        }

        const payload = await response.json();
        const match = payload?.[0];

        if (!match) {
          throw new Error("Destination not found on map.");
        }

        if (!cancelled) {
          setDestinationLocation({
            latitude: Number(match.lat),
            longitude: Number(match.lon),
          });
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "Unable to load destination.");
        }
      }
    };

    loadDestination();

    return () => {
      cancelled = true;
    };
  }, [deliveryAddress]);

  React.useEffect(() => {
    let cancelled = false;

    const loadRoute = async () => {
      setRouteCoordinates([]);

      if (!destinationLocation || !riderLocation) {
        return;
      }

      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${riderLocation.longitude},${riderLocation.latitude};${destinationLocation.longitude},${destinationLocation.latitude}?overview=full&geometries=geojson`,
          {
            headers: {
              Accept: "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Unable to load route.");
        }

        const payload = await response.json();
        const geometry = payload?.routes?.[0]?.geometry?.coordinates;

        if (!geometry?.length) {
          throw new Error("Route unavailable.");
        }

        if (!cancelled) {
          setRouteCoordinates(geometry.map(([longitude, latitude]) => [latitude, longitude]));
        }
      } catch {
        if (!cancelled && destinationLocation && riderLocation) {
          setRouteCoordinates([
            [riderLocation.latitude, riderLocation.longitude],
            [destinationLocation.latitude, destinationLocation.longitude],
          ]);
        }
      }
    };

    loadRoute();

    return () => {
      cancelled = true;
    };
  }, [destinationLocation, riderLocation]);

  const mapCenter = destinationLocation
    ? [destinationLocation.latitude, destinationLocation.longitude]
    : riderLocation
      ? [riderLocation.latitude, riderLocation.longitude]
      : DEFAULT_CENTER;

  return (
    <div className="leaflet-map-shell">
      <MapContainer center={mapCenter} zoom={14} scrollWheelZoom={false} className="leaflet-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitMapBounds riderLocation={riderLocation} destinationLocation={destinationLocation} />

        {routeCoordinates.length ? <Polyline positions={routeCoordinates} pathOptions={{ color: "#23ddd5", weight: 5, opacity: 0.88 }} /> : null}

        {riderLocation ? (
          <CircleMarker
            center={[riderLocation.latitude, riderLocation.longitude]}
            radius={10}
            pathOptions={{
              color: "#071121",
              fillColor: "#75f0b7",
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              Rider location
            </Tooltip>
          </CircleMarker>
        ) : null}

        {destinationLocation ? (
          <CircleMarker
            center={[destinationLocation.latitude, destinationLocation.longitude]}
            radius={10}
            pathOptions={{
              color: "#071121",
              fillColor: "#23ddd5",
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              Drop-off point
            </Tooltip>
          </CircleMarker>
        ) : null}
      </MapContainer>

      {error ? <p className="map-status-note">{error}</p> : null}
      {!riderLocation ? <p className="map-status-note">Enable device location to center the route on the rider.</p> : null}
    </div>
  );
};
