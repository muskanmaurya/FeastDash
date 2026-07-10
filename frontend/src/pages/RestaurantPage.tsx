import {useEffect, useState} from 'react';
import { useParams } from 'react-router-dom';
import type { IMenuItem, IRestaurant } from '../types';
import { toast } from 'react-hot-toast/headless';
import { restaurantService } from '../config';
import axios from 'axios';
import RestaurantProfile from '../components/RestaurantProfile';
import MenuItems from '../components/MenuItems';

const RestaurantPage = () => {

    const {id} = useParams();
    const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
    const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
    const [loading, setLoading] = useState(true);

const fetchRestaurant = async () => {
    try {
        setLoading(true);
        // 🚀 Fix 1: Use axios consistently so it parses JSON automatically
        const { data } = await axios.get(`${restaurantService}/api/restaurant/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`, 
            }
        });

        // 🚀 Fix 2: Pull the 'restaurant' key explicitly from backend object envelope
        if (data && data.restaurant) {
            setRestaurant(data.restaurant);
        } else {
            setRestaurant(null);
        }

    } catch (error) {
        console.log("Error in fetching restaurant: ", error);
        toast.error("Error in fetching restaurant");
        setRestaurant(null);
    } finally {
        setLoading(false);
    }
};

const fetchMenuItems = async () => {
    try {
        const { data } = await axios.get(`${restaurantService}/api/item/all/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            }
        });

        // Target the 'items' array key inside backend payload safely
        setMenuItems(data.items || []);

    } catch (error: any) {
        console.log("error in fetching menu items: ", error);
        toast.error(error?.response?.data?.message || "Failed to fetch menu items");
    }
};

  useEffect(()=>{
    if(id){
        fetchRestaurant();
        fetchMenuItems();
    }
  },[id])

  if(loading){
    return(
        <div className = "flex h-[60vh] items-center justify-center" >
      <p className="text-gray-900 ">Loading restaurant...</p> 
      </div>
    )
  }

  if(!restaurant){
    return(
        <div className = "flex h-[60vh] items-center justify-center" >
      <p className="text-gray-900 ">Restaurant not found with this id</p> 
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 space-y-6">
        <RestaurantProfile restaurant={restaurant} onUpdate={setRestaurant} isSeller={false} />

        <div className='rounded-xl bg-white shadow-sm p-4'>
            <MenuItems isSeller={false} items={menuItems} onItemDeleted={()=>{}} />
        </div>
    </div>
  )
}

export default RestaurantPage