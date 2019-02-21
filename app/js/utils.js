var BDB = BDB || {};

BDB.getMarkersFromLocalStorage = () => {
  const tmp = JSON.parse(localStorage.getItem('markers'));

  if (tmp) {
    for (let i = 0; i < tmp.length; i++) {
      tmp[i].gmarker = null;
    }
  }

  return tmp;
};

BDB.saveMarkersToLocalStorage = markersToSave => {
  // let tmp = markersToSave.map( m => {
  //   m.gmarker = null;
  //   return m;
  // });

  // localStorage.setItem( 'markers', JSON.stringify(tmp) );
};

BDB.getURLParameter = function(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
};

BDB.getThumbUrlFromPhotoUrl = function(url) {
  if (url) {
    return url.replace('images', 'images/thumbs'); 
  } else {
    return;
  }
}

window.createdAtToDaysAgo = createdAtStr => {
  const createdAtDate = Date.parse(createdAtStr);
  const msAgo = Date.now() - createdAtDate;

  const monthsAgo = Math.floor(msAgo/(1000*60*60*24*30));
  if (monthsAgo) {
    return `${monthsAgo} ${monthsAgo > 1 ? 'meses' : 'mês'}`;
  }
  
  const daysAgo = Math.floor(msAgo/(1000*60*60*24));
  if (daysAgo) {
    return `${daysAgo} dia${daysAgo > 1 ? 's' : ''}`;
  }

  const hoursAgo = Math.floor(msAgo/(1000*60*60));
  if (hoursAgo) {
    return `${hoursAgo} hora${hoursAgo > 1 ? 's' : ''}`;
  }

  const minsAgo = Math.floor(msAgo/(1000*60));
  if (minsAgo) {
    return `${minsAgo} minuto${minsAgo > 1 ? 's' : ''}`;
  }

  return 'agora há pouco';
};

window.toggleSpinner = () => {
  $('#spinnerOverlay').fadeToggle();
};

window.showSpinner = function (label, showProgress) {
  return new Promise((resolve, reject) => {
    console.debug('show spinner');
  
    $('#globalProgressBar').toggle(!!showProgress);
    if (showProgress) {
      updateSpinnerProgress(0);
    }
  
    if (label) {
      $('#globalSpinnerLabel').html(label);
    }
    $('#spinnerOverlay:hidden').velocity('transition.fadeIn', {complete: resolve});
  });
};

window.hideSpinner = callback => {
  console.debug('hide spinner');

  $('#spinnerOverlay').velocity('transition.fadeOut', {duration: 400, complete: () => {
    $('#globalSpinnerLabel').html('');

    if (callback && typeof callback === 'function') {
      callback();
    }
  }});
};

window.updateSpinnerProgress = (percentComplete) => {
  $('#globalProgressBar').attr('value', percentComplete*100);
};

window.requestFailHandler = () => {
  hideSpinner();
  toastr['warning']('Ops, algo deu errado :(');
  // swal('Ops', 'Algo deu errado. :/', 'error');
},

/**
 * Gets the browser name or returns an empty string if unknown. 
 * This function also caches the result to provide for any 
 * future calls this function has.
 * @returns {string}
 *
 * source: https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
 */
window.getBrowserName = () => {
  // Return cached result if avalible, else get result then cache it.
  if (getBrowserName.prototype._cachedResult)
    return getBrowserName.prototype._cachedResult;

  // Opera 8.0+
  var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

  // Firefox 1.0+
  var isFirefox = typeof InstallTrigger !== 'undefined';

  // Safari 3.0+ "[object HTMLElementConstructor]" 
  var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === '[object SafariRemoteNotification]'; })(!window['safari'] || safari.pushNotification);

  // Internet Explorer 6-11
  var isIE = /*@cc_on!@*/false || !!document.documentMode;

  // Edge 20+
  var isEdge = !isIE && !!window.StyleMedia;

  // Chrome 1+
  var isChrome = !!window.chrome && !!window.chrome.webstore;

  // Blink engine detection
  var isBlink = (isChrome || isOpera) && !!window.CSS;

  return getBrowserName.prototype._cachedResult =
        isOpera ? 'Opera' :
          isFirefox ? 'Firefox' :
            isSafari ? 'Safari' :
              isChrome ? 'Chrome' :
                isIE ? 'IE' :
                  isEdge ? 'Edge' :
                    'Don\'t know';
};

// Adapted from: https://github.com/tyxla/remove-accents
window.removeAccents = string => {  
  const characterMap = {'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Ấ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A', 'Æ': 'AE', 'Ầ': 'A', 'Ằ': 'A', 'Ȃ': 'A', 'Ç': 'C', 'Ḉ': 'C', 'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E', 'Ế': 'E', 'Ḗ': 'E', 'Ề': 'E', 'Ḕ': 'E', 'Ḝ': 'E', 'Ȇ': 'E', 'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I', 'Ḯ': 'I', 'Ȋ': 'I', 'Ð': 'D', 'Ñ': 'N', 'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O', 'Ø': 'O', 'Ố': 'O', 'Ṍ': 'O', 'Ṓ': 'O', 'Ȏ': 'O', 'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U', 'Ý': 'Y', 'ß': 's', 'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'ấ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a', 'æ': 'ae', 'ầ': 'a', 'ằ': 'a', 'ȃ': 'a', 'ç': 'c', 'ḉ': 'c', 'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e', 'ế': 'e', 'ḗ': 'e', 'ề': 'e', 'ḕ': 'e', 'ḝ': 'e', 'ȇ': 'e', 'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i', 'ḯ': 'i', 'ȋ': 'i', 'ð': 'd', 'ñ': 'n', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o', 'ố': 'o', 'ṍ': 'o', 'ṓ': 'o', 'ȏ': 'o', 'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u', 'ý': 'y', 'ÿ': 'y', 'Ā': 'A', 'ā': 'a', 'Ă': 'A', 'ă': 'a', 'Ą': 'A', 'ą': 'a', 'Ć': 'C', 'ć': 'c', 'Ĉ': 'C', 'ĉ': 'c', 'Ċ': 'C', 'ċ': 'c', 'Č': 'C', 'č': 'c', 'C̆': 'C', 'c̆': 'c', 'Ď': 'D', 'ď': 'd', 'Đ': 'D', 'đ': 'd', 'Ē': 'E', 'ē': 'e', 'Ĕ': 'E', 'ĕ': 'e', 'Ė': 'E', 'ė': 'e', 'Ę': 'E', 'ę': 'e', 'Ě': 'E', 'ě': 'e', 'Ĝ': 'G', 'Ǵ': 'G', 'ĝ': 'g', 'ǵ': 'g', 'Ğ': 'G', 'ğ': 'g', 'Ġ': 'G', 'ġ': 'g', 'Ģ': 'G', 'ģ': 'g', 'Ĥ': 'H', 'ĥ': 'h', 'Ħ': 'H', 'ħ': 'h', 'Ḫ': 'H', 'ḫ': 'h', 'Ĩ': 'I', 'ĩ': 'i', 'Ī': 'I', 'ī': 'i', 'Ĭ': 'I', 'ĭ': 'i', 'Į': 'I', 'į': 'i', 'İ': 'I', 'ı': 'i', 'Ĳ': 'IJ', 'ĳ': 'ij', 'Ĵ': 'J', 'ĵ': 'j', 'Ķ': 'K', 'ķ': 'k', 'Ḱ': 'K', 'ḱ': 'k', 'K̆': 'K', 'k̆': 'k', 'Ĺ': 'L', 'ĺ': 'l', 'Ļ': 'L', 'ļ': 'l', 'Ľ': 'L', 'ľ': 'l', 'Ŀ': 'L', 'ŀ': 'l', 'Ł': 'l', 'ł': 'l', 'Ḿ': 'M', 'ḿ': 'm', 'M̆': 'M', 'm̆': 'm', 'Ń': 'N', 'ń': 'n', 'Ņ': 'N', 'ņ': 'n', 'Ň': 'N', 'ň': 'n', 'ŉ': 'n', 'N̆': 'N', 'n̆': 'n', 'Ō': 'O', 'ō': 'o', 'Ŏ': 'O', 'ŏ': 'o', 'Ő': 'O', 'ő': 'o', 'Œ': 'OE', 'œ': 'oe', 'P̆': 'P', 'p̆': 'p', 'Ŕ': 'R', 'ŕ': 'r', 'Ŗ': 'R', 'ŗ': 'r', 'Ř': 'R', 'ř': 'r', 'R̆': 'R', 'r̆': 'r', 'Ȓ': 'R', 'ȓ': 'r', 'Ś': 'S', 'ś': 's', 'Ŝ': 'S', 'ŝ': 's', 'Ş': 'S', 'Ș': 'S', 'ș': 's', 'ş': 's', 'Š': 'S', 'š': 's', 'Ţ': 'T', 'ţ': 't', 'ț': 't', 'Ț': 'T', 'Ť': 'T', 'ť': 't', 'Ŧ': 'T', 'ŧ': 't', 'T̆': 'T', 't̆': 't', 'Ũ': 'U', 'ũ': 'u', 'Ū': 'U', 'ū': 'u', 'Ŭ': 'U', 'ŭ': 'u', 'Ů': 'U', 'ů': 'u', 'Ű': 'U', 'ű': 'u', 'Ų': 'U', 'ų': 'u', 'Ȗ': 'U', 'ȗ': 'u', 'V̆': 'V', 'v̆': 'v', 'Ŵ': 'W', 'ŵ': 'w', 'Ẃ': 'W', 'ẃ': 'w', 'X̆': 'X', 'x̆': 'x', 'Ŷ': 'Y', 'ŷ': 'y', 'Ÿ': 'Y', 'Y̆': 'Y', 'y̆': 'y', 'Ź': 'Z', 'ź': 'z', 'Ż': 'Z', 'ż': 'z', 'Ž': 'Z', 'ž': 'z', 'ſ': 's', 'ƒ': 'f', 'Ơ': 'O', 'ơ': 'o', 'Ư': 'U', 'ư': 'u', 'Ǎ': 'A', 'ǎ': 'a', 'Ǐ': 'I', 'ǐ': 'i', 'Ǒ': 'O', 'ǒ': 'o', 'Ǔ': 'U', 'ǔ': 'u', 'Ǖ': 'U', 'ǖ': 'u', 'Ǘ': 'U', 'ǘ': 'u', 'Ǚ': 'U', 'ǚ': 'u', 'Ǜ': 'U', 'ǜ': 'u', 'Ứ': 'U', 'ứ': 'u', 'Ṹ': 'U', 'ṹ': 'u', 'Ǻ': 'A', 'ǻ': 'a', 'Ǽ': 'AE', 'ǽ': 'ae', 'Ǿ': 'O', 'ǿ': 'o', 'Þ': 'TH', 'þ': 'th', 'Ṕ': 'P', 'ṕ': 'p', 'Ṥ': 'S', 'ṥ': 's', 'X́': 'X', 'x́': 'x', 'Ѓ': 'Г', 'ѓ': 'г', 'Ќ': 'К', 'ќ': 'к', 'A̋': 'A', 'a̋': 'a', 'E̋': 'E', 'e̋': 'e', 'I̋': 'I', 'i̋': 'i', 'Ǹ': 'N', 'ǹ': 'n', 'Ồ': 'O', 'ồ': 'o', 'Ṑ': 'O', 'ṑ': 'o', 'Ừ': 'U', 'ừ': 'u', 'Ẁ': 'W', 'ẁ': 'w', 'Ỳ': 'Y', 'ỳ': 'y', 'Ȁ': 'A', 'ȁ': 'a', 'Ȅ': 'E', 'ȅ': 'e', 'Ȉ': 'I', 'ȉ': 'i', 'Ȍ': 'O', 'ȍ': 'o', 'Ȑ': 'R', 'ȑ': 'r', 'Ȕ': 'U', 'ȕ': 'u', 'B̌': 'B', 'b̌': 'b', 'Č̣': 'C', 'č̣': 'c', 'Ê̌': 'E', 'ê̌': 'e', 'F̌': 'F', 'f̌': 'f', 'Ǧ': 'G', 'ǧ': 'g', 'Ȟ': 'H', 'ȟ': 'h', 'J̌': 'J', 'ǰ': 'j', 'Ǩ': 'K', 'ǩ': 'k', 'M̌': 'M', 'm̌': 'm', 'P̌': 'P', 'p̌': 'p', 'Q̌': 'Q', 'q̌': 'q', 'Ř̩': 'R', 'ř̩': 'r', 'Ṧ': 'S', 'ṧ': 's', 'V̌': 'V', 'v̌': 'v', 'W̌': 'W', 'w̌': 'w', 'X̌': 'X', 'x̌': 'x', 'Y̌': 'Y', 'y̌': 'y', 'A̧': 'A', 'a̧': 'a', 'B̧': 'B', 'b̧': 'b', 'Ḑ': 'D', 'ḑ': 'd', 'Ȩ': 'E', 'ȩ': 'e', 'Ɛ̧': 'E', 'ɛ̧': 'e', 'Ḩ': 'H', 'ḩ': 'h', 'I̧': 'I', 'i̧': 'i', 'Ɨ̧': 'I', 'ɨ̧': 'i', 'M̧': 'M', 'm̧': 'm', 'O̧': 'O', 'o̧': 'o', 'Q̧': 'Q', 'q̧': 'q', 'U̧': 'U', 'u̧': 'u', 'X̧': 'X', 'x̧': 'x', 'Z̧': 'Z', 'z̧': 'z', };
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
};

// Original gist: https://gist.github.com/mathewbyrne/1280286
window.slugify = text => {
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
};

// Thanks https://stackoverflow.com/questions/17772260/textarea-auto-height/24676492#24676492
window.autoGrowTextArea = function(element) {
  if (element) {
    element.style.height = '5px';
    element.style.height = (element.scrollHeight+20)+'px';
  }
};

window.performanceMeasureStart = function() {
  window.performanceT0 = performance.now();
}

window.performanceMeasureEnd = function() {
  if (!window.performanceT0) {
    console.error('[PERFORMANCE] ERROR: you should call performanceMeasureStart() first.');
    return;
  } else {
    const msPassed = performance.now() - window.performanceT0;
    
    console.log(`[PERFORMANCE] ${msPassed}ms elapsed`);
  
    window.performanceT0 = undefined;
  
    return msPassed;
  }
  
}

window.resizeImage = function (blob) {
  return new Promise((resolve, reject) => {
    let canvas = document.createElement('canvas');
    let img = new Image();
    // img.crossOrigin = 'anonymous';
    img.crossOrigin = 'https://www.bikedeboa.com.br';
  
    img.onload = () => {
      // Resize image fitting PHOTO_UPLOAD_MAX_W and PHOTO_UPLOAD_MAX_H
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > PHOTO_UPLOAD_MAX_W) {
          height *= PHOTO_UPLOAD_MAX_W / width;
          width = PHOTO_UPLOAD_MAX_W;
        }
      } else {
        if (height > PHOTO_UPLOAD_MAX_H) {
          width *= PHOTO_UPLOAD_MAX_H / height;
          height = PHOTO_UPLOAD_MAX_H;
        }
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
  
      const resizedBlob = canvas.toDataURL('image/jpeg', 0.8);
      resolve(resizedBlob);
    };

    img.onerror = () => {
      reject();
    };
  
    img.src = blob;
  });
};

window.formatAverage = function(avg) {
  if (avg) {
    avg = parseFloat(avg);
    if (avg.toFixed && avg !== Math.round(avg)) {
      avg = avg.toFixed(1);
    }
    avg = '' + avg;
  }

  return avg;
};

// https://stackoverflow.com/questions/22581345/click-button-copy-to-clipboard-using-jquery
window.copyToClipboard = function(elem) {
  // create hidden text element, if it doesn't already exist
  var targetId = '_hiddenCopyText_';
  var isInput = elem.tagName === 'INPUT' || elem.tagName === 'TEXTAREA';
  var origSelectionStart, origSelectionEnd;
  if (isInput) {
    // can just use the original source element for the selection and copy
    target = elem;
    origSelectionStart = elem.selectionStart;
    origSelectionEnd = elem.selectionEnd;
  } else {
    // must use a temporary form element for the selection and copy
    target = document.getElementById(targetId);
    if (!target) {
      var target = document.createElement('textarea');
      target.style.position = 'absolute';
      target.style.left = '-9999px';
      target.style.top = '0';
      target.id = targetId;
      document.body.appendChild(target);
    }
    target.textContent = elem.textContent;
  }
  // select the content
  var currentFocus = document.activeElement;
  target.focus();
  target.setSelectionRange(0, target.value.length);
    
  // copy the selection
  var succeed;
  try {
    succeed = document.execCommand('copy');
  } catch(e) {
    succeed = false;
  }
  // restore original focus
  if (currentFocus && typeof currentFocus.focus === 'function') {
    currentFocus.focus();
  }
    
  if (isInput) {
    // restore prior selection
    elem.setSelectionRange(origSelectionStart, origSelectionEnd);
  } else {
    // clear temporary content
    target.textContent = '';
  }
  return succeed;
};

window.getColorFromAverage = function(average) {
  if (typeof average === 'string') {
    average = parseFloat(average);
  }

  let color;
 
  if (average) {
    if (average === 0) {
      color = 'gray';
    } else if (average > 0 && average <= 2) {
      color = 'red';
    } else if (average > 2 && average < 3.5) {
      color = 'yellow';
    } else if (average >= 3.5) {
      color = 'green';
    } else {
      color = 'gray';
    }
  } else {
    color = false;
  }

  return color;
};


// Service Worker
window.swUpdateAvailableCallback = function() {
  // At this point, the old content will have been purged and the fresh content will
  // have been added to the cache.
  // It's the perfect time to display a "New content is available; please refresh."
  // message in the page's interface.
 
  if (BDB_ENV === 'beta' || BDB_ENV === 'localhost') {
    $('.hamburger-button, #logo').css({ filter: 'grayscale(100%)' });
  }  
}; 

window.swCachedCallback = function() {
  // At this point, everything has been precached.
  // It's the perfect time to display a "Content is cached for offline use." message.

  // toastr['success']('A partir de agora você pode explorar os bicicletários mesmo sem Internet.', 'Webapp salvo offline');
};


// Thanks https://stackoverflow.com/questions/365826/calculate-distance-between-2-gps-coordinates
function distanceInKmBetweenEarthCoordinates(lat1, lon1, lat2, lon2) {
  function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
  }

  var earthRadiusKm = 6371;

  var dLat = degreesToRadians(lat2 - lat1);
  var dLon = degreesToRadians(lon2 - lon1);

  lat1 = degreesToRadians(lat1);
  lat2 = degreesToRadians(lat2);

  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

//  https://developer.mozilla.org/en-US/docs/Web/API/Background_Tasks_API#Example
window.requestIdleCallback = window.requestIdleCallback || function (handler) {
  let startTime = Date.now();

  return setTimeout(function () {
    handler({
      didTimeout: false,
      timeRemaining: function () {
        return Math.max(0, 50.0 - (Date.now() - startTime));
      }
    });
  }, 1);
};


// Confettiful
// Production ready confetti generator, yo. By Jacob Gunnarsson.
// https://codepen.io/jacobgunnarsson/pen/pbPwga
const Confettiful = function(el) {
  this.el = el;
  this.containerEl = null;
  
  this.confettiFrequency = 4;
  this.confettiColors = ['#30bb6a', '#F6C913', '#FF8265', '#533FB4'];
  this.confettiAnimations = ['slow', 'medium', 'fast'];
  
  this._init();
  this._start();
};

Confettiful.prototype._init = function() {
  const containerEl = document.createElement('div');
  const elPosition = this.el.style.position;
  
  // if (elPosition !== 'relative' || elPosition !== 'absolute') {
  //   this.el.style.position = 'relative';
  // }
  
  containerEl.classList.add('confetti-container');
  
  this.el.appendChild(containerEl);
  
  this.containerEl = containerEl;
};

Confettiful.prototype._start = function() {
  this.confettiInterval = setInterval(() => {
    const confettiEl = document.createElement('div');
    const confettiSize = (Math.floor(Math.random() * 3) + 7) + 'px';
    const confettiBackground = this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)];
    const confettiLeft = (Math.floor(Math.random() * this.el.offsetWidth)) + 'px';
    const confettiAnimation = this.confettiAnimations[Math.floor(Math.random() * this.confettiAnimations.length)];
    
    confettiEl.classList.add('confetti', 'confetti--animation-' + confettiAnimation);
    confettiEl.style.left = confettiLeft;
    confettiEl.style.width = confettiSize;
    confettiEl.style.height = confettiSize;
    confettiEl.style.backgroundColor = confettiBackground;
    
    confettiEl.removeTimeout = setTimeout(function() {
      confettiEl.parentNode.removeChild(confettiEl);
    }, 3000);
    
    this.containerEl.appendChild(confettiEl);
  }, 25);
};
