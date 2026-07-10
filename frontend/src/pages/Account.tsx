import { useAppData } from '../context/AppContext'
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast/headless';
import { FiBox, FiLogOut, FiMapPin } from 'react-icons/fi';

const Account = () => {
    const {user, setUser, setIsAuth} = useAppData(); // Access user data and authentication state from context
   
    const firstLetter = user?.name?.charAt(0).toUpperCase(); // Get the first letter of the user's name or default to "U" if user is null
    
    const navigate = useNavigate();
    
    const logoutHandler = () =>{
        localStorage.setItem('token', '');
        setUser(null);
        setIsAuth(false);
        navigate('/login');
        toast.success('Logged out successfully');
    }
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-gray-50/50 p-6 font-sans">
      
      {/* Main Profile Card Box Container */}
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl transition-all duration-300 hover:shadow-2xl">
        
        {/* SECTION 1: User Identity Details Header Block */}
        <div className="flex items-center gap-4 p-5">
          {/* Dynamic Profile Avatar Bubble */}
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#E23744] text-lg font-bold text-white shadow-md">
            {firstLetter}
          </div>
          {/* Name and Email layout stack */}
          <div className="flex flex-col min-w-0">
            <h2 className="truncate text-base font-semibold text-gray-800">
              {user?.name}
            </h2>
            <p className="truncate text-xs text-gray-400">
              {user?.email}
            </p>
          </div>
        </div>

        {/* SECTION 2: Interactive Lists Links Router Buttons */}
        <div className="divide-y divide-gray-100 border-t border-gray-100">
          
          {/* Submenu Item 1: Your Orders */}
          <button 
            onClick={() => navigate('/orders')} 
            className="flex w-full items-center gap-4 px-5 py-4 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50/80 hover:text-[#E23744]"
          >
            <FiBox className="h-5 w-5 text-gray-400 transition-colors" />
            <span>Your Orders</span>
          </button>

          {/* Submenu Item 2: Addresses */}
          <button 
            onClick={() => navigate('/addresses')} 
            className="flex w-full items-center gap-4 px-5 py-4 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50/80 hover:text-[#E23744]"
          >
            <FiMapPin className="h-5 w-5 text-gray-400 transition-colors" />
            <span>Addresses</span>
          </button>

          {/* Submenu Item 3: Logout Action Control */}
          <button 
            onClick={logoutHandler} 
            className="flex w-full items-center gap-4 px-5 py-4 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50/80 hover:text-[#E23744]"
          >
            <FiLogOut className="h-5 w-5 text-gray-400 transition-colors" />
            <span>Logout</span>
          </button>

        </div>

      </div>
    </div>
  );
};

export default Account