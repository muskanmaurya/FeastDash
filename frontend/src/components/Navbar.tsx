import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import { useState, useEffect } from "react";
import { CgShoppingCart } from "react-icons/cg";
import { BiMapPin, BiSearch } from "react-icons/bi";

const Navbar = () => {
  const { isAuth, city, quantity } = useAppData();
  const currLocation = useLocation();
  const isHomePage = currLocation.pathname === "/";

  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");

  // Debounce sync layer
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search) {
        setSearchParams({ search });
      } else {
        setSearchParams({});
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="w-full h-16 bg-white border-b border-gray-100 flex items-center justify-center px-4 md:px-8">
      {/* 🟢 Main Wrapper that holds everything in a structured single line row */}
      <div className="w-full max-w-7xl flex items-center justify-between gap-4">
        
        {/* LEFT SECTION: Logo Brand Identity */}
        <div className="flex-shrink-0">
          <Link to={'/'} className="text-2xl font-extrabold text-[#E23744] tracking-tight">
            FeastDash
          </Link>
        </div>

        {/* CENTER SECTION: The Integrated Searchbar Grid */}
        <div className="flex-1 max-w-2xl mx-4">
          {isHomePage && (
            <div className="flex w-full items-center rounded-lg border border-gray-200 shadow-sm bg-white py-2">
              {/* Location Pointer segment */}
              <div className="flex items-center gap-2 px-3 border-r border-gray-200 text-gray-500">
                <BiMapPin className="h-5 w-5 text-[#E23744] shrink-0 cursor-pointer hover:scale-110 transition" />
                <span className="text-gray-700 text-sm font-medium truncate max-w-[100px]">
                  {city}
                </span>
              </div>
              {/* Input Text box entry segment */}
              <div className="flex flex-1 items-center gap-2 px-3">
                <BiSearch className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search for restaurant, cuisine or a dish"
                  className="w-full outline-none text-sm text-gray-700 placeholder-gray-400"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SECTION: Cart and Account Navigation Trigger Links */}
        <div className="flex items-center gap-6 flex-shrink-0">
          <Link to={'/cart'} className="relative group p-1">
            <CgShoppingCart className="text-2xl h-6 w-6 text-gray-700 group-hover:text-[#E23744] transition-colors" />
            <span className="absolute -top-1 -right-1 bg-[#E23744] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-sm">
              {quantity}
            </span>
          </Link>
          
          {isAuth ? (
            <Link to={'/account'} className="text-sm font-medium text-gray-700 hover:text-[#E23744] transition-colors">
              Account
            </Link>
          ) : (
            <Link to={'/login'} className="text-sm font-medium text-gray-700 hover:text-[#E23744] transition-colors">
              Login
            </Link>
          )}
        </div>

      </div>
    </div>
  );
};

export default Navbar;