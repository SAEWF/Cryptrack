var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken');

var config = require('./config');

//user auth can also be written self or use readymade
exports.local = passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

exports.getToken = function(user) {
    return jwt.sign(user, config.secretKey,
        {expiresIn: 3600*30});
};


var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(new JwtStrategy(opts,
    (jwt_payload, done)=>{
        console.log("JWT Payload: ", jwt_payload);
        User.findOne({_id: jwt_payload._id}, (err,user)=>{
            if(err) return done(err, false);
            else if(user) return done(null,user);
            else return done(null,false);
        });
    }));

exports.verifyUser = passport.authenticate('jwt', {session: false});

exports.verifyAdmin = function (req, res, next) {
    if (req.user.admin) {
        next();
    }
    else {
        var err = new Error("You are not authorized to perform this operation!");
        err.status = 403;
        return next(err);
    }
}

exports.authAPI = async function (req, res, next) {
    try {
        const { apikey, apisecret, username } = req.headers;
        if (!apikey || !apisecret) {
            var err = new Error("Please Provide a valid API key or API secret!");
            err.status = 403;
            return next(err);
        }
        const user = await User.findOne({ username: username });
        if (user.APIKey === apikey && user.APISecret === apisecret) {
            next();
        }
        else {
            console.log('error');
            var err = new Error("Invalid API Key or API Secret!");
            err.status = 403;
            return next(err);
        }
    } catch (err) {
        var err = new Error("You are not authorized to perform this operation!");
        err.status = 403;
        return next(err);
    }
}
