import { useState } from "react"
import { useAppData } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { authService } from "../config";

type Role = "customer" | "rider" | "seller" | null;

const SelectRole = () => {
    const[role, setRole] = useState<Role>(null)
    const {setUser} = useAppData();
    const navigate = useNavigate();

    const roles: Role[] = ["customer", "rider", "seller"]

    const addRole = async()=>{
      try{
        const {data} = await axios.put(`${authService}/api/auth/add/role`,{role},{
          headers:{
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        })

        localStorage.setItem("token", data.token)
        setUser(data.user)
        navigate("/",{replace:true});
        
      }catch(error){
        alert("Something went wrong in select role page")
        console.error("Error adding role:", error)
      }
    }
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 bg-white p-4">
      <div>
        <div className="w-full max-w-sm space-y-6">
          <h1 className="text-center text-2xl font-bold mb-4">Select Your Role</h1>
          <div className="space-y-4">
            {
              roles.map((r)=>(
                <button key={r} onClick={()=>setRole(r)} className={`w-full rounded-lg px-4 py-2 text-white font-semibold capitalize transition ${role === r ? " border-[#E23744] border-[#E23744]" : "text-black border-gray-300 bg-gray-200 hover:bg-gray-500"}`}>
                  Continue as {r}
                </button>
              ))
            }
          </div>
          <button disabled={!role} onClick={addRole} className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${role ? "bg-blue-600 text-white hover:bg-blue-700 " : "bg-gray-400 text-gray-700 cursor-not-allowed"}`}>
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default SelectRole
