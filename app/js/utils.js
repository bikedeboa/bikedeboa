var BIKE = BIKE || {};

BIKE.getMarkersFromLocalStorage = () => {
  return JSON.parse( localStorage.getItem('markers') );
}

BIKE.saveMarkersToLocalStorage = markersToSave => {
  localStorage.setItem( 'markers', JSON.stringify(markersToSave) );
}

BIKE.getURLParameter = function(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
};

BIKE.geocodeLatLng = function(lat, lng, successCB, failCB) {
  const latlng = {lat: parseFloat(lat), lng: parseFloat(lng)};

  geocoder.geocode({'location': latlng}, function(results, status) {
    if (status === google.maps.GeocoderStatus.OK) {
      // console.log('geocoding results', results);
      
      if (results[0]) {
        if (successCB && typeof successCB === 'function') {
          successCB(results[0].formatted_address);
        }
      } else {
        console.error('No results found');
      }
    } else {
      console.error('Geocoder failed due to: ' + status);
      if (failCB && typeof failCB === 'function') {
        failCB();
      }
    }
  });
};

window.toggleSpinner = function () {
  $('#spinnerOverlay').fadeToggle();
};

window.showSpinner = function (label, callback) {
  console.log('showspinner');
  if (label) {
    $('#globalSpinnerLabel').html(label);
  }
  $('#spinnerOverlay').velocity('transition.fadeIn', {complete: () => {
    if (callback && typeof callback === 'function') {
      callback();
    }
  }});
};

window.hideSpinner = function (callback) {
  $('#spinnerOverlay').velocity('transition.fadeOut', {duration: 400, complete: () => {
    $('#globalSpinnerLabel').html('');

    if (callback && typeof callback === 'function') {
      callback();
    }
  }});
};

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
    var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || safari.pushNotification);

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
        "Don't know";
};