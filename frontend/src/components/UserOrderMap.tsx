import type { IOrder } from "../types";
import {useState, useEffect} from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import axios from "axios";
import { realtimeService } from "../config";

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

    useEffect(()=>{
        const control = L.Routing.control({
            waypoints:[L.latLng(from), L.latLng(to)],
            lineOptions:{
                styles:[{color: "#E23744", weight: 5}],
            },
            addWayPoints: false,
            draggableWayPoints: false,
            show: false,
            createMarker: ()=>null,
            router:L.Routing.osrmv1({
                serviceUrl: "https://router.project-osrm.org/route/v1"
            })
        }).addTo(map);
        return ()=>{
            map.removeControl(control);
        };
    },[from, to, map])

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