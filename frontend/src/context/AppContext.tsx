import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AppContextType, ICart, LocationData, User } from '../types';
import axios from 'axios';
import { authService, restaurantService } from '../config';
import { toast } from 'react-hot-toast/headless';
import { Toaster } from 'react-hot-toast';

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuth, setIsAuth] = useState(false);
    const [loading, setLoading] = useState(true);

    const [location, setLocation] = useState<LocationData | null>(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [city, setCity] = useState("Fetching location....");

    const [cart, setCart] = useState<ICart[]>([]); 
    const [subTotal, setSubTotal] = useState(0); 
    const [quantity, setQuantity] = useState(0); 



    // const [hasRestaurant, setHasRestaurant] = useState<boolean>(false);

    // async function fetchUser() {
    //     try {

    //         const token = localStorage.getItem("token");

    //         const { data } = await axios.get(`${authService}/api/auth/me`, {
    //             headers: {
    //                 Authorization: `Bearer ${token}`,
    //             }
    //         })
    //         setUser(data.user);  //this was the reason why my page when reloading everytime return to home page even when I was a seller because Ijust gave setUser(data) and when I gave here setUser(data.user) it worked because data.user is the user object and data is the whole response object which contains other things like message, status etc. so when I gave setUser(data) it was not setting the user object correctly and hence it was returning to home page because user was null.
    //         // setHasRestaurant(data.hasRestaurant);
    //         setIsAuth(true);

    //     } catch (error) {
    //         console.log(error);
    //         // setUser(null);
    //         // setIsAuth(false);
    //     } finally {
    //         setLoading(false);
    //     }
    // }


    async function fetchUser() {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setLoading(false);
                return;
            }

            const { data } = await axios.get(`${authService}/api/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            setUser(data.user);
            setIsAuth(true);

        } catch (error) {
            console.log("Invalid token detected, clearing session...", error);
            // 🟢 Senior Dev Safety Guard: Clear invalid tokens automatically on 401
            localStorage.removeItem("token");
            setUser(null);
            setIsAuth(false);
        } finally {
            setLoading(false);
        }
    }

    async function fetchCart(){
        if(!user || user.role !== "customer") return;
        try{
            const {data} = await axios.get(`${restaurantService}/api/cart/all`,{
                headers:{
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            })

            setCart(data.cart || []);
            setSubTotal(data.subTotal || 0);
            setQuantity(data.cartLength);
        }catch(error){
            console.log("Error in fetching cart: ", error);
        }
    }

    useEffect(() => {
        fetchUser();
    }, [])

    useEffect(() => {
        if(user && user.role === "customer"){
            fetchCart();
        }
    },[user])


    useEffect(() => {
        if (!navigator.geolocation) return alert("Please Allow location access to continue");
        setLoadingLocation(true);

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;

            try {
                // const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
                //     {
                //         headers: {
                //             // 🔥 Send an identifiable app identity string (Do not keep it generic!)
                //             "User-Agent": "FeastDashFoodApp/1.0 (muskanmaurya@example.com)"
                //         }
                //     }
                // );

                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);

                const data = await response.json();

                setLocation({
                    latitude,
                    longitude,
                    formattedAddress: `${data.locality}, ${data.city}`
                })
                // formattedAddress: data.display_name || "current location",

                // setCity(data.address.city || data.address.town || data.address.village || "current location");
                setCity(data.city || data.locality || "current location");
                setLoadingLocation(false);

            } catch (error) {
                setLocation({
                    latitude,
                    longitude,
                    formattedAddress: "current location",
                });
                setCity("Failed to load")
                console.log(error);
                toast.error("Error fetching location");
                setLoadingLocation(false);
            }
        })
    }, [])

    return <AppContext.Provider
        value={{ 
            user, 
            isAuth, 
            loading, 
            setIsAuth, 
            setLoading, 
            setUser, 
            location, 
            city, 
            loadingLocation,
            cart,
            fetchCart,
            subTotal,
            quantity
        }}>
        {children}
        <Toaster />
    </AppContext.Provider>

}

export const useAppData = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useAppData must be used within an AppProvider");
    }
    return context;
}