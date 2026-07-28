import type { IOrder } from "../types";
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import axios from "axios";
import { realtimeService } from "../config";

/* eslint-disable @typescript-eslint/no-namespace */
declare module "leaflet" {
  namespace Routing {
    function control(options: any): any;
    function osrmv1(options: any): any;
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

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

// 1. Helper component to auto-pan map when rider moves
const MapRecenter = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [center, map]);
  return null;
};

// 2. Fixed Routing component
const Routing = ({
  from,
  to,
}: {
  from: [number, number];
  to: [number, number];
}) => {
  const map = useMap();
  const routingControlRef = useRef<any>(null);

  // Initialize control ONCE when map mounts
  useEffect(() => {
    if (!map) return;

    if (!L || !(L as any).Routing) {
      console.warn("Leaflet Routing Machine is not ready yet.");
      return;
    }

    try {
      const control = (L as any).Routing.control({
        waypoints: [L.latLng(from), L.latLng(to)],
        lineOptions: {
          styles: [{ color: "#E23744", weight: 6, opacity: 1 }],
          extendToWaypoints: true,
          missingRouteTolerance: 0,
        },
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: false, // Prevents map zoom jumping on every tick
        show: false,
        createMarker: () => null,
        router: (L as any).Routing.osrmv1({
          serviceUrl: "https://router.project-osrm.org/route/v1",
        }),
      }).addTo(map);

      routingControlRef.current = control;
    } catch (err) {
      console.error("Leaflet Routing Error:", err);
    }

    return () => {
      if (map && routingControlRef.current) {
        try {
          map.removeControl(routingControlRef.current);
        } catch (e) {
          // Safe cleanup
        }
      }
    };
  }, [map]); // CRITICAL: ONLY [map] in dependencies!

  // Dynamically update waypoints as rider moves
  useEffect(() => {
    if (routingControlRef.current) {
      try {
        routingControlRef.current.setWaypoints([
          L.latLng(from),
          L.latLng(to),
        ]);
      } catch (err) {
        console.warn("Error updating waypoints safely handled:", err);
      }
    }
  }, [from, to]);

  return null;
};

const RiderOrderMap = ({ order }: Props) => {
  const [riderLocation, setRiderLocation] = useState<[number, number] | null>(null);

  if (order.deliveryAddress.latitude == null || order.deliveryAddress.longitude == null) {
    return null;
  }

  const deliveryLocation: [number, number] = [
    order.deliveryAddress.latitude,
    order.deliveryAddress.longitude,
  ];

  useEffect(() => {
    const fetchLocation = async () => {
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
          maximumAge: 5000,
          timeout: 10000,
        }
      );
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 10000);

    return () => clearInterval(interval);
  }, [order._id]);

  if (!riderLocation) return null;

  return (
    <div className="rounded-xl bg-white shadow-sm p-3">
      <MapContainer
        center={riderLocation}
        zoom={14}
        className="w-full h-80 rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter center={riderLocation} />
        <Marker position={riderLocation} icon={riderIcon}>
          <Popup>You (Rider)</Popup>
        </Marker>
        <Marker position={deliveryLocation} icon={deliveryIcon}>
          <Popup>Delivery Location</Popup>
        </Marker>
        <Routing from={riderLocation} to={deliveryLocation} />
      </MapContainer>
    </div>
  );
};

export default RiderOrderMap;