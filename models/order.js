const mongoose = require("mongoose");
const Counter = require("../models/counter");


const Schema = mongoose.Schema;

const orderSchema = new Schema({
    order_id: Number,
    u_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product'
        },
        qty: {
            type: Number,
            default: 1
        },
        subtotal: {
            type: Number,
        },
        rate:{
            type:Number
        }
    }],
    total: {
        type: Number,
    },
    subtotal:Number,
        name: String,
        addr1: String,
        addr2: String,
        mark: String,
        city: String,
        state: String,
        country: String,
        pincode: String,
        email: String,
        phone: Number,
        type: Boolean,
    paytype: String,
    payref: Number,
    notes:String,
    razpay:String,
    razorder:String,
    couponcode:String,
    coupondiscount:{
        type:Number,
        default:0
    },
    time: { type: Date, default: Date.now },
    status: String,
    dispatched:{
        type:Boolean,
        default: false
    },
    inTransit:{
        type:Boolean,
        default: false
    },
    delivered:{
        type:Boolean,
        default: false
    },
    reqCancel:{
        type:Boolean,
        default: false
    },
    cancelled:{
        type:Boolean,
        default: false
    },
    returned:{
        type:Boolean,
        default: false
    },
    refundStarted:{
        type:Boolean,
        default: false
    },
    refunded:{
        type:Boolean,
        default: false
    },
}, { timestamps: true, versionKey: false });

// Pre-save middleware to generate sequential order_id
orderSchema.pre('save', async function(next) {
    if (!this.isNew) {
        return next();
    }

    try {
        const counter = await Counter.findByIdAndUpdate({ _id: 'orderId' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
        this.order_id = counter.seq;
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model("order", orderSchema);
