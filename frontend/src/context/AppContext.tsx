import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AppContextType, LocationData, User } from '../types';
import axios from 'axios';
import { authService } from '../config';
import { toast } from 'react-hot-toast/headless';

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

    async function fetchUser() {
        try {

            const token = localStorage.getItem("token");

            const { data } = await axios.get(`${authService}/api/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            })
            setUser(data);
            setIsAuth(true);

        } catch (error) {
            console.log(error);
            // setUser(null);
            // setIsAuth(false);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchUser();
    }, [])

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
                    formattedAddress:`${data.locality}, ${data.city}`
                })
                // formattedAddress: data.display_name || "current location",

                // setCity(data.address.city || data.address.town || data.address.village || "current location");
                setCity(data.city || data.locality || "current location");


            } catch (error) {
                setLocation({
                    latitude,
                    longitude,
                    formattedAddress: "current location",
                });
                setCity("Failed to load")
                console.log(error);
                toast.error("Error fetching location");
            }
        })
    }, [])

    return <AppContext.Provider value={{ user, isAuth, loading, setIsAuth, setLoading, setUser, location, city, loadingLocation }}>{children}</AppContext.Provider>

}

export const useAppData = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useAppData must be used within an AppProvider");
    }
    return context;
}