const express = require('express');
const secure = require('express-force-https');
const router = express.Router();
const path = __dirname + '/';
const compression = require('compression');
const exphbs  = require('express-handlebars');
const request = require('request');
// var fs = require("fs");

// Imported from globals
// @todo: import this properly to avoid code duplication
function createMapFromArrays(a, b) {var ret = {}; a.forEach( (val, i) => {ret[val] = b[i]; }); return ret; } var STRUCTURE_NAMES = ['U Invertido', 'De Roda', 'Trave', 'Suspenso', 'Grade', 'Outro'];
var STRUCTURE_NAMES = ['U Invertido', 'De Roda', 'Trave', 'Suspenso', 'Grade', 'Outro', 'Pescocinho', 'Paliteiro', 'Tipo M', 'Pente'];
var STRUCTURE_CODES = ['uinvertido', 'deroda', 'trave', 'suspenso', 'grade', 'other', 'pescocinho', 'paliteiro', 'm', 'pente'];
const STRUCTURE_NAME_TO_CODE = createMapFromArrays(STRUCTURE_NAMES, STRUCTURE_CODES);
const STRUCTURE_CODE_TO_NAME = createMapFromArrays(STRUCTURE_CODES, STRUCTURE_NAMES);

// Original gist: https://gist.github.com/mathewbyrne/1280286
function removeAccents(string) {  
  const characterMap = {"À": "A", "Á": "A", "Â": "A", "Ã": "A", "Ä": "A", "Å": "A", "Ấ": "A", "Ắ": "A", "Ẳ": "A", "Ẵ": "A", "Ặ": "A", "Æ": "AE", "Ầ": "A", "Ằ": "A", "Ȃ": "A", "Ç": "C", "Ḉ": "C", "È": "E", "É": "E", "Ê": "E", "Ë": "E", "Ế": "E", "Ḗ": "E", "Ề": "E", "Ḕ": "E", "Ḝ": "E", "Ȇ": "E", "Ì": "I", "Í": "I", "Î": "I", "Ï": "I", "Ḯ": "I", "Ȋ": "I", "Ð": "D", "Ñ": "N", "Ò": "O", "Ó": "O", "Ô": "O", "Õ": "O", "Ö": "O", "Ø": "O", "Ố": "O", "Ṍ": "O", "Ṓ": "O", "Ȏ": "O", "Ù": "U", "Ú": "U", "Û": "U", "Ü": "U", "Ý": "Y", "ß": "s", "à": "a", "á": "a", "â": "a", "ã": "a", "ä": "a", "å": "a", "ấ": "a", "ắ": "a", "ẳ": "a", "ẵ": "a", "ặ": "a", "æ": "ae", "ầ": "a", "ằ": "a", "ȃ": "a", "ç": "c", "ḉ": "c", "è": "e", "é": "e", "ê": "e", "ë": "e", "ế": "e", "ḗ": "e", "ề": "e", "ḕ": "e", "ḝ": "e", "ȇ": "e", "ì": "i", "í": "i", "î": "i", "ï": "i", "ḯ": "i", "ȋ": "i", "ð": "d", "ñ": "n", "ò": "o", "ó": "o", "ô": "o", "õ": "o", "ö": "o", "ø": "o", "ố": "o", "ṍ": "o", "ṓ": "o", "ȏ": "o", "ù": "u", "ú": "u", "û": "u", "ü": "u", "ý": "y", "ÿ": "y", "Ā": "A", "ā": "a", "Ă": "A", "ă": "a", "Ą": "A", "ą": "a", "Ć": "C", "ć": "c", "Ĉ": "C", "ĉ": "c", "Ċ": "C", "ċ": "c", "Č": "C", "č": "c", "C̆": "C", "c̆": "c", "Ď": "D", "ď": "d", "Đ": "D", "đ": "d", "Ē": "E", "ē": "e", "Ĕ": "E", "ĕ": "e", "Ė": "E", "ė": "e", "Ę": "E", "ę": "e", "Ě": "E", "ě": "e", "Ĝ": "G", "Ǵ": "G", "ĝ": "g", "ǵ": "g", "Ğ": "G", "ğ": "g", "Ġ": "G", "ġ": "g", "Ģ": "G", "ģ": "g", "Ĥ": "H", "ĥ": "h", "Ħ": "H", "ħ": "h", "Ḫ": "H", "ḫ": "h", "Ĩ": "I", "ĩ": "i", "Ī": "I", "ī": "i", "Ĭ": "I", "ĭ": "i", "Į": "I", "į": "i", "İ": "I", "ı": "i", "Ĳ": "IJ", "ĳ": "ij", "Ĵ": "J", "ĵ": "j", "Ķ": "K", "ķ": "k", "Ḱ": "K", "ḱ": "k", "K̆": "K", "k̆": "k", "Ĺ": "L", "ĺ": "l", "Ļ": "L", "ļ": "l", "Ľ": "L", "ľ": "l", "Ŀ": "L", "ŀ": "l", "Ł": "l", "ł": "l", "Ḿ": "M", "ḿ": "m", "M̆": "M", "m̆": "m", "Ń": "N", "ń": "n", "Ņ": "N", "ņ": "n", "Ň": "N", "ň": "n", "ŉ": "n", "N̆": "N", "n̆": "n", "Ō": "O", "ō": "o", "Ŏ": "O", "ŏ": "o", "Ő": "O", "ő": "o", "Œ": "OE", "œ": "oe", "P̆": "P", "p̆": "p", "Ŕ": "R", "ŕ": "r", "Ŗ": "R", "ŗ": "r", "Ř": "R", "ř": "r", "R̆": "R", "r̆": "r", "Ȓ": "R", "ȓ": "r", "Ś": "S", "ś": "s", "Ŝ": "S", "ŝ": "s", "Ş": "S", "Ș": "S", "ș": "s", "ş": "s", "Š": "S", "š": "s", "Ţ": "T", "ţ": "t", "ț": "t", "Ț": "T", "Ť": "T", "ť": "t", "Ŧ": "T", "ŧ": "t", "T̆": "T", "t̆": "t", "Ũ": "U", "ũ": "u", "Ū": "U", "ū": "u", "Ŭ": "U", "ŭ": "u", "Ů": "U", "ů": "u", "Ű": "U", "ű": "u", "Ų": "U", "ų": "u", "Ȗ": "U", "ȗ": "u", "V̆": "V", "v̆": "v", "Ŵ": "W", "ŵ": "w", "Ẃ": "W", "ẃ": "w", "X̆": "X", "x̆": "x", "Ŷ": "Y", "ŷ": "y", "Ÿ": "Y", "Y̆": "Y", "y̆": "y", "Ź": "Z", "ź": "z", "Ż": "Z", "ż": "z", "Ž": "Z", "ž": "z", "ſ": "s", "ƒ": "f", "Ơ": "O", "ơ": "o", "Ư": "U", "ư": "u", "Ǎ": "A", "ǎ": "a", "Ǐ": "I", "ǐ": "i", "Ǒ": "O", "ǒ": "o", "Ǔ": "U", "ǔ": "u", "Ǖ": "U", "ǖ": "u", "Ǘ": "U", "ǘ": "u", "Ǚ": "U", "ǚ": "u", "Ǜ": "U", "ǜ": "u", "Ứ": "U", "ứ": "u", "Ṹ": "U", "ṹ": "u", "Ǻ": "A", "ǻ": "a", "Ǽ": "AE", "ǽ": "ae", "Ǿ": "O", "ǿ": "o", "Þ": "TH", "þ": "th", "Ṕ": "P", "ṕ": "p", "Ṥ": "S", "ṥ": "s", "X́": "X", "x́": "x", "Ѓ": "Г", "ѓ": "г", "Ќ": "К", "ќ": "к", "A̋": "A", "a̋": "a", "E̋": "E", "e̋": "e", "I̋": "I", "i̋": "i", "Ǹ": "N", "ǹ": "n", "Ồ": "O", "ồ": "o", "Ṑ": "O", "ṑ": "o", "Ừ": "U", "ừ": "u", "Ẁ": "W", "ẁ": "w", "Ỳ": "Y", "ỳ": "y", "Ȁ": "A", "ȁ": "a", "Ȅ": "E", "ȅ": "e", "Ȉ": "I", "ȉ": "i", "Ȍ": "O", "ȍ": "o", "Ȑ": "R", "ȑ": "r", "Ȕ": "U", "ȕ": "u", "B̌": "B", "b̌": "b", "Č̣": "C", "č̣": "c", "Ê̌": "E", "ê̌": "e", "F̌": "F", "f̌": "f", "Ǧ": "G", "ǧ": "g", "Ȟ": "H", "ȟ": "h", "J̌": "J", "ǰ": "j", "Ǩ": "K", "ǩ": "k", "M̌": "M", "m̌": "m", "P̌": "P", "p̌": "p", "Q̌": "Q", "q̌": "q", "Ř̩": "R", "ř̩": "r", "Ṧ": "S", "ṧ": "s", "V̌": "V", "v̌": "v", "W̌": "W", "w̌": "w", "X̌": "X", "x̌": "x", "Y̌": "Y", "y̌": "y", "A̧": "A", "a̧": "a", "B̧": "B", "b̧": "b", "Ḑ": "D", "ḑ": "d", "Ȩ": "E", "ȩ": "e", "Ɛ̧": "E", "ɛ̧": "e", "Ḩ": "H", "ḩ": "h", "I̧": "I", "i̧": "i", "Ɨ̧": "I", "ɨ̧": "i", "M̧": "M", "m̧": "m", "O̧": "O", "o̧": "o", "Q̧": "Q", "q̧": "q", "U̧": "U", "u̧": "u", "X̧": "X", "x̧": "x", "Z̧": "Z", "z̧": "z", }
  let accentsRegex;
  let accentList = [];
  for (let accented in characterMap) {
    accentList.push(accented);
  }
  accentsRegex = new RegExp('(' + accentList.join('|') + ')', 'g');

  string = string.replace(accentsRegex, function(match) {
    return characterMap[match];
  });

  return string;
}

function slugify(text) {
  if (text && text.length > 0) {
    text = removeAccents(text);
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start of text
      .replace(/-+$/, '');            // Trim - from end of text
  } else {
    return '';
  }
}


////////////////////////////////////////////////////////////////////////////////

var app = express();
app.engine('handlebars', exphbs({ defaultLayout: 'app' }));

app.set('view engine', 'handlebars');


// Automatically redirects to HTTPS
app.use(secure);

// GZIP
app.use(compression());

// Static libs
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
  res.sendFile(path + 'io.html');
});

// Our data Dashboard
router.get('/dados',function(req,res) {
  res.sendFile(path + 'dashboard.html');
});

// SEO server-side rendering Social Network Crawler Bots.
// Request the API for details of a pin and delivers a simple HTML page with only SEO metatags.
router.get('/b/*',function(req,res) {
  // Default fallback response if anything fails
  function fallback() {
    // res.sendFile(path + 'index.html');
    
    res.render('default');
  }

  // URL is of the format "/b/1148-cafe-agridoce"
  var url = req.url;
  var regex = /\/b\/(\d*)/;
  // ID should be just the numerical part of the URL
  var id = regex.exec(url)[1];

  if (id && id.length > 0) {
    request('<DATABASE_URL>/local/' + id, function (error, response, body) {
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
          
          if (obj.text) {
            // Reconstruct the URL with the correct title
            data.canonicalUrl = 'https://www.bikedeboa.com.br/b/' + obj.id;
            // if (obj.text) {
              data.canonicalUrl += '-' + slugify(obj.text);
            // }
          }
          
          console.log(data.canonicalUrl);

          // Test user agent for known social network bots
          var userAgent = req.headers['user-agent'];
          if (userAgent && userAgent.startsWith('facebookexternalhit/1.1') || userAgent === 'Facebot' || userAgent.startsWith('Twitterbot')) {
            res.render('seo_optimized_head', data);
          } else {
            res.render('default', data);
          }
        } else {
          fallback();
        }
      } else {
        fallback();
      }
    });
  } else {
    fallback();
  }
  // } else {
  //   fallback();
  // }
});


// Home
router.get('/*',function(req,res) {
  // res.sendFile(path + 'index.html');
  var data = {};
  data.google_verification_id = "<GOOGLE_DOMAIN_ID>";
  res.render('default', data);
});

app.use('/',router);

// 404
app.use('*',function(req,res){
  res.sendFile(path + '404.html');
});

var port = process.env.PORT || 5000;
app.listen(port, function(){
  console.log('Live at http://localhost:' + port);
});
