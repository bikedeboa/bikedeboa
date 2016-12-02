/* eslint no-console: ["warn", { allow: ["log", "warn", "error"] }] */
/* eslint-env node, jquery */


$(function () {
  function openDetailsModal(i) {
    if (addLocationMode) {
      return false;
    }

    openedMarker = markers[i];
    const m = openedMarker;

    History.pushState({}, 'Detalhes do bicicletário', 'detalhes');

    let templateData = {};

    templateData.title = m.text;
    templateData.address = m.address;
    templateData.description = m.description;

    // Average
    if (m.average) {
      if (m.average.toFixed && m.average !== Math.round(m.average)) {
        m.average = m.average.toFixed(1);
      }
      templateData.average = m.average;
    }

    // Tags
    const MAX_TAG_COUNT = m.reviews;
    const MIN_TAG_OPACITY = 0.2;
    if (m.tags && m.tags.length > 0) {
      templateData.tags = m.tags
        .sort((a, b) => {return b.count - a.count;})
        .map(t => {
          // Tag opacity is proportional to count
          // @todo refactor this to take into account Handlebars native support for arrays
          const opacity = t.count/MAX_TAG_COUNT + MIN_TAG_OPACITY;
          return t.count > 0 ? `<span class="tagDisplay" style="opacity: ${opacity}"><span class="badge">${t.count}</span> ${t.name}</span>` : '';
        })
        .join('');
    }

    // Reviews, checkins
    templateData.numReviews = m.reviews || '';
    templateData.numCheckins = m.checkin && (m.checkin + ' check-ins') || '';

    if (loggedUser) {
      templateData.isAdmin = true;
    }

    // Route button
    templateData.gmapsRedirectUrl = `https://www.google.com/maps/dir//${m.lat},${m.lng}`;

    // Photo
    templateData.photoUrl = m.photo;

    // Is public?
    if (m.isPublic != null) {
      templateData.isPublic = m.isPublic === true;
    } else {
      templateData.noIsPublicData = true;
    }

    // Structure type
    let structureTypeIcon;
    switch (m.structureType) {
      case 'uinvertido': structureTypeIcon = '/img/tipo_uinvertido.svg'; break;
      case 'deroda': structureTypeIcon = '/img/tipo_deroda.svg'; break;
      case 'trave': structureTypeIcon = '/img/tipo_trave.svg'; break;
      case 'suspenso': structureTypeIcon = '/img/tipo_suspenso.svg'; break;
      case 'grade': structureTypeIcon = '/img/tipo_grade.svg'; break;
      case 'other': structureTypeIcon = '/img/tipo_other.svg'; break;
    }
    if (m.structureType) {
      templateData.structureTypeLabel = 'Bicicletário ' + STRUCTURE_CODE_TO_NAME[m.structureType];
    }
    templateData.structureTypeIcon = structureTypeIcon;


    ////////////////////////////////
    // Render handlebars template //
    ////////////////////////////////
    $('#placeDetailsModalTemplatePlaceholder').html(templates.placeDetailsModalTemplate(templateData));

    // Template is rendered, start jquerying
    $('.numreviews').toggle(m.reviews && m.reviews > 0);
    $('input[name=placeDetails_rating]').val([''+Math.round(m.average)]);
  }

  function _geolocate(toCenter, callback) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
          function(position) {
            var pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };

            if (toCenter) {
              map.panTo(pos);
              map.setZoom(17);
            }

            _geolocationMarker.setPosition(pos);
            _geolocationMarker.setVisible(true);

            if (callback && typeof callback === 'function') {
              callback();
            }
          },
          (error) => {
              // @todo show something more informative to the user
            console.error('Geolocation failed!');
            console.error(error);

            // Secure Origin issue test by Google: https://developers.google.com/web/updates/2016/04/geolocation-on-secure-contexts-only?hl=en
            if(error.message.indexOf('Only secure origins are allowed') == 0) {
              // Disable button since it won't work anyway in the current domain.
              $('#geolocationBtn').hide();
            }

            if (callback && typeof callback === 'function') {
              callback();
            }
          }, {
            enableHighAccuracy: true,
            timeout: 5000
          }
      );
    }
  }

  function geolocationBtn(controlDiv) {
    // Set CSS for the control border.
    var controlUI = document.createElement('div');
    controlUI.id = 'geolocationBtn';
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '50%';
    // controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI.style.cursor = 'pointer';
    controlUI.style.margin = '0 20px 90px';
    controlUI.style.width = '50px';
    controlUI.style.height = '50px';
    controlUI.style.textAlign = 'center';
    controlUI.style.boxShadow = '0 0 4px 0 rgba(0, 0, 0, 0.15), 0 2px 2px 0 rgba(0, 0, 0, 0.06';

    controlUI.title = 'Clique para centralizar mapa';

    controlDiv.appendChild(controlUI);

    // Set CSS for the control interior.
    var controlText = document.createElement('div');
    controlText.style.color = '#30bb6a';
    controlText.style.width = '100%';
    controlText.style.paddingTop = '13px';
    controlText.innerHTML = '<img src="/img/geolocation.svg" style="width: 20px;"/>';
    controlUI.appendChild(controlText);

    // Setup the click event listeners
    controlUI.addEventListener('click', () => {
      showSpinner();
      _geolocate(true, () => {
        hideSpinner();
      });
    });

  }

  function onMarkerClick(markerIndex) {
    const marker = markers[markerIndex];

    $('#placeDetailsModalTemplatePlaceholder').html(templates.placeDetailsModalLoadingTemplate());
    $('#placeDetailsModal').modal('show');

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

  function addMarkerToMap(markerIndexInArray) {
    const i = markerIndexInArray;
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

    // @todo temporarily disabled this because backend still doesnt support flags for these
    // let labelStr;
    // if (loggedUser && (!m.photo || !m.structureType || m.isPublic == null)) {
    //   labelStr = '?';
    // }

    _gmarkers.push(new google.maps.Marker({
      position: {
        lat: Number.parseFloat(m.lat),
        lng: Number.parseFloat(m.lng)
      },
      map: map,
      icon: icon,
      title: m.text,
      // label: labelStr && {
      //   text: labelStr,
      //   color: 'white',
      //   fontFamily: 'Roboto'
      // },
      zIndex: i, //markers should be ordered by average
      // opacity: 0.1 + (m.average/5).
    }));

    (function (markerIndex) {
      _gmarkers[markerIndex].addListener('click', () => {
        onMarkerClick(markerIndex);
      });
    }(i));
  }

  function updateMarkers() {
    hideSpinner();

    clearMarkers();

    // Markers from Database
    if (markers && markers.length > 0) {
      // Order by average so best ones will have higher z-index
      markers = markers.sort((a, b) => {
        return a.average - b.average;
      });

      for(let i=0; i<markers.length; i++) {
        addMarkerToMap(i);
      }
    }
  }

  function searchLocation() {
    var address = $('#locationQueryInput').val();

    console.log('Searching for ' + address);

    geocoder.geocode({'address': address}, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK) {
        map.panTo(results[0].geometry.location);

        // Create marker on located place
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
  function clearMarkers () {
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
    $('#geolocationBtnBtn').toggle();
    $('#locationSearch').toggleClass('coolHide');

    toggleMarkers();
  }

  // @todo refactor this, it's confusing
  function sendNewPlace() {
    // $('#newPlaceModal').modal('hide');
    History.pushState({}, 'bike de boa', '/');
    showSpinner();

    const isUpdate = openedMarker && loggedUser;
    let place = {};

    place.lat = isUpdate ? openedMarker.lat : newMarkerTemp.lat;
    place.lng = isUpdate ? openedMarker.lng : newMarkerTemp.lng;
    if (!isUpdate && newMarkerTemp.address) {
      place.address = newMarkerTemp.address;
    }

    place.text = $('#newPlaceModal #titleInput').val();
    place.isPublic = $('#newPlaceModal input:radio[name=isPublicRadioGrp]:checked').val();
    place.structureType = $('#newPlaceModal .typeIcon.active').data('type');
    place.photo = _uploadingPhotoBlob;
    place.description = $('#newPlaceModal #descriptionInput').val();

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
    const inputElem = document.getElementById('locationQueryInput');
    let autocomplete = new google.maps.places.Autocomplete(inputElem);
    autocomplete.bindTo('bounds', map);

    // var infowindow = new google.maps.InfoWindow();
    _searchResultMarker = new google.maps.Marker({
      map: map,
      anchorPoint: new google.maps.Point(0, -29)
    });


    autocomplete.addListener('place_changed', () => {
      // infowindow.close();
      _searchResultMarker.setVisible(false);
      const place = autocomplete.getPlace();
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
      // _searchResultMarker.setIcon(/** @type {google.maps.Icon} */({
      //   url: place.icon,
      //   size: new google.maps.Size(71, 71),
      //   origin: new google.maps.Point(0, 0),
      //   anchor: new google.maps.Point(17, 34),
      //   scaledSize: new google.maps.Size(35, 35)
      // }));

      _searchResultMarker.setPosition(place.geometry.location);
      _searchResultMarker.setVisible(true);

      // var address = '';
      // if (place.address_components) {
      //   address = [
      //               (place.address_components[0] && place.address_components[0].short_name || ''),
      //               (place.address_components[1] && place.address_components[1].short_name || ''),
      //               (place.address_components[2] && place.address_components[2].short_name || '')
      //   ].join(' ');
      // }
      // infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
      // infowindow.open(map, marker);
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
    templates.placeDetailsModalLoadingTemplate = Handlebars.compile($('#placeDetailsModalLoadingTemplate').html());
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
    function activateModal() {
      $('#newPlaceModal').modal('show');

      History.pushState({}, 'Novo bicicletário', 'novo');

      validateNewPlaceForm();
    }

    // Reset fields
    newMarkerTemp = {};
    _uploadingPhotoBlob = '';
    $('#newPlaceModal .little-pin').toggleClass('gray', true);
    $('#newPlaceModal #saveNewPlaceBtn').prop('disabled', true);
    $('#newPlaceModal #titleInput').val('');
    $('#newPlaceModal .typeIcon').removeClass('active');
    $('#newPlaceModal input[name=isPublicRadioGrp]').prop('checked',false);
    $('#newPlaceModal #photoInputBg').attr('src', '');
    $('#newPlaceModal #descriptionInput').val('');
    // $('#newPlaceModal .tagsContainer button').removeClass('active');

    // Not creating a new one, but editing
    if (openedMarker && loggedUser) {
      // @todo refactor this, probably separate into different functions

      const m = openedMarker;
      $('#newPlaceModal #titleInput').val(m.text);
      $(`#newPlaceModal .typeIcon[data-type="${m.structureType}"]`).addClass('active');
      $('#newPlaceModal #saveNewPlaceBtn').prop('disabled', false);
      $(`#newPlaceModal input[name=isPublicRadioGrp][value="${m.isPublic}"]`).prop('checked', true);
      $('#newPlaceModal #photoInputBg').attr('src', m.photo);
      $('#newPlaceModal #descriptionInput').val(m.description);

      if (m.description && m.description.length > 0) {
        $('#newPlaceModal .description').addClass('expanded');
      }

      // $('#placeDetailsModal').modal('hide');
      History.pushState({}, 'bike de boa', '/');

    } else {
      toggleLocationInputMode();

      // Automatically get the address
      const mapCenter = map.getCenter();
      newMarkerTemp.lat = mapCenter.lat();
      newMarkerTemp.lng = mapCenter.lng();
      BIKE.geocodeLatLng(
        newMarkerTemp.lat, newMarkerTemp.lng,
        (address) => {
          console.log('Resolved location address:');
          console.log(address);
          newMarkerTemp.address = address;
          // activateModal();
        }, () => {
          // Failed
          // activateModal();
        }
      );
    }

    activateModal();
  }

  function deletePlace() {
    if (openedMarker && loggedUser) {
      if (confirm('Tem certeza que quer deletar este bicicletário?')) {
        Database.deletePlace(openedMarker.id, () => {
          // $('#newPlaceModal').modal('hide');
          History.pushState({}, 'bike de boa', '/');
          Database.getPlaces(updateMarkers);
        });
      }
    }
  }

  function openReviewPanel() {
    const m = openedMarker;

    let templateData = {};
    templateData.title = m.text;
    templateData.address = m.address;

    const previousReview = getReviewFromSession(m.id);
    console.log(previousReview);

    // Tags
    templateData.tagsButtons = tags.map(t => {
      const isPrepoped = previousReview && previousReview.tags.find( (i) => {return parseInt(i.id) === t.id;} );
      // @todo refactor this to use Handlebars' native support for arrays
      return `<button class="btn btn-tag ${isPrepoped && 'active'}" data-toggle="button" data-value="${t.id}">${t.name}</button>`;
    }).join('');


    ////////////////////////////////
    // Render handlebars template //
    ////////////////////////////////
    $('#reviewPanelTemplatePlaceholder').html(templates.reviewPanelTemplate(templateData));


    // Template is rendered, start jquerying
    //

    // Prepopulate rating
    if (previousReview) {
      currentPendingRating = previousReview.rating;
      $('input[name=rating]').val([previousReview.rating]);
    }

    validateReviewForm();

    $('#placeDetailsModal').modal('hide');
    $('#reviewPanel').modal('show');
    History.replaceState({}, 'Nova avaliação', 'avaliar');
    // $('#placeDetailsModal .flipper').toggleClass('flipped');
  }

  function getReviewFromSession(placeId) {
    const reviewsArray = Cookies.getJSON('bikedeboa_reviews') || [];
    return reviewsArray.find((i) => {return i.placeId === placeId;});
  }

  function saveOrUpdateReviewCookie(reviewObj) {
    const reviewsArray = Cookies.getJSON('bikedeboa_reviews') || [];

    // Search for previous entered review
    let review;
    if (reviewsArray && reviewsArray.length > 0) {
      review = reviewsArray.find((i) => {return i.placeId === reviewObj.placeId;});
    }

    if (review) {
      // Update current review
      review.placeId = reviewObj.placeId;
      review.rating = reviewObj.rating;
      review.tags = reviewObj.tags;
      review.databaseId = reviewObj.databaseId;
    } else {
      // Push a new one
      reviewsArray.push({
        placeId: reviewObj.placeId,
        rating: reviewObj.rating,
        tags: reviewObj.tags,
        databaseId: reviewObj.databaseId
      });
    }

    Cookies.set('bikedeboa_reviews', reviewsArray, { expires: 365 });
  }

  function _initTriggers() {
    // Home
    $('body').on('click', '#locationQueryBtn', searchLocation);
    $('body').on('click', '#clearLocationQueryBtn', () => {
      $('#locationQueryInput').val('');
      $('#clearLocationQueryBtn').css('opacity', 0);
      _searchResultMarker.setVisible(false);
    });
    $('body').on('input', '#locationQueryInput', () => {
      if ($('#locationQueryInput').val().length > 0) {
        $('#clearLocationQueryBtn').css('opacity', 1);
      } else {
        $('#clearLocationQueryBtn').css('opacity', 0);
      }
    });


    $('body').on('click', '#addPlace', toggleLocationInputMode);


    // @todo FIX ME! This is getting triggered when changing between modals...
    $('body').on('hidden.bs.modal', '#reviewPanel, #placeDetailsModal, #newPlaceModal', (e) => {
      // if (History.getState().title !== 'bike de boa') {
      //   pushtory.replaceState({}, 'bike de boa', '/');
      // }
    });


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

    $('body').on('click', '#deletePlaceBtn', deletePlace);

    $(':file').change(function () {
      if (this.files && this.files[0]) {
        var reader = new FileReader();
        reader.onload = photoUploadCB;
        reader.readAsDataURL(this.files[0]);
      }
    });

    $('body').on('click', '.description.collapsable h2', (e) => {
      $(e.currentTarget).parent().toggleClass('expanded');
    });

    // Review panel
    $('body').on('click', '#ratingDisplay, .openReviewPanelBtn', () => {
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

      showSpinner();

      const reviewObj = {
        placeId: openedMarker.id,
        rating: currentPendingRating,
        tags: reviewTags
      };

      const callback = () => {
        Database.sendReview(reviewObj, (reviewId) => {
          // Update internal state
          reviewObj.databaseId = reviewId;
          saveOrUpdateReviewCookie(reviewObj);

          // Update screen state
          // $('#reviewPanel').modal('hide');
          // $('#placeDetailsModal').modal('hide');
          History.pushState({}, 'bike de boa', '/');

          // Update markers data
          Database.getPlaces(updateMarkers);
        });
      };

      const previousReview = getReviewFromSession(openedMarker.id);
      if (previousReview) {
        // Delete previous
        Database.deleteReview(previousReview.databaseId, callback);
      } else {
        callback();
      }
    });


    // Details panel
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
      let geolocationBtnDiv = document.createElement('div');
      new geolocationBtn(geolocationBtnDiv, map);
      geolocationBtnDiv.index = 1;
      map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(geolocationBtnDiv);
    }

    _geolocationMarker = new google.maps.Marker({
      map: map,
      icon: {
        url: '/img/current_position.svg', // url
        scaledSize: new google.maps.Size(15, 15), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(7, 7), // anchor
      }
    });

    _initTriggers();

    _initTemplates();

    // Bind trigger for history changes
    History.Adapter.bind(window,'statechange',function(){
      const state = History.getState();

      if (state.title === 'bike de boa') {
        $('#reviewPanel').modal('hide');
        $('#placeDetailsModal').modal('hide');
        $('#newPlaceModal').modal('hide');
      }
    });

    // Service Worker
    UpUp.start({
      'content': 'Foi mal, o Bike De Boa ainda não funciona offline.',
      assets: [
        '/css/vendors.min.css',
        '/css/main.css',
        '/js/vendors.min.js',
        '/js/app.min.js',
        '/img/*'
      ]
    });
  }

  function init() {
    if (isDemoMode) {
      Database = BIKE.MockedDatabase;
    } else {
      Database = BIKE.Database;
    }

    showSpinner();

    Database.authenticate(() => {
      if (loggedUser) {
        $('#locationSearch').append('<span class="logged-user"><span class="glyphicon glyphicon-user"></span>'+loggedUser+'<button>✕</button></span>');
        $('.logged-user button').on('click', () => {
          Cookies.remove('bikedeboa_user');
          window.location.reload();
        });
      }

      // Reset URL
      History.replaceState({}, 'bike de boa', '/');

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
  _geolocate();
});
