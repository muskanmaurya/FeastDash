import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import {Toaster} from 'react-hot-toast';
import PublicRoute from './routes/publicRoute';
import ProtectedRoute from './routes/protectedRoute';
import SelectRole from './pages/SelectRole';
import Navbar from './components/Navbar';
import Account from './pages/Account';

function App() {

  return (
    <>
    <BrowserRouter>
      <Navbar/>
       <Routes>
        <Route element = {<PublicRoute/>}>
        <Route path = '/login' element = {<Login/>}/>
        </Route>
        <Route element = {<ProtectedRoute/>}>
        <Route path = '/' element = {<Home/>}/>
        <Route path = '/select-role' element = {<SelectRole/>}/>
        <Route path = '/account' element = {<Account/>}/>
        </Route>
       </Routes>
       <Toaster/>
    </BrowserRouter>

    </>
  )
}

export default App
