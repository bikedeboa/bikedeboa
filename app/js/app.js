/* eslint no-console: ["warn", { allow: ["log", "warn", "error"] }] */
/* eslint-env node, jquery */


$(function () {
  function openDetailsModal(i) {
    if (addLocationMode) {
      return false;
    }

    openedMarker = markers[i];
    const m = openedMarker;
    let templateData = {};

    templateData.title = m.text;
    templateData.address = '';

    // Average
    if (m.average) {
      if (m.average.toFixed && m.average !== Math.round(m.average)) {
        m.average = m.average.toFixed(1);
      }
      templateData.average = m.average;
    }

    // Tags
    const MAX_TAG_COUNT = 20;
    const MIN_TAG_OPACITY = 0.2;
    if (m.tags && m.tags.length > 0) {
      templateData.tags = m.tags
        .sort((a, b) => {return b.count - a.count;})
        .map(t => {
          const opacity = t.count/MAX_TAG_COUNT + MIN_TAG_OPACITY;
          return t.count > 0 ? `<span class="tagDisplay" style="opacity: ${opacity}"><span class="badge">${t.count}</span> ${t.name}</span>` : '';
        })
        .join('');
    }

    // Reviews, checkins
    templateData.numReviews = m.reviews || '';
    templateData.numCheckins = m.checkin && (m.checkin + ' check-ins') || '';

    if (loggedUser) {
      templateData.admin = true;
    }

    // Render handlebars template
    $('#placeDetailsModalTemplatePlaceholder').html(templates.placeDetailsModalTemplate(templateData));


    // Template is rendered, start jquerying

    $('#placeDetails_heading').toggle(m.text && m.text.length > 0);

    $('.numreviews').toggle(m.reviews && m.reviews > 0);

    // Average - stars
    $('input[name=placeDetails_rating]').val([''+Math.round(m.average)]);

    // Is public?
    if (m.isPublic != null) {
      $('#placeDetails_isPublic_icon').attr('src', m.isPublic === true ? 'img/icon_public.svg' : 'img/icon_private.svg');
      $('#placeDetails_isPublic').html(m.isPublic === true ? 'Público' : 'Restrito<br><small>(apenas clientes)</small>');
    } else {
      // $('#placeDetails_isPublic_icon').attr('src', '');
      $('#placeDetails_isPublic').html('<small>Sem dados.</small>');
    }

    // Structure type
    let structureTypeIcon;
    switch (m.structureType) {
      case 'uinvertido': structureTypeIcon = 'img/tipo_uinvertido.svg'; break;
      case 'deroda': structureTypeIcon = 'img/tipo_deroda.svg'; break;
      case 'trave': structureTypeIcon = 'img/tipo_trave.svg'; break;
      case 'suspenso': structureTypeIcon = 'img/tipo_suspenso.svg'; break;
      case 'grade': structureTypeIcon = 'img/tipo_grade.svg'; break;
      case 'other': structureTypeIcon = 'img/tipo_other.svg'; break;
    }
    $('#placeDetails_structureType_icon').attr('src', structureTypeIcon);
    $('#placeDetails_structureType').html(m.structureType ? 'Bicicletário ' + STRUCTURE_CODE_TO_NAME[m.structureType] : '<small>Sem dados.</small>');

    // Pic
    if (m.photo) {
      $('#placeDetails_photo').attr('src', Database.API_URL + '/' + m.photo);
    }


    $('#placeDetailsModal .flipper').removeClass('flipped');
    $('#placeDetailsModal').modal('show');
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
          () => {
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
  
    // Setup the click event listeners
    controlUI.addEventListener('click', () => {
      showSpinner();
      _geolocateAndCenterMap(() => {
        hideSpinner();
      });
    });

  }

  function onMarkerClick(markerIndex) {
    const marker = markers[markerIndex];
    
    if (marker._hasDetails) {
      openDetailsModal(markerIndex);
    } else {
      showSpinner();
      Database.getPlaceDetails(marker.id, () => {
        hideSpinner();
        openDetailsModal(markerIndex);
      });
    }
  }

  function updateMarkers() {
    hideSpinner();

    deleteMarkers();

    // Markers from Database
    if (markers && markers.length > 0) {
      // Order by average
      markers = markers.sort((a, b) => {
        return a.average - b.average;
      });

      for(let i=0; i<markers.length; i++) {
        const m = markers[i];

        // Icon and Scaling
        let iconUrl;
        let scale;
        if (!m.average || m.average === 0) {
          iconUrl = MARKER_ICON_GRAY;
          scale = 0.8;
        } else if (m.average > 0 && m.average < 2) {
          iconUrl = MARKER_ICON_RED;
        } else if (m.average >= 2 && m.average < 3.5) {
          iconUrl = MARKER_ICON_YELLOW;
        } else if (m.average >= 3.5) {
          iconUrl = MARKER_ICON_GREEN;
        } else {
          iconUrl = MARKER_ICON_GRAY;
        }

        if (!scale) {
          scale = 0.5 + (m.average/10);
        }

        const icon = {
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
          zIndex: i, //markers should be ordered by average
          // opacity: 0.1 + (m.average/5).
        });

        (function (markerIndex) {
          _gmarkers[markerIndex].addListener('click', () => {
            onMarkerClick(markerIndex);
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

  function toggleLocationInputMode() {
    addLocationMode = !addLocationMode;

    if (addLocationMode) {
      $(document).on('keyup.disableInput', e => {
        if (e.keyCode === 27) {
          toggleLocationInputMode();
        }
      });
      // Adjust for a minimum zoom for improved recommended precision
      // if (map.getZoom() < 18) {
      //   map.setZoom(18);
      // }
    } else {
      $(document).off('keyup.disableInput');
    }

    $('#addPlace').toggleClass('active');
    $('#newPlaceholder').toggleClass('active');
    $('#newPlaceholderShadow').toggle();
    $('#centerControlBtn').toggle();
    $('#locationSearch').toggleClass('coolHide');

    toggleMarkers();
  }

  // @todo refactor this, it's confusing
  function sendNewPlace() { 
    $('#newPlaceModal').modal('hide');
    showSpinner();

    const isUpdate = openedMarker && loggedUser;
    let place = {};

    // Update case
    if (isUpdate) {
      place.lat = openedMarker.lat;
      place.lng = openedMarker.lng;
    } else {
      const mapCenter = map.getCenter();
      place.lat = mapCenter.lat();
      place.lng = mapCenter.lng();
    }

    place.text = $('#newPlaceModal #titleInput').val();
    place.isPublic = $('#newPlaceModal input:radio[name=isPublicRadioGrp]:checked').val();
    place.structureType = $('#newPlaceModal .typeIcon.active').data('type');
    place.photo = _uploadingPhotoBlob;

    const callback = () => {
      Database.getPlaces(updateMarkers);
    };

    if (isUpdate) {
      Database.updatePlace(openedMarker.id, place, callback);
    } else {
      Database.sendPlace(place, callback);
    }
  }

  function sendCheckinBtn() {
    Database.sendCheckin(openedMarker.id, () => {
      $('#placeDetailsModal').modal('show');

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


    autocomplete.addListener('place_changed', () => {
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

      // Custom icon depending on place type
      // marker.setIcon(/** @type {google.maps.Icon} */({
      //   url: place.icon,
      //   size: new google.maps.Size(71, 71),
      //   origin: new google.maps.Point(0, 0),
      //   anchor: new google.maps.Point(17, 34),
      //   scaledSize: new google.maps.Size(35, 35)
      // }));
      
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
    console.log('showspinner'); 
    $('#spinnerOverlay').fadeIn();
  }

  function hideSpinner () {
    $('#spinnerOverlay').fadeOut();
    $('.coolHide').removeClass('coolHide');
  }

  function photoUploadCB(e) {
    if (e.target.result) {
      _uploadingPhotoBlob = e.target.result;
      $('#photoInputBg').attr('src', _uploadingPhotoBlob);
      // $('#photoInput + label').fadeOut();
    }
  }

  function _initTemplates() {
    templates.placeDetailsModalTemplate = Handlebars.compile($('#placeDetailsModalTemplate').html());
    templates.reviewPanelTemplate = Handlebars.compile($('#reviewPanelTemplate').html());
  }

  function validateNewPlaceForm() {
    const textOk = $('#newPlaceModal #titleInput').val().length > MIN_TITLE_CHARACTERS;
    const isOk =
      textOk &&
      $('#newPlaceModal input:radio[name=isPublicRadioGrp]:checked').val() &&
      $('#newPlaceModal .typeIcon.active').data('type');

    $('#newPlaceModal .little-pin').toggleClass('gray', !textOk);

    // console.log('validating');

    $('#newPlaceModal #saveNewPlaceBtn').prop('disabled', !isOk);
  }


  function validateReviewForm() {
    const isOk = currentPendingRating;

    // console.log('validating review form');

    $('#sendReviewBtn').prop('disabled', !isOk);
  }

  function openNewPlaceModal() {
    // Reset fields
    _uploadingPhotoBlob = '';
    $('#newPlaceModal .little-pin').toggleClass('gray', true);
    $('#newPlaceModal #saveNewPlaceBtn').prop('disabled', true);
    $('#newPlaceModal #titleInput').val('');
    $('#newPlaceModal .typeIcon').removeClass('active');
    $('#newPlaceModal input[name=isPublicRadioGrp]').prop('checked',false);
    // $('#newPlaceModal .tagsContainer button').removeClass('active');

    if (openedMarker && loggedUser) {
      // @todo refactor this, probably separate into different functions

      const m = openedMarker;
      $('#newPlaceModal #titleInput').val(m.text);
      $(`#newPlaceModal .typeIcon[data-type="${m.structureType}"]`).addClass('active');
      $('#newPlaceModal #saveNewPlaceBtn').prop('disabled', false);
      $(`#newPlaceModal input[name=isPublicRadioGrp][value="${m.isPublic}"]`).prop('checked', true);

      $('#placeDetailsModal').modal('hide');
    } else {
      toggleLocationInputMode();
    }
    
    $('#newPlaceModal').modal('show');
  }

  function openReviewPanel() {
    $('#placeDetailsModal').modal('hide'); 

    const m = openedMarker;

    let templateData = {};
    templateData.title = m.text;
    templateData.address = '';
    
    // Tags
    templateData.tagsButtons = tags.map(t => {
      return `<button class="btn btn-tag" data-toggle="button" data-value="${t.id}">${t.name}</button>`;
    }).join('');

    // Compile template
    $('#reviewPanelTemplatePlaceholder').html(templates.reviewPanelTemplate(templateData));

    
    // Template is rendered, start jquerying 

    // Reset fields
    if (m.text) {
      $('#review_title').show();
      $('#review_titleIcon').show();
      $('#review_title').text(m.text);
    } else {
      $('#review_title').hide();
      $('#review_titleIcon').hide();
    }

    $('#sendReviewBtn').prop('disabled', true);

    $('#reviewPanel .tagsContainer button').removeClass('active');
    $('#reviewPanel input:radio[name=rating]:checked').prop('checked', false);

    $('#reviewPanel').modal('show');
    // $('#placeDetailsModal .flipper').toggleClass('flipped');
  }

  function _initTriggers() {
    // Home
    $('body').on('click', '#locationQueryBtn', searchLocation);

    $('body').on('click', '#addPlace', toggleLocationInputMode);


    // New place panel
    $('body').on('click', '#newPlaceholder', () => {
      openedMarker = null;
      openNewPlaceModal();
    });

    $('body').on('click', '.typeIcon', function(e){
      $(e.currentTarget).siblings('.typeIcon').removeClass('active');
      $(e.currentTarget).addClass('active');
    });

    $('body').on('change input click','#newPlaceModal input, #newPlaceModal .typeIcon', () => {
      // this has to be AFTER the typeIcon click trigger
      validateNewPlaceForm();
    });


    $('body').on('click', '#saveNewPlaceBtn', sendNewPlace);

    $('body').on('click', '#editPlaceBtn', openNewPlaceModal);

    $(':file').change(function () {
      if (this.files && this.files[0]) {
        var reader = new FileReader();
        reader.onload = photoUploadCB;
        reader.readAsDataURL(this.files[0]);
      }
    });

    // Review panel
    $('body').on('click', '#ratingDisplay, #openReviewPanelBtn', () => {
      openReviewPanel();
    });

    $('body').on('change', '#reviewPanel .rating', function(e) {
      currentPendingRating = $(e.target).val();
      validateReviewForm();
    });

    $('body').on('click', '#sendReviewBtn', () => {
      const activeTagBtns = $('#reviewPanel .tagsContainer .btn.active');
      let reviewTags = [];
      for(let i=0; i<activeTagBtns.length; i++) {
        reviewTags.push( {id: ''+activeTagBtns.eq(i).data('value')} );
      }

      $('#reviewPanel').modal('hide');
      $('#placeDetailsModal').modal('hide');
      showSpinner();
      Database.sendReview(openedMarker.id, currentPendingRating, reviewTags, () => {
        Database.getPlaces(updateMarkers);
      });
    });


    // Details panel
    $('body').on('click', '#openDirectionsBtn', () => {
      window.location.href = `https://www.google.com/maps/dir//${openedMarker.lat},${openedMarker.lng}`; 
    });

    $('body').on('click', '#checkinBtn', sendCheckinBtn);
    
    $('body').on('click', '.modal-header img', e => {
      $(e.target).parent().toggleClass('expanded');
    });
  }

  function setup() {
    map = new google.maps.Map(document.getElementById('map'), {
      center: {
        lat: -30.0346,
        lng: -51.2177
      },
      zoom: 15,
      disableDefaultUI: true,
      scaleControl: false,
      clickableIcons: false,
      zoomControl: isDesktop(),
      styles: _gmapsCustomStyle,
    });

    geocoder = new google.maps.Geocoder();

    setupAutocomplete();

    // Add cyclable path bike Layer
    // var bikeLayer = new google.maps.BicyclingLayer();
    // bikeLayer.setMap(map);

    // Geolocalization button
    if (navigator.geolocation) {
      let centerControlDiv = document.createElement('div');
      new centerControl(centerControlDiv, map);
      centerControlDiv.index = 1;
      map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(centerControlDiv);
    }

    _initTriggers();

    _initTemplates();
  }

  function init() {
    if (isDemoMode) {
      Database = BIKE.MockedDatabase;
    } else {
      Database = BIKE.Database;
    }

    showSpinner(); 
     
    Database.authenticate(() => {
      Database.getAllTags();
      Database.getPlaces(updateMarkers);
    });
  }

  window.toggleDemoMode = () => {
    showSpinner();
    isDemoMode = !isDemoMode;
    init();
  };

  //////////////////////////
  // Start initialization //
  //////////////////////////

  setup();
  init();
  // _geolocateAndCenterMap();
});
