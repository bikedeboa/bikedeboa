var express = require('express');
var secure = require('express-force-https');
var app = express();
var router = express.Router();
var path = __dirname + '/';
var compression = require('compression');

// Automatically redirects to HTTPS
app.use(secure);

// GZIP!!!!!
app.use(compression());

// Static libs
app.use('/bower_components', express.static(path + 'bower_components'));
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
router.get('/io',function(req,res){
  res.redirect('https://drive.google.com/open?id=18DyziybC2Benf43OMAd5T7611QULd9oWA1L60rzvrsM');
});

// Home
router.get('/*',function(req,res){
  res.sendFile(path + 'dist/index.html');
});

app.use('/',router);

// 404
app.use('*',function(req,res){
  res.sendFile(path + 'dist/404.html');
});

var port = process.env.PORT || 5000;
app.listen(port, function(){
  console.log('Live at http://localhost:' + port);
});
