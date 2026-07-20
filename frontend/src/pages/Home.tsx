import { useSearchParams } from "react-router-dom";
import { useAppData } from "../context/AppContext"
import { useEffect, useState } from "react";
import type { IRestaurant } from "../types";
import { restaurantService } from "../config";
import axios from "axios";
import toast from "react-hot-toast";
import RestaurantCard from "../components/RestaurantCard";

const Home = () => {

  const { location } = useAppData();

  const [searchParams] = useSearchParams();

  const search = searchParams.get("search") || ""

  const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  //haversine formula to calculate distance between two points on earth
  const getDistanceKm = (lat1:number, lon1:number, lat2:number, lon2: number):number =>{ //here lat1 and lon1 are location of the user and lat2 and lon2 are location of the restaurant
    
    const R = 6371; // Radius of the earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180; //dLat is the difference between the latitudes of the two points in radians divided by 180 and multiplied by pi which means that we are converting the difference in latitudes from degrees to radians
    const dLon = ((lon2 - lon1) * Math.PI) / 180; //dLon is the difference between the longitudes of the two points in radians divided by 180 and multiplied by pi which means that we are converting the difference in longitudes from degrees to radians

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2); //a is the square of half the chord length between the two points

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return +(R * c).toFixed(2);

  }

  const fetchRestaurants = async() =>{
    if(!location?.latitude || !location.longitude){
      return;
      // return alert("You need to give permission of your location to continue");
    }
    
    try{ 
      setLoading(true);
      const {data} = await axios.get(`${restaurantService}/api/restaurant/all`,{
        params:{
          latitude: location.latitude,
          longitude: location.longitude,
          search,
        },
          headers:{
            Authorization: `Bearer ${localStorage.getItem("token")}`,
         },
      });

      setRestaurants(data.restaurants ?? []);
    }catch(error){
      console.log("Error in fetching restaurants: ", error);
      toast.error("Error in fetching restaurants");
    }finally{
      setLoading(false)
    }
  };

  useEffect(() =>{
    fetchRestaurants(); 
  },[location, search]);

  if(loading || !location){
    return <div className = "flex h-[60vh] items-center justify-center" >
      <p className="text-gray-900 ">Finding restaurants near you...</p> 
      </div>
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {restaurants.length > 0 ? 
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {
          restaurants.map((res) =>{
            const [resLng, resLat] = res.autoLocation.coordinates;
            const distance = getDistanceKm(
              location.latitude, 
              location.longitude, 
              resLat, 
              resLng);
            return <RestaurantCard 
            key={res._id} 
            id={res._id} 
            name={res.name} 
            image={res.image ?? ""} 
            isOpen={res.isOpen} 
            distance={distance.toString()} />
          })
        }

      </div>
       : 
      <p className="text-gray-900 ">No restaurants found</p>}

    </div>
  )
}


export default Home


