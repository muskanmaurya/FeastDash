import { useState } from "react";
import type { IMenuItem } from "../types";
import { BsCartPlus, BsEye } from "react-icons/bs";
import { FiEyeOff } from "react-icons/fi";
import { BiLoader, BiTrash } from "react-icons/bi";
import axios from "axios";
import { restaurantService } from "../config";
import { useAppData } from "../context/AppContext";
import toast from "react-hot-toast";

interface MenuItemsProps {
  items:IMenuItem[];
  onItemDeleted: () => void;
  isSeller: boolean;
}

const MenuItems = ({items, onItemDeleted, isSeller}: MenuItemsProps) => {
  
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

  const handleDelete = async (itemId: string) => {
    const confirm = window.confirm("Are you sure you want to delete this menu item?");
    if(!confirm) return;

    try{

      await axios.delete(`${restaurantService}/api/item/${itemId}`, {
        headers:{
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      })

      toast.success("Menu item deleted successfully.");
      onItemDeleted(); // Notify parent component to refresh the list

    }catch(error){
      toast.error("Failed to delete menu item. Please try again.");
      console.log("Error in deleting menu item: ", error);
    }
  }

  const toggleAvailability = async (itemId: string) => {

    try{

      const {data} = await axios.put(`${restaurantService}/api/item/status/${itemId}`,
        {}, //in put method, we need to send an empty object as the second argument to indicate that there is no request body
         {
        headers:{
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      })

      toast.success(data.message || "Menu item status updated successfully.");
      onItemDeleted(); // Notify parent component to refresh the list-
    }catch(error){
      toast.error("Failed to update menu item status. Please try again.");
      console.log("Error in updating menu item status: ", error);
    }
  }

const {fetchCart} = useAppData(); // Destructure any required context values here

const addToCart = async(restaurantId: string, itemId: string) => {
  try{
    setLoadingItemId(itemId); // Set loading state for the specific item
    const {data} = await axios.post(`${restaurantService}/api/cart/add`,{
      restaurantId,
      itemId,
    },{
      headers:{
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      }
    })

    toast.success(data.message || "Item added to cart successfully.");
    await fetchCart(); // Refresh cart data after adding an item
  }catch(error){
    console.log("Error in adding item to cart: ", error);
    toast.error("Failed to add item to cart. Please try again.");
  }finally{
    setLoadingItemId(null); // Reset loading state after operation
  }
}


return (
  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 sm:grid-cols-2 gap-4">
    {/* 🟢 Senior Dev Type Guard: Ensures execution doesn't throw a runtime TypeError */}
    {Array.isArray(items) && items.length > 0 ? (
      items.map((item) => {
        const isLoading = loadingItemId === item._id;
        // Strict evaluation of availability to avoid truthy/falsy bugs
        const isCurrentlyAvailable = item.isAvailable === true;

        return ( 
          <div 
            key={item._id} 
            className={`relative flex gap-4 rounded-lg bg-white p-4 shadow-sm border border-gray-100 transition-all duration-300 ${
              !isCurrentlyAvailable ? "bg-gray-50/80 opacity-80" : "hover:shadow-md"
            }`}
          >
            {/* Image Container Block with Dynamic Grayscale Filters */}
            <div className="relative shrink-0 w-20 h-20 overflow-hidden rounded-md bg-gray-100">
              <img 
                src={item.image} 
                alt={item.name} 
                className={`h-full w-full object-cover transition-all duration-300 ${
                  !isCurrentlyAvailable ? "grayscale contrast-75 brightness-90" : ""
                }`} 
              />
              {/* Tutorial Overlay Text Badge for Unavailable Items */}
              {!isCurrentlyAvailable && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 transition-all rounded-md">
                  <span className="text-[10px] font-bold text-white tracking-wider uppercase bg-black/40 px-1.5 py-0.5 rounded">
                    Not Available
                  </span>
                </div>
              )}
            </div>

            {/* Product Meta Details & Controls Layout */}
            <div className="flex flex-col w-full justify-between gap-1">
              <div>
                <h3 className={`text-base font-semibold transition-colors ${
                  !isCurrentlyAvailable ? "text-gray-400 line-through decoration-gray-300" : "text-gray-800"
                }`}>
                  {item.name}
                </h3>
                {item.description && (
                  <p className={`text-xs transition-colors truncate max-w-[150px] ${
                    !isCurrentlyAvailable ? "text-gray-300" : "text-gray-500"
                  }`}>
                    {item.description}
                  </p>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-auto"> 
                <p className={`font-semibold text-sm transition-colors ${
                  !isCurrentlyAvailable ? "text-gray-400" : "text-gray-700"
                }`}>
                  ₹{item.price}
                </p>
                
                {/* Action Controls for Seller */}
                {isSeller && (
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => toggleAvailability(item._id)} 
                      disabled={isLoading}
                      className="p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                      title={isCurrentlyAvailable ? "Mark Unavailable" : "Mark Available"}
                    >
                      {isCurrentlyAvailable ? (
                        <BsEye size={18} className="text-green-500 transition-transform active:scale-95" />
                      ) : (
                        <FiEyeOff size={18} className="text-gray-400 transition-transform active:scale-95" />
                      )}
                    </button>
                    <button 
                      onClick={() => handleDelete(item._id)} 
                      className="p-1 rounded-md hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete Item"
                    >
                      <BiTrash size={18} />
                    </button>
                  </div>
                )}
                
                {/* Action Controls for Customer */}
                {!isSeller && (
                  <button 
                    disabled={!item.restaurantId || isLoading || !isCurrentlyAvailable}
                    onClick={() => addToCart(item.restaurantId, item._id)} 
                    className={`flex items-center justify-center rounded-lg p-2 transition-all ${
                      !isCurrentlyAvailable || isLoading
                        ? "cursor-not-allowed text-gray-200 bg-gray-300"
                        : "bg-red-50 text-red-500 hover:bg-red-100 cursor-pointer shadow-sm active:scale-95"
                    }`} 
                  >
                    {isLoading ? <BiLoader size={18} className="animate-spin" /> : <BsCartPlus size={18} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })
    ) : (
      /* 🟢 Fallback Node UI: Prevents empty screen flickering */
      <div className="col-span-full text-center py-10 bg-white rounded-xl border border-gray-100 shadow-sm">
        <p className="text-gray-500 text-sm">No menu items found.</p>
      </div>
    )}
  </div>
);
}
 
export default MenuItems