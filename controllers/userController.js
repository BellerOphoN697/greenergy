const User = require("../models/user");
const Product=require("../models/product")
const Order=require("../models/order")
const Address=require("../models/address")
const Wallet=require("../models/wallet")

const otpGenerator = require('otp-generator');
const sendOTP=require('../public/javascripts/sendOTP')
const crypt=require('../public/javascripts/crypt');
const address = require("../models/address");

let title="Greenergy"




//-------------------------------------- User Routes -----------------------------------------\\

const home_get=(req,res)=>{
  res.redirect('/sign-in')
  //res.render('user/home-03', { title: 'Greenergy' });
  console.log("Login rendered")
}
const home_post=(req,res)=>{
    // MongoClient.connect(process.env.MONGODB_URI,function(err,client){
    //   if(err){
    //     console.log('error')
    //   }
    //   else
    //   {
    //     console.log("connected")
    //   }
    // })
  }

const signInLoad=(req, res, next) =>{
  
   res.render('user/sign-in', { user: req.session.user,email:req.session.email,message:'',title: 'Sign-in' });
    console.log("sign_in_get rendered")
    

  }
  const signInAction=async(req, res, next) =>{
    const { email, password } = req.body;
    req.session.email=email


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
          let userData=await User.findOne({email:email})
          console.log(`logged in ${userData._id}`)
          req.session.user=userData._id
          res.redirect(`${req.session.redirect}`);
          console.log(`redirected to `+req.session.redirect)
        }

        

        // If user is valid, render the home page
        // Assuming you have a home template

    } catch (error) {
        console.error(error);
        res.status(500).render('user/sign-in', {title,message: 'Server error' });
    }
;

    }

const forgotPassword=(req,res)=>{
  const message=req.query.message
  const email=req.session.email
  res.render('user/forgot-password',{title,carttotal,cartnum, message,email,cartnum,carttotal})
}

const forgotPasswordForm=async (req,res)=>{

  const email=req.body.email
  const emailCheck=await User.findOne({email:email})
  if(!emailCheck){
    return res.redirect('/forgot-password?message=Email+not+registered')
  }
  req.session.email=email
  req.session.forgotPassword=true
  res.redirect('/otp')
}


const create_account_get=(req, res, next) =>{
    res.render('user/create-account', {user: req.session.user, title: 'Create-Account' ,message:''});
    console.log("Create-Account rendered")
}


const create_account_post =  async (req, res) =>{
  console.log("create account")
  var data={first_name,last_name,email,phone,password,referral}=req.body
  req.session.referral=referral
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

const otp_get=async (req, res, next)=> {
  try{
    //mail_id= 'yesudas@yopmail.com'
    if(req.session.forgotPassword){
      mail_id=req.session.email
    }
    else{
      mail_id=req.session.data.email
    }
    // Generate a 6-digit OTP
    const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
    sendOTP(otp,mail_id)
    req.session.otp=otp
    //console.log('Generated OTP:', otp);
    res.render('user/otp', { user: req.session.user,title: 'OTP Verification' });
    console.log("OTP Verification rendered")
    //console.log(req.session.data)
  }
  catch(err){
    console.log(err) 

  }
  
  }

const otp_check=async(req, res, next)=> {
  
    let otp=req.session.otp
    const userotp = req.body
    let recotp=[]
    for(const key in userotp) recotp.push(key)

    if(recotp[0]===otp){
      if(req.session.forgotPassword){

        return res.redirect('/new-password')

    }
      res.redirect('/otp-success');
      
         const hashedPassword = await crypt.hashPassword(req.session.data.password);
        console.log("password:  ",hashedPassword)

        const referrals=await User.findOne({referral:req.session.referral})

      
        await User.create({
          email:req.session.data.email,
          first_name: req.session.data.first_name,
          last_name: req.session.data.last_name,
          phone: req.session.data.phone,
          password: hashedPassword,
          isRefer: referrals,
          block: 0,
          isAdmin: 0,
        }) 
        console.log(req.session.referral)
        if(referrals){
          const walletReferral=await Wallet.findOne({u_id:referrals._id})
          walletReferral.balance+=100
          const newAction={
              credit:true,
              amount:100,
              current: walletReferral.balance,
              reference: "New User Referral"

          }
          walletReferral.action.push(newAction)
          await walletReferral.save()

        }
        
           

      
    }
     else{
      res.status(400).json({ error: 'Invalid OTP' });

      //res.render('user/otp', { user: req.session.user,title,message: 'OTP invalid' });
     }
}


const otp_resend=(req,res,next)=>{
  console.log("OTP Resent");

  
}

const newPassword=(req,res)=>{
  res.render('user/new-password')
}

const otp_success=(req,res)=>{
  let user=req.session.user
  let message=""
  if(req.session.forgotPassword){
    return res.redirect('/new-password')
  }
  else{
     message='Your account have been created. Please proceed to login.' 

  }
  res.render('user/otp-success', { user:user ,title,message: message});
}

const newPasswordForm=async (req,res)=>{
  
  const password=req.body.password
  const email=req.session.email
  const hashedPassword = await crypt.hashPassword(password);
  const reset=await User.findOneAndUpdate({email:email},{password:hashedPassword})
  console.log(reset)

  res.render('user/otp-success', { title,message: 'Your password has been reset. Please proceed to login.' });
  req.session.forgotPassword=false
}

  
const search_post=async(req, res, next)=> {
    req.session.search=req.body.key
    const results = await Product.find({ name: { $regex: req.session.search } });
    console.log("key is" + req.session.search)
    res.redirect('shop', cartnum, carttotal, title)
  }

const page_not_found=(req,res)=>{
  res.status(404).render('user/404', { title: 'Search' , layout:false, shop:'user/shop-02'});
  }
  

const user_logout=(req,res)=>{
  res.cookie('redirecturl','/')

  console.log("cookie: " + req.cookies.redirecturl);

  req.session.destroy(err => {
    if (err) {
      console.error(err);
    }
    res.redirect('/sign-in')
    console.log("Redirect")
  });
}

const userDashboard=async (req,res)=>{
  const user=await User.find({_id:req.session.user})
  const address=await Address.findOne({u_id:req.session.user,default:true})
  const order=await Order.find({u_id:req.session.user}).populate('items.product').sort({createdAt:-1}).limit(4)
  console.log(address)
  res.render('user/user-dashboard',{user,title,cartnum,carttotal,address,order,dashboard:true})
}

const profileLoad=async(req,res)=>{
  const user=await User.find({_id:req.session.user})
  console.log(user)
  res.redirect('user-dashboard')
  //res.render('user/profile',{user,title,user_dashboard:true, my_account:true, layout: 'layout'})

}

const settingsLoad=async(req,res)=>{
  const message=req.query.message
  res.render('user/settings',{user: req.session.user,message:message, cartnum, carttotal, settin:true })
}

const settingsSave=async(req,res)=>{
  const _id=req.session.user
  const data = await User.findOne({_id:_id});       
  const val = await crypt.cmpPassword(data.password,req.body.oldpassword)
  if(val){
    try{
      const hashedPassword = await crypt.hashPassword(req.body.newpassword);
    await User.findOneAndUpdate({_id:_id},{password:hashedPassword})
    console.log("password changed")
    res.redirect('/settings?message=Password+successfully+changed')
    }
    catch(error){
      console.log(error+"\nredirecting with error msg")
      res.redirect('/settings?message=Some+error+has+occurred')
    }
  }
  else{
    console.log("passwords not matching")
    res.redirect('/settings?message=Old+password+does+not+match')
  }
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
  console.log("adminLogin")
  if(req.session.admin){
    res.redirect('/admin/dashboard')
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
      const adminData = await User.findOne({email:username})
      req.session.admin = adminData._id;
      res.redirect(`/admin`); 
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

const adminDashboard=async (req,res)=>{
  const products=await Product.find().sort({popularity:-1}).limit(10)
  const categories=await Product.aggregate([
    {
        $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'category'
        }
    },
    {
        $unwind: '$category'
    },
    {
        $group: {
            _id: '$category._id',
            name: { $first: '$category.name' },
            popularity: { $sum: '$popularity' } 
        }
    },
    {
        $project: {
            _id: 0,
            name: 1,
            popularity: 1
        }
    }
]).sort({popularity:-1}).limit(5)
const brands=await Product.aggregate([
  {
      $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand'
      }
  },
  {
      $unwind: '$brand'
  },
  {
      $group: {
          _id: '$brand._id',
          name: { $first: '$brand.name' },
          popularity: { $sum: '$popularity' } 
      }
  },
  {
      $project: {
          _id: 0,
          name: 1,
          popularity: 1
      }
  }
]).sort({popularity:-1}).limit(5)
  console.log(categories)
  res.render('admin/dashboard', {products,categories,brands,title, message: '' ,layout:'admin/layout'});
  console.log("Admin Dashboard rendered")  
  
}



const monthlyChart = async (req, res) => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  // Construct the date range query
  const orders = await Order.aggregate([
      {
          $match: {
              createdAt: { $gte: twelveMonthsAgo } // Orders within the last 12 months
          }
      },
      {
          $group: {
              _id: { $dateToString: { format: "%m-%Y", date: "$createdAt" } },
              totalAmount: { $sum: "$total" } // Sum of total amount for each month
          }
      },
      {
          $sort: { "_id": 1 } // Sort by date in ascending order
      }
  ]);

  // Convert string months back to actual dates for proper sorting
  const sortedOrders = orders.map(order => ({
      ...order,
      _id: new Date(order._id.split('-').reverse().join('-') + '-01T00:00:00') // Convert string month to actual date with first day of the month and 00:00:00 time
  })).sort((a, b) => a._id - b._id);

  // Extracting x-axis (months) and y-axis (total values) data
  const val = sortedOrders.map(order => order.totalAmount);
  const xaxis = sortedOrders.map(order => order._id.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })); // Format month as "January 2023"

  return res.status(200).json({ val, xaxis });
};



const dailyChart = async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Construct the date range query
  const orders = await Order.aggregate([
      {
          $match: {
              createdAt: { $gte: thirtyDaysAgo } // Orders within the last 30 days
          }
      },
      {
          $group: {
              _id: { $dateToString: { format: "%d-%m-%Y", date: "$createdAt" } },
              totalAmount: { $sum: "$total" } // Sum of total amount for each day
          }
      },
      {
          $sort: { "_id": 1 } // Sort by date in ascending order
      }
  ]);

  // Convert string dates back to actual dates for proper sorting
  const sortedOrders = orders.map(order => ({
      ...order,
      _id: new Date(order._id.split('-').reverse().join('-') + 'T00:00:00') // Convert string date to actual date with 00:00:00 time
  })).sort((a, b) => a._id - b._id);

  // Extracting x-axis (dates) and y-axis (total values) data
  const val = sortedOrders.map(order => order.totalAmount);
  const xaxis = sortedOrders.map(order => order._id.toLocaleDateString('en-GB')); // Format date as dd-mm-yyyy

  return res.status(200).json({ val, xaxis });
};



const admin_user_list_get=async (req,res)=>{
  
  
  try {
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
  adminDashboard,
  admin_user_list_get,
  admin_user_details_get,
  admin_user_details_post,
  admin_page_not_found,
  admin_logout,
  home_get,
  home_post,
  signInLoad,
  signInAction,
  create_account_get,
  create_account_post,
  otp_get,
  otp_resend,
  otp_check,
  otp_success,
  search_post,
  page_not_found,
  user_logout,
  userDashboard,
  profileLoad,
  settingsLoad,
  settingsSave,
  forgotPassword,
  forgotPasswordForm,
  newPassword,
  newPasswordForm,
  monthlyChart,
  dailyChart

    
}