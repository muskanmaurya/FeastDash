import { useEffect, useState } from "react";
import { adminService } from "../config";
import axios from "axios";
import AdminRestaurantCard from "../components/AdminRestaurantCard";
import AdminRiderCard from "../components/AdminRiderCard";

const Admin = () => {
    const [restaurants, setRestaurants] = useState<any[]>([]);

    const [riders, setRiders] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);

    const [tab, setTab] = useState<"restaurants" | "riders">("restaurants");

    const fetchData = async () => {
        try {
            const { data } = await axios.get(`${adminService}/api/v1/admin/restaurant/pending`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            })

            const response = await axios.get(`${adminService}/api/v1/admin/rider/pending`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            })

            setRestaurants(data.restaurants);
            setRiders(response.data.riders);

        } catch (err) {
            console.log("Error fetching data", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return <div className="text-center py-60 font-bold">Loading Admin Panel...</div>;
    }

    return (
        <div className="mx-auto max-w-6xl px-6 py-6 spavce-y-6">
            <h1 className="text-2xl font-bold" >Admin Dashboard</h1>
            <div className="flex gap-4 " >
                <button
                    onClick={() => setTab("restaurants")}
                    className={`px-4 py-2 rounded ${tab === "restaurants" ? "bg-red-500 text-white" : "bg-gray-200 text-black"}`}
                >Restaurants</button>
                
                <button
                    onClick={() => setTab("riders")}
                    className={`px-4 py-2 rounded ${tab === "riders" ? "bg-red-500 text-white" : "bg-gray-200 text-black"}`}
                >Riders</button>
            </div>

            {
                tab === 'restaurants' && (
                <div className="mt-6 grid grid-cols-1 sm:grid-col-2 md:grid-cols-3 lg:grid-cols-4 gap-4">  
                    {restaurants.length === 0 ? <p>No Pending restaurants.</p>: 
                    restaurants.map((r)=>{
                        return <AdminRestaurantCard key={r._id} restaurant={r} onVerify={fetchData} />
                    })
                    }

                </div>
                )
            }

            {
                tab === 'riders' && (
                <div className="mt-6 grid grid-cols-1 sm:grid-col-2 md:grid-cols-3 lg:grid-cols-4 gap-4">  
                    {riders.length === 0 ? <p>No Pending riders.</p>: 
                    riders.map((r)=>{
                        return <AdminRiderCard key={r._id} rider={r} onVerify={fetchData} />
                    })
                    }

                </div>
                )
            }

        </div> 
    )
}

export default Admin