import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

// Auto-recenter map when rider moves
const MapRecenter = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        if (map && center) {
            map.panTo(center);
        }
    }, [center, map]);
    return null;
};

interface Props {
    riderLocation: [number, number];
    deliveryLocation: [number, number];
}

const UserOrderMap = ({ riderLocation, deliveryLocation }: Props) => {
    const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

    // Fetch road-snapped coordinates whenever rider moves
    useEffect(() => {
        if (!riderLocation || !deliveryLocation) return;

        const getDrivingRoute = async () => {
            try {
                // OSRM expects coordinates as longitude,latitude
                const start = `${riderLocation[1]},${riderLocation[0]}`;
                const end = `${deliveryLocation[1]},${deliveryLocation[0]}`;

                const response = await fetch(
                    `https://routing.openstreetmap.de/routed-car/route/v1/driving/${start};${end}?overview=full&geometries=geojson`
                );
                const data = await response.json();

                if (data.routes && data.routes.length > 0) {
                    const coords = data.routes[0].geometry.coordinates.map(
                        (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
                    );
                    setRouteCoordinates(coords);
                }
            } catch (error) {
                console.error("UserOrderMap: Error fetching road route:", error);
            }
        };

        getDrivingRoute();
    }, [riderLocation[0], riderLocation[1], deliveryLocation[0], deliveryLocation[1]]);

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
                
                {/* Dynamically recenter as rider travels */}
                <MapRecenter center={riderLocation} />

                {/* Road-snapped Red Polyline */}
                {routeCoordinates.length > 0 && (
                    <Polyline
                        positions={routeCoordinates}
                        pathOptions={{ color: "#E23744", weight: 6, opacity: 0.9 }}
                    />
                )}

                <Marker position={riderLocation} icon={riderIcon}>
                    <Popup>Rider</Popup>
                </Marker>
                <Marker position={deliveryLocation} icon={deliveryIcon}>
                    <Popup>Delivery Location</Popup>
                </Marker>
            </MapContainer>    
        </div>
    );
};

export default UserOrderMap;