var BDB = BDB || {};

BDB.Geolocation = (function(){
  let portoAlegreCenter = { latitude: -30.0346, longitude: -51.2177 };
  let currentPosition = portoAlegreCenter;
  let positionWatcher;
  let geocoder;

  let setCurrentPosition = function(position){
    let newstring = JSON.stringify(position,[
      'latitude',
      'longitude'])
    //other attributes the coords may have.
    /*'accuracy',
            'heading', 
            'altitude', 
            'speed', 
            'altitudeAccuracy']);*/
    currentPosition = position;
    localStorage.setItem("BDB.LatestPosition", newstring);
  };
    
  let getFromLocalStorage = function(){
    let stringPos = localStorage.getItem("BDB.LatestPosition");
    let pos = JSON.parse(stringPos);
    if (pos && typeof pos === 'object'){
      currentPosition = pos;
      return true;
    } else {
      return false;
    }
  };
    
  let geolocate = function(param = {}){
    // set default options to geolocate
    let defaults = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 500
    };

    let settings = Object.assign({}, defaults, param);

    let result = {
      status : false,
      center : false,
      response : {}
    }

    let Location = new Promise(function(resolve,reject){
      if (positionWatcher){
        result.status = true;
        result.center = true;
        result.response = currentPosition;
        resolve(result);
      } else {
        if (navigator.geolocation) {
          clearGeoWatch();
          navigator.geolocation.getCurrentPosition(
            position => {
              result.status = true;
              result.center = true;
              result.response = position.coords;
              setCurrentPosition(result.response);
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
    });

    Location.then(geolocateDone, geolocateDone);

    return Location;
  };
  let geolocateDone = function(response){
    let event = new CustomEvent('geolocation:done', {detail: response});
    document.dispatchEvent(event);
  };
  let geoWatch = function(options){
    positionWatcher = navigator.geolocation.watchPosition(function(position){
      let result = {
        status: true,
        center: false,
        response : position.coords
      };
      setCurrentPosition(position.coords);
      geolocateDone(result);
    },function(error){
      let result = {
        status: false,
        center: false,
        response : error
      };
      geolocateDone(result);
    }, null, options);
  };
  let clearGeoWatch = function(){
    if (positionWatcher) {
      navigator.geolocation.clearWatch(positionWatcher);
    }
  }; 
  return {
    init: function () {
      return new Promise((resolve, reject) => {
        function next() {
          geocoder = new google.maps.Geocoder();
          resolve();
        }
  
        if (!window.google) { 
          BDB.Map.init()
            .then(next)
            .catch(next)
        } else {
          next(); 
        }
      });
    },
    getLastestLocation: function(){
      getFromLocalStorage();
      return currentPosition;
    },
    isDefaultLocation: function(){
      return !getFromLocalStorage();
    },
    getLocation : function(options = false){
      return geolocate(options);
    },
    forceLocation : function(coords){
      setCurrentPosition(coords);
    },
    checkPermission : function(){
      if (navigator.permissions) {
        return navigator.permissions.query({'name': 'geolocation'});
      } else {
        let fallback = new Promise(function(resolve,reject){
          reject(false);
        });
        return fallback;
      }
    },
    searchAdress: function(address) {
      return new Promise(function (resolve, reject) {
        geocoder.geocode({ 'address': address }, function (results, status) {
          if (status === 'OK') {
            resolve(results[0]);
          } else {
            reject();
          }
        });
      });
    },
    reverseGeocode: function(lat, lng) {
      return new Promise(function (resolve, reject) {
        const latlng = {lat: parseFloat(lat), lng: parseFloat(lng)};

        geocoder.geocode({'location': latlng}, function(results, status) {
          if (status === google.maps.GeocoderStatus.OK) {
            if (results[0]) {
              const r = results[0].address_components;
              const formattedAddress = `${r[1].short_name}, ${r[0].short_name} - ${r[3].short_name}`
              let city, state, country;

              r.forEach(address => {
                address.types.forEach(type => {
                  if (type === 'locality' || type === 'administrative_area_level_2') {
                    if (city && city != address.long_name) {
                      console.warn('reverseGeocode: conflicting city names:', city, address.long_name);
                    }  
                    city = address.long_name;
                  } else if (type === "administrative_area_level_1") {
                    if (state && state != address.long_name) {
                      console.warn('reverseGeocode: conflicting state names:', state, address.long_name);
                    }
                    state = address.long_name;
                  } else if (type === "country") {
                    if (country && country != address.long_name) {
                      console.warn('reverseGeocode: conflicting country names:', country, address.long_name);
                    }
                    country = address.long_name;
                  }
                })
              });

              resolve({
                address: formattedAddress,
                city: city,
                state: state,
                country: country
              });
            } else {
              console.error('No results found');
              reject();
            }
          } else {
            console.error('Geocoder failed due to: ' + status);
            reject(status);
          }
        });
      });
    },
    clearWatch : function(){
      clearGeoWatch();
    }
  }
})();