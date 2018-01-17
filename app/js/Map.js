var BDB = BDB || {};

BDB.Map = (function(){
  //google maps api Key
  const apiKey = '<GOOGLE_MAPS_ID>';

  let map, 
      mapBounds,
      geolocationMarker,
      geolocationRadius,
      geolocationInitialized,
      positionWatcher,
      bikeLayer;

  let initMap = function(coords, zoomValue = 15) {
    // Dynamically inject Google Map's lib
    $.getScript('https://maps.googleapis.com/maps/api/js?key=<GOOGLE_MAPS_ID>&libraries=places&language=pt-BR', () => {
        $.getScript('/lib/infobox.min.js', () => {
            initMap_continue(coords, zoomValue);
          }
        );
      }
    );
  };
  
  let initMap_continue = function(coords, zoomValue = 15) {
    let gpos = convertToGmaps(coords);
    map = new google.maps.Map(document.getElementById('map'), {
        center: gpos,
        zoom: zoomValue,
        disableDefaultUI: true,
        scaleControl: false,
        clickableIcons: false,
        styles: _gmapsCustomStyle,
        mapTypeControl: false,
        zoomControl: _isDesktop,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER
        }
    });
    setMarker(); 
    setRadius();
    updateMarkerPosition(gpos);

    setupAutocomplete();
    BDB.Geolocation.init();
    
    map.addListener('center_changed', mapCenterChanged);

    setMapBounds();
    mapCenterChanged();
     
    setInfoBox();

    //native Event Dispatcher 
    let event = new Event('map:ready');
    document.dispatchEvent(event);
  };

  let convertToGmaps = function(obj, convert = true){
    if (convert){
      let coords = {
        lat : obj.latitude,
        lng : obj.longitude,
        accuracy: obj.accuracy
      };  
      return coords;
    }else{
      return obj;
    }    
  };
  let mapCenterChanged = function(){
    clearTimeout(_centerChangedTimeout);
    _centerChangedTimeout = setTimeout( () => {
      
      const isCenterWithinBounds = isPosWithinBounds(map.getCenter());

      let centerInfo = {
        isCenterWithinBounds : isPosWithinBounds(map.getCenter()),
        isViewWithinBounds : (map.getBounds())? map.getBounds().intersects(mapBounds) : isPosWithinBounds(map.getCenter())
      }
      let event = new CustomEvent('map:outofbounds', {detail: centerInfo});
      document.dispatchEvent(event);

     }, 50);
  };
  let isPosWithinBounds = function(pos) {
    const ret = mapBounds.contains(pos);
    return ret;
  };
  let setMapBounds = function(){
      mapBounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(_mapBoundsCoords.sw.lat, _mapBoundsCoords.sw.lng),
          new google.maps.LatLng(_mapBoundsCoords.ne.lat, _mapBoundsCoords.ne.lng)
      );
  };
  let setInfoBox = function(){
      const infoboxWidth = _isMobile ? $(window).width() * 0.95 : 300;
      const myOptions = {
        maxWidth: 0,
        pixelOffset: new google.maps.Size(-infoboxWidth/2, 0),
        disableAutoPan: _isMobile ? false : true,
        zIndex: null,
        boxStyle: {
          width: `${infoboxWidth}px`,
          height: '75px', 
          cursor: 'pointer',
        },
        // closeBoxMargin: '10px 2px 2px 2px',
        closeBoxURL: '',
        infoBoxClearance: new google.maps.Size(1, 1),
        pane: 'floatPane',
        enableEventPropagation: false,
      };
      _infoWindow = new InfoBox(myOptions);
  };
  let updateMarkerPosition = function(gposition) {    
    if (map) {
      geolocationMarker.setPosition(gposition);
      geolocationRadius.setCenter(gposition);
      geolocationRadius.setRadius(gposition.accuracy);
    }
  };
  let updateMapCenter = function(coords, convert = true){
    let gpos = convertToGmaps(coords, convert); 
    map.panTo(gpos);
    updateMarkerPosition(gpos);
    if (map.getZoom() < 17) {
      map.setZoom(17); 
    } 
    geolocationRadius.setVisible(true);
  };

  let setMarker = function(){
    geolocationMarker = new google.maps.Marker({
      optimized: true,
      map: map,
      clickable: false,
      icon: {
        url: '/img/current_position.svg', // url
        scaledSize: new google.maps.Size(CURRENT_LOCATION_MARKER_W, CURRENT_LOCATION_MARKER_H), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(CURRENT_LOCATION_MARKER_W/2, CURRENT_LOCATION_MARKER_H/2), // anchor
      }
    });
  };
  let setRadius = function(){
    geolocationRadius = new google.maps.Circle({
      map: map,
      clickable: false,
      fillColor: '#705EC7',
      fillOpacity: '0.2',
      strokeColor: 'transparent',
      strokeOpacity: '0'
    });
  };

  let geolocate = function(options = false){
      document.addEventListener('geolocation:done', function(result){
        if(result.detail.status){
          updateMapCenter(result.detail.response);  
        }
      });
      BDB.Geolocation.getLocation(options);
  };
  
  let setupAutocomplete = function() {
    const inputElem = document.getElementById('locationQueryInput');
    // Limits the search to the our bounding box
    const options = {
      bounds: mapBounds,
      strictBounds: true
    };
    let autocomplete = new google.maps.places.Autocomplete(inputElem, options);
    
    autocomplete.addListener('place_changed', () => {
      
      const place = autocomplete.getPlace();
      if (!place.geometry) {
        console.error('Autocomplete\'s returned place contains no geometry');
        return;
      }

      map.panTo(place.geometry.location);
      if (place.geometry.viewport) { 
        map.fitBounds(place.geometry.viewport); 
      } else {
        map.setZoom(17);  // Why 17? Because it looks good.
      }

      let event = new CustomEvent('autocomplete:done', {detail: place});
      document.dispatchEvent(event);
      
      });
  };
  let setupBikeLayer = function(){
    if (!bikeLayer){
      bikeLayer = new google.maps.BicyclingLayer();
      map.data.map = null;
      map.data.loadGeoJson('/geojson/ciclovias_portoalegre.json');
      map.data.setStyle({
        strokeColor: 'green',
        strokeWeight: 5
      });
    }
  };
  return {
    init: function(){
      let zoom = (BDB.Geolocation.isDefaultLocation()) ? 15 : 17; 
      let coords =  BDB.Geolocation.getLastestLocation();
      initMap(coords, zoom);
      
      // Check previous user permission for geolocation
      BDB.Geolocation.checkPermission().then( permission => {
        if (permission.state === 'granted') {
            BDB.Geolocation.getLocation().then(function(result){
              // initMap(result.response, 17); 
              updateMapCenter(result.response);
            },function(error){
              // initMap(coords, zoom);
            });
        }
      });
    },
    getStaticImgMap : function (staticImgDimensions, pinColor, lat, lng, customStyle, zoom = false) {
      let zoomStr = (zoom) ? `zoom=${zoom}&` : '';
      let imgUrl = `https://maps.googleapis.com/maps/api/staticmap?${zoomStr}size=${staticImgDimensions}&markers=icon:https://www.bikedeboa.com.br/img/pin_${pinColor}.png|${lat},${lng}&key=${apiKey}&${_gmapsCustomStyleStaticApi}`;
              
      return imgUrl;
    },
    getGeolocation : function(options = false){
      geolocate(options);
    },
    showBikeLayer : function(){
      setupBikeLayer();
      bikeLayer.setMap(map);
    },
    hideBikeLayer : function() {
      map.setOptions({styles: _gmapsCustomStyle});
      bikeLayer.setMap(null);
      map.data.setMap(null);
    },
    //return this to app.js to apply markers 
    getMap : function(){
      return map;
    },
    checkBounds: function(){
      if (map){
        return isPosWithinBounds(map.getCenter());  
      }else{
        return false;
      }    
    }
  }
})();