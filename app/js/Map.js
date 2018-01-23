var BDB = BDB || {};

BDB.Map = (function () {
  //google maps api Key
  const apiKey = '<GOOGLE_MAPS_ID>';

  let map;
  let mapBounds;
  let geolocationMarker;
  let geolocationRadius;
  // let geolocationInitialized;
  // let positionWatcher;
  let bikeLayer;
  let markerClickCallback;
  let markerClusterer;
  let areMarkersHidden = false;
  let mapZoomLevel; 

  // "Main Brazil" Bounding Box
  //   [lat, long]
  // SW [[-34.0526594796, -61.3037107971],
  // SE [-34.0526594796, -34.3652340941],
  // NE [0.1757808338, -34.3652340941],
  // NW [0.1757808338, -61.3037107971]]]

  // Rio Grande do Sul Bounding Box
  // let _mapBoundsCoords = {sw: {lat:"-33.815031097046436", lng:'-57.6784069268823'}, ne: {lat: '-27.048660701748112', lng:'-49.5485241143823'}};

  // "Main Brazil"
  let _mapBoundsCoords = { sw: { lat: '-34.0526594796', lng: '-61.3037107971' }, ne: { lat: '0.1757808338', lng: '-34.3652340941' } };


  let initMap = function (coords, zoomValue, pinUser) {
    // Dynamically inject Google Map's lib
    $.getScript('https://maps.googleapis.com/maps/api/js?key=<GOOGLE_MAPS_ID>&libraries=places&language=pt-BR', () => {
      $.getScript('/lib/infobox.min.js', () => {
        $.getScript('/lib/markerclusterer.min.js', () => {
          // $.getScript('/lib/markerwithlabel.min.js', () => {
            initMap_continue(coords, zoomValue, pinUser);
          // });
        });
      });
    } 
    );
  };

  let initMap_continue = function (coords, zoomValue, pinUser) {
    let gpos = convertToGmaps(coords);
    map = new google.maps.Map(document.getElementById('map'), {
      center: gpos,
      zoom: zoomValue,
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
    setMarker();
    setRadius();
    if (pinUser) {
      updateMarkerPosition(gpos);
    }
 
    setupAutocomplete();
    BDB.Geolocation.init();
    
    setMapBounds();
    
    setInfoBox();
    
    map.addListener('center_changed', mapCenterChanged);
    mapCenterChanged();

    if (!_isMobile) {
      google.maps.event.addListener(map, 'zoom_changed', mapZoomChanged);
    }
    mapZoomChanged();

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
        setMarkersIcon(mapZoomLevel); 
        // $('body').toggleClass('showMarkerLabels', mapZoomLevel === 'full');
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
      }
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
      new google.maps.LatLng(_mapBoundsCoords.sw.lat, _mapBoundsCoords.sw.lng),
      new google.maps.LatLng(_mapBoundsCoords.ne.lat, _mapBoundsCoords.ne.lng)
    );
  };
  let setInfoBox = function () {
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
  let updateMarkerPosition = function (gposition) {
    if (map) {
      geolocationMarker.setPosition(gposition);
      geolocationRadius.setCenter(gposition);
      geolocationRadius.setRadius(gposition.accuracy);
    }
  };
  let updateUserPosition = function (coords, center = true, convert = true) {
    let gpos = convertToGmaps(coords, convert);
    updateMarkerPosition(gpos);
    geolocationRadius.setVisible(true);

    if (center){
      map.panTo(gpos); 
      if (map.getZoom() < 17) {
        map.setZoom(17);
      }
    }
  };

  let setMarker = function () {
    geolocationMarker = new google.maps.Marker({
      optimized: true,
      map: map,
      clickable: false,
      icon: {
        url: '/img/current_position.svg', // url
        scaledSize: new google.maps.Size(CURRENT_LOCATION_MARKER_W, CURRENT_LOCATION_MARKER_H), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(CURRENT_LOCATION_MARKER_W / 2, CURRENT_LOCATION_MARKER_H / 2), // anchor
      }
    });
  };
  let setRadius = function () {
    geolocationRadius = new google.maps.Circle({
      map: map,
      clickable: false,
      fillColor: '#705EC7',
      fillOpacity: '0.2',
      strokeColor: 'transparent',
      strokeOpacity: '0'
    });
  };

  let geolocate = function (options = false) {
    document.addEventListener('geolocation:done', function (result) {
      if (result.detail.status) {
          updateUserPosition(result.detail.response, result.detail.center);  
      }
    });
    BDB.Geolocation.getLocation(options);
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
      bikeLayer = new google.maps.BicyclingLayer();
      map.data.map = null;
      map.data.loadGeoJson('/geojson/ciclovias_portoalegre.json');
      map.data.setStyle({
        strokeColor: 'green',
        strokeWeight: 5
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
  }
  return {
    init: function (_markerClickCallback) {
      let isDefaultLocation = BDB.Geolocation.isDefaultLocation();
      let zoom = (isDefaultLocation) ? 15 : 17; 
      let coords =  BDB.Geolocation.getLastestLocation();

      markerClickCallback = _markerClickCallback;

      initMap(coords, zoom, !isDefaultLocation);

      // Check previous user permission for geolocation
      BDB.Geolocation.checkPermission().then(permission => {
        if (permission.state === 'granted') {
          BDB.Geolocation.getLocation().then(function (result) {
            // initMap(result.response, 17); 
            updateUserPosition(result.response);
          }, function (error) {
            // initMap(coords, zoom);
          });
        }
      });
    },
    getMarkers: function() {
      return markerClusterer.getMarkers();
    },
    getStaticImgMap: function (staticImgDimensions, pinColor, lat, lng, customStyle, zoom = false) {
      let zoomStr = (zoom) ? `zoom=${zoom}&` : '';
      let imgUrl = `https://maps.googleapis.com/maps/api/staticmap?${zoomStr}size=${staticImgDimensions}&markers=icon:https://www.bikedeboa.com.br/img/pin_${pinColor}.png|${lat},${lng}&key=${apiKey}&${_gmapsCustomStyleStaticApi}`;

      return imgUrl;
    },
    getGeolocation: function (options = false) {
      geolocate(options);
    },
    showBikeLayer: function () {
      setupBikeLayer();
      bikeLayer.setMap(map);
    },
    hideBikeLayer: function () {
      map.setOptions({ styles: _gmapsCustomStyle });
      bikeLayer.setMap(null);
      map.data.setMap(null);
    },
    //return this to app.js to apply markers 
    getMap: function () {
      return map;
    },
    checkBounds: function () {
      if (map) {
        return isPosWithinBounds(map.getCenter());
      } else {
        return false;
      }
    },
    goToPortoAlegre: function () {
      map.setCenter({ lat: -30.0346, lng: -51.2177 });
      map.setZoom(12);
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
      const tempMarkers = markerClusterer && markerClusterer.getMarkers();
      if (tempMarkers && Array.isArray(tempMarkers)) {
        for (let i = 0; i < tempMarkers.length; i++) {
          tempMarkers[i].setMap(map);
        }
      }
    },
    hideMarkers: function() {
      // Removes the markers from the map, but keeps them in the array.
      const tempMarkers = markerClusterer && markerClusterer.getMarkers();
      if (tempMarkers && Array.isArray(tempMarkers)) {
        for (let i = 0; i < tempMarkers.length; i++) {
          tempMarkers[i].setOptions({ clickable: false, opacity: 0.3 });
        }
      }
    },
    showMarkers: function() {
      // Shows any markers currently in the array.
      const tempMarkers = markerClusterer && markerClusterer.getMarkers();
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
                let thumbUrl = '';
                if (m.photo) {
                  thumbUrl = m.photo.replace('images', 'images/thumbs');
                }
                let templateData = {
                  thumbnailUrl: thumbUrl,
                  title: m.text,
                  average: m.average,
                  roundedAverage: m.average && ('' + Math.round(m.average)),
                  pinColor: getColorFromAverage(m.average)
                };

                templateData.numReviews = m.reviews;

                // Attributes
                const attrs = [];
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

                    _infoWindow.setContent(contentString);
                    _infoWindow.open(map, newMarker);
                    _infoWindow.addListener('domready', () => {
                      // Show spinner while thumbnail is loading
                      // $('.infobox--img img').off('load').on('load', e => {
                      //   $(e.target).parent().removeClass('loading');
                      // });

                      $('.infoBox').off('click').on('click', () => {
                        markerClickCallback(markers[i]);
                        _infoWindow.close();
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
          let clustererOptions;
          if (_isMobile) {
            clustererOptions = {
              maxZoom: 15,
              minimumClusterSize: 2,
              styles: clustererStyles,
              gridSize: 50
            };
          } else {
            clustererOptions = {
              maxZoom: 10,
              minimumClusterSize: 1,
              styles: clustererStyles,
              gridSize: 50
            };
          }

          markerClusterer = new MarkerClusterer(map, gmarkers, clustererOptions);
        }
      }
    }
  }
})();