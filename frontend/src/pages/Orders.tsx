import { useEffect, useState } from "react"
import type { IOrder } from "../types"
import { useNavigate } from "react-router-dom"
import { useSocket } from "../context/SocketContext"
import { restaurantService } from "../config"
import axios from "axios"

const ACTIVE_STATUSES = ['placed', 'accepted', 'preparing', 'ready-for-rider', 'rider-assigned', 'picked-up']



const Orders = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<IOrder[]>([])
  const [loading, setLoading] = useState(true)

  const {socket} = useSocket()

  const fetchOrders = async() =>{
    try{
      const {data} = await axios.get(`${restaurantService}/api/order/myorders`,
        {
          headers:{
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      )

      setOrders(data.orders  || [])
    }catch(err){
      console.log("Error fetching orders", err);
    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{
    fetchOrders()
  },[]);

  useEffect(()=>{
    if(!socket) return;

    const onOrderUpdate = () =>{
      fetchOrders()
    }

    socket.on("order:update", onOrderUpdate);

    return ()=>{
      socket.off("order:update", onOrderUpdate)
    }
  },[socket])

  if(loading){
    return <p className="text-center text-gray-500">Loading orders...</p>
  }

  if(orders.length === 0){
    return <div className="text-center text-gray-500">No orders found</div>
  }

   const activeOrders = orders.filter((o)=>{
        return ACTIVE_STATUSES.includes(o.status)
    })

    const completedOrders = orders.filter((o)=>!ACTIVE_STATUSES.includes(o.status))


  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">My Orders</h1>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Active Orders</h2>
        {activeOrders.length === 0 ? <p> No active Orders</p> : (
          activeOrders.map((order)=>{
            return <OrderRow 
            key={order._id} 
            order={order} 
            onClick={()=>navigate(`/orders/${order._id}`)}
           />
          })
        )}

      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Completed Orders</h2>
        {completedOrders.length === 0 ? <p> No completed Orders</p> : (
          completedOrders.map((order)=>{
            return <OrderRow 
            key={order._id} 
            order={order} 
            onClick={()=>navigate(`/orders/${order._id}`)}
            />
          })
        )}

      </section>
      </div>
  )
}

export default Orders


//component Order row

const OrderRow=({
  order, 
  onClick
}: {
  order: IOrder, onClick:()=>void
})=>{
  return <div className="cursor-pointer rounded-xl bg-white p-4 shadow-sm hover:bg-gray-50 " onClick={onClick}  >
    <div className="flex justify-between items-center">
      <p className="text-sm font-medium"  >Order #{order._id.slice(-6)}</p>
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800" >
        {order.status}
      </span>
    </div>
    <div className="mt-2 text-sm text-gray-600" >
      {
        order.items.map((item, i)=>{
          return <span key={i}>
            {item.name} x {item.quantity}
            {i < order.items.length - 1 && ", "}
          </span>
        })
      }
    </div>

    <div className="mt-2 text-sm text-gray-600" >
      Total: Rs.{order.totalAmount.toFixed(2)}
    </div>

  </div>
}