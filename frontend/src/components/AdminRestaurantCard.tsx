import axios from "axios"
import { adminService } from "../config"
import toast from "react-hot-toast"

const AdminRestaurantCard = ({restaurant, onVerify}:{restaurant: any, onVerify:() => void}) => {
    const verify = async () =>{
        try{
            await axios.patch(`${adminService}/api/v1/verify/restaurant/${restaurant._id}`,{},{
                headers:{
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            toast.success("Restaurant verified successfully");
            onVerify();
        }catch(err){
            toast.error("Error verifying restaurant");
        console.log("Error verifying restaurant", err);
    }
    }
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm space-y-2 ">
        <img src={restaurant.image} className="h-40 w-full object-cover rounded" />
        <h3 className="text-lg font-semibold" >{restaurant.name}</h3>
        <p className="text-gray-500" >{restaurant.phone}</p>
        <p className="text-gray-500" >{restaurant.autoLocation?.formattedAddress}</p>
        <button onClick={verify} className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 cursor-pointer text-white rounded" >Verify Restaurant</button>

    </div>
  )
}

export default AdminRestaurantCard