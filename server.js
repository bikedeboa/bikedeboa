var express = require('express');
var secure = require('express-force-https');
var router = express.Router();
var path = __dirname + '/';
var compression = require('compression');
var exphbs  = require('express-handlebars');
var fs = require("fs");
var request = require('request');

// Imported from globals
function createMapFromArrays(a, b) {var ret = {}; a.forEach( (val, i) => {ret[val] = b[i]; }); return ret; } var STRUCTURE_NAMES = ['U Invertido', 'De Roda', 'Trave', 'Suspenso', 'Grade', 'Outro'];
var STRUCTURE_NAMES = ['U Invertido', 'De Roda', 'Trave', 'Suspenso', 'Grade', 'Outro'];
var STRUCTURE_CODES = ['uinvertido', 'deroda', 'trave', 'suspenso', 'grade', 'other'];
var STRUCTURE_NAME_TO_CODE = createMapFromArrays(STRUCTURE_NAMES, STRUCTURE_CODES);
var STRUCTURE_CODE_TO_NAME = createMapFromArrays(STRUCTURE_CODES, STRUCTURE_NAMES);


var app = express();
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');


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

// Google IO Presentation Redirect
router.get('/io',function(req,res){
  // res.redirect('https://drive.google.com/open?id=18DyziybC2Benf43OMAd5T7611QULd9oWA1L60rzvrsM');
  res.sendFile(path + 'dist/io.html');
});

// SEO server-side rendering Social Network Crawler Bots.
// Request the API for details of a pin and delivers a simple HTML page with only SEO metatags.
router.get('/b/*',function(req,res) {
  // Default fallback response if anything fails
  function defaultResponse() {
    res.sendFile(path + 'dist/index.html');
  }

  // Test user agent for known social network bots
  var userAgent = req.headers['user-agent'];
  if (userAgent && userAgent.startsWith('facebookexternalhit/1.1') || userAgent === 'Facebot' || userAgent.startsWith('Twitterbot')) {
    // URL is of the format "/b/1148-cafe-agridoce"
    var url = req.url;
    var regex = /\/b\/(\d*)/;
    // ID should be just the numerical part of the URL
    var id = regex.exec(url)[1];

    if (id && id.length > 0) {
      request('https://bdb-api.herokuapp.com/local/' + id, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var obj = JSON.parse(body);

          if (obj) {
            // Build data to feed the template
            var data = {};
            data.title = obj.text;
            data.photo = obj.photo;
            data.address = obj.address;
            data.access = obj.isPublic ? 'público' : 'privado';
            data.type = STRUCTURE_CODE_TO_NAME[obj.structureType];
            data.redirectUrl = url;

            // Render template
            res.render('seo', data);
          } else {
            defaultResponse();
          }
        } else {
          defaultResponse();
        }
      });
    } else {
      defaultResponse();
    }
  } else {
    defaultResponse();
  }
});

// Home
router.get('/*',function(req,res) {
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
