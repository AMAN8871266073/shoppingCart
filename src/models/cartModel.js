const mongoose = require("mongoose")
const ObjectId = mongoose.Types.ObjectId
const cartSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: 'cartUser',
        required: true,
        unique: true
    },
    items: [{
        productId: {
            type: ObjectId,
            ref: 'product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    totalItems: {
        type: Number,
        required: true
    },
}, { timestamps: true })
module.exports = mongoose.model('cart', cartSchema)