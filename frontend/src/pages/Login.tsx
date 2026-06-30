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
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-md rounded-lg bg-gray-100 p-8 shadow-md">
            <h1 className='text-center text-3xl font-bold text-red-500'>Zomato Clone</h1>
            <p className = "text-center text-sm text-gray-500"> Login or Sign up to continue</p>
            <button onClick={googleLogin} disabled={loading} className='flex w-full items-center justify-center gap-4 rounded-xl border-gray-300 bg-white px-4 py-3'><FcGoogle size={20}/>{loading?"Signing in...":"Continue with Google"}</button>
            <p className="text-center text-sm text-gray-500">By continuing, you agree to our <span className="font-semibold text-red-500">Terms of Service</span> and <span className="font-semibold text-red-500">Privacy Policy</span>.</p>
        </div>
    </div>
  )
}

export default Login