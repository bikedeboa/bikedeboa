var BDB = BDB || {};

BDB.Map = (function () {
  //google maps api Key
  const apiKey = '<GOOGLE_MAPS_ID>';

  let map;
  let mapBounds;
  let geolocationMarker;
  let geolocationRadius;
  let bikeLayer;
  let mapZoomLevel; 
  let isGeolocated = false;
  let markerClickCallback;
  let markerClusterer;
  let areMarkersHidden = false;
  let directionsRenderer;
  let directionsService;

  // to do:  move this to configuration
  let mapBoundsCoords = { 
    sw: { lat: '-34.0526594796', lng: '-61.3037107971' }, 
    ne: { lat: '0.1757808338', lng: '-34.3652340941' } 
  };

  // function that must be called on map.init(), returns a promise.
  let loadScripts = function(){
    /*By default, $.getScript() sets the cache setting to false.This appends a timestamped query parameter to the 
     request URL to ensure that the browser downloads the script each time it is requested.You can override this 
     feature by setting the cache property globally using $.ajaxSetup():*/
    
    $.ajaxSetup({
      cache: true
    });

    return new Promise((resolve, reject) => {
    // Dynamically inject Google Map's lib
    // todo: apply reject behaviour.
      $.getScript('https://maps.googleapis.com/maps/api/js?key=<GOOGLE_MAPS_ID>&libraries=places&language=pt-BR', () => {
        $.getScript('/lib/infobox.min.js', () => {
          $.getScript('/lib/markerclusterer.min.js', () => {
            resolve();
          });
        });
      });
    });
  };

  let setMapElement = function(options) {

    let {coords, zoom, isUserLocation, elId} = options;

    const DOM_EL = document.getElementById(elId);

    if (!elId) {
      console.warn('Map initialization stopped: no #map element found');
      return;
    }

    let gpos = convertToGmaps(coords);
    
    map = new google.maps.Map(DOM_EL, { 
      center: gpos,
      zoom,
      disableDefaultUI: true,
      scaleControl: false,
      clickableIcons: false,
      styles: _gmapsCustomStyle,
      mapTypeControl: false,
      zoomControl: !_isMobile,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_CENTER
      }
    });

    setUserMarker();
    setUserRadius();

    if (isUserLocation) {
      updateUserMarkerPosition(gpos);
    }
 
    setupAutocomplete();  
    setMapBounds(); 
    setInfoBox();
    mapCenterChanged();
    mapZoomChanged();
    setupBikeLayer(); 
    
    map.addListener('center_changed', mapCenterChanged);
  
    if (!_isMobile) {
      google.maps.event.addListener(map, 'zoom_changed', mapZoomChanged);
    }

    directionsRenderer = new google.maps.DirectionsRenderer({
      map: map,
      hideRouteList: true,
      draggable: false,
      preserveViewport: true,
      suppressMarkers: true,
      suppressBicyclingLayer: true,
      suppressInfoWindows: true,
      polylineOptions: {
        clickable: false,
        strokeColor: '#533FB4', // purple
        strokeOpacity: 0,
        fillOpacity: 0,
        icons: [{
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillOpacity: 1, 
            scale: 2
          },
          offset: '0',
          repeat: '10px'
        }]
      }
    });
    directionsService = new google.maps.DirectionsService;

    //native Event Dispatcher 
    let event = new Event('map:ready');
    document.dispatchEvent(event);
  };

  let convertToGmaps = function (obj, convert = true) {
    if (convert) {
      let coords = {
        lat: obj.latitude,
        lng: obj.longitude,
        accuracy: obj.accuracy
      };
      return coords;
    } else {
      return obj;
    }
  };
  
  let mapZoomChanged = function () {
    const prevZoomLevel = mapZoomLevel;

    mapZoomLevel = map.getZoom() <= 13 ? 'mini' : 'full';

    if (!prevZoomLevel || prevZoomLevel !== mapZoomLevel) { 
      if (!_activeFilters) {
        //setMarkersIcon(mapZoomLevel); 
      }
    }
  };
  
  let mapCenterChanged = function () {
    clearTimeout(_centerChangedTimeout);
    _centerChangedTimeout = setTimeout(() => {

      const isCenterWithinBounds = isPosWithinBounds(map.getCenter());

      let centerInfo = {
        isCenterWithinBounds: isPosWithinBounds(map.getCenter()),
        isViewWithinBounds: (map.getBounds()) ? map.getBounds().intersects(mapBounds) : isPosWithinBounds(map.getCenter())
      };
      let event = new CustomEvent('map:outofbounds', { detail: centerInfo });
      document.dispatchEvent(event);

    }, 50);
  };
  let isPosWithinBounds = function (pos) {
    const ret = mapBounds.contains(pos);
    return ret;
  };
  let setMapBounds = function () {
    mapBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(mapBoundsCoords.sw.lat, mapBoundsCoords.sw.lng),
      new google.maps.LatLng(mapBoundsCoords.ne.lat, mapBoundsCoords.ne.lng)
    );
  };
  let setInfoBox = function () {
    // remove jquery reference.
    // const infoboxWidth = _isMobile ? $(window).width() * 0.95 : 400;
    const infoboxWidth = _isMobile ? $(window).width() * 0.95 : 300;
    const myOptions = {
      maxWidth: 0,
      pixelOffset: new google.maps.Size(-infoboxWidth / 2, 0),
      disableAutoPan: _isMobile ? false : true,
      zIndex: null,
      boxStyle: {
        width: `${infoboxWidth}px`,
        // height: _isMobile ? '75px' : '100px',
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
  let updateUserMarkerPosition = function (gposition) {
    if (map) {
      geolocationMarker.setPosition(gposition);
      geolocationRadius.setCenter(gposition);
      geolocationRadius.setRadius(gposition.accuracy);
    }
  };
  let updateUserPosition = function (coords, center = true, convert = true) {
    let gpos = convertToGmaps(coords, convert); 
    
    updateUserMarkerPosition(gpos);
    
    if (geolocationRadius) {
      geolocationRadius.setVisible(true);
    }

    if (center && map) {
      map.panTo(gpos); 
      if (map.getZoom() < 17) {
        map.setZoom(17);
      }
    }
  };
  let setUserMarker = function () {
    geolocationMarker = new google.maps.Marker({
      optimized: false, // more smooth in new Beta Renderer
      map: map,
      clickable: false,
    });
    setUserMarkerIcon();
  };
  let setUserMarkerIcon = function(){
    let iconName = (isGeolocated) ? 'current' : 'last';
    geolocationMarker.setIcon({
      url: `/img/${iconName}_position.svg`, // url
      scaledSize: new google.maps.Size(CURRENT_LOCATION_MARKER_W, CURRENT_LOCATION_MARKER_H), // scaled size
      origin: new google.maps.Point(0, 0), // origin
      anchor: new google.maps.Point(CURRENT_LOCATION_MARKER_W / 2, CURRENT_LOCATION_MARKER_H / 2), // anchor
    });
  };
  let setUserRadius = function () {
    geolocationRadius = new google.maps.Circle({
      map: map,
      clickable: false,
      fillColor: '#705EC7',
      fillOpacity: '0.2',
      strokeColor: 'transparent',
      strokeOpacity: '0'
    });
  };
  let geolocate = function (options = {}) {
    BDB.Geolocation.getLocation();

    document.addEventListener('geolocation:done', function (result) {
      if (result.detail.success) {
        if (!isGeolocated){
          isGeolocated = true;
          setUserMarkerIcon();
        }
        updateUserPosition(result.detail.response, result.detail.center);  
      }else{
        isGeolocated = false;
        setUserMarkerIcon();
      }
    });
  };

  let setupAutocomplete = function () {
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

      let event = new CustomEvent('autocomplete:done', { detail: place });
      document.dispatchEvent(event);

    });
  };
  let setupBikeLayer = function () {
    if (!bikeLayer) {
      // Google Maps Bike Layer (sucks)
      // bikeLayer = new google.maps.BicyclingLayer();
       
      // Custom, locally loaded GeoJSONs
      // map.data.map = null;  
      map.data.loadGeoJson('/geojson/ciclovias_florianopolis_osm.min.json'); // 99 KB
      map.data.loadGeoJson('/geojson/ciclovias_fortaleza_osm.min.json'); // 203 KB
      map.data.loadGeoJson('/geojson/ciclovias_recife_osm.min.json'); // 68 KB 
      map.data.loadGeoJson('/geojson/ciclovias_grandeportoalegre_osm.min.json'); // 369 KB
      // map.data.loadGeoJson('/geojson/ciclovias_riograndedosul_osm.min.json'); // 654 KB
      // map.data.loadGeoJson('/geojson/ciclovias_riodejaneiro_osm.min.json'); // 374 KB

      map.data.setStyle({  
        // strokeColor: '#cde9c8', //super light green
        // strokeColor: '#00b800', // dark green
        strokeColor: '#2cd978', // light green
        strokeWeight: 2,
        strokeOpacity: 1, 
        clickable: false
      });
    }
  };
  let setMarkersIcon = function(scale) {
    const tempMarkers = markerClusterer && markerClusterer.getMarkers();
    if (tempMarkers && Array.isArray(tempMarkers)) {
      let m;
      for (let i = 0; i < tempMarkers.length; i++) {
        m = markers[i];
        tempMarkers[i].setIcon(scale === 'mini' ? m.iconMini : m.icon);
      }
    }
  };
  let searchAdress = function(address) {
    return new Promise(function (resolve, reject) {
      geocoder.geocode({ 'address': address }, function (results, status) {
        if (status === 'OK') {
          resolve(results[0]);
        } else {
          reject();
        }
      });
    });
  };
  return {
    init: function (coords, zoom, elId, getLocation, _markerClickCallback) {
      let options = Object.assign({isUserLocation : false}, {coords, zoom, elId});

      loadScripts().then(()=>{
        // enabling search address and reverse geocoder
        geocoder = new google.maps.Geocoder();

        // chech localStorage to see if there is a saved location;
        if (getLocation){
          options.coords = BDB.Geolocation.getLastestLocation() || options.coords;
          options.zoom = 15;
          options.isUserLocation = true;
        }

        markerClickCallback = _markerClickCallback;

        setMapElement(options);

        // if a coord is passed to the map so do not check for automatic geolocation check.
        if (getLocation){
          BDB.Geolocation.checkPermission().then(permission => {
            if (permission.state === 'granted') {
              geolocate();
            }
          });
        }
      });             
    },
    searchAndCenter: function(address) {
      return new Promise(function (resolve, reject) {
        searchAdress(address) 
          .then( result => {
            map.panTo(result.geometry.location); 
            
            if (result.geometry.viewport) {
              map.fitBounds(result.geometry.viewport);
            } else { 
              map.setZoom(17);  // Why 17? Because it looks good.
            }
            
            resolve();
          })
          .catch(reject);
      });
    },
    getStaticImgMap: function (staticImgDimensions, pinColor, lat, lng, customStyle, zoom = false) {
      let zoomStr = (zoom) ? `zoom=${zoom}&` : '';
      let imgUrl = `https://maps.googleapis.com/maps/api/staticmap?${zoomStr}size=${staticImgDimensions}&markers=icon:https://www.bikedeboa.com.br/img/pin_${pinColor}.png|${lat},${lng}&key=${apiKey}&${_gmapsCustomStyleStaticApi}`;

      return imgUrl;
    },
    getGeolocation: function (options = {}) {
      geolocate(options);
    },
    showBikeLayer: function () {
      setupBikeLayer();
      
      if (bikeLayer) {
        bikeLayer.setMap(map);
      }
    },
    hideBikeLayer: function () {
      if (bikeLayer) {
        map.setOptions({ styles: _gmapsCustomStyle });
        bikeLayer.setMap(null);
      }

      map.data.setMap(null);
    },
    checkBounds: function () {
      if (map) {
        return isPosWithinBounds(map.getCenter());
      } else {
        return false;
      }
    },
    goToCoords: function (coords) {
      map.setCenter(convertToGmaps(coords));
      map.setZoom(12);
      BDB.Geolocation.clearWatch();
    },
    getMap: function(){
      return map;
    },
    reverseGeocode: function(lat, lng) {
      return new Promise(function (resolve, reject) {
        const latlng = {lat: parseFloat(lat), lng: parseFloat(lng)};

        geocoder.geocode({'location': latlng}, function(results, status) {
          if (status === google.maps.GeocoderStatus.OK) {
            if (results[0]) {
              const r = results[0].address_components;
              const formattedAddress = `${r[1].short_name}, ${r[0].short_name} - ${r[3].short_name}`;
              let city, state, country;

              r.forEach(address => {
                address.types.forEach(type => {
                  if (type === 'locality' || type === 'administrative_area_level_2') {
                    if (city && city != address.long_name) {
                      console.warn('reverseGeocode: conflicting city names:', city, address.long_name);
                    }  
                    city = address.long_name;
                  } else if (type === 'administrative_area_level_1') {
                    if (state && state != address.long_name) {
                      console.warn('reverseGeocode: conflicting state names:', state, address.long_name);
                    }
                    state = address.long_name;
                  } else if (type === 'country') {
                    if (country && country != address.long_name) {
                      console.warn('reverseGeocode: conflicting country names:', country, address.long_name);
                    }
                    country = address.long_name;
                  }
                });
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
    getMarkers: function() {
      return markerClusterer.getMarkers();
    },
    clearMarkers: function () {
      // Deletes all markers in the array by removing references to them.
      // setMapOnAll(null);
      // gmarkers = [];
      if (markerClusterer) {
        markerClusterer.clearMarkers();
      }
    },
    // Sets the map on all markers in the array.
    setMapOnAll: function(map) {
      let tempMarkers = markerClusterer && markerClusterer.getMarkers();
      if (tempMarkers && Array.isArray(tempMarkers)) {
        for (let i = 0; i < tempMarkers.length; i++) {
          tempMarkers[i].setMap(map);
        }
      }
    },
    hideMarkers: function() {
      // Removes the markers from the map, but keeps them in the array.
      let tempMarkers = markerClusterer && markerClusterer.getMarkers();
      if (tempMarkers && Array.isArray(tempMarkers)) {
        for (let i = 0; i < tempMarkers.length; i++) {
          tempMarkers[i].setOptions({ clickable: false, opacity: 0.3 });
        }
      }
    },
    showMarkers: function() {
      // Shows any markers currently in the array.
      let tempMarkers = markerClusterer && markerClusterer.getMarkers();
      if (tempMarkers && Array.isArray(tempMarkers)) {
        for (let i = 0; i < tempMarkers.length; i++) {
          tempMarkers[i].setOptions({ clickable: true, opacity: 1 });
        }
      }
    },
    // Switches all marker icons to the full or the mini scale
    // scale := 'mini' | 'full'
    setMarkersIcon: function(scale) {
      setMarkersIcon(scale);
    },
    toggleMarkers: function() {
      if (areMarkersHidden) {
        // showMarkers();
        setMarkersIcon('full');
        areMarkersHidden = false;
      } else {
        // hideMarkers();
        setMarkersIcon('mini');
        areMarkersHidden = true;
      }
    },
    getListOfPlaces: function (orderBy, maxPlaces = 50) {
      let markersToShow;
      switch (orderBy) {
      case 'nearest': { 
        // if (!_userCurrentPosition) {
        //   showSpinner('Localizando...');

        //   geolocate(true).then(() => {
        //     // hideSpinner();

        //     openNearbyPlacesModal(orderBy);
        //   }).catch(() => {
        //     console.error('Cant open nearby places, geolocation failed.');

        //     // hideSpinner();

        //     switchToMap();
        //   });
        //   return;
        // }

        // @todo do this properly
        const positionToCompare = BDB.Geolocation.getCurrentPosition();

        // Use nearest places
        for (let i = 0; i < markers.length; i++) {
          const m = markers[i];

          m.distance = distanceInKmBetweenEarthCoordinates(
            positionToCompare.latitude,
            positionToCompare.longitude, 
            m.lat,
            m.lng);
        }
        markersToShow = markers.sort((a, b) => { return a.distance - b.distance; });
        markersToShow = markersToShow.slice(0, maxPlaces);
        break;
      }
      case 'updatedAt':
        // Most recently updated places
        // @todo bring this info from getAll endpoint
        markersToShow = markers.sort((a, b) => { return b.updatedAt - a.updatedAt; });
        markersToShow = markersToShow.slice(0, maxPlaces);
        break;
      case 'best':
        // Best rated places
        markersToShow = markers.sort((a, b) => {
          return (b.average * 1000 + b.reviews * 1) - (a.average * 1000 + a.reviews * 1);
        });
        markersToShow = markersToShow.slice(0, maxPlaces);
        break;
      }

      return markersToShow;
    },
    fitToNearestPlace: function() {
      let bounds = new google.maps.LatLngBounds();

      bounds.extend(convertToGmaps(BDB.Geolocation.getCurrentPosition()));  

      var nearest = this.getListOfPlaces('nearest', 1)[0];
      console.log('nearest place:', nearest); 
      var nearestPos = { lat: parseFloat(nearest.lat), lng: parseFloat(nearest.lng) };
      bounds.extend(nearestPos);

      map.fitBounds(bounds);
      map.panToBounds(bounds);
    },
    showDirectionsToNearestPlace: function() {
      const nearest = BDB.Map.getListOfPlaces('nearest', 1)[0];
      this.showDirectionsToPlace({ lat: parseFloat(nearest.lat), lng: parseFloat(nearest.lng) });
    },
    showDirectionsToPlace: function(dest, forceLongDistance = false) {
      // const travelMode = 'WALKING';
      const travelMode = 'BICYCLING'; 

      const currentPos = BDB.Geolocation.getCurrentPosition();
      if (!currentPos) {
        return;
      }

      const distanceKm = distanceInKmBetweenEarthCoordinates(currentPos.latitude, currentPos.longitude, dest.lat(), dest.lng());

      // console.log(distanceKm); 

      if (!forceLongDistance && distanceKm > MAX_KM_TO_CALCULATE_ITINERARY) {
        console.warn('Wont calculate directions, too far away:', distanceKm);
        return; 
      } else {
        directionsService.route({ 
          origin: { lat: currentPos.latitude, lng: currentPos.longitude },
          destination: dest,
          travelMode: google.maps.TravelMode[travelMode]
        }, function (response, status) {
          if (status == 'OK') {
            directionsRenderer.setDirections(response); 
          } else {
            console.error('Directions request failed due to ' + status);
          }
        });
      }

    },
    updateMarkers: function () {
      this.clearMarkers();

      // Markers from Database
      if (markers && markers.length > 0) {
        // Order by average so best ones will have higher z-index
        // markers = markers.sort((a, b) => {
        //   return a.average - b.average;
        // });

        let gmarkers = [];

        for (let i = 0; i < markers.length; i++) {
          const m = markers[i];

          if (m) {
            // Icon and Scaling
            let scale;
            let iconType, iconTypeMini;
            let color = getColorFromAverage(m.average);
            switch (color) {
            case 'red':
              iconType = MARKER_ICON_RED;
              iconTypeMini = MARKER_ICON_RED_MINI;
              break;
            case 'yellow':
              iconType = MARKER_ICON_YELLOW;
              iconTypeMini = MARKER_ICON_YELLOW_MINI;
              break;
            case 'green':
              iconType = MARKER_ICON_GREEN;
              iconTypeMini = MARKER_ICON_GREEN_MINI;
              break;
            case 'gray':
            default:
              iconType = MARKER_ICON_GRAY;
              iconTypeMini = MARKER_ICON_GRAY_MINI;
              scale = 0.8;
              break;
            }

            if (!scale) {
              scale = 0.5 + (m.average / 10);
            }

            if (map) {
              m.icon = {
                url: iconType, // url
                scaledSize: new google.maps.Size((MARKER_W * scale), (MARKER_H * scale)), // scaled size
                origin: new google.maps.Point(0, 0), // origin
                anchor: new google.maps.Point((MARKER_W * scale) / 2, (MARKER_H - MARKER_H / 10) * scale), // anchor
              };

              m.iconMini = {
                url: iconTypeMini, // url
                scaledSize: new google.maps.Size((MARKER_W_MINI * scale), (MARKER_H_MINI * scale)), // scaled size
                origin: new google.maps.Point(0, 0), // origin
                anchor: new google.maps.Point((MARKER_W_MINI * scale) / 2, (MARKER_H_MINI * scale) / 2), // anchor
              };
            }

            // Average might come with crazy floating point value
            m.average = formatAverage(m.average);

            // @todo temporarily disabled this because backend still doesnt support flags for these
            // let labelStr;
            // if (BDB.User.isAdmin && (!m.photo || !m.structureType || m.isPublic == null)) {
            //   labelStr = '?';
            // }

            if (map) {
              if (m.lat && m.lng) {
                let newMarker = new google.maps.Marker({
                  optimized: true, 
                  position: {
                    lat: parseFloat(m.lat),
                    lng: parseFloat(m.lng)
                  },
                  // map: map,
                  icon: m.icon,
                  zIndex: i, //markers should be ordered by average
                  // opacity: 0.1 + (m.average/5).
                });
                // Performance of MarkerWithLabel is horrible even when hiding labels with display:none :(
                // const labelHeightPx = 12;
                // let newMarker = new MarkerWithLabel({
                //   optimized: false, // this lib forces optimized to be false anyway
                //   labelVisible: false, // force display:none first, for performance
                //   position: {
                //     lat: parseFloat(m.lat),
                //     lng: parseFloat(m.lng)
                //   },
                //   icon: m.icon,
                //   labelContent: m.text,
                //   labelAnchor: new google.maps.Point(-(MARKER_W * scale) / 2, (MARKER_H * scale) / 2 + labelHeightPx/2),
                //   labelClass: `markerLabel color-${color}`,
                // });

                // Info window
                
                let templateData = {
                  thumbnailUrl: (m.photo) ? m.photo.replace('images', 'images/thumbs') : '',
                  title: m.text,
                  average: m.average,
                  roundedAverage: m.average && ('' + Math.round(m.average)),
                  pinColor: getColorFromAverage(m.average),
                  numReviews : m.reviews
                };

                // Attributes
                let attrs = [];
                if (m.isPublic != null) {
                  attrs.push(m.isPublic ? 'Público' : 'Privado');
                }
                if (m.structureType) {
                  attrs.push(STRUCTURE_CODE_TO_NAME[m.structureType]);
                }
                if (m.isCovered != null) {
                  attrs.push(m.isCovered ? 'Coberto' : 'Não coberto');
                }
                templateData.attrs = attrs.join(' · ');

                const contentString = BDB.templates.infoWindow(templateData);

                if (_isTouchDevice) {
                  // Infobox preview on click
                  newMarker.addListener('click', () => {
                    ga('send', 'event', 'Local', 'infobox opened', m.id);

                    map.panTo(newMarker.getPosition());

                    BDB.Map.showDirectionsToPlace(newMarker.position); 

                    _infoWindow.setContent(contentString);
                    _infoWindow.open(map, newMarker);
                    _infoWindow.addListener('domready', () => {
                      // Show spinner while thumbnail is loading
                      // $('.infobox--img img').off('load').on('load', e => {
                      //   $(e.target).parent().removeClass('loading');
                      // });

                      $('.infoBox').off('click').on('click', () => {
                        markerClickCallback(markers[i], () => {
                          _infoWindow.close();
                        });
                      });
                    });
                  });

                  map.addListener('click', () => {
                    _infoWindow.close();
                  });
                } else {
                  // No infobox, directly opens the details modal
                  newMarker.addListener('click', () => {
                    markerClickCallback(markers[i]);
                  });

                  // Infobox preview on hover
                  newMarker.addListener('mouseover', () => {
                    ga('send', 'event', 'Local', 'infobox opened', m.id);

                    _infoWindow.setContent(contentString);
                    _infoWindow.open(map, newMarker);
                    _infoWindow.addListener('domready', () => {
                      $('.infobox--img img').off('load').on('load', e => {
                        $(e.target).parent().removeClass('loading');
                      });
                    });
                  });

                  newMarker.addListener('mouseout', () => {
                    _infoWindow.close();
                  });
                }

                gmarkers.push(newMarker);
              } else {
                console.error('error: pin with no latitude/longitude');
              }
            }

          } else {
            console.error('marker is weirdly empty on addMarkerToMap()');
          }
        }

        if (map) {
          //_geolocationMarker.setZIndex(markers.length);

          const clustererStyles = [
            {
              url: '/img/cluster_medium.png',
              height: 50,
              width: 50
            },
            {
              url: '/img/cluster_medium.png',
              height: 75,
              width: 75
            },
            {
              url: '/img/cluster_medium.png',
              height: 80,
              width: 80
            },
            {
              url: '/img/cluster_big.png',
              height: 100,
              width: 100
            },
            {
              url: '/img/cluster_big.png',
              height: 120,
              width: 120
            },
          ];
          let clustererOptions = {
            maxZoom: 10,
            minimumClusterSize: 1,
            styles: clustererStyles,
            gridSize: 60
          };
          if (_isMobile) {
            clustererOptions.maxZoom = 15;
            clustererOptions.minimumClusterSize = 2;
          } 

          markerClusterer = new MarkerClusterer(map, gmarkers, clustererOptions);
        }
      }
    }
  };
})();