var express = require('express');
var User = require('../models/user');
var router = express.Router();
var passport = require('passport');
var authenticate = require('../authenticate');
var generateApiKey = require('generate-api-key').default;
var cors = require('./cors');


/* GET users listing. */
router.options('*', cors.corsWithOptions, (req,res)=> {res.statusCode=200});
router.get('/', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, function(req, res, next) {
    User.find({})
    .then((users)=>{
      res.statusCode=200;
      res.setHeader('Content-type','application/json');
      res.json(users);
    },(err)=>next(err))
    .catch((err)=>next(err));
});

router.post('/signup', cors.corsWithOptions, function (req, res, next) {
  User.register(new User({
    username: req.body.username,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    isKeyGenerated: false
  }), req.body.password, (err, user) => {
    if (err) {
      res.statusCode = 200;
      res.setHeader('Content-type', 'application/json');
      res.json({ err: err });
    }
    else {
      user.save((err, user) => {
        if (err) {
          res.statusCode = 500;
          res.setHeader('Content-type', 'application/json');
          res.json({ err: err });
          return;
        }
        passport.authenticate('local')(req, res, () => {
        
          res.statusCode = 200;
          res.setHeader('Content-type', 'application/json');
          res.json({ status: 'Registration successfull', success: true });
        });
      });
    }
  });
});

router.post('/login',cors.corsWithOptions, (req, res, next)=>{

  passport.authenticate('local', (err, user, info) =>{
    if(err)
      return next(err);

    if(!user) {
      res.statusCode=401;
      res.setHeader('Content-type','application/json');
      res.json({success: false, status: 'Login Unsuccesfull', err:info});
    }

    req.logIn(user, (err)=>{
      console.log(user);
      if(err){
        console.log(err);
        res.statusCode=401;
        res.setHeader('Content-type','application/json');
        res.json({success: false, status: 'Login Unsuccesfullss', err:info});
        return res;
      }

      var token = authenticate.getToken({_id: user._id});
      res.statusCode=200;
      res.setHeader('Content-type','application/json');
      res.json({status: 'Succesully logged in !!',success: true, token: token});
      return res;
    });
  }) (req,res,next);
});

router.get('/logout',cors.corsWithOptions, (req, res, next) => {
  if (req.session) {
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/');
  }
  else {
    var err = new Error('You are not logged in!');
    err.status = 403;
    next(err);
  }
});

router.get('/checkJWTToken', cors.corsWithOptions, (req,res)=>{
  passport.authenticate('jwt', {session: false}, (err,user,info)=>{
    if(err) return next(err);

    if(!user){
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.json({status: 'JWT Invalid', success: false, err:info});
    }
    else{
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json({status: 'JWT valid', success: true, err:info});
    }
  }) (req,res);
});

router.post('/generateAPIKey', cors.corsWithOptions, (req,res)=>{
    User.findOne({username: req.body.username}, (err,user)=>{
      if(err){
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.json({err:err});
        return res;
      }

      if(!user){
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.json({status: 'User not found', success: false});
      }
      else if(user.isKeyGenerated){
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.json({status: 'API Key already generated', success: false});
      }
      else{
        user.APIKey = generateApiKey({ method: 'string', length: 24 });
        user.APISecret = generateApiKey({ method: 'string', length: 36 });
        user.isKeyGenerated = true;
        user.save((err,user)=>{
          if(err) return next(err);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({status: 'API Key generated', success: true, apiKey: user.apiKey});
        });
      }
    });
});


module.exports = router;