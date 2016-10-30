/* global $, google */

$(function () {
    var MARKER_ICON_GREEN = 'img/icon-pin-green.png';
    var MARKER_ICON_YELLOW = 'img/icon-pin-yellow-copy.png';
    var MARKER_ICON_RED = 'img/icon-yellow-copy-2.png';
    var LOCATION_ICON = 'img/icon-location.png';
    var API_URL = 'http://92076cd7.ngrok.io'; //without final '/'

    var map;
    var geocoder;
    var markers;
    var _gmarkers;
    var areMarkersHidden = false;

    window._removeAll = function() {
        console.log('Removing all entries in 5 seconds...');

        setTimeout(function() {
            $.ajax({
                url: API_URL + '/local',
                type: 'DELETE'
            }).done(function(data) {
                console.log(data);
            });
        }, 5000)
    }

    window._sendAllMarkersToBackend = function() {
        console.log('Sending ALL ' + allMarkers.length + ' places.');

        allMarkers.forEach(function(m){
            $.post(API_URL + '/local', m);
        })
    }

    function postPlace(place, callback) {
        console.log('Sending new place:');
        console.log(place);

        $.post(
            API_URL + '/local',
            place,
            function(data) { 
                console.log('Addition success!');
                
                if (callback) {
                    callback();
                }
            }
        );
    }

    function getAllPlaces(successCB, failCB, alwaysCB) {
        console.log('Getting all places...');

        toggleSpinner();

        $.ajax({
            url: API_URL + '/local'
        }).done(function(data) {
            console.log('Successfully retrieved ' + data.length + ' places!');
            
            markers = data;

            // mock some stuff
            console.warn("creating some shit from where"); 
            markers.forEach(function(m) {
                m.average = (Math.floor(Math.random() * 50) + 10)/10;
            });

            if (successCB) {
                successCB();
            }
        })
        .fail(function() {
            if (failCB) {
                failCB();
            }
        })
        .always(function() {
            toggleSpinner();

            if (alwaysCB) {
                alwaysCB();
            }
        });
    }

    function openDetails(i) {
        var m = markers[i];

        console.log(m.text);
        console.log(m.structureType);
        console.log(m.isPublic);

        $('#placeDetails_title').text(m.text)
        $('#placeDetails_address').text('') 
        $('#placeDetails_average').text(m.average || '');

        // fuckin stars
        $('#star1_gold').hide();
        $('#star2_gold').hide();
        $('#star3_gold').hide();
        $('#star4_gold').hide();
        $('#star5_gold').hide();
        $('#star5_gold').hide();
        $('#star1_gray').show();
        $('#star2_gray').show();
        $('#star3_gray').show();
        $('#star4_gray').show();
        $('#star5_gray').show();
        $('#star5_gray').show();
        if (m.average) {
            if (m.average > 0.5) {
                $('#star1_gold').show();
                $('#star1_gray').hide();
            }
            if (m.average > 1.5) {
                $('#star2_gold').show();
                $('#star2_gray').hide();
            }
            if (m.average > 2.5) {
                $('#star3_gold').show();
                $('#star3_gray').hide();
            }
            if (m.average > 3.5) {
                $('#star4_gold').show();
                $('#star4_gray').hide();
            }
            if (m.average > 4.5) {
                $('#star5_gold').show();
                $('#star5_gray').hide();
            }
        }
        
        // Enable modal
        $('#placeDetailsModal').modal('toggle');
    }

    /**
     * The CenterControl adds a control to the map that recenters the map on Chicago.
     * This constructor takes the control DIV as an argument.
     * @constructor
     */
    function centerControl(controlDiv, map) { 
        function _tryGeolocate() { 
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    var pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    map.setCenter(pos);

                    toggleSpinner();
                }, function() {
                    // handleLocationError(true, infoWindow, map.getCenter());
                });
            }
        }

        // Set CSS for the control border.
        var controlUI = document.createElement('div');
        controlUI.style.backgroundColor = '#fff';
        controlUI.style.border = '2px solid #fff';
        controlUI.style.borderRadius = '50%';
        // controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
        controlUI.style.cursor = 'pointer';
        controlUI.style.margin = '0 20px 90px';
        controlUI.style.width = '45px';
        controlUI.style.height = '45px';
        controlUI.style.textAlign = 'center';
        controlUI.style.boxShadow = '0 0 4px 0 rgba(0, 0, 0, 0.15), 0 2px 2px 0 rgba(0, 0, 0, 0.06';

        controlUI.title = 'Clique para centralizar mapa';

        controlDiv.appendChild(controlUI);

        // Set CSS for the control interior.
        var controlText = document.createElement('div');
        controlText.style.color = '#30bb6a';
        controlText.style.fontSize = '22px';
        controlText.style.padding = '8px';
        controlText.innerHTML = '<span class="glyphicon glyphicon-screenshot"></span>';
        controlUI.appendChild(controlText);

        // Setup the click event listeners: simply set the map to Chicago.
        controlUI.addEventListener('click', function() {
            toggleSpinner();
            _tryGeolocate();
        });

    }

    function addTestMarker() {
        // Add test marker
        var contentString = '<div id="content">'+
        '<div id="siteNotice">'+
        '</div>'+
        '<h1 id="firstHeading" class="firstHeading">Uluru</h1>'+
        '<div id="bodyContent">'+
        '<p><b>Uluru</b>, also referred to as <b>Ayers Rock</b>, is a large ' +
        'sandstone rock formation in the southern part of the '+
        'Northern Territory, central Australia. It lies 335&#160;km (208&#160;mi) '+
        'south west of the nearest large town, Alice Springs; 450&#160;km '+
        '(280&#160;mi) by road. Kata Tjuta and Uluru are the two major '+
        'features of the Uluru - Kata Tjuta National Park. Uluru is '+
        'sacred to the Pitjantjatjara and Yankunytjatjara, the '+
        'Aboriginal people of the area. It has many springs, waterholes, '+
        'rock caves and ancient paintings. Uluru is listed as a World '+
        'Heritage Site.</p>'+
        '<p>Attribution: Uluru, <a href="https://en.wikipedia.org/w/index.php?title=Uluru&oldid=297882194">'+
        'https://en.wikipedia.org/w/index.php?title=Uluru</a> '+
        '(last visited June 22, 2009).</p>'+
        '</div>'+
        '</div>';
        var infowindow = new google.maps.InfoWindow({
            content: contentString
        });
        var marker = new google.maps.Marker({
            position: {
                lat: -30.0458531,
                lng: -51.2295223
            },
            map: map,
            icon: MARKER_ICON_GREEN,
            // title: 'Uluru (Ayers Rock)'
        });
        marker.addListener('click', function() {
            infowindow.open(map, marker);
        });
    }

    function updateMarkers() {
        _gmarkers = [];

        // Markers from Database
        if (markers && markers.length > 0) {
            // markers.forEach(function(m) {
            for(var i=0; i<markers.length; i++) {
                
                var whichIcon;
                if (markers[i].average > 0 && markers[i].average < 2) {
                    whichIcon = MARKER_ICON_RED;
                } else if (markers[i].average >= 2 && markers[i].average < 3.5) {
                    whichIcon = MARKER_ICON_YELLOW;
                } else {
                    whichIcon = MARKER_ICON_GREEN;
                }

                _gmarkers[i] = new google.maps.Marker({
                    position: {
                        lat: Number.parseFloat(markers[i].lat),
                        lng: Number.parseFloat(markers[i].lng)
                    }, 
                    map: map,
                    icon: whichIcon,
                });
                
                // var content = '<div id="content">'+
                // '<p>' + markers[i].text + '</p>' + 
                // '<p>structureType: ' + markers[i].structureType + '</p>' +
                // '<p>isPublic: ' + markers[i].isPublic + '</p>' +
                // '</div>';
                // var infowindow = new google.maps.InfoWindow({
                //     content: content
                // });

                (function (markerIndex) {
                    _gmarkers[markerIndex].addListener('click', function() {
                        openDetails(markerIndex);
                    });
                }(i));
            }
            // });
        }
    }

    function searchLocation() {
        var address = $('#locationQueryInput').val();

        console.log('Searching for ' + address);

        geocoder.geocode({'address': address}, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                map.setCenter(results[0].geometry.location);
                
                // Set marker on located place
                // new google.maps.Marker({
                //     map: map,
                //     position: results[0].geometry.location
                // });
            } else {
                console.error('Geocode was not successful for the following reason: ' + status);
            }
        });
    }

    // Sets the map on all markers in the array.
    function setMapOnAll(m) {
      if (_gmarkers) {
        for (var i = 0; i < _gmarkers.length; i++) {
            _gmarkers[i].setMap(m);
          }
      }
    }

    // Removes the markers from the map, but keeps them in the array.
    function hideMarkers() {
        areMarkersHidden = true;
        setMapOnAll(null);
    }

    // Shows any markers currently in the array.
    function showMarkers() {
      areMarkersHidden = false;
      setMapOnAll(map);
    }

    // Deletes all markers in the array by removing references to them.
    function deleteMarkers() {
      clearMarkers();
      _gmarkers = [];
    }

    function toggleMarkers() {
        if (areMarkersHidden) {
            showMarkers();
        } else {
            hideMarkers();
        }
    }

    function addLocationModeToggle() {
        $('#addPlace').toggleClass('active')
        $('#newPlaceholder').toggleClass('active');
        $('#newPlaceholderShadow').toggle();

        toggleMarkers();
    }

    function addLocation() {
        console.log('add location');

        var mapCenter = map.getCenter();
        postPlace({
            lat: '' + mapCenter.lat(),
            lng: '' + mapCenter.lng(),
            isPublic: 'true',
            text: 'test',
            // @todo more stuff?
        }, function() {
            // Addition finished
            addLocationModeToggle();
            getAllPlaces(updateMarkers);
        });
    }

    function setupAutocomplete() {
        var inputElem = document.getElementById('locationQueryInput');
        var autocomplete = new google.maps.places.Autocomplete(inputElem);
        autocomplete.bindTo('bounds', map);
        
        var infowindow = new google.maps.InfoWindow();
        var marker = new google.maps.Marker({
            map: map,
            anchorPoint: new google.maps.Point(0, -29)
        });
        

        autocomplete.addListener('place_changed', function() {
            infowindow.close();
            marker.setVisible(false);
            var place = autocomplete.getPlace();
            if (!place.geometry) {
              console.error("Autocomplete's returned place contains no geometry");
              return;
            }

            // If the place has a geometry, then present it on a map.
            if (place.geometry.viewport) {
              map.fitBounds(place.geometry.viewport);
            } else {
              map.setCenter(place.geometry.location);
              map.setZoom(17);  // Why 17? Because it looks good.
            }
            marker.setIcon(/** @type {google.maps.Icon} */({
              url: place.icon,
              size: new google.maps.Size(71, 71),
              origin: new google.maps.Point(0, 0),
              anchor: new google.maps.Point(17, 34),
              scaledSize: new google.maps.Size(35, 35)
            }));
            marker.setPosition(place.geometry.location);
            marker.setVisible(true);

            var address = '';
            if (place.address_components) {
              address = [
                (place.address_components[0] && place.address_components[0].short_name || ''),
                (place.address_components[1] && place.address_components[1].short_name || ''),
                (place.address_components[2] && place.address_components[2].short_name || '')
              ].join(' ');
            }

            infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
            infowindow.open(map, marker);
          });
    }

    function toggleSpinner() {
        $('#spinnerOverlay').fadeToggle();
    }

    var init = function () {
        map = new google.maps.Map(document.getElementById('map'), {
            center: {
                lat: -30.0458531,
                lng: -51.2295223
            },
            zoom: 16,
            disableDefaultUI: true,
            scaleControl: false,
            // zoomControl: true,
        });

        geocoder = new google.maps.Geocoder();

        setupAutocomplete();

        // Add bike Layer
        var bikeLayer = new google.maps.BicyclingLayer();
        bikeLayer.setMap(map);

        // Geolocalization button
        if (navigator.geolocation) {
            var centerControlDiv = document.createElement('div');
            new centerControl(centerControlDiv, map);
            centerControlDiv.index = 1;
            map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(centerControlDiv); 
        }

        $('#locationQueryBtn').on('click', searchLocation);

        $('#addPlace').on('click', addLocationModeToggle);

        $('#newPlaceholder').on('click', addLocation);

        // addTestMarker();

        getAllPlaces(updateMarkers);
        // markers = allMarkers;
        // updateMarkers();

    };

    init();
});