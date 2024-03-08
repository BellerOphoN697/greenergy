var express = require('express');
var router = express.Router();
var userController=require('../controllers/userController')
var addressController=require('../controllers/addressController')
var productController=require('../controllers/productController')
var cartController=require('../controllers/cartController')
var orderController=require('../controllers/orderController')


var MongoClient=require('mongodb').MongoClient
const User = require("../models/user");

const setNoCache=require('../public/javascripts/setNoCache');
const Cart = require('../models/cart');

router.get('/shop', requireLogin,setNoCache.user,isBlock,userPreload,productController.shop_get);
router.get('/product', requireLogin,setNoCache.user,isBlock,userPreload,productController.product)
router.get('/sign-in',isLoggedIn, setNoCache.user, userPreload,userController.sign_in_get);
router.post('/sign-in', setNoCache.user, userPreload,userController.sign_in_post)
router.get('/create-account',  setNoCache.user,userPreload, userController.create_account_get);
router.post('/create-account',  setNoCache.user, userPreload,userController.create_account_post);
router.get('/otp', setNoCache.user, userPreload, userController.otp_get);
router.get('/resend', setNoCache.user, userPreload,userController.otp_resend);
router.post('/otpcheck', setNoCache.user,userPreload, userController.otp_check);
router.get('/otp-success', setNoCache.user,userPreload, userController.otp_success)
router.get('/search', setNoCache.user, userPreload,userController.search_get);
router.get('/user-dashboard',setNoCache.user,requireLogin,userPreload,userController.user_dashboard_get)
router.get('/profile',setNoCache.user,requireLogin,userPreload,userController.profile_get)
router.get('/settings',setNoCache.user,requireLogin,userPreload,userController.settings_get)
router.post('/settings',setNoCache.user,requireLogin,userPreload,userController.settings_post)
router.get('/address-add',setNoCache.user,requireLogin,userPreload,addressController.address_add_get)
router.post('/address-add',setNoCache.user,requireLogin,userPreload,addressController.address_add_post)
router.get('/addresses',setNoCache.user,requireLogin,userPreload,addressController.addresses_get)
router.get('/address-edit',setNoCache.user,requireLogin,userPreload,addressController.address_edit_get)
router.post('/address-edit',setNoCache.user,requireLogin,userPreload,addressController.address_edit_post)
router.get('/address-cart',setNoCache.user,requireLogin,userPreload,addressController.address_cart_get)
router.post('/address-cart',setNoCache.user,requireLogin,userPreload,addressController.address_cart_post)
router.get('/cart',setNoCache.user,requireLogin,userPreload,cartController.cart_view_get)
router.post('/addToCart',setNoCache.user,requireLogin,userPreload,cartController.add_to_cart_post)
router.post('/removeFromCart',setNoCache.user,requireLogin,userPreload,cartController.remove_from_cart_post)
router.get('/deleteFromCart',setNoCache.user,requireLogin,userPreload,cartController.delete_from_cart_get)
router.get('/checkout',setNoCache.user,requireLogin,userPreload,cartController.checkout_get)
router.post('/checkout',setNoCache.user,requireLogin,userPreload,cartController.checkout_post)
router.get('/order-details',setNoCache.user,requireLogin,userPreload,orderController.order_details_get)
router.get('/order-list',setNoCache.user,requireLogin,userPreload,orderController.order_list_get)
router.get('/order-cancel',setNoCache.user,requireLogin,userPreload,orderController.order_cancel_get)
router.get('/logout', requireLogin, setNoCache.user, userPreload,userController.user_logout,()=>{console.log("cookie"+req.cookies.redirecturl)})
router.get('/',  setNoCache.user, userPreload,userController.home_get);
router.post('/',  setNoCache.user, userPreload,userController.home_post)
router.get('/*', setNoCache.user, userPreload,userController.page_not_found)

async function requireLogin(req, res, next) {
  req.session.user='65dc11c766e50223004d914e'
    if (!req.session.user) {
      return res.redirect('/sign-in');
    }
    next();
}

async function isLoggedIn(req, res, next) {
    if (req.session.user) {
      return res.redirect('/shop');
    }
    next();
}

async function isBlock(req,res,next){
  const userdata=await User.findOne({_id: req.session.user})

  if(userdata.block==true){
    console.log("blocked")
    return res.redirect('/logout');
  }
  next()

}
async function userPreload(req,res,next){
  try{
  const cart=await Cart.findOne({u_id:req.session.user})
  cartnum=cart.items.length
  carttotal=cart.total
  next()  
  }
  catch{
    cartnum=0
  carttotal=0
  next() 

  }
}

module.exports = router;