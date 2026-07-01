import multer from "multer";

//there are two types of storage in multer, diskStorage and memoryStorage. DiskStorage saves the file to the disk, while memoryStorage saves the file to memory as a Buffer object. In this case, we are using memoryStorage because we want to upload the image to cloud, which requires the image to be in memory.

const storage = multer.memoryStorage();  

const uploadFile = multer({storage}).single("file"); //storage is the storage engine, single is the method to upload a single file, and "file" is the name of the field in the form that contains the file. that we later gonna use to upload the file to cloud.

export default uploadFile;


