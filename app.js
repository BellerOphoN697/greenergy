const express = require('express');
const app = express();
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const createError = require('http-errors');
const mongoose = require("mongoose");


require('dotenv').config();
mongoose.connect('mongodb://127.0.0.1:27017/greenergy');

const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');
const adminRouter=require('./routes/admin')
const productRouter=require('./routes/product')


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views/assets')));


app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));


app.use('/admin',adminRouter);
//app.use('/', indexRouter);
//app.use('/user', userRouter);
app.use('/', userRouter);
//app.use('/product', productRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
app.listen(3000,()=>{
  console.log("Server running in http://localhost:3000")
})

module.exports = app;
