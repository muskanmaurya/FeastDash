import { useEffect, useState } from 'react'
import type { IMenuItem, IRestaurant } from '../types';
import axios from 'axios';
import { restaurantService } from '../config';
import AddRestaurant from '../components/AddRestaurant';
import RestaurantProfile from '../components/RestaurantProfile';
import MenuItems from '../components/MenuItems';
import AddMenuItem from '../components/AddMenuItem';
import { toast } from 'react-hot-toast/headless';

type SellerTab = "menu" | "add-item" | "sales";


const Restaurant = () => {

  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState('menu');

  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);

  const fetchMyRestaurant = async () => {
    try {
      setLoading(true); // Ensure loading is active during the call
      const { data } = await axios.get(`${restaurantService}/api/restaurant/my-restaurant`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      });

      // Explicit check: Agar success false hai ya restaurant null hai, explicitly set null
      if (data && data.restaurant) {
        setRestaurant(data.restaurant);
      } else {
        setRestaurant(null);
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
        window.location.reload(); // 🔥 Force reload to ensure the new token is used in subsequent requests
      }

    } catch (error) {
      console.error("Error in fetching my restaurant: ", error);
      setRestaurant(null); // Fallback to safe null state on error
    } finally {
      setLoading(false); // 🔥 This will guarantee that the loading screen strips away
    }
  };

  const fetchMenuItems = async (restaurantId: string) => {
    try {
      const { data } = await axios.get(`${restaurantService}/api/item/all/${restaurantId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      });

      // 🟢 Extract the 'items' array key from backend envelope safely with fallback
      setMenuItems(data.items || []);

    } catch (error: any) {
      console.log("error in fetching menu items: ", error);
      toast.error(error?.response?.data?.message || "Failed to fetch menu items");
    }
  };

  useEffect(() => {
    fetchMyRestaurant();
  }, [])


  useEffect(() => {
    if (restaurant?._id) {
      fetchMenuItems(restaurant._id);
    }
  }, [restaurant])

  if (loading) {
    return <div className='text-center flex items-center justify-center my-60 p-4 text-3xl' >
      <p>Loading your restaurant...</p>
    </div>
  }

  // if (!restaurant) {
  //   return <AddRestaurant />
  // }

  if (!restaurant || restaurant === null) {
    return <AddRestaurant fetchMyRestaurant={fetchMyRestaurant} />;
  }

  return (<div className='min-h-screen bg-gray-50 px-4 py-6 space-y-6'>
    <RestaurantProfile restaurant={restaurant} onUpdate={setRestaurant} isSeller={true} />

    <div className="bg-white p-4 shadow space-y-4 rounded-2xl shadow-gray-300">
      <div className="flex items-center justify-around border-b">
        {[
          { key: "menu", label: "Menu Items" },
          { key: "add-item", label: "Add Item" },
          { key: "sales", label: "Sales" },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as SellerTab)} className={`px-4 flex-1 py-2 text-sm font-medium transition-all ${tab === t.key ? "border-b-2 border-red-500 text-red-500" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-5">
        {tab === "menu" && <MenuItems items={menuItems} onItemDeleted={() => fetchMenuItems(restaurant._id)} isSeller={true} />}
        {tab === "add-item" && <AddMenuItem onItemAdded={() => fetchMenuItems(restaurant._id)} />}
        {tab === "sales" && <p>Sales Page</p>}
      </div>
    </div>

  </div>
  )
}

export default Restaurant