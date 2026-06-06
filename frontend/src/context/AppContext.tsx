import {createContext, useEffect , useState, type ReactNode} from 'react';
import type { AppContextType, LocationData } from '../types';

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps{
    Children: ReactNode;
}

export const AppProvider = ({children}: AppProviderProps)=>{
    const [user, setUser] = useState<User | null>(null);
    const [isAuth, setIsAuth] = useState(false);
    const [loading, setLoading] = useState(true);

    const [location, setLocation] = useState<LocationData | null>(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [city, setCity] = useState("Fetching location....");

    async function fetchUser(){
        try{

            const token = localStorage.getItem("token");
            
            const {user} = await axios.get(`S{authService}/api/auth/me`,{
                headers:{
                    Authorization: `Bearer ${token}`,
                }
            })
            setUser(data.user);
            setIsAuth(true);
            
        }catch(error){
            console.log(error);
            setUser(null);
            setIsAuth(false);
        }finally{
            setLoading(false);
        }
    }

    useEffect(()=>{
        fetchUser();
    }, [])

    return <AppContext.Provider value={{isAuth, loading, setIsAuth, setLoading, setUser}}>{children}</AppContext.Provider>

}

export const useAppData = (): AppContextType  =>{
    const context = useContext(AppContext);
    if(!context){
        throw new Error("useAppData must be used within an AppProvider");
    }
    return context;
}