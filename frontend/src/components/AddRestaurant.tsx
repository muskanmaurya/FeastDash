import { useState } from 'react'
import { useAppData } from '../context/AppContext';
import { toast } from 'react-hot-toast';
import { restaurantService } from '../config';
import axios from 'axios';
import { FiLoader, FiMapPin, FiUploadCloud } from 'react-icons/fi';

interface props{
  fetchMyRestaurant: () => Promise<void>;
}

const AddRestaurant = ({ fetchMyRestaurant }: props) => {

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { loadingLocation, location } = useAppData();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name || !image) {
      alert("All fields are required");
      return;
    }

    const formData = new FormData();

    formData.append("name", name);
    formData.append("description", description);
    // formData.append("latitude", String(location.latitude));
    // formData.append("longitude", String(location.longitude));
    // formData.append("formattedAddress", location.formattedAddress);
    formData.append("file", image);
    formData.append("phone", phone);

    console.log("formdata: ",formData);

    
    try {
      setSubmitting(true);
      await axios.post(`${restaurantService}/api/restaurant/new`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data"
        }
      });
      
      
      toast.success("Restaurant created successfully");
      fetchMyRestaurant(); // Refresh the restaurant data after successful creation
      alert("Restaurant created successfully!");
      
      // Optional: reload the page or trigger fetchMyRestaurant again to show the newly created restaurant page
      window.location.reload();
      
    } catch (error : any) {
      console.log("formdata: ",formData);
      console.log("Error in creating restaurant: ", error);
      console.log(error.response.data.message);
      toast.error("Error in creating restaurant");
    } finally {
      setSubmitting(false);
    }

  };

  return (
    <div className="flex min-h-[90vh] items-center justify-center bg-gray-50/50 p-4 font-sans">

      {/* Form Container Card */}
      <div className="w-full max-w-lg rounded-xl border border-gray-100 bg-white p-6 shadow-xl md:p-8">

        <h2 className="text-xl font-bold text-gray-800 mb-6">Add Your Restaurant</h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Input: Restaurant Name */}
          <div>
            <input
              type="text"
              placeholder="Restaurant name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-[#E23744] focus:ring-1 focus:ring-[#E23744]"
            />
          </div>

          {/* Input: Contact Number */}
          <div>
            <input
              type="number"
              placeholder="Contact Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-[#E23744] focus:ring-1 focus:ring-[#E23744]"
            />
          </div>

          {/* Input: Description */}
          <div>
            <textarea
              placeholder="Restaurant Description"
              //   rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-[#E23744] focus:ring-1 focus:ring-[#E23744] resize-none"
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
                {image ? `Selected: ${image.name}` : "Upload restaurant image"}
              </span>
            </label>
          </div>

          {/* Live Location Status Info Row */}
          <div className="flex items-center gap-2 py-1 text-sm">
            {
              loadingLocation ? (
                <>
                  <FiLoader className="h-4 w-4 animate-spin text-[#E23744]" />
                  <span className="text-gray-500 font-medium">Fetching your location...</span>
                </>
              )
                :
                location ? (
                  <>
                    <FiMapPin className="h-4 w-4 text-[#E23744]" />
                    <span className="text-gray-700 font-medium truncate">
                      Location Loaded: <span className="text-gray-500 font-normal">{location?.formattedAddress || "Detected"}</span>
                    </span>
                  </>
                )
                  :
                  (
                    <>
                      <FiMapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-red-500 font-medium">Location access required</span>
                    </>
                  )
            }
          </div>

          {/* Action Trigger Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center rounded-lg bg-[#E23744] py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#c62835] disabled:bg-gray-400"
            >
              {submitting ? (
                <FiLoader className="h-5 w-5 animate-spin" />
              ) : (
                "Add Restaurant"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default AddRestaurant