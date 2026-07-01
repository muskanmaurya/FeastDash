//when we send fata in the cloudinary first we create a buffer and cloudinary only accepts buffer which makes our work easy so we are using data uri
import DatauriParser from "datauri/parser.js";
import path from "path"; //inbuilt module in nodejs which helps us to get the extension of the file
const getBuffer = (file) => {
    const parser = new DatauriParser(); //we are creating a new instance of the DatauriParser class which helps us to convert the file to buffer
    const extName = path.extname(file.originalname).toString();
    return parser.format(extName, file.buffer); //we are using the format method of the DatauriParser class which takes two arguments, the first is the extension of the file and the second is the buffer of the file and it returns the buffer of the file
};
export default getBuffer;
