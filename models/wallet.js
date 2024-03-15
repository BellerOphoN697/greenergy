const mongoose=require('mongoose')

const Schema=mongoose.Schema

const walletSchema=new Schema({
    u_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    },
    balance: {
        type:Number,
        default:0
    },
    action:[{
        flow: String,
        amount: Number,
        current:Number,
        reference: Number,
        time: { type: Date, default: Date.now },
    }]
},{ timestamps: true, versionKey: false })
module.exports = mongoose.model("wallet", walletSchema);