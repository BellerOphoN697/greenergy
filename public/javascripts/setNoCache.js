function setNoCache(req, res, next) {
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
    });
    if(req.url!='/sign-in' &&  req.url!='/'){
      req.session.redirect=req.url
    }
    next();
  }
module.exports=setNoCache