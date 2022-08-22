require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
var passport = require('passport');
const {
    handleSend,
    // handleForward,
    handleTrack
} = require('./routes');
var usersRouter = require('./routes/users');
const config = require('./config');
const session = require('express-session');
const { authAPI } = require('./authenticate');
// const { generateKeyPair } = require('crypto');

const url = config.mongoUrl;
const connect = mongoose.connect(url);

connect.then((db) =>{
  console.log(' Connected to server'+db);
}, (err) => {console.log(err);});

const app = express();

const corsOption = {
    origin: '*',
    optionSuccessStatus: 200,
};

const httpServer = http.createServer(app);

app.use(cors(corsOption));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true, parameterList: 5000 }));

// app.get('/', (req, res) => {
//     res.status(200).send('Welcome to SAEWF');
// });
// app.get('/generateKey', generateKeyPair);
// app.use(authenticateCustomer);

app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: '1234567890' 
}));
app.use(passport.initialize());
app.use(passport.session());
// passport.use(new LocalStrategy({
//     session: false
// }));
// app.use(passport.session());

app.use('/users', usersRouter);
app.use(authAPI);
app.use('/send', handleSend);
// app.use('/forward', handleForward);
app.use('/track', handleTrack);

const port = process.env.PORT || 8080;

httpServer.listen(port, () => {
    console.log('http server is running at ', port);
});
