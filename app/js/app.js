/* global BIKE, google */
/* eslint no-console: ["warn", { allow: ["log", "warn", "error"] }] */
/* eslint-env node, jquery */


$(function () {
  function openDetailsModal(i) {
    if (addLocationMode) {
      return false;
    }

    openedMarker = markers[i];
    const m = openedMarker;


    var isPublicIcon = m.isPublic === 'true' ? 'img/icon_public.svg' : 'img/icon_private.svg';
    var structureTypeIcon = '';
    switch (m.structureType) {
      case 'U Invertido': structureTypeIcon = 'img/tipo_uinvertido.svg'; break;
      case 'De roda': structureTypeIcon = 'img/tipo_deroda.svg'; break;
      case 'Trave': structureTypeIcon = 'img/tipo_trave.svg'; break;
      case 'Suspenso': structureTypeIcon = 'img/tipo_suspenso.svg'; break;
      case 'Grade': structureTypeIcon = 'img/tipo_grade.svg'; break;
    }

    let templateData = {};
    templateData.title = m.text;
    templateData.address = '';

    // Average
    if (m.average && m.average.toFixed && m.average !== Math.round(m.average)) {
      m.average = m.average.toFixed(1);
    }
    if (m.average) {
      templateData.average = m.average;
    }

    // Tags
    templateData.tagsButtons = tags.map(t => {
      return `<button class="btn btn-tag" data-toggle="button">${t}</button>`;
    }).join('');

    templateData.tags = m.tags
      .sort((a, b) => {return b.count - a.count; })
      .map(t => {
        return t.count > 0 ? `<span class="tagDisplay"><span class="badge">${t.count}</span> ${t.name}</span>` : '';
      })
      .join('');

    // Reviews, checkins
    templateData.numReviews = m.reviews && (m.reviews + ' avaliações') || '';
    templateData.numCheckins = m.checkin && (m.checkin + ' check-ins') || '';

    // Render handlebars template
    $('#placeDetailsModalTemplatePlaceholder').html(templates.placeDetailsModalTemplate(templateData));

    
    // Template is rendered, start jquerying

    $('#placeDetails_heading').toggle(m.text && m.text.length > 0);

    // Average - stars
    $('input[name=placeDetails_rating]').val([''+Math.round(m.average)]);

    // Is public?
    $('#placeDetails_isPublic_icon').attr('src', isPublicIcon);
    $('#placeDetails_isPublic').html(m.isPublic === 'true' ? 'Público' : 'Restrito<br><span class="small">(apenas clientes)</span>');

    // Structure type
    $('#placeDetails_structureType_icon').attr('src', structureTypeIcon);
    $('#placeDetails_structureType').text(m.structureType ? 'Bicicletario ' + m.structureType : '');

    // Pic
    var randomPic = Math.floor(Math.random() * N_MOCK_PICS) + 1;
    $('#placeDetails_photo').attr('src','img/photos/'+randomPic+'.jpg');


    $('#placeDetailsModal .flipper').removeClass('flipped');
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
            map.setZoom(17);

            if (callback && typeof callback === 'function') {
              callback();
            }
          },
          function() {
              // @todo show something more informative to the user
            console.error('Geolocation failed.');

            if (callback && typeof callback === 'function') {
              callback();
            }
          }
      );
    }
  }

  function centerControl(controlDiv) {
        // Set CSS for the control border.
    var controlUI = document.createElement('div');
    controlUI.id = 'centerControlBtn';
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '50%';
        // controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI.style.cursor = 'pointer';
    controlUI.style.margin = '0 20px 90px';
    controlUI.style.width = '35px';
    controlUI.style.height = '35px';
    controlUI.style.textAlign = 'center';
    controlUI.style.boxShadow = '0 0 4px 0 rgba(0, 0, 0, 0.15), 0 2px 2px 0 rgba(0, 0, 0, 0.06';

    controlUI.title = 'Clique para centralizar mapa';

    controlDiv.appendChild(controlUI);

        // Set CSS for the control interior.
    var controlText = document.createElement('div');
    controlText.style.color = '#30bb6a';
    controlText.style.fontSize = '16px';
    controlText.style.padding = '7px';
    controlText.innerHTML = '<span class="glyphicon glyphicon-record"></span>';
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
    hideSpinner();

    deleteMarkers();

    // Markers from Database
    if (markers && markers.length > 0) {
      // markers.forEach(function(m) {
      for(var i=0; i<markers.length; i++) {
        var m = markers[i];

        // Icon
        var iconUrl;
        if (!m.reviews) {
          iconUrl = MARKER_ICON_GRAY;
        } else if (m.average > 0 && m.average < 2) {
          iconUrl = MARKER_ICON_RED;
        } else if (m.average >= 2 && m.average < 3.5) {
          iconUrl = MARKER_ICON_YELLOW;
        } else if (m.average >= 3.5) {
          iconUrl = MARKER_ICON_GREEN;
        } else {
          iconUrl = MARKER_ICON_GRAY;
        }

                // Scaling
        var scale;
        if (!m.reviews) {
          scale = 0.8;
        } else {
          scale = 0.5 + (m.average/10);
        }

        var icon = {
          url: iconUrl, // url
          scaledSize: new google.maps.Size((MARKER_W*scale), (MARKER_H*scale)), // scaled size
          origin: new google.maps.Point(0, 0), // origin
          anchor: new google.maps.Point((MARKER_W*scale)/2, (MARKER_H*scale)), // anchor
        };

        _gmarkers[i] = new google.maps.Marker({
          position: {
            lat: Number.parseFloat(m.lat),
            lng: Number.parseFloat(m.lng)
          },
          map: map,
          icon: icon,
          title: m.text,
          // opacity: 0.1 + (m.average/5).
        });

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
  function setMapOnAll (map) {
    if (_gmarkers && Array.isArray(_gmarkers)) {
      _gmarkers.forEach(function(m) {
        m.setMap(map);
      });
    }
  }

    // Removes the markers from the map, but keeps them in the array.
  function hideMarkers () {
    areMarkersHidden = true;
    // setMapOnAll(null);
    _gmarkers.forEach(i => {
      i.setOptions({clickable: false, opacity: 0.3});
    });
  }

    // Shows any markers currently in the array.
  function showMarkers () {
    areMarkersHidden = false;
    // setMapOnAll(map);
    _gmarkers.forEach(i => {
      i.setOptions({clickable: true, opacity: 1});
    });
  }

    // Deletes all markers in the array by removing references to them.
  function deleteMarkers () {
    setMapOnAll(null);
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

    // if (addLocationMode) {
    //   if (map.getZoom() < 18) {
    //     map.setZoom(18);
    //   }
    // }

    $('#addPlace').toggleClass('active');
    $('#newPlaceholder').toggleClass('active');
    $('#newPlaceholderShadow').toggle();
    $('#centerControlBtn').toggle();
    $('#locationSearch').toggleClass('coolHide');

    toggleMarkers();
  }

  function saveNewPlaceCB() {
    $('#newPlaceModal').modal('toggle');

    var mapCenter = map.getCenter();
    Database.sendPlace({
      lat: '' + mapCenter.lat(),
      lng: '' + mapCenter.lng(),
      text: $('#newPlaceModal #titleInput').val(),
      isPublic: $('#newPlaceModal input:radio[name=isPublicRadioGrp]:checked').val(),
      structureType: $('#newPlaceModal .typeIcon.active').data('type'),
      // @todo retrieve tags
    }, function() {
      // Addition finished
      showSpinner();
      Database.getPlaces(updateMarkers);
    });
  }

  function sendCheckinBtn() {
    Database.sendCheckin(openedMarker.id, function() {
      $('#placeDetailsModal').modal('toggle');

      showSpinner();
      Database.getPlaces(updateMarkers);
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
        console.error('Autocomplete\'s returned place contains no geometry');
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

  function toggleSpinner () {
    $('#spinnerOverlay').fadeToggle();
  }

  function showSpinner () {
    $('#spinnerOverlay').fadeIn();
  }

  function hideSpinner () {
    $('#spinnerOverlay').fadeOut();
    $('.coolHide').removeClass('coolHide');
  }

  function photoUploadCB(e) {
    if (e.target.result) {
      uploadingPhotoBlob = e.target.result;
      $('#photoInputBg').attr('src', uploadingPhotoBlob);
      // $('#photoInput + label').fadeOut();
    }
  }

  function _initTemplates() {
    templates.placeDetailsModalTemplate = Handlebars.compile($('#placeDetailsModalTemplate').html());
  }

  function validateNewPlaceForm() {
    const textOk = $('#newPlaceModal #titleInput').val().length > MIN_TITLE_CHARACTERS;
    const isOk =
      textOk &&
      $('#newPlaceModal input:radio[name=isPublicRadioGrp]:checked').val() &&
      $('#newPlaceModal .typeIcon.active').data('type');

    $('#newPlaceModal .little-pin').toggleClass('gray', !textOk);

    console.log('validating');

    $('#newPlaceModal #saveNewPlaceBtn').prop('disabled', !isOk);
  }

  function _initTriggers() {
    // Home
    $('body').on('click', '#locationQueryBtn', searchLocation);

    $('body').on('click', '#addPlace', addLocationModeToggle);

    $('body').on('click', '#newPlaceholder', function() {
      console.log('add location');

      addLocationModeToggle();

      // Reset fields
      $('#newPlaceModal .little-pin').toggleClass('gray', true);
      $('#newPlaceModal #saveNewPlaceBtn').prop('disabled', true);
      $('#newPlaceModal #titleInput').val('');
      $('#newPlaceModal .typeIcon').removeClass('active');
      $('#newPlaceModal input[name=isPublicRadioGrp]').prop('checked',false);
      $('#newPlaceModal .tagsContainer button').removeClass('active');
      $('#newPlaceModal').modal('toggle');
    });


    // New place panel
    $('body').on('click', '.typeIcon', function(e){
      $(e.currentTarget).siblings('.typeIcon').removeClass('active');
      $(e.currentTarget).addClass('active');
    });

    $('body').on('change input click','#newPlaceModal input, #newPlaceModal .typeIcon', function() {
      // this has to be AFTER the typeIcon click trigger
      validateNewPlaceForm();
    }); 


    $('body').on('click', '#saveNewPlaceBtn', saveNewPlaceCB);

    $(':file').change(function () {
      if (this.files && this.files[0]) {
        var reader = new FileReader();
        reader.onload = photoUploadCB;
        reader.readAsDataURL(this.files[0]);
      }
    });

    // Review panel
    $('body').on('click', '#openReviewPanelBtn', function() {
      var m = openedMarker;
      if (m.text) {
        $('#review_title').show();
        $('#review_titleIcon').show();
        $('#review_title').text(m.text);
      } else {
        $('#review_title').hide();
        $('#review_titleIcon').hide();
      }

      // Reset fields
      $('#reviewPanel .tagsContainer button').removeClass('active');
      $('#reviewPanel input:radio[name=rating]:checked').prop('checked', false);

      // $('#reviewPanel').modal('toggle');
      $('#placeDetailsModal .flipper').toggleClass('flipped');
    });

    $('body').on('change', '.rating', function(e) {
      currentPendingRating = $(e.target).val();
    });

    $('body').on('click', '#sendReviewBtn', function() {
      Database.sendReview(openedMarker.id, currentPendingRating, function() {
        $('#reviewModal').modal('toggle');
        $('#placeDetailsModal').modal('toggle');
        // @todo retrieve tags

        showSpinner();
        Database.getPlaces(updateMarkers);
      });
    });


    // Details panel
    $('body').on('click', '#checkinBtn', sendCheckinBtn);
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

    // Add cyclabe path bike Layer
    // var bikeLayer = new google.maps.BicyclingLayer();
    // bikeLayer.setMap(map);

    // Geolocalization button
    if (navigator.geolocation) {
      var centerControlDiv = document.createElement('div');
      new centerControl(centerControlDiv, map);
      centerControlDiv.index = 1;
      map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(centerControlDiv);
    }

    _initTriggers();

    _initTemplates();

    showSpinner();
    Database.getPlaces(updateMarkers);

  }

    //////////////////////////
    // Start initialization //
    //////////////////////////

  showSpinner();
  init();
  // _geolocateAndCenterMap();
});
