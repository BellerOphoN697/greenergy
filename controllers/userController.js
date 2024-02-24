const User = require("../models/user");
const Product=require("../models/product")
const Category=require("../models/category")

const otpGenerator = require('otp-generator');
const sendOTP=require('../public/javascripts/sendOTP')
const crypt=require('../public/javascripts/crypt')

let title="Greenergy"




//---------------------------------- User Routes -----------------------------------------\\

const home_get=(req,res)=>{
  res.redirect('/sign-in')
  //res.render('user/home-03', { title: 'Greenergy' });
  console.log("Login rendered")
}
const home_post=(req,res)=>{
    MongoClient.connect(process.env.MONGODB_URI,function(err,client){
      if(err){
        console.log('error')
      }
      else
      {
        console.log("connected")
      }
    })
  }
const shop_get=async (req,res)=>{
  const products=await Product.find({delete:false}).populate('category')
  const categories=await Category.find({delete: false})
    res.render('user/shop-02', {user: req.session.user,title, categories,products:products, title: 'Shop' });
    console.log("shop_get rendered")
  }
const sign_in_get=(req, res, next) =>{
  

    res.render('user/sign-in', { user: req.session.user,message:'',title: 'Sign-in' });

    console.log("sign_in_get rendered")
  }
  const sign_in_post=async(req, res, next) =>{
    const { email, password } = req.body;

    try {
        // Find the user by email
        const user = await User.findOne({ email});
        // If user not found, return error
        if (!user ) {
            return res.status(400).render('user/sign-in',{title, message: 'User not found' });
        }

        if (user.block) {
          return res.status(400).render('user/sign-in',{ title,message: 'User is blocked' });
      }


        // Check if password matches
        const data = await User.findOne({email:email});       
        const val = await crypt.cmpPassword(data.password,password);
        
        // If password does not match, return error
        if (val==false) {
          return res.status(400).render('user/sign-in',{ title,message: 'Invalid credentials' });
        }
        else{
          req.session.user=email
          res.redirect('/shop'); 
        }

        

        // If user is valid, render the home page
        // Assuming you have a home template

    } catch (error) {
        console.error(error);
        res.status(500).render('user/sign-in', {title,message: 'Server error' });
    }
;

    }

const create_account_get=(req, res, next) =>{
    res.render('user/create-account', {user: req.session.user, title: 'Create-Account' ,message:''});
    console.log("Create-Account rendered")
  }
const create_account_post =  async (req, res) =>{
  var data={first_name,last_name,email,phone,password}=req.body
  const userExist=await User.exists({email})
  if(userExist){

    res.render('user/sign-in', {user: req.session.user,title, message: 'Email already registered. Please Login' });
    console.log("User exist")
    
  }
  else if(req.body.password===req.body.confirmpassword){
    req.session.data=data
    //const user=await User.create({data})
    console.log("Create-Account done")
    res.redirect('/otp')

   }
   else{
    res.render('user/create-account', { user: req.session.user,title,message: 'Password not matching' });
    
   }

   //console.log(user)
    //res.render('user/create-account', {user: req.session.user, title: 'Create-Account' });
    
  }

const otp_get=(req, res, next)=> {
mail_id=req.session.data.email
// Generate a 6-digit OTP
const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
sendOTP(otp,mail_id)
req.session.otp=otp
console.log('Generated OTP:', otp);
    res.render('user/otp', { user: req.session.user,title: 'OTP Verification' });
    console.log("OTP Verification rendered")
      //console.log(req.session.data)
  }

  const otp_post=async(req, res, next)=> {
    let otp=req.session.otp
    
    if(req.body.userotp===otp){
      res.redirect('otp-success');

        // Hash the password along with the salt
         const hashedPassword = await crypt.hashPassword(req.session.data.password);
        console.log("password:  ",hashedPassword)
      await User.create({
        email:req.session.data.email,
        first_name: req.session.data.first_name,
        last_name: req.session.data.last_name,
        phone: req.session.data.phone,
        password: hashedPassword,
        block: 0,
        isAdmin: 0,
      })      
    }
  
     
     else{
      res.render('user/otp', { user: req.session.user,title,message: 'OTP invalid' });
      
     }
    }

const otp_success=(req,res)=>{
  res.render('user/otp-success', { user: req.session.user,title,message: 'Your account have been created. Please proceed to login.' });
}

const product=async (req,res)=>{
  const id=req.query.id
  
  const details=await Product.find({ _id: id }).populate(['brand','category']);
  const related=await Product.find({_id:{$ne:id}});

  res.render('user/product-details', {user: req.session.user,details,title,related})
  console.log("Product details rendered")
}
  

  
const search_get=(req, res, next)=> {
    res.render('user/!search!not!defined!', {user: req.session.user, title: 'Search' });
    console.log("Search rendered")
  }

const page_not_found=(req,res)=>{
  res.status(404).render('user/404', { title: 'Search' , layout:false});
  }
  

  const user_logout=(req,res)=>{
  
    req.session.destroy(err => {
      if (err) {
        console.error(err);
      }
      res.redirect('/sign-in')
      console.log("Redirect")
   });
  }



//------------------------------------- Admin Routes -------------------------------------\\



const admin_user_details_post=async(req,res)=>{
  const {_id,first_name,last_name,email,phone,block,password,isAdmin}=req.body
  if(req.session.admin==email && block==true){
  const id=req.query.id
  const users = await User.find({_id:id});
  console.log("Invalid operation")
  res.render('user-details',{users,title,message:"Invalid operation", layout:'admin/layout'})
  }
  else{
  await User.findOneAndReplace({_id:_id},{first_name,last_name,email,phone,block,password,isAdmin})
  res.redirect('users')
  }

}

const admin_login_get=(req,res)=>{
  if(req.session.admin){
    res.redirect('/admin/users')
  }
  else
  {
    res.render('admin/admin-login', { title, message: '' ,layout:false});
    console.log('Admin Login rendered')
  };
}
const admin_login_post=async(req,res)=>{
    const { username, password } = req.body;
    
    try {
      // Find the user by email
      const user = await User.findOne({ email:username, isAdmin:true});
      

      

      // If user not found, return error
      if (!user ) {
          return res.status(400).render('admin/admin-login',{ title,message: 'Unauthorised access' ,layout:false});
      }
      

      // Check if password matches
      const data = await User.findOne({email:username});       

      // If password does not match, return error
      const val = await crypt.cmpPassword(data.password,password);
        
        // If password does not match, return error
        if (val==false) {
          return res.status(400).render('admin/admin-login',{title, message: 'Invalid credentials' ,layout:false});
      }
      req.session.admin = username;
      res.redirect('/admin/users')
      //res.render('userlist', { message: '',userdetails,findmessage:'',updatemessage:'',userexist });
      console.log('Logged in as '+req.session.admin)
      // If user is valid, render the home page
      // Assuming you have a home template
  } catch (error) {
      console.error(error);
      res.status(500, '/', {message: 'Server error' ,layout:false});
  }
;

  }

const admin_dashboard_get=(req,res)=>{ 
  res.render('admin-dashboard', {title, message: '' ,layout:'admin/layout'});
  console.log("Admin Dashboard rendered")  
  
}

const admin_user_list_get=async (req,res)=>{
  
  
  try {
    // Retrieve products from MongoDB
    const users = await User.find();
    res.render('admin/userlist',{title,users,layout:'admin/layout'})
  }
  catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
}
}

const admin_user_details_get=async(req,res)=>{
  const id=req.query.id
  const users = await User.find({_id:id});
  console.log("user_details_get loaded")
  res.render('admin/user-details',{title,users, layout:'admin/layout'})
}

const admin_page_not_found=(req,res)=>{
  res.render('admin/page-error-404', { title: 'Search' , layout:false});
  }



const admin_logout=(req,res)=>{
  
  req.session.destroy(err => {
    if (err) {
      console.error(err);
    }
    res.redirect('/admin/')
    console.log("Redirected to Admin Login")
 });
}






//------------------------------------- Exports -------------------------------------\\
module.exports={
  admin_login_get,
  admin_login_post,
  admin_dashboard_get,
  admin_user_list_get,
  admin_user_details_get,
  admin_user_details_post,
  admin_page_not_found,
  admin_logout,
  home_get,
  home_post,
  shop_get,
  sign_in_get,
  sign_in_post,
  create_account_get,
  create_account_post,
  otp_get,
  otp_post,
  otp_success,
  search_get,
  page_not_found,
  product,
  user_logout,
    
}