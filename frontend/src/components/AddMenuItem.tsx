import axios from "axios";
import { useState } from "react";
import { restaurantService } from "../config";
import { toast } from "react-hot-toast";
import { FiUploadCloud } from "react-icons/fi";



const AddMenuItem = ({onItemAdded}:{onItemAdded:()=>void}) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState(0);
    const [image, setImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setName("");
        setDescription("");
        setPrice(0);
        setImage(null);
    }

    const handleSubmit = async(e: React.FormEvent) => {
        e.preventDefault();

        if(!name || !price || !image){
            alert("Please fill all the fields");
            return;
        }

        const formData = new FormData();

        formData.append("name", name);
        formData.append("description", description);
        formData.append("price", price.toString());
        formData.append("file", image);

        try{
            setLoading(true);
            await axios.post(`${restaurantService}/api/item/new`, formData, {
                headers:{
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "multipart/form-data"
                }
            })

            toast.success("Menu item added successfully");
            resetForm();
            onItemAdded();  //received as props
        }catch(error){
            console.error("Error adding menu item:", error);
            toast.error("Failed to add menu item");
        } finally {
            setLoading(false);
        }


    }
  return (

    <div className="max-w-md mx-auto p-6 bg-white shadow-xl rounded-xl border border-gray-100 font-sans">
  
  {/* Header Title Text Block */}
  <h2 className="text-xl font-bold text-gray-800 mb-6">Add Menu Item</h2>
  
  {/* Form Control Vertical Grid Wrapper */}
  <div className="space-y-5">
    
    {/* Input 1: Menu Item Name */}
    <div className="w-full">
      <input 
        type='text' 
        placeholder="Item name" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        className="w-full border border-gray-300 rounded-lg py-3 px-4 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-[#E23744] focus:ring-1 focus:ring-[#E23744]" 
      />
    </div>

    {/* Input 2: Menu Item Description */}
    <div className="w-full">
      <textarea 
        placeholder="Item description" 
        value={description} 
        onChange={(e) => setDescription(e.target.value)} 
        className="w-full border border-gray-300 rounded-lg py-3 px-4 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-[#E23744] focus:ring-1 focus:ring-[#E23744] h-24 resize-none" 
      />
    </div>

    {/* Input 3: Item Price (With exact Currency symbol look tracking placeholder) */}
    <div className="w-full">
      <input 
        type='number' 
        placeholder="Price ₹" 
        value={price || ""} 
        onChange={(e) => setPrice(Number(e.target.value))} 
        className="w-full border border-gray-300 rounded-lg py-3 px-4 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-[#E23744] focus:ring-1 focus:ring-[#E23744]" 
      />
    </div>

    {/* Input 4: Clean Custom File Uploader Label Wrapper */}
    <div className="w-full">
      <label
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/50 px-4 py-3.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 cursor-pointer"
      >
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
          className="hidden"
        />
        <FiUploadCloud className="h-5 w-5 text-[#E23744]" />
        <span className="truncate text-gray-500 font-normal">
          {image ? `Selected: ${image.name}` : "Upload restaurant image"}
        </span>
      </label>
    </div>
    <button 
      className="bg-red-500 w-full cursor-pointer text-white py-3 px-6 rounded-lg font-medium hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#E23744] focus:ring-offset-2"
      onClick={handleSubmit}
      disabled={loading}
    >
      {loading ? "Adding..." : "Add Item"}
    </button>

  </div>
</div>
  )
}

export default AddMenuItem