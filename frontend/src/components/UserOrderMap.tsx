import { useEffect, useRef} from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';

/* eslint-disable @typescript-eslint/no-namespace */
declare module 'leaflet' {
    namespace Routing {
        function control(options: any): any;
        function osrmv1(options: any): any;
    }
}
/* eslint-enable @typescript-eslint/no-namespace */

const riderIcon = new L.DivIcon({
    html: "🛵",
    iconSize: [30, 30],
    className:"",
})

const deliveryIcon = new L.DivIcon({
    html:"📦",
    iconSize:[30,30],
    className:"",
})


const Routing = ({
    from,
    to
}:{
    from: [number, number], //latitude and longitude of the restaurant
    to: [number, number] //latitude and longitude of the delivery address
})=>{
    const map = useMap();

    const routingControlRef = useRef<any>(null);

    useEffect(() => {
        if (!map) return;

        const control = L.Routing.control({
            waypoints: [L.latLng(from), L.latLng(to)],
            lineOptions: { styles: [{ color: "#E23744", weight: 5 }] },
            addWayPoints: false,
            draggableWayPoints: false,
            show: false,
            createMarker: () => null,
            router: L.Routing.osrmv1({
                serviceUrl: "https://router.project-osrm.org/route/v1",
            }),
        }).addTo(map);

        routingControlRef.current = control;

        return () => {
            if (map && routingControlRef.current) {
                try {
                    map.removeControl(routingControlRef.current);
                } catch (e) {
                    console.warn("Leaflet cleanup warning caught safely", e);
                }
            }
        };
    }, [map]); 

    // Dynamically update waypoints when coordinates change without re-creating the control
    useEffect(() => {
        if (routingControlRef.current) {
            routingControlRef.current.setWaypoints([L.latLng(from), L.latLng(to)]);
        }
    }, [from, to]);

    return null;
};


interface Props{
    riderLocation: [number, number];
    deliveryLocation: [number, number];
}

const UserOrderMap = ({ riderLocation, deliveryLocation }: Props) => {





  return (
      <div className="rounded-xl bg-white shadow-sm p-3" >
          <MapContainer 
          center={riderLocation}
          zoom={14}
          className="w-full h-80 rounded-lg"
          >
              <TileLayer attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={riderLocation} icon={riderIcon} >
                  <Popup>Rider</Popup>
              </Marker>
              <Marker position={deliveryLocation} icon={deliveryIcon} >
                  <Popup>Delivery Location</Popup>
              </Marker>
              <Routing from={riderLocation} to={deliveryLocation} />
          </MapContainer>    
      </div>
    )
}

export default UserOrderMap