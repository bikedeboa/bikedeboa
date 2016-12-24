var BIKE = BIKE || {};

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