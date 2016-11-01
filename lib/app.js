/* global $, google */

$(function () {
    var MARKER_ICON_GREEN = 'img/icon-pin-green.png';
    var MARKER_ICON_YELLOW = 'img/icon-pin-yellow-copy.png';
    var MARKER_ICON_RED = 'img/icon-yellow-copy-2.png';
    var MARKER_ICON_GRAY = 'img/icon-pin-gray.png';
    var LOCATION_ICON = 'img/icon-location.png';
    var N_MOCK_PICS = 15;
    var STRUCTURE_TYPES = ['U Invertido', 'De roda', 'Trave', 'Suspenso', 'Grade'];
    var GMAPS_DIRECTIONS_URL = 'http://maps.google.com/maps?saddr="#{origin}"&daddr="#{destination}"';

    /////////////////////////////////////////////////////////////
    //

    // API path, without the final slash ('/')
    var API_URL = 'http://90ef9c3e.ngrok.io';

    // Chose between real DB or hardcoded, mocked data from JS.
    var getPlaces = getPlacesFromJS;
    // var getPlaces = getPlacesFromDB;

    //
    /////////////////////////////////////////////////////////////

    var map;
    var geocoder;
    var markers;
    var tags;
    var _gmarkers;
    var areMarkersHidden = false;
    var addLocationMode = false;
    var openMarker;
    var currentPendingRating;

    window._removeAll = function() {
        console.log('Removing all entries in 5 seconds...');

        setTimeout(function() {
            $.ajax({
                url: API_URL + '/local',
                type: 'DELETE'
            }).done(function(data) {
                console.log(data);
            });
        }, 5000);
    };

    window._sendAllMarkersToBackend = function() {
        console.log('Sending ALL ' + allMarkers.length + ' places.');

        allMarkers.forEach(function(m){
            $.post(API_URL + '/local', m);
        });
    };

    function postCheckin(placeId, callback) {
        $.post(
            API_URL + '/checkin',
            {
                idLocal: placeId,
            },
            function(data) {
                console.log('Check-in success.');

                if (callback) {
                    callback();
                }
            }
        );
    }

    function postReview(placeId, rating, callback) {
        $.post(
            API_URL + '/review',
            {
                idLocal: placeId,
                rating: rating
            },
            function(data) {
                console.log('Review success.');

                if (callback) {
                    callback();
                }
            }
        );
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

    function getAllTags(successCB, failCB, alwaysCB) {
        console.log('Getting tags...');

        $.ajax({
            url: API_URL + '/tag'
        }).done(function(data) {
            console.log('Successfully retrieved ' + data.length + ' tags.');
            tags = data;

            if (successCB && typeof successCB === 'function') {
                successCB();
            }
        })
        .fail(function() {
            if (failCB && typeof failCB === 'function') {
                failCB();
            }
        })
        .always(function() {
            if (alwaysCB && typeof alwaysCB === 'function') {
                alwaysCB();
            }
        });
    }

    function mockData() {
        console.warn("Mocking data...");
        markers.forEach(function(m) {
            // Average rating
            m.average = (Math.floor(Math.random() * 40) + 10)/10;

            // Number of reviews and checkins
            m.reviews = Math.floor(Math.random() * 20);
            m.checkin = Math.floor(Math.random() * 100);

            // Structure types
            var randomStructure = Math.floor(Math.random() * 4) + 0;
            switch(randomStructure) {
                case 0: m.structureType = STRUCTURE_TYPES[0]; break;
                case 1: m.structureType = STRUCTURE_TYPES[1]; break;
                case 2: m.structureType = STRUCTURE_TYPES[2]; break;
                case 3: m.structureType = STRUCTURE_TYPES[3]; break;
                case 4: m.structureType = STRUCTURE_TYPES[4]; break;
            }
        });
    }

    function getPlacesFromJS(successCB, failCB, alwaysCB) {
        markers = allMarkers;

        console.log('Retrieved ' + markers.length + ' places from hardcoded DB.');

        mockData();

        if (successCB && typeof successCB === 'function') {
            successCB();
        }
        if (failCB && typeof failCB === 'function') {
            failCB();
        }
        if (alwaysCB && typeof alwaysCB === 'function') {
            alwaysCB();
        }

        hideSpinner();
    }

    function getPlacesFromDB(successCB, failCB, alwaysCB) {
        console.log('Getting all places...');

        showSpinner();

        $.ajax({
            url: API_URL + '/local'
        }).done(function(data) {
            console.log('Successfully retrieved ' + data.length + ' places!');

            markers = data;

            if (successCB && typeof successCB === 'function') {
                successCB();
            }
        })
        .fail(function() {
            if (failCB && typeof failCB === 'function') {
                failCB();
            }
        })
        .always(function() {
            hideSpinner();

            if (alwaysCB && typeof alwaysCB === 'function') {
                alwaysCB();
            }
        });
    }

    function openDetailsModal(i) {
        if (addLocationMode) {
            return false;
        }

        openMarker = markers[i];
        var m = openMarker;

        // console.log(m.text);
        // console.log(m.structureType);
        // console.log(m.isPublic);

        if (m.text) {
            $('#placeDetails_title').show();
            $('#placeDetails_titleIcon').show();
            $('#placeDetails_title').text(m.text);
        } else {
            $('#placeDetails_title').hide();
            $('#placeDetails_titleIcon').hide();
        }
        $('#placeDetails_address').text('') ;
        if (m.average && m.average.toFixed && m.average !== Math.round(m.average)) {
            m.average = m.average.toFixed(1);
        }
        $('#placeDetails_average').text(m.average || '');
        $('#placeDetails_isPublic').text(m.isPublic === 'true' ? 'Público' : 'Privado');
        $('#placeDetails_structureType').text(m.structureType || '');
        $('#placeDetails_reviews').text(m.reviews && (m.reviews + ' avaliações') || '');
        $('#placeDetails_checkins').text(m.checkin && (m.checkin + ' check-ins') || '');

        var randomPic = Math.floor(Math.random() * N_MOCK_PICS) + 1;
        $('#placeDetails_photo').attr('src','img/photos/'+randomPic+'.jpg');

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

        // Finally, open modal
        $('#placeDetailsModal').modal('toggle');
    }

    function _geolocateAndCenterMap(callback) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    var pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    map.panTo(pos);

                    if (callback && typeof callback === 'function') {
                        callback();
                    }
                }, function() {
                    // @todo show something more informative to the user
                    console.error('Geolocation failed.');

                    if (callback && typeof callback === 'function') {
                        callback();
                    }
                }
            );
        }
    }

    function centerControl(controlDiv, map) {
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
            showSpinner();
            _geolocateAndCenterMap(function() {
                hideSpinner();
            });
        });

    }

    function updateMarkers() {
        _gmarkers = [];

        // Markers from Database
        if (markers && markers.length > 0) {
            // markers.forEach(function(m) {
            for(var i=0; i<markers.length; i++) {

                var whichIcon;
                if (markers[i].reviews === 0) {
                    whichIcon = MARKER_ICON_GRAY;
                } else if (markers[i].average > 0 && markers[i].average < 2) {
                    whichIcon = MARKER_ICON_RED;
                } else if (markers[i].average >= 2 && markers[i].average < 3.5) {
                    whichIcon = MARKER_ICON_YELLOW;
                } else if (markers[i].average >= 3.5) {
                    whichIcon = MARKER_ICON_GREEN;
                } else {
                    whichIcon = MARKER_ICON_GRAY;
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
                        openDetailsModal(markerIndex);
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
                map.panTo(results[0].geometry.location);

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
        addLocationMode = !addLocationMode;

        $('#addPlace').toggleClass('active');
        $('#newPlaceholder').toggleClass('active');
        $('#newPlaceholderShadow').toggle();

        toggleMarkers();
    }

    function addLocation() {
        console.log('add location');

        addLocationModeToggle();

        $('#newPlaceModal').modal('toggle');
    }

    function saveNewPlaceBtn() {
        $('#newPlaceModal').modal('toggle');

        var mapCenter = map.getCenter();
        postPlace({
            lat: '' + mapCenter.lat(),
            lng: '' + mapCenter.lng(),
            isPublic: $('#isPublicCheckbox').val(),
            text: $('#titleInput').val(),
            // @todo more stuff?
        }, function() {
            // Addition finished
            getPlaces(updateMarkers);
        });
    }

    function reviewBtn() {
        $('#reviewModal').modal('toggle');

        function resetStars() {
            $('#review_star1_gold').hide();
            $('#review_star2_gold').hide();
            $('#review_star3_gold').hide();
            $('#review_star4_gold').hide();
            $('#review_star5_gold').hide();
            $('#review_star5_gold').hide();
            $('#review_star1_gray').show();
            $('#review_star2_gray').show();
            $('#review_star3_gray').show();
            $('#review_star4_gray').show();
            $('#review_star5_gray').show();
            $('#review_star5_gray').show();
        }

        function setReviewRating(rating) {
            currentPendingRating = rating;

            resetStars();
            if (rating > 0) {
                $('#review_star1_gold').show();
                $('#review_star1_gray').hide();
            }
            if (rating > 1) {
                $('#review_star2_gold').show();
                $('#review_star2_gray').hide();
            }
            if (rating > 2) {
                $('#review_star3_gold').show();
                $('#review_star3_gray').hide();
            }
            if (rating > 3) {
                $('#review_star4_gold').show();
                $('#review_star4_gray').hide();
            }
            if (rating > 4) {
                $('#review_star5_gold').show();
                $('#review_star5_gray').hide();
            }
        }

        var m = openMarker;
        if (m.text) {
            $('#review_title').show();
            $('#review_titleIcon').show();
            $('#review_title').text(m.text);
        } else {
            $('#review_title').hide();
            $('#review_titleIcon').hide();
        }
        resetStars();

        $('#review_star1_gray, #review_star1_gold').on('click', function() {setReviewRating(1); });
        $('#review_star2_gray, #review_star2_gold').on('click', function() {setReviewRating(2); });
        $('#review_star3_gray, #review_star3_gold').on('click', function() {setReviewRating(3); });
        $('#review_star4_gray, #review_star4_gold').on('click', function() {setReviewRating(4); });
        $('#review_star5_gray, #review_star5_gold').on('click', function() {setReviewRating(5); });
    }

    function sendReviewBtn() {
        postReview(openMarker.id, currentPendingRating, function() {
            $('#reviewModal').modal('toggle');
            $('#placeDetailsModal').modal('toggle');

            getPlaces(updateMarkers);
        });
    }

    function postCheckinBtn() {
        postCheckin(openMarker.id, function() {
            $('#placeDetailsModal').modal('toggle');

            getPlaces(updateMarkers);
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
              map.panTo(place.geometry.location);
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

    function showSpinner() {
        $('#spinnerOverlay').fadeIn();
    }

    function hideSpinner() {
        $('#spinnerOverlay').fadeOut();
    }

    function _initTriggers() {
        $('#locationQueryBtn').on('click', searchLocation);

        $('#addPlace').on('click', addLocationModeToggle);

        $('#newPlaceholder').on('click', addLocation);

        $('#saveNewPlaceBtn').on('click', saveNewPlaceBtn);

        $('#reviewBtn').on('click', reviewBtn);
        $('#sendReviewBtn').on('click', sendReviewBtn);

        $('#checkinBtn').on('click', postCheckinBtn);

        $('.typeIcon').on('click', function(event){
            $('#'+event.target.id).parent().addClass('active');
            var i = 1;
            while(i<=5){
                if (event.target.id != i) {
                    $('#'+i).parent().removeClass('active');
                }
             i++;
            }
        });
    }

    function init() {
        map = new google.maps.Map(document.getElementById('map'), {
            center: {
                lat: -30.0346,
                lng: -51.2177
            },
            zoom: 15,
            disableDefaultUI: true,
            scaleControl: false,
            // zoomControl: true,
            styles: _gmapsCustomStyle,
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

        _initTriggers();

        getPlaces(updateMarkers);

    }

    //////////////////////////
    // Start initialization //
    //////////////////////////

    showSpinner();
    init();
    _geolocateAndCenterMap();
});
