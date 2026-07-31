import { useState } from 'react'
import { useAppData } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import type { ICart, IMenuItem, IRestaurant } from '../types';
import { restaurantService } from '../config';
import axios from 'axios';
import toast from 'react-hot-toast';
import { VscLoading } from 'react-icons/vsc';
import { BiMinus, BiPlus, BiTrash } from 'react-icons/bi';

const Cart = () => {
    const navigate = useNavigate();
    const { cart, subTotal, quantity, fetchCart } = useAppData();

    const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
    const [clearingCart, setClearingCart] = useState(false);

    if (!cart || cart.length === 0) {
        return <div className='flex min-h-[60vh] items-center justify-center '>
            <p className='text-lg text-gray-500'>Your cart is currently empty.</p>
        </div>
    }

   

const restaurant = cart[0].restaurantId as IRestaurant;

const deliveryFee = subTotal < 250 ? 49 : 0;

const platformFee = Math.round(subTotal * 0.05) || 7; 

const grandTotal = subTotal + deliveryFee + platformFee;

    const increaseQty = async (itemId: string) => {
        try {
            setLoadingItemId(itemId);
            await axios.put(`${restaurantService}/api/cart/inc`,
                { itemId }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            })
            await fetchCart(); // Refresh cart data after increasing quantity
        } catch (error) {
            toast.error("Failed to increase item quantity. Please try again.");
            console.log("Error in increasing item quantity: ", error);
        } finally {
            setLoadingItemId(null); // Reset loading state after operation
        }
    }

    const decreaseQty = async (itemId: string) => {
        try {
            setLoadingItemId(itemId);
            await axios.put(`${restaurantService}/api/cart/dec`,
                { itemId }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            })
            await fetchCart(); // Refresh cart data after increasing quantity
        } catch (error) {
            toast.error("Failed to increase item quantity. Please try again.");
            console.log("Error in increasing item quantity: ", error);
        } finally {
            setLoadingItemId(null); // Reset loading state after operation
        }
    }

    const clearCart = async () => {
        const confirm = window.confirm("Are you sure you want to clear the cart?");
        if (!confirm) return;
        try {
            setClearingCart(true);
            await axios.delete(`${restaurantService}/api/cart/clear`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    }
                })
            await fetchCart(); // Refresh cart data after increasing quantity
        } catch (error) {
            toast.error("Failed to increase item quantity. Please try again.");
            console.log("Error in increasing item quantity: ", error);
        } finally {
            setClearingCart(false); // Reset loading state after operation
        }
    }

    const checkout = () => {
        navigate(`/checkout`);
    }

    return (

        <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
            <div className="rounded-xl bg-white p-4 shadow-sm">
                <h2 className="text-xl font-semibold">{restaurant.name}</h2>
                <p className="text-gray-500 text-sm">{restaurant.autoLocation.formattedAddress}</p>
            </div>
            <div className='space-y-4'>
                {
                    cart.map((cartItem: ICart) => {
                        const item = cartItem.itemId as IMenuItem;
                        const isLoading = loadingItemId === item._id;

                        return <div key={item._id} className='flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm'>
                            <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                            <div className='flex flex-1 flex-col gap-2'>
                                <h3 className="text-lg font-medium">{item.name}</h3>
                                <p className="text-gray-500 text-sm">Rs.{item.price}</p>
                            </div>
                            <div className='flex items-center gap-2'>
                                <button
                                    onClick={() => decreaseQty(item._id)}
                                    className={`rounded-full bg-gray-200 p-2 text-gray-700 transition ${isLoading ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-300'}`}>
                                    {isLoading ? (
                                        <VscLoading size={16} className="animate-spin" />
                                    ) : (
                                        <BiMinus size={16} />)}
                                </button>
                                <span className='text-lg font-medium'>{cartItem.quantity}</span>
                                <button
                                    onClick={() => increaseQty(item._id)}
                                    className={`rounded-full bg-gray-200 p-2 text-gray-700 transition ${isLoading ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-300'}`}>
                                    {isLoading ? (
                                        <VscLoading size={16} className="animate-spin" />
                                    ) : (
                                        <BiPlus size={16} />)}
                                </button>
                            </div>
                            <p className="w-20 text-right font-medium">Rs.{(cartItem.quantity * item.price)}</p>
                        </div>
                    })
                }
            </div>

<div className="rounded-xl bg-white p-4 shadow-sm space-y-3">
    <div className="flex justify-between text-sm">
        <span>Total Items</span>
        <span>{quantity}</span>
    </div>
    <div className="flex justify-between text-sm">
        <span>Subtotal</span>
        <span>Rs.{subTotal}</span> 
    </div>
    <div className="flex justify-between text-sm">
        <span>Delivery Fee</span>
        <span>Rs.{deliveryFee === 0 ? "Free" : deliveryFee.toFixed(2)}</span>
    </div>
    <div className="flex justify-between text-sm">
        <span>Platform Fee</span>
        <span>Rs.{platformFee}</span>
    </div>
    {
        subTotal < 250 && (
            <p className='text-xs text-gray-500'>Add Item worth Rs.{250 - subTotal} more to get free delivery</p>
        )
    }
    <div className="flex justify-between text-base font-semibold border-t border-gray-200 pt-3">
        <span>Grand Total</span>
        <span>Rs.{grandTotal}</span>
    </div>
    <button
    onClick={checkout}
    className={`mt-3 w-full rounded-lg bg-[#E23744] py-3 text-sm font-semibold text-white hover:bg-red-800 ${!restaurant.isOpen? "opacity-50 cursor-not-allowed":""}`}
    disabled={!restaurant.isOpen}
    >
        {!restaurant.isOpen ? "Restaurant is closed" : "Proceed to Checkout"}
    </button>

    <button 
    onClick={clearCart}
    className='mt-3 w-full flex justify-center items-center rounded-lg gap-2 bg-[#7b7979] py-3 text-sm font-semibold text-white hover:bg-gray-500'
    disabled={clearingCart}
    >
       
        Clear Cart <BiTrash  size={20} />
    </button>
</div>
        </div>
    )
}

export default Cart