var BDB = BDB || {};

BDB.Geolocation = (function() {
  let positionWatcher;
  let geocoder;
  let currentPosition = false; 

  let persistLocation = function(position) {
    currentPosition = position;
    let newstring = JSON.stringify(position,[
      'latitude',
      'longitude'])
    //other attributes the coords may have.
    /*'accuracy',
            'heading', 
            'altitude', 
            'speed', 
            'altitudeAccuracy']);*/
    localStorage.setItem("BDB.LatestPosition", newstring);
  }; 
  
  let retrieveLocation = function() {
    let stringPos = localStorage.getItem("BDB.LatestPosition");
    let pos = JSON.parse(stringPos);
    if (pos && typeof pos === 'object') {
      currentPosition = pos;
      return currentPosition;
    } else {
      return false;
    }
  };
    
  let geolocate = function(param = {}) {
    // set default options to geolocate
    let defaults = {
      enableHighAccuracy: true,
      // timeout: 10000, //dont think we need that, since it doesnt block the UI like before
      maximumAge: 500
    };

    let settings = Object.assign({}, defaults, param);

    let result = {
      success : false,
      center : false,
      response : {}
    }

    return new Promise(function(resolve,reject) {
      if (positionWatcher) {
        result.success = true;
        result.center = true;
        result.response = currentPosition;
        resolve(result);
      } else {
        if (navigator.geolocation) {
          clearGeoWatch();
          navigator.geolocation.getCurrentPosition(
            position => {
              result.success = true;
              result.center = true;
              result.response = position.coords;
              persistLocation(result.response);
              geoWatch(settings);
              resolve(result);
            },
            error => {
              result.response = error;
              reject(result);
            },
            settings
          );
                    
        } else {
          let error = {code: 1}
          reject(error);
        }
      }
    }).then(geolocateDone)
      .catch(geolocateDone);
  };
  let geolocateDone = function(response) {
    let event = new CustomEvent('geolocation:done', {detail: response});
    document.dispatchEvent(event);
  };
  let geoWatch = function(options) {
    positionWatcher = navigator.geolocation.watchPosition(position => {
      let result = {
        success: true,
        center: false,
        response : position.coords
      };
      persistLocation(position.coords);
      geolocateDone(result);
    }, error => {
      let result = {
        success: false,
        center: false,
        response : error
      };
      geolocateDone(result);
    }, null, options);
  };
  let clearGeoWatch = function() {
    if (positionWatcher) {
      navigator.geolocation.clearWatch(positionWatcher);
    }
  }; 
  return {
    getLastestLocation: function() {
      return retrieveLocation();
    },
    getLocation : function(options = false) {
      return geolocate(options);
    },
    forceLocation : function(coords) {
      persistLocation(coords);
    },
    checkPermission : function() {
      if (navigator.permissions) {
        return navigator.permissions.query({'name': 'geolocation'});
      } else {
        let fallback = new Promise(function(resolve,reject) {
          reject(false);
        });
        return fallback;
      }
    },
    clearWatch : function() {
      clearGeoWatch();
    },
    getCurrentPosition: function() {
      return currentPosition;
    }
  }
})();