var express = require('express');
var app = express();
var router = express.Router();
var path = __dirname;
var compression = require('compression');

// GZIP!!!!!
app.use(compression());

// Static libs
app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use(express.static('public'));
app.use(express.static('assets'));
app.use(express.static('dist'));

// Automatically redirect HTTP to HTTPS
app.get('*',function(req,res,next){
  // console.log(req.headers.host.split(':')[0]);
  if (req.headers.host.split(':')[0] !== 'localhost' && req.headers['x-forwarded-proto']!='https') {
    res.redirect('https://www.bikedeboa.com.br' + req.url);
  } else
  next(); /* Continue to other routes if we're not redirecting */
});

router.use(function (req,res,next) {
  console.log('/' + req.method);
  next();
});

// Home
router.get('/*',function(req,res){
  res.sendFile('index.html');
});

app.use('/',router);

// 404
app.use('*',function(req,res){
  res.sendFile('404.html');
});

var port = process.env.PORT || 5000;
app.listen(port, function(){
  console.log('Live at http://localhost:' + port);
});
