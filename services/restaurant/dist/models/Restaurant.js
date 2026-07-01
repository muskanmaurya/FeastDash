import { model, Schema } from 'mongoose';
const schema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
    },
    image: {
        type: String,
        required: true,
    },
    ownerId: {
        type: String,
        required: true,
    },
    phone: {
        type: Number,
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    autoLocation: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
        },
        coordinates: {
            type: [Number],
            required: true,
        },
        formattedAddress: {
            type: String,
        }
    },
    isOpen: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
//we need to add one more line to add geoindex to nearby search means around 5km here 
schema.index({ autoLocation: '2dsphere' }); //this is used to create a geospatial index on the autoLocation field, which allows us to perform geospatial queries on the collection.
const RestaurantModel = model('Restaurant', schema); //this is used to create a model for the restaurant collection in the database.
export default RestaurantModel;
