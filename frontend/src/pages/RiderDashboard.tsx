import { useEffect, useRef, useState } from 'react'
import { useAppData } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import { riderService } from '../config';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiLoader, FiUploadCloud } from 'react-icons/fi';
import type { IOrder } from '../types';
import audio from '../assets/notifications/correct-answer-tone.wav'
import RiderOrderRequest from '../components/RiderOrderRequest';
import RiderCurrentOrder from '../components/RiderCurrentOrder';
import RiderOrderMap from '../components/RiderOrderMap';

interface IRider {
    _id: string;
    phoneNumber: string;
    aadharNumber: string;
    drivingLicenseNumber: string;
    picture: string;
    isVerified: boolean;
    isAvailable: boolean;
}


const RiderDashboard = () => {

    const { user } = useAppData();

    const { socket } = useSocket();

    const [profile, setProfile] = useState<IRider | null>(null);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);

    const [incomingOrders, setIncomingOrders] = useState<string[]>([]);
    const [currentOrder, setCurrentOrder] = useState<IOrder | null>(null);

    const [audioUnlocked, setAudioUnlocked] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        audioRef.current = new Audio(audio);
        audioRef.current.preload = "auto";
    }, []);

    const unlockAudio = async () => {
        try {
            if (!audioRef.current) return;

            await audioRef.current.play();
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setAudioUnlocked(true);
            toast.success("Sound Enabled")
        } catch (error) {
            toast.error("Tap again to enable sound")
        }
    }

    useEffect(() => {
        if (!socket) return;

        const onOrderAvailable = ({ orderId }: { orderId: string }) => {
            setIncomingOrders((prev) => prev.includes(orderId) ? prev : [...prev, orderId])

            if (audioUnlocked && audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => { })
            }

            setTimeout(() => {
                setIncomingOrders((prev) => prev.filter((id) => id !== orderId));
            }, 10000);
        }

        socket.on("order:available", onOrderAvailable);

        return () => {

            socket.off("order:available", onOrderAvailable);
        }
    }, [socket, audioUnlocked])

    const fetchProfile = async () => {
        try {
            const { data } = await axios.get(`${riderService}/api/rider/myprofile`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            })
            setProfile(data || null);
        } catch (error) {
            setProfile(null);
            console.error("Error fetching rider profile:", error);
            toast.error("Error fetching rider profile");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user?.role === 'rider') {
            fetchProfile();
        }
        else setLoading(false);
    }, [user]);

    const fetchCurrentOrder = async () => {
        try {
            const { data } = await axios.get(`${riderService}/api/rider/order/current`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                },
            );
            if (data && data.order && data.order.status !== 'delivered') {
                setCurrentOrder(data.order);
            } else {
                setCurrentOrder(null);
            }

        } catch (error) {
            console.log("Error fetching current order: ", error);
            setCurrentOrder(null);
        }
    }

    useEffect(() => {
        fetchCurrentOrder();
    }, [])

    const toggleAvailability = async () => {
        if (!navigator.geolocation) {
            toast.error("Location is Required to toggle availability");
            return;
        }

        setToggling(true);

        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                await axios.patch(`${riderService}/api/rider/toggle`, {
                    isAvailable: !profile?.isAvailable,
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                }, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                })

                toast.success(`You are now ${!profile?.isAvailable ? "Available" : "Unavailable"}`);
                fetchProfile();
            } catch (error: any) {
                console.error("Error toggling availability:", error);
                toast.error(error.response?.data?.message || "Error toggling availability");
            } finally {
                setToggling(false);
            }
        })
    }


    const [phoneNumber, setPhoneNumber] = useState("");
    const [aadharNumber, setAadharNumber] = useState("");
    const [drivingLicenseNumber, setDrivingLicenseNumber] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        //  Verify Geolocation capabilities exist
        if (!navigator.geolocation) {
            toast.error("Location access is required to register as a rider.");
            return;
        }

        setSubmitting(true);

        // Fetch modern geolocation parameters directly upon submitting action
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const formData = new FormData();


                    formData.append("phoneNumber", phoneNumber);
                    formData.append("aadharNumber", aadharNumber);
                    formData.append("drivingLicenseNumber", drivingLicenseNumber);
                    formData.append("latitude", pos.coords.latitude.toString());
                    formData.append("longitude", pos.coords.longitude.toString());

                    if (image) {
                        formData.append("file", image);
                    }

                    await axios.post(`${riderService}/api/rider/new`, formData, {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                            "Content-Type": "multipart/form-data" // Mandatory flag for processing files
                        }
                    });
                    //guard rails 
                    const token = localStorage.getItem("token");
                    if (!token || token === "null" || token === "undefined") {
                        toast.error("Your session has expired. Please log in again.");
                        setSubmitting(false);
                        return;
                    }

                    toast.success("Profile created successfully 🎉");
                    fetchProfile();
                } catch (error: any) {
                    console.error("Error creating profile:", error);
                    toast.error(error.response?.data?.message || "Error creating profile");
                } finally {
                    setSubmitting(false);
                }
            },
            (geoError) => {
                console.error("Geolocation acquisition failed:", geoError);
                toast.error("Please enable location permissions inside your browser toolbar.");
                setSubmitting(false);
            }
        );
    };



    if (user?.role !== 'rider') {
        return <div className="text-center py-60 font-bold">
            You are not authorized to view this page
        </div>;
    }

    if (loading) {
        return <div className="text-center py-60 font-bold">Loading Rider Details...</div>;
    }

    if (!profile)
        return (
            <div className="flex min-h-[90vh] items-center justify-center bg-gray-50/50 p-4 font-sans">

                {/* Form Container Card */}
                <div className="w-full max-w-lg rounded-xl border border-gray-100 bg-white p-6 shadow-xl md:p-8">

                    <h2 className="text-xl font-bold text-gray-800 mb-6">Add Your Profile</h2>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5">

                        {/* Input: Phone Number */}
                        <div>
                            <input
                                type="number"
                                placeholder="Phone Number"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-[#E23744] focus:ring-1 focus:ring-[#E23744]"
                            />
                        </div>

                        {/* Input: Aadhar Number */}
                        <div>
                            <input
                                type="number"
                                placeholder="Aadhar Number"
                                value={aadharNumber}
                                onChange={(e) => setAadharNumber(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-[#E23744] focus:ring-1 focus:ring-[#E23744]"
                            />
                        </div>

                        {/* Input: driving license Number */}
                        <div>
                            <input
                                type="text"
                                placeholder="Driving License Number"
                                value={drivingLicenseNumber}
                                onChange={(e) => setDrivingLicenseNumber(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-[#E23744] focus:ring-1 focus:ring-[#E23744]"
                            />
                        </div>

                        {/* Custom Image Upload Trigger Block */}
                        <div>
                            <label
                                className="flex w-full items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/50 px-4 py-4 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 cursor-pointer"
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
                                    className="hidden"
                                />
                                <FiUploadCloud className="h-5 w-5 text-[#E23744]" />
                                <span className="truncate"
                                >
                                    {image ? `Selected: ${image.name}` : "Upload Your Image"}
                                </span>
                            </label>
                        </div>

                        {/* Action Trigger Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex w-full items-center justify-center rounded-lg bg-[#E23744] py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#c62835] disabled:bg-gray-400"
                            >
                                {submitting ? (
                                    <FiLoader className="h-5 w-5 animate-spin" />
                                ) : (
                                    "Register as Rider"
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        )

    return <div className="space-y-4" >
        <div className='mx-auto max-w-md px-4 py-4'>
            <div className="rounded-xl bg-white p-4 shadow space-y-3">

                <img src={profile.picture} className="mx-auto h-24 w-24 rounded-full object-cover"
                    alt="" />
                <p className="text-center text-lg font-semibold">{user?.name}</p>
                <p className="text-center text-gray-500">{profile.phoneNumber}</p>
                <div className='flex justify-center gap-2'>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-500 " >{profile.isVerified ? "Verified" : "Pending"}</span>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-500 " >{profile.isAvailable ? "Online" : "Offline"}</span>
                </div>
                <div>
                    <p className="text-blue-400" >Please be within a 500m radius of any restaurant (which we call a hotspot) before going online as a rider to receive orders.</p>
                </div>
                {
                    profile.isVerified && !currentOrder &&
                    <button
                        onClick={toggleAvailability}
                        disabled={toggling}
                        className={`w-full py-2 rounded-lg text-white font-semibold ${toggling
                            ? "bg-gray-400"
                            : profile.isAvailable
                                ? "bg-gray-600"
                                : "bg-[#E23744]"
                            }`} >
                        {toggling
                            ? "Updating..."
                            : profile.isAvailable
                                ? "Set as Offline"
                                : "Set as Online"
                        }

                    </button>
                }
            </div>
        </div>
        {!audioUnlocked && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between" >
            <div className="flex items-center gap-3 " >
                <span className="text-2xl" >🔔</span>
                <div>
                    <p className="font-medium text-blue-900" >Enable Sound Notifications</p>
                    <p className="text-sm text-blue-600" >Allow sound notifications for new orders</p>
                </div>
            </div>
            <button onClick={unlockAudio} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md" >
                Enable Sound
            </button>
        </div>}


        {profile.isAvailable && incomingOrders.length > 0 && (
            <div className='mx-auto max-w-md px-4 space-y-3'>
                <h3 className="font-semibold text-gray-700">Incoming Orders</h3>
                {incomingOrders.map((id) => (
                    <RiderOrderRequest
                        key={id}
                        orderId={id}
                        onAccepted={async () => {
                            await fetchCurrentOrder();
                            await fetchProfile();
                        }}
                    />
                ))}
            </div>
        )}

        {
            currentOrder && (
                <div className="mx-auto max-w-md px-4 space-y-4" >
                    <RiderCurrentOrder order={currentOrder} onStatusUpdate={fetchCurrentOrder} />
                    <RiderOrderMap order={currentOrder} />

                </div>
            )
        }
    </div>
}

export default RiderDashboard