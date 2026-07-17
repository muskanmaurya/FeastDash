import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../config';
import { toast } from 'react-hot-toast';
import { useGoogleLogin } from '@react-oauth/google';
import { FcGoogle } from 'react-icons/fc';
import { useAppData } from '../context/AppContext';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const {setUser, setIsAuth} = useAppData();

    const responseGoogle = async (authResult : any) =>{  // eslint-disable-line
        setLoading(true);
        try{
            const result = await axios.post(`${authService}/api/auth/login`, {
                code : authResult["code"],
            })

            localStorage.setItem("token",result.data.token);
            toast.success(result.data.message);
            setLoading(false);
            setIsAuth(true);
            setUser(result.data.user);
            navigate("/select-role",{replace:true});

        }catch(error){
            console.log(error);
            toast.error("Login failed");
            setLoading(false);     
        }
    }

    const googleLogin = useGoogleLogin({
        onSuccess: responseGoogle,
        onError: responseGoogle,
        flow: "auth-code",
    })
    

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100/90 px-4 font-sans antialiased">
        <div className="shadow-md w-full max-w-md transform rounded-2xl border-t-4 border-[#E23744] bg-white p-8 transition-all duration-300 md:p-10">
            
            {/* Header / Brand Typography Layer */}
            <div className="space-y-2 text-center">
                <h1 className="text-4xl font-black tracking-tight text-[#E23744]">
                    FeastDash
                </h1>
                <p className="text-sm font-medium text-gray-400">
                    Login or Sign up to continue
                </p>
            </div>

            {/* Interactive OAuth CTA Section */}
            <div className="my-8 cursor-pointer">
                <button 
                    onClick={googleLogin} 
                    disabled={loading} 
                    className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold text-gray-700 shadow-sm outline-none transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                >
                    <FcGoogle size={22} className={loading ? "animate-bounce" : ""} />
                    <span>{loading ? "Signing in..." : "Continue with Google"}</span>
                </button>
            </div>

            {/* Legal / Compliance Footer Text */}
            <p className="text-center text-xs font-medium leading-relaxed text-gray-400 px-2">
                By continuing, you agree to our{" "}
                <span className="cursor-pointer font-semibold text-gray-600 transition-colors hover:text-[#E23744]">
                    Terms of Service
                </span>{" "}
                and{" "}
                <span className="cursor-pointer font-semibold text-gray-600 transition-colors hover:text-[#E23744]">
                    Privacy Policy
                </span>.
            </p>
        </div>
    </div>
  )
}

export default Login