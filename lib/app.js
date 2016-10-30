/* global $, google */

$(function () {
    var MARKER_ICON = 'img/icon-pin-green.png';
    var LOCATION_ICON = 'img/icon-location.png';
    var API_URL = 'http://7cb0c2aa.ngrok.io'; //without final '/'

    var map;
    var geocoder;
    var markers;
    var _gmarkers;
    var areMarkersHidden = false;

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
                if (callback) {
                    console.log('Addition success');
                    callback();
                }
            }
        );
    }

    function getAllPlaces(successCB, failCB, alwaysCB) {
        console.log('Getting all places...');

        $.ajax({
            url: API_URL + '/local'
        }).done(function(data) {
            console.log(data);
            
            markers = data;

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
            if (alwaysCB) {
                alwaysCB();
            }
        });
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
        controlUI.style.width = '38px';
        controlUI.style.height = '38px';
        controlUI.style.textAlign = 'center';
        controlUI.title = 'Clique para centralizar mapa';

        controlDiv.appendChild(controlUI);

        // Set CSS for the control interior.
        var controlText = document.createElement('div');
        controlText.style.color = '#30bb6a';
        controlText.style.fontSize = '20px';
        controlText.style.padding = '5px';
        controlText.innerHTML = '<span class="glyphicon glyphicon-screenshot"></span>';
        controlUI.appendChild(controlText);

        // Setup the click event listeners: simply set the map to Chicago.
        controlUI.addEventListener('click', function() {
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
            icon: MARKER_ICON,
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
                _gmarkers[i] = new google.maps.Marker({
                    position: {
                        lat: Number.parseFloat(markers[i].lng),
                        lng: Number.parseFloat(markers[i].lat)
                    }, 
                    map: map,
                    icon: MARKER_ICON,
                    // title: markers[i].text,
                });
                
                // var content = '<div id="content">'+
                // '<p>' + markers[i].text + '</p>' + 
                // '<p>structureType: ' + markers[i].structureType + '</p>' +
                // '<p>isPublic: ' + markers[i].isPublic + '</p>' +
                // '</div>';
                // var infowindow = new google.maps.InfoWindow({
                //     content: content
                // });

                (function (m) {
                    _gmarkers[i].addListener('click', function() {
                        // infowindow.open(map, _gmarkers[i]);
                        console.log(m.text);
                        console.log(m.structureType);
                        console.log(m.isPublic);
                    });
                }(markers[i]));
            }
            // });
        }
    }

    function searchLocation() {
        var address = $('#locationQueryInput').val();

        geocoder.geocode({'address': address}, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                map.setCenter(results[0].geometry.location);
                
                // Set marker on located place
                // new google.maps.Marker({
                //     map: map,
                //     position: results[0].geometry.location
                // });
            } else {
                alert('Geocode was not successful for the following reason: ' + status);
            }
        });
    }

    // Sets the map on all markers in the array.
    function setMapOnAll(m) {
      for (var i = 0; i < _gmarkers.length; i++) {
        _gmarkers[i].setMap(m);
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
        $('#newPlaceholder').toggle();
        toggleMarkers();
    }

    function addLocation() {
        console.log('add location');

        var mapCenter = map.getCenter();
        postPlace({
            lat: ''+mapCenter.lat(),
            lng: ''+mapCenter.lng(),
            isPublic: 'true',
            text: 'test'
        });

        updateMarkers();
        
        addLocationModeToggle();
    }

    var init = function () {
        map = new google.maps.Map(document.getElementById('map'), {
            center: {
                lat: -30.0458531,
                lng: -51.2295223},
            zoom: 16,
            disableDefaultUI: true,
            scaleControl: false,
        });

        geocoder = new google.maps.Geocoder();

        // Bike Layer
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

    console.log('not good!');
});