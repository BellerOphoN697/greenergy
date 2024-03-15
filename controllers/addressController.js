const User = require("../models/user");
const Address=require('../models/address')
let title="Address"


const address_add_get=async(req,res)=>{
  const message=req.query.message    
    res.render('user/address-add', {message,title,address:true})
  }
  
const address_add_post=async(req,res)=>{
  let defaultVal=false


    firstAddress=await Address.findOne({u_id:req.session.user})
    if(!firstAddress){
      defaultVal=true
    }
    
    const data=new Address({
      default: defaultVal,
      u_id:req.session.user,
      name:req.body.name,
      pincode:req.body.pincode,
      addr1:req.body.addr1,
      addr2:req.body.addr2,
      mark: req.body.mark,
      city:req.body.city,
      state:req.body.state,
      country:req.body.country,
      type:req.body.type,
      email:req.body.email,
      phone:req.body.phone,
    })
    try{
      await data.save()
      res.redirect('addresses')
    }
    catch{
      res.redirect('address-add?message=Error+occured.+Try+again')
    }
}


  const addresses_get=async(req,res)=>{
    const addrs=await Address.find({u_id:req.session.user},{})
    res.render('user/addresses',{addrs,title,address:true})
    console.log(`addresses_get rendered`)
  }
  
  const address_edit_get=async(req,res)=>{
    const message=req.query.message
    const _id=req.query._id
    const data=await Address.findOne({_id:_id})
      res.render('user/address-edit', {message:message,data,title,address:true})
    }

    const address_edit_post=async(req,res)=>{
      const _id=req.body._id
      if(req.body.default){
        await Address.updateMany({},{default:false})
        await Address.updateOne({_id:_id},{default:true})
      }
      const address=await Address.findOne({_id})
      try{
        if(address){
        await Address.updateOne({_id:_id},{$set:{
          name:req.body.name,
          pincode:req.body.pincode,
          addr1:req.body.addr1,
          addr2:req.body.addr2,
          mark: req.body.mark,
          city:req.body.city,
          state:req.body.state,
          country:req.body.country,
          type:req.body.type,
          email:req.body.email,
          phone:req.body.phone,
        }})
        res.redirect('addresses')
        }
        else{
          res.redirect(`address-edit?message=Cannot+find+previous+data.+Try+again&_id=${_id}`)

        }
      }
      catch{
        res.redirect(`address-edit?message=Error+occured.+Try+again&_id=${_id}`)
      }
  }

  const address_delete_get=async(req,res)=>{
    const message=req.query.message
    const _id=req.query._id
    const data=await Address.findOneAndDelete({_id:_id})
      res.render('user/addresses', {message:message,data,title})
    }
  
  const address_cart_get=async(req,res)=>{
    const message=req.query.message
      res.render('user/address-cart', {message,title})
    }
    
  const address_cart_post=async(req,res)=>{
      
      const data=new Address({
        default: false,
        u_id:req.session.user,
        name:req.body.name,
        pincode:req.body.pincode,
        addr1:req.body.addr1,
        addr2:req.body.addr2,
        mark: req.body.mark,
        city:req.body.city,
        state:req.body.state,
        country:req.body.country,
        type:req.body.type,
        email:req.body.email,
        phone:req.body.phone,
      })
      try{
        await data.save()
        res.redirect('checkout')
      }
      catch{
        res.redirect('address-cart?message=Error+occured.+Try+again')
      }
  }

//------------------------------------- Exports -------------------------------------\\
module.exports={
    
    address_add_get,
    address_add_post,
    
    addresses_get,
    address_edit_get,
    address_edit_post,
    address_delete_get,

    address_cart_get,
    address_cart_post
      
  }