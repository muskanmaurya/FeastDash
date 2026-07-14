import { useState } from "react";
import type { IRestaurant } from "../types";
import { restaurantService } from "../config";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FiSave } from "react-icons/fi";
import { BiEdit, BiMapPin } from "react-icons/bi";
import { useAppData } from "../context/AppContext";

interface props { 
    restaurant: IRestaurant; 
    isSeller: boolean;  
    onUpdate: (restaurant: IRestaurant) => void;
}

const RestaurantProfile = ({ restaurant, isSeller, onUpdate }: props) => {
    const [editMode, setEditMode] = useState(false);
    const [name, setName] = useState(restaurant.name);
    const [description, setDescription] = useState(restaurant.description);
    const [isOpen, setIsOpen] = useState(restaurant.isOpen);
    const [loading, setLoading] = useState(false);

    // Toggle operational status cleanly isolate
    const toggleOpenStatus = async () => {
        try {
            const { data } = await axios.put(`${restaurantService}/api/restaurant/status`, {
                status: !isOpen
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            });

            toast.success(data.message);
            setIsOpen(data.restaurant.isOpen);
        } catch (error: any) {     
            console.log("Error in toggling restaurant status: ", error);
            toast.error(error.response?.data?.message || "Error in toggling restaurant status");
        }
    }; 

    // Save metadata changes cleanly isolated
    const saveChanges = async () => {
        try {
            setLoading(true);
            const { data } = await axios.put(`${restaurantService}/api/restaurant/edit`, {
                name, description
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            onUpdate(data.restaurant);
            toast.success(data.message);
            setEditMode(false); // Turn off edit mode after successful save
        } catch (error: any) {  
            console.log("Error in saving restaurant changes: ", error);
            toast.error(error.response?.data?.message || "Error in updating restaurant changes");
        } finally {
            setLoading(false);
        }
    };

    const {setIsAuth, setUser} = useAppData();

    const logoutHandler = async () => {
        await axios.put(`${restaurantService}/api/restaurant/status`, {
                status: false
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
        });
        localStorage.removeItem("token");
        setIsAuth(false);
        setUser(null);
        toast.success("Logged out successfully");
    }

    return (
        <div className="mx-auto max-w-xl rounded-xl bg-white shadow-sm overflow-hidden">
            {restaurant.image && (
                <img src={restaurant.image} alt="" className="h-48 w-full object-cover" />
            )}
            <div className="p-5 space-y-4">
                {isSeller && (
                    <div className="flex justify-between items-start">
                        <div>
                            {editMode ? (
                                <input 
                                    value={name} 
                                    onChange={e => setName(e.target.value)}
                                    className="w-full rounded border px-2 py-1 text-lg font-semibold" 
                                />
                            ) : (
                                <h2 className="text-xl font-semibold">{name}</h2>
                            )}
                            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                                <BiMapPin className="h-4 w-4 text-red-500" />
                                {restaurant.autoLocation?.formattedAddress || "Location not available"}
                            </div>
                        </div>
                        <button onClick={() => setEditMode(!editMode)} className="text-gray-500 hover:text-gray-900">
                            <BiEdit size={18} />
                        </button>
                    </div>
                )}

                {!isSeller && (
                    <h2 className="text-xl font-semibold">{name}</h2>
                )}
                
                {editMode ? (
                    <textarea 
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        className="w-full rounded border px-2 py-1 text-sm h-24 resize-none" 
                    />
                ) : (
                    <p className="text-gray-700 text-sm">{description}</p>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                    <span className={`text-sm font-medium ${isOpen ? "text-green-600" : "text-red-500"}`}>
                        {isOpen ? "Open" : "Closed"}
                    </span>
                    <div className="flex items-center gap-2">
                        {editMode && (
                            <button onClick={saveChanges} disabled={loading} className="flex items-center gap-1 text-blue-500 hover:text-blue-700 font-medium">
                                <FiSave size={16} />
                                Save
                            </button>
                        )}
                        {isSeller && (
                            <button 
                                onClick={toggleOpenStatus} 
                                className={`rounded-lg px-4 py-1.5 font-medium cursor-pointer text-sm border shadow-sm transition-all ${
                                    isOpen 
                                        ? "text-red-500 border-red-200 hover:bg-red-500 hover:border-red-600 hover:text-white" 
                                        : "text-white border-green-600 bg-green-500 hover:bg-green-600"
                                }`}
                            >
                                {isOpen ? "Close Restaurant" : "Open Restaurant"}
                            </button>
                        )}
                        {isSeller && (
                            <button 
                                onClick={logoutHandler} 
                                className={`rounded-lg px-4 py-1.5 font-medium cursor-pointer text-sm border shadow-sm transition-all text-red-500 border-red-200 hover:bg-red-500 hover:border-red-600 hover:text-white`}
                            >
                                Logout
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-xs text-gray-400">Created on {new Date(restaurant.createdAt).toLocaleDateString()}</p>
            </div>
        </div>
    );
};

export default RestaurantProfile;