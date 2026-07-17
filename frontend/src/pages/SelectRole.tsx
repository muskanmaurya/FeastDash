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
    <div className="flex min-h-screen items-center justify-center bg-white px-6 font-sans antialiased">
      <div className="w-full max-w-sm p-6 rounded-lg shadow-md border-t-4 border-[#E23744]">
        
        {/* Minimal Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Select Your Role
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Choose an account type to get started.
          </p>
        </div>

        {/* Minimal Stacked Options */}
        <div className="space-y-3 mb-8">
          {
            roles.map((r)=>(
              <button 
                key={r} 
                onClick={()=>setRole(r)}
                className={`w-full cursor-pointer text-center rounded-lg py-2 font-semibold capitalize border transition-all duration-150 text-sm ${
                  role === r 
                    ? "border-[#E23744] bg-[#E23744] text-white" 
                    : "border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-100/70"
                }`}
              >
                Continue as {r}
              </button>
            ))
          }
        </div>

        {/* Flat Minimal Button */}
        <button 
          disabled={!role}
          onClick={addRole}
          className={`w-full rounded-lg py-3 text-sm font-semibold tracking-wide transition-all duration-150 ${
            role 
              ? "bg-[#E23744] text-white hover:bg-[#c62835]" 
              : "bg-gray-100 text-gray-300 cursor-not-allowed"
          }`}
        >
          Next
        </button>
        
      </div>
    </div>
  )
}

export default SelectRole
