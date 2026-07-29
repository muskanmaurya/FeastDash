import type { IOrder } from "../types";
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
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

// 1. Map Recenter Component to follow rider smoothly
const MapRecenter = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [center, map]);
  return null;
};

const Routing = ({
  from,
  to,
}: {
  from: [number, number];
  to: [number, number];
}) => {
  const map = useMap();
  const routingControlRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    // Validate valid numeric lat/lng coordinates before firing OSRM
    if (!from || !to || isNaN(from[0]) || isNaN(from[1]) || isNaN(to[0]) || isNaN(to[1])) {
      return;
    }

    const RoutingObj = (L as any).Routing;
    if (!RoutingObj || !RoutingObj.control) return;

    // Clean up existing instance before recreating
    if (routingControlRef.current) {
      try {
        map.removeControl(routingControlRef.current);
      } catch (e) {
        // ignore
      }
    }

    try {
      const control = RoutingObj.control({
        waypoints: [
          L.latLng(Number(from[0]), Number(from[1])),
          L.latLng(Number(to[0]), Number(to[1]))
        ],
        lineOptions: {
          styles: [{ color: "#E23744", weight: 6, opacity: 0.9 }],
          extendToWaypoints: true,
          missingRouteTolerance: 100,
        },
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: false,
        show: false,
        createMarker: () => null,
        // Using OpenStreetMap DE endpoint which doesn't block Vercel origins:
        router: RoutingObj.osrmv1({
          serviceUrl: "https://routing.openstreetmap.de/routed-car/route/v1",
        }),
      }).addTo(map);

      // Debugging logs to verify OSRM in Console
      control.on("routesfound", (e: any) => {
        console.log("✅ REAL ROAD ROUTE FOUND:", e.routes);
      });

      control.on("routingerror", (e: any) => {
        console.error("❌ OSRM ROUTE ERROR (Falling back to straight line):", e);
      });

      routingControlRef.current = control;
    } catch (err) {
      console.error("Routing error:", err);
    }

    return () => {
      if (map && routingControlRef.current) {
        try {
          map.removeControl(routingControlRef.current);
          routingControlRef.current = null;
        } catch (e) {
          // safe cleanup
        }
      }
    };
  }, [map, from[0], from[1], to[0], to[1]]); // Trigger on coordinate change cleanly

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
    const fetchLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latitude = pos.coords.latitude;
          const longitude = pos.coords.longitude;
          setRiderLocation([latitude, longitude]);
          console.log("📍 GPS Ping Triggered at:", new Date().toLocaleTimeString(), pos.coords);

          axios.post(
            `${realtimeService}/api/v1/internal/emit`,
            {
              event: "rider:location",
              room: `order:${order._id}`, // Fixed room target to match Order ID
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
          maximumAge: 0, // Force fresh GPS coordinates on every check
          timeout: 5000,
        }
      );
    };
    fetchLocation();
    const interval = setInterval(fetchLocation, 5000); // Fixed interval to 5 seconds (5000ms)

    return () => clearInterval(interval);
  }, [order._id]);

  if (!riderLocation) return null;

  return (
    <div className="rounded-xl bg-white shadow-sm p-3">
      <MapContainer center={riderLocation} zoom={14} className="w-full h-80 rounded-lg">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter center={riderLocation} />

        {/* Guaranteed Red Polyline */}
        <Polyline
          positions={[riderLocation, deliveryLocation]}
          pathOptions={{ color: "#E23744", weight: 6, opacity: 0.9 }}
        />

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