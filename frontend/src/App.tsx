import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import {Toaster} from 'react-hot-toast';
import PublicRoute from './routes/publicRoute';
import ProtectedRoute from './routes/protectedRoute';
import SelectRole from './pages/SelectRole';
import Navbar from './components/Navbar';
import Account from './pages/Account';
import { useAppData } from './context/AppContext';
import Restaurant from './pages/Restaurant';
import RestaurantPage from './pages/RestaurantPage';
import Cart from './pages/Cart';
import AddAddressPage from './pages/Address';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import OrderPage from './pages/OrderPage';
import RiderDashboard from './pages/RiderDashboard';

function App() {

  const {user, loading} = useAppData();

  if(loading) {
    return <div className="text-center py-60 font-bold">Loading...</div>;
  }

  if (user !== null && user.role === 'seller'){
    return <Restaurant/>;
  }

  if (user && user.role === 'rider'){
    return <RiderDashboard/>;
  }

  return (
    <>
    <BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar/>
       <Routes>
        <Route element = {<PublicRoute/>}>
        <Route path = '/login' element = {<Login/>}/>
        </Route>
        <Route element = {<ProtectedRoute/>}>
        <Route path = '/' element = {<Home/>}/> 
        <Route path = '/orders' element = {<Orders/>}/> 
        <Route path = '/orders/:id' element = {<OrderPage/>}/> 
        <Route path = '/ordersuccess' element = {<OrderSuccess/>}/> 
        <Route path = '/address' element = {<AddAddressPage/>}/> 
        <Route path = '/checkout' element = {<Checkout/>}/> 
        <Route path = '/restaurant/:id' element = {<RestaurantPage/>}/> 
        <Route path = '/cart' element = {<Cart/>}/> 
        <Route path = '/select-role' element = {<SelectRole/>}/>
        <Route path = '/account' element = {<Account/>}/>
        </Route>
       </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
