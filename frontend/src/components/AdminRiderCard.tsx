import axios from "axios"
import { adminService } from "../config"
import toast from "react-hot-toast"

const AdminRiderCard = ({rider, onVerify}:{rider: any, onVerify:() => void}) => {
    const verify = async () =>{
        try{
            await axios.patch(`${adminService}/api/v1/verify/rider/${rider._id}`,{},{
                headers:{
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            toast.success("Restaurant verified successfully");
            onVerify();
        }catch(err){
            toast.error("Error verifying rider");
        console.log("Error verifying rider", err);
    }
    }
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm space-y-2 ">
        <img src={rider.picture} className="h-40 w-full object-cover rounded" />
        <h3 className="text-lg font-semibold" >{rider.name}</h3>
        <p className="text-gray-500" >Phone: {rider.phoneNumber}</p>
        <p className="text-gray-500" >Aadhar Number: {rider.aadharNumber}</p>
        <p className="text-gray-500" >Driving License Number: {rider.drivingLicenseNumber}</p>
        <button onClick={verify} className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 cursor-pointer text-white rounded" >Verify Rider</button>

    </div>
  )
}

export default AdminRiderCard