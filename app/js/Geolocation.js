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
        }else{
            return false;
        }
    };
    
    let geolocate = function(param = false){
        // set default options to geolocate
        let options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 500
        };
        if (param && typeof param === 'object'){
            options.enableHighAccuracy = (param.enableHighAccuracy && typeof param.enableHighAccuracy === 'boolean') ?  param.enableHighAccuracy : options.enableHighAccuracy;
            options.timeout = (param.timeout && typeof param.timeout === 'number') ?  param.timeout : options.timeout;
            options.maximumAge = (param.maximumAge && typeof param.maximumAge === 'number') ?  param.maximumAge : options.maximumAge;
        }  

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
            }else{
                if (navigator.geolocation) {
                    clearGeoWatch();
                    navigator.geolocation.getCurrentPosition(
                        position => {
                            result.status = true;
                            result.center = true;
                            result.response = position.coords;
                            setCurrentPosition(result.response);
                            geoWatch(options);
                            resolve(result);
                        },
                        error => {
                            result.response = error;
                            reject(result);
                        },
                        options
                    );
                    
                }else{
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
            geocoder = new google.maps.Geocoder();
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
        checkPermission : function(){
            if (navigator.permissions) {
              return navigator.permissions.query({'name': 'geolocation'});
            }else{
                let fallback = new Promise(function(resolve,reject){
                      reject(false);
                  });
              return fallback;
            }

        },
        reverseGeocode : function(lat, lng, successCB, failCB) {
              const latlng = {lat: parseFloat(lat), lng: parseFloat(lng)};

              geocoder.geocode({'location': latlng}, function(results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                      if (results[0]) {
                        const r = results[0].address_components;
                        const address = `${r[1].short_name}, ${r[0].short_name} - ${r[3].short_name}`
                        if (successCB && typeof successCB === 'function') {
                              successCB(address);
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
        }
    }
})();