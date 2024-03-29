const cors = require('cors');

const whitelist = ['*'];

var corsOptionDelegate = (req,callback) =>{
    var corsOption;

    if(whitelist.indexOf(req.header('Origin'))!==-1){
        corsOption = {origin: true};
    }
    else corsOption = {orgin: false};

    callback(null,corsOption);
};

exports.cors = cors();
exports.corsWithOptions = cors(corsOptionDelegate);