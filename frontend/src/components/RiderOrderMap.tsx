import type { IOrder } from "../types";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { realtimeService } from "../config";

const riderIcon = new L.DivIcon({
  html: "🛵",
  iconSize: [30, 30],
  className: "",
});

const deliveryIcon = new L.DivIcon({
  html: "📦",
  iconSize: [30, 30],
  className: "",
});

interface Props {
  order: IOrder;
}

// Auto-recenter map on rider location
const MapRecenter = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [center, map]);
  return null;
};

const RiderOrderMap = ({ order }: Props) => {
  const [riderLocation, setRiderLocation] = useState<[number, number] | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

  if (order.deliveryAddress.latitude == null || order.deliveryAddress.longitude == null) {
    return null;
  }

  const deliveryLocation: [number, number] = [
    order.deliveryAddress.latitude,
    order.deliveryAddress.longitude,
  ];

  // 1. Poll GPS Location every 5 seconds
  useEffect(() => {
    const fetchLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latitude = pos.coords.latitude;
          const longitude = pos.coords.longitude;
          setRiderLocation([latitude, longitude]);

          axios.post(
            `${realtimeService}/api/v1/internal/emit`,
            {
              event: "rider:location",
              room: `order:${order._id}`,
              payload: { latitude, longitude },
            },
            {
              headers: {
                "x-internal-key": import.meta.env.VITE_INTERNAL_SERVICE_KEY,
              },
            }
          );
        },
        (err) => console.log("Location error:", err),
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000,
        }
      );
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 5000);
    return () => clearInterval(interval);
  }, [order._id]);

  // 2. Fetch Street Directions (OSRM API) whenever Rider or Dropoff Location changes
  useEffect(() => {
    if (!riderLocation) return;

    const getDrivingRoute = async () => {
      try {
        // OSRM expects coordinates formatted as: longitude,latitude
        const start = `${riderLocation[1]},${riderLocation[0]}`;
        const end = `${deliveryLocation[1]},${deliveryLocation[0]}`;

        const response = await fetch(
          `https://routing.openstreetmap.de/routed-car/route/v1/driving/${start};${end}?overview=full&geometries=geojson`
        );
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          // OSRM GeoJSON gives [lng, lat], convert back to Leaflet [lat, lng]
          const coords = data.routes[0].geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
          );
          setRouteCoordinates(coords);
          console.log("✅ Road coordinates loaded successfully:", coords.length, "points");
        }
      } catch (error) {
        console.error("Error fetching road directions:", error);
      }
    };

    getDrivingRoute();
  }, [riderLocation?.[0], riderLocation?.[1]]);

  if (!riderLocation) return null;

  return (
    <div className="rounded-xl bg-white shadow-sm p-3">
      <MapContainer center={riderLocation} zoom={14} className="w-full h-80 rounded-lg">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter center={riderLocation} />

        {/* 3. Render Polyline using REAL street coordinates array! */}
        {routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{ color: "#E23744", weight: 6, opacity: 0.9 }}
          />
        )}

        <Marker position={riderLocation} icon={riderIcon}>
          <Popup>You (Rider)</Popup>
        </Marker>
        <Marker position={deliveryLocation} icon={deliveryIcon}>
          <Popup>Delivery Location</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default RiderOrderMap;