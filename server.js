var express = require("express");
var app = express();
var router = express.Router();
var path = __dirname + '/views/';

// Static libs
app.use(express.static('public'));
app.use(express.static('lib'));

router.use(function (req,res,next) {
  console.log("/" + req.method);
  next();
});

// Home
router.get("/",function(req,res){
  res.sendFile(path + "index.html");
});

app.use("/",router);

// 404
app.use("*",function(req,res){
  res.sendFile(path + "404.html");
});

app.listen((process.env.PORT || 5000), function(){
  console.log("Live at Port " + (process.env.PORT || 5000));
});
