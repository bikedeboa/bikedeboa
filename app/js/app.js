/* eslint no-console: ["warn", { allow: ["log", "warn", "error"] }] */
/* eslint-env node, jquery */


$(function () {
  function getPinColorFromAverage(average) {
    let pinColor;

    if (average) {
      if (!average || average === 0) {
        pinColor = 'gray';
      } else if (average > 0 && average <= 2) {
        pinColor = 'red';
      } else if (average > 2 && average < 3.5) {
        pinColor = 'yellow';
      } else if (average >= 3.5) {
        pinColor = 'green';
      } else {
        pinColor = 'gray';
      }
    } else {
      pinColor = 'gray';
    }

    return pinColor;
  }

  function openDetailsModal(marker, callback) {
    openedMarker = marker;
    const m = openedMarker;

    if (addLocationMode || !m._hasDetails) {
      return false;
    }

    ga('send', 'event', 'Local', 'view', ''+m.id);

    History.pushState({}, 'Detalhes do bicicletário', `detalhes/${m.id}`);

    let templateData = {};

    templateData.title = m.text;
    templateData.address = m.address;
    templateData.description = m.description;

    // Average
    if (m.average && m.average.toFixed && m.average !== Math.round(m.average)) {
      // Average might come with crazy floating point value
      m.average = m.average.toFixed(1);
    }
    templateData.pinColor = getPinColorFromAverage(m.average);
    templateData.average = m.average;

    templateData.mapStaticImg = `https://maps.googleapis.com/maps/api/staticmap?size=600x150&markers=icon:https://www.bikedeboa.com.br/img/pin_${templateData.pinColor}.png|${m.lat},${m.lng}&key=${GOOGLEMAPS_KEY}&${_gmapsCustomStyleStaticApi}`;

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
      templateData.isLoggedUser = true;
      templateData.canModify = true;
    } else if (BIKE.Session.getPlaceFromSession(m.id)) {
      templateData.canModify = true;
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

    // Retrieves a previous review saved in session
    const previousReview = BIKE.Session.getReviewFromSession(m.id);
    if (previousReview) {
      templateData.savedRating = previousReview.rating;
    }


    ////////////////////////////////
    // Render handlebars template //
    ////////////////////////////////
    $('#placeDetailsModalTemplatePlaceholder').removeClass('loading-skeleton').html(templates.placeDetailsModalTemplate(templateData));

    // Template is rendered, start jquerying
    $('.numreviews').toggle(m.reviews && m.reviews > 0);
    if (m.average) {
      $('input[name=placeDetails_rating]').val([''+Math.round(m.average)]);
    } else {
      $('#ratingDisplay').addClass('empty');
    }

    $('.photo-container img').on('load', e => {
      $(e.target).parent().removeClass('loading');
    });

    $('.review').tooltip();

    // If we rendered a skeleton modal then the modal is visible already
    if (!$('#placeDetailsModal').is(':visible')) {
      $('#placeDetailsModal').modal('show');
    }

    // Animate modal content
    $('.photo-container, .modal-body > div, .modal-footer').velocity(
      'transition.fadeIn',
      {stagger: STAGGER_NORMAL, queue: false, complete: () => {
        if (callback && typeof callback === 'function') {
          callback();
        }
      }
    });
  }

  function updateCurrentPosition(position) {
    const pos = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };

    _geolocationMarker.setPosition(pos);

    _geolocationRadius.setCenter(pos);
    _geolocationRadius.setRadius(position.coords.accuracy);
  }

  function _geolocate(toCenter, callback, quiet = false) {
    ga('send', 'event', 'Geolocation', 'click');

    if (navigator.geolocation) {
      // @todo split both behaviors into different functions
      if (_geolocationInitialized) {
        const markerPos = _geolocationMarker.getPosition();
        const pos = {
          lat: markerPos.lat(),
          lng: markerPos.lng()
        };

        map.panTo(pos);
        if (map.getZoom() < 17) {
          map.setZoom(17);
        }
      } else {
        if (!quiet) {
          showSpinner();
        }

        _geolocationInitialized = false;

        const options = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            position => {
              console.log(position);

              _geolocationInitialized = true;

              ga('send', 'event', 'Geolocation', 'init');

              updateCurrentPosition(position);

              $('#geolocationBtn').css('border', '2px solid lightblue');
              _geolocationMarker.setZIndex(markers.length);
              _geolocationMarker.setVisible(true);
              _geolocationRadius.setVisible(true);

              if (toCenter) {
                const pos = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                };

                map.panTo(pos);
                if (map.getZoom() < 17) {
                  map.setZoom(17);
                }
              }

              if (callback && typeof callback === 'function') {
                callback();
              }
            },
            error => {
              ga('send', 'event', 'Geolocation', error.message ? `fail - ${error.message}`: 'fail - no_message');

              console.error('Geolocation failed.', error);

              if (!quiet) {
                switch(error.code) {
                case 1:
                  // PERMISSION_DENIED
                  if (_isFacebookBrowser) {
                    swal('Ops', 'Seu navegador parece não suportar essa função, que pena.', 'warning');
                  } else {
                    swal('Ops', 'Sua localização está desabilitada, ou seu navegador parece não suportar essa função.', 'warning');
                  }
                  break;
                case 2:
                  // POSITION_UNAVAILABLE
                  swal('Ops', 'A geolocalização parece não estar funcionando. Já verificou se o GPS está ligado?', 'warning');
                  break;
                case 3:
                  // TIMEOUT
                  swal('Ops', 'A geolocalização do seu dispositivo parece não estar funcionando agora. Mas tente denovo que deve dar ;)', 'warning');
                  break;
                }
              }

              // Secure Origin issue test by Google: https://developers.google.com/web/updates/2016/04/geolocation-on-secure-contexts-only?hl=en
              if(error.message.indexOf('Only secure origins are allowed') == 0) {
                // Disable button since it won't work anyway in the current domain.
                $('#geolocationBtn').hide();
              }

              if (callback && typeof callback === 'function') {
                callback();
              }
            },
            options
        );

        if (_positionWatcher) {
          navigator.geolocation.clearWatch(_positionWatcher);
        }
        _positionWatcher = navigator.geolocation.watchPosition(updateCurrentPosition, null, options);
      }


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

    controlUI.title = 'Onde estou?';

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
      _geolocate(true, () => {
        hideSpinner();
      });
    });

  }

  function onMarkerClick(marker, callback) {
    _abortedDetailsRequest = false;

    if (marker._hasDetails) {
      openDetailsModal(marker);
    } else {
      // Load skeleton modal template
      $('#placeDetailsModalTemplatePlaceholder').addClass('loading-skeleton').html(templates.placeDetailsModalLoadingTemplate());
      $('#placeDetailsModal').modal('show');
      $('.photo-container, .modal-body > div').velocity('transition.slideDownIn', { stagger: STAGGER_FAST });

      // Request content
      Database.getPlaceDetails(marker.id, () => {
        if (!_abortedDetailsRequest) {
          openDetailsModal(marker, callback);
        }
      });
    }
  }

  function updateMarkers() {
    clearMarkers();

    // Markers from Database
    if (markers && markers.length > 0) {
      // Order by average so best ones will have higher z-index
      // markers = markers.sort((a, b) => {
      //   return a.average - b.average;
      // });

      for(let i=0; i < markers.length; i++) {
        const m = markers[i];

        if (m) {
          // Icon and Scaling
          let scale;
          let iconType, iconTypeMini;
          if (!m.average || m.average === 0) {
            iconType = MARKER_ICON_GRAY;
            iconTypeMini = MARKER_ICON_GRAY_MINI;
            scale = 0.8;
          } else if (m.average > 0 && m.average <= 2) {
            iconType = MARKER_ICON_RED;
            iconTypeMini = MARKER_ICON_RED_MINI;
          } else if (m.average > 2 && m.average < 3.5) {
            iconType = MARKER_ICON_YELLOW;
            iconTypeMini = MARKER_ICON_YELLOW_MINI;
          } else if (m.average >= 3.5) {
            iconType = MARKER_ICON_GREEN;
            iconTypeMini = MARKER_ICON_GREEN_MINI;
          } else {
            iconType = MARKER_ICON_GRAY;
            iconTypeMini = MARKER_ICON_GRAY_MINI;
          }
          if (!scale) {
            scale = 0.5 + (m.average/10);
          }

          m.icon = {
            url: iconType, // url
            scaledSize: new google.maps.Size((MARKER_W*scale), (MARKER_H*scale)), // scaled size
            origin: new google.maps.Point(0, 0), // origin
            anchor: new google.maps.Point((MARKER_W*scale)/2, (MARKER_H*scale)), // anchor
          };

          m.iconMini = {
            url: iconTypeMini, // url
            scaledSize: new google.maps.Size((MARKER_W_MINI*scale), (MARKER_H_MINI*scale)), // scaled size
            origin: new google.maps.Point(0, 0), // origin
            anchor: new google.maps.Point((MARKER_W_MINI*scale)/2, (MARKER_H_MINI*scale)/2), // anchor
          };

          // @todo temporarily disabled this because backend still doesnt support flags for these
          // let labelStr;
          // if (loggedUser && (!m.photo || !m.structureType || m.isPublic == null)) {
          //   labelStr = '?';
          // }

          if (m.lat && m.lng) {
            _gmarkers.push(new google.maps.Marker({
              position: {
                lat: parseFloat(m.lat),
                lng: parseFloat(m.lng)
              },
              map: map,
              icon: m.icon,
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
                onMarkerClick(markers[markerIndex]);
              });
            }(i));
          } else {
            console.error('not lat or long o.O');
          }

        } else {
          console.error('marker is weirdly empty on addMarkerToMap()');
        }
      }
    }

    _geolocationMarker.setZIndex(markers.length);
  }

  // Sets the map on all markers in the array.
  function setMapOnAll (map) {
    if (_gmarkers && Array.isArray(_gmarkers)) {
      for (let i = 0; i < _gmarkers.length; i++) {
        _gmarkers[i].setMap(map);
      }
    }
  }

  // Removes the markers from the map, but keeps them in the array.
  function hideMarkers () {
    areMarkersHidden = true;
    if (_gmarkers && Array.isArray(_gmarkers)) {
      for (let i = 0; i < _gmarkers.length; i++) {
        _gmarkers[i].setOptions({clickable: false, opacity: 0.3});
      }
    }
  }

  // Shows any markers currently in the array.
  function showMarkers () {
    areMarkersHidden = false;
    if (_gmarkers && Array.isArray(_gmarkers)) {
      for (let i = 0; i < _gmarkers.length; i++) {
        _gmarkers[i].setOptions({clickable: true, opacity: 1});
      }
    }
  }

  // Switches all marker icons to the full or the mini scale
  function setMarkersIcon (scale) {
    if (_gmarkers && Array.isArray(_gmarkers)) {
      let m;
      for (let i = 0; i < _gmarkers.length; i++) {
        m = markers[i];
        _gmarkers[i].setIcon(scale === 'mini' ? m.iconMini : m.icon);
      }
    }
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

  function testNewLocalBounds() {
    const isWithinBounds = _mapBounds.contains(map.getCenter());
    $('#newPlaceholder').toggleClass('invalid', !isWithinBounds);
    return isWithinBounds;
  }

  function toggleLocationInputMode() {
    addLocationMode = !addLocationMode;

    if (addLocationMode) {
      // hideUI();

      testNewLocalBounds();
      map.addListener('center_changed', () => {
        // console.log('center_changed');
        testNewLocalBounds();
      });

      // ESC button cancels locationinput
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
      // showUI();

      $(document).off('keyup.disableInput');

      google.maps.event.clearInstanceListeners(map);
    }

    $('#addPlace').toggleClass('active');
    $('#newPlaceholder').toggleClass('active');
    $('#newPlaceholderShadow').toggle();
    $('#newPlaceholderTarget').toggle();
    $('#geolocationBtnBtn').toggle();
    // $('#locationSearch').toggleClass('coolHide');

    toggleMarkers();
  }

  function showUI() {
    $('#locationSearch').velocity('transition.slideDownIn', {queue: false});
    // $('#addPlace').velocity('transition.slideUpIn');
  }

  function hideUI() {
    $('#locationSearch').velocity('transition.slideUpOut', {queue: false});
    // $('#addPlace').velocity('transition.slideDownOut');
  }

  // @todo refactor this, it's confusing
  function createOrUpdatePlace() {
    // $('#newPlaceModal').modal('hide');
    History.pushState({}, 'bike de boa', '/');
    showSpinner('Salvando bicicletário...');

    const isUpdate = openedMarker;
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

    const callback = newLocal => {
      // Save cookie to temporarily enable edit/delete of this local
      // Having the cookie isn't enought: the request origin IP is matched with the author IP
      //   saved in the database.
      if (!isUpdate) {
        BIKE.Session.saveOrUpdatePlaceCookie(newLocal.id);
      }

      Database.getPlaces( () => {
        updateMarkers();
        hideSpinner();

        if (!isUpdate) {
          const newMarker = markers.find( i => i.id === newLocal.id );
          if (newMarker) {
            onMarkerClick(newMarker, () => {
              $('.review').tooltip('show');
              // $('.review').velocity('callout.bounce');
            });
          }
        }
      });
    };

    if (isUpdate) {
      ga('send', 'event', 'Local', 'update', ''+openedMarker.id);
      Database.updatePlace(openedMarker.id, place, callback);
    } else {
      ga('send', 'event', 'Local', 'create');
      Database.sendPlace(place, callback);
    }
  }

  function sendCheckinBtn() {
    Database.sendCheckin(openedMarker.id, () => {
      $('#placeDetailsModal').modal('show');

      showSpinner();
      Database.getPlaces( () => {
        updateMarkers();
        hideSpinner();
      });
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

      ga('send', 'event', 'Search', 'location', place.formatted_address);

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

  function photoUploadCB(e) {
    if (e.target.result) {
      // $('#photoInput + label').fadeOut();
      let canvas = document.createElement('canvas');
      let img = new Image();
      img.src = e.target.result;
      // img.style.height = '1000px';

      // Resize image fitting PHOTO_UPLOAD_MAX_W and PHOTO_UPLOAD_MAX_H
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > PHOTO_UPLOAD_MAX_W) {
          height *= PHOTO_UPLOAD_MAX_W / width;
          width = PHOTO_UPLOAD_MAX_W;
        }
      } else {
        if (height > PHOTO_UPLOAD_MAX_H) {
          width *= PHOTO_UPLOAD_MAX_H / height;
          height = PHOTO_UPLOAD_MAX_H;
        }
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);

      // Save the resized blob
      _uploadingPhotoBlob = canvas.toDataURL('image/jpeg', 0.8);

      // Present to the user the already resized image
      document.getElementById('photoInputBg').src = _uploadingPhotoBlob;
    }

    hideSpinner();
  }

  function _initTemplates() {
    // Thanks https://stackoverflow.com/questions/8853396/logical-operator-in-a-handlebars-js-if-conditional
    Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
      switch (operator) {
      case '==':
        return (v1 == v2) ? options.fn(this) : options.inverse(this);
      case '===':
        return (v1 === v2) ? options.fn(this) : options.inverse(this);
      case '!=':
        return (v1 != v2) ? options.fn(this) : options.inverse(this);
      case '!==':
        return (v1 !== v2) ? options.fn(this) : options.inverse(this);
      case '<':
        return (v1 < v2) ? options.fn(this) : options.inverse(this);
      case '<=':
        return (v1 <= v2) ? options.fn(this) : options.inverse(this);
      case '>':
        return (v1 > v2) ? options.fn(this) : options.inverse(this);
      case '>=':
        return (v1 >= v2) ? options.fn(this) : options.inverse(this);
      case '&&':
        return (v1 && v2) ? options.fn(this) : options.inverse(this);
      case '&&!':
        return (v1 && !v2) ? options.fn(this) : options.inverse(this);
      case '||':
        return (v1 || v2) ? options.fn(this) : options.inverse(this);
      case '||!':
        return (v1 || !v2) ? options.fn(this) : options.inverse(this);
      default:
        return options.inverse(this);
      }
    });

    templates.placeDetailsModalTemplate = Handlebars.compile($('#placeDetailsModalTemplate').html());
    templates.reviewPanelTemplate = Handlebars.compile($('#reviewPanelTemplate').html());
    templates.placeDetailsModalLoadingTemplate = Handlebars.compile($('#placeDetailsModalLoadingTemplate').html());
    templates.messageModalTemplate = Handlebars.compile($('#messageModalTemplate').html());
    templates.revisionModalTemplate = Handlebars.compile($('#revisionModalTemplate').html());
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

  // @todo clean up this mess
  function openNewPlaceModal() {
    // Reset fields
    _uploadingPhotoBlob = '';
    $('#newPlaceModal .little-pin').toggleClass('gray', true);
    $('#newPlaceModal #saveNewPlaceBtn').prop('disabled', true);
    $('#newPlaceModal #titleInput').val('');
    $('#newPlaceModal .typeIcon').removeClass('active');
    $('#newPlaceModal input[name=isPublicRadioGrp]').prop('checked',false);
    $('#newPlaceModal #photoInputBg').attr('src', '');
    $('#newPlaceModal #descriptionInput').val('');
    $('#newPlaceModal .description.collapsable').removeClass('expanded');

    // $('#newPlaceModal .tagsContainer button').removeClass('active');

    // Not creating a new one, but editing
    if (openedMarker) {
      // @todo refactor this, probably separate into different functions

      const m = openedMarker;
      $('#newPlaceModal #titleInput').val(m.text);
      $(`#newPlaceModal .typeIcon[data-type="${m.structureType}"]`).addClass('active');
      $('#newPlaceModal #saveNewPlaceBtn').prop('disabled', false);
      $(`#newPlaceModal input[name=isPublicRadioGrp][value="${m.isPublic}"]`).prop('checked', true);
      $('#newPlaceModal #photoInputBg').attr('src', m.photo);
      $('#newPlaceModal #photoInput+label').addClass('editMode');
      $('#newPlaceModal #descriptionInput').val(m.description);

      if (m.description && m.description.length > 0) {
        $('#newPlaceModal .description').addClass('expanded');
      }

      ga('send', 'event', 'Local', 'update - pending', ''+m.id);
      // $('#placeDetailsModal').modal('hide');
      History.pushState({}, 'bike de boa', '/');

    } else {
      toggleLocationInputMode();

      // Queries Google Geocoding service for the position address
      const mapCenter = map.getCenter();
      newMarkerTemp = {lat: mapCenter.lat(), lng: mapCenter.lng()};
      BIKE.geocodeLatLng(
        newMarkerTemp.lat, newMarkerTemp.lng,
        (address) => {
          console.log('Resolved location address:');
          console.log(address);
          newMarkerTemp.address = address;
        }, () => {
        }
      );

      ga('send', 'event', 'Local', 'create - pending');
    }

    // Finally, activate modal
    $('#newPlaceModal').modal('show');
    History.pushState({}, 'Novo bicicletário', 'novo');
    validateNewPlaceForm();
  }

  function deletePlace() {
    if (openedMarker) {
      if (confirm('Tem certeza que quer deletar este bicicletário?')) {
        ga('send', 'event', 'Local', 'delete', ''+openedMarker.id);

        showSpinner();
        Database.deletePlace(openedMarker.id, () => {
          // $('#newPlaceModal').modal('hide');
          History.pushState({}, 'bike de boa', '/');
          Database.getPlaces( () => {
            updateMarkers();
            hideSpinner();
          });
        });
      }
    }
  }

  function openReviewPanel(prepopedRating) {
    const m = openedMarker;

    let templateData = {};
    templateData.title = m.text;
    templateData.address = m.address;

    const previousReview = BIKE.Session.getReviewFromSession(m.id);

    // Tags
    templateData.tagsButtons = tags.map(t => {
      const isPrepoped = previousReview && previousReview.tags.find( (i) => {return parseInt(i.id) === t.id;} );
      // @todo refactor this to use Handlebars' native support for arrays
      return `<button class="btn btn-tag ${isPrepoped ? 'active' : ''}" data-toggle="button" data-value="${t.id}">${t.name}</button>`;
    }).join('');


    ////////////////////////////////
    // Render handlebars template //
    ////////////////////////////////
    $('#reviewPanelTemplatePlaceholder').html(templates.reviewPanelTemplate(templateData));


    // Template is rendered, start jquerying
    //

    // Prepopulate rating
    if (previousReview) {
      _updatingReview = true;
      currentPendingRating = previousReview.rating;
      $('input[name=rating]').val([previousReview.rating]);

      ga('send', 'event', 'Review', 'update - pending', ''+m.id);
    } else if (prepopedRating) {
      currentPendingRating = prepopedRating;
      $('input[name=rating]').val([prepopedRating]);
    } else {
      _updatingReview = false;
      ga('send', 'event', 'Review', 'create - pending', ''+m.id);
    }

    validateReviewForm();

    $('#placeDetailsModal').modal('hide');
    $('#reviewPanel').modal('show');
    History.replaceState({}, 'Nova avaliação', 'avaliar');
    // $('#placeDetailsModal .flipper').toggleClass('flipped');
  }

  function toggleExpandModalHeader() {
    $('.photo-container').toggleClass('expanded');
  }

  function toggleClearLocationBtn(stateStr) {
    if (stateStr === 'show') {
      $('#clearLocationQueryBtn').css('opacity', 1).css('visibility', 'visible').css('pointer-events', 'auto');
      $('#locationSearch input').css('padding-right', '50px');
    } else if (stateStr === 'hide') {
      $('#clearLocationQueryBtn').css('opacity', 0).css('visibility', 'hidden').css('pointer-events', 'none');
      $('#locationSearch input').css('padding-right', '0');
    } else {
      console.error('Invalid arg in toggleClearLocationBtn()');
    }
  }

  function sendReviewBtnCB() {
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
        BIKE.Session.saveOrUpdateReviewCookie(reviewObj);

        // Update screen state
        // $('#reviewPanel').modal('hide');
        // $('#placeDetailsModal').modal('hide');
        History.pushState({}, 'bike de boa', '/');

        if (_updatingReview) {
          ga('send', 'event', 'Review', 'update', ''+openedMarker.id, parseInt(currentPendingRating));
        } else {
          ga('send', 'event', 'Review', 'create', ''+openedMarker.id, parseInt(currentPendingRating));
        }

        // Update markers data
        Database.getPlaces( () => {
          updateMarkers();
          hideSpinner();
        });
      });
    };

    const previousReview = BIKE.Session.getReviewFromSession(openedMarker.id);
    if (previousReview) {
      // Delete previous
      Database.deleteReview(previousReview.databaseId, callback);
    } else {
      callback();
    }
  }

  function openRevisionPanel() {
    const m = openedMarker;
    let templateData = {};

    templateData.pinColor = getPinColorFromAverage(m.average);
    templateData.title = m.text;
    templateData.address = m.address;
    $('#revisionModalTemplatePlaceholder').html(templates.revisionModalTemplate(templateData));

    History.replaceState({}, 'Sugerir mudança', `detalhes/${m.id}/sugestao`);
    $('#placeDetailsModal').modal('hide');
    $('#revisionModal').modal('show');
  }

  function sendRevisionBtn() {
    showSpinner();

    const revisionObj = {
      placeId: openedMarker.id,
      content: $('#revisionText').val()
    };

    Database.sendRevision(revisionObj, (revisionId) => {
      hideSpinner();

      swal('Sugestão enviada', 'Obrigado por contribuir com o Bike de Boa. Sua sugestão será avaliada pelo nosso time de colaboradores o mais rápido possível.', 'success');

      // Update screen state
      History.pushState({}, 'bike de boa', '/');
    });
  }

  function _initTriggers() {
    /////////////////////
    // Home

    // $('body').on('click', '#locationQueryBtn', searchLocation);
    $('body').on('click', '#clearLocationQueryBtn', () => {
      $('#locationQueryInput').val('');
      toggleClearLocationBtn('hide');
      _searchResultMarker.setVisible(false);
    });
    $('body').on('input', '#locationQueryInput', () => {
      toggleClearLocationBtn($('#locationQueryInput').val().length > 0 ? 'show' : 'hide');
    });

    $('.js-menu-show').on('click', () => {
      // Menu open is already triggered inside the menu component.
      ga('send', 'event', 'Misc', 'hamburger menu opened');
    });

    $('#loginBtn').on('click', () => {
      _sidenav.hide();
      login(true);
    });

    $('#aboutBtn').on('click', () => {
      _sidenav.hide();
      // $('.modal-body p').css({opacity: 0}).velocity('transition.slideDownIn', { stagger: STAGGER_NORMAL });
      History.pushState({}, 'Sobre', 'sobre');
      $('#aboutModal').modal('show');
    });

    $('#faqBtn').on('click', () => {
      _sidenav.hide();
      History.pushState({}, 'Perguntas frequentes', 'faq');
      $('.modal-body .panel').css({opacity: 0}).velocity('transition.slideDownIn', { stagger: STAGGER_NORMAL });
      $('#faqModal').modal('show');
    });

    $('body').on('click', '#addPlace', toggleLocationInputMode);

    // Capture modal closing by
    $('body').on('click', '.modal, .close-modal', e => {
      // If click was on modal backdrop
      if (e.target == e.currentTarget) {
        // If a details request was under way
        _abortedDetailsRequest = true;

        // Reset history state
        // @todo just do a history.back(), so a forward would reopen the modal
        if (History.getState().title !== 'bike de boa') {
          History.replaceState({}, 'bike de boa', '/');
        }
      }
    });

    // Replace bootstrap modal animation with Velocity.js
    $('body').on('show.bs.modal', '.modal', e => {
      $('.modal-dialog').velocity('transition.slideDownBigIn', {duration: MODAL_TRANSITION_IN_DURATION});

      if (_isMobile) {
        $('#map, #addPlace').addClass('hidden');
      }
    });

    $('body').on('hide.bs.modal', '.modal', e => {
      // $('.modal-dialog').velocity('transition.slideDownBigOut');

      if (_isMobile) {
        $('#map, #addPlace').removeClass('hidden');
      }
    });


    /////////////////////
    // New place panel
    $('body').on('click', '#newPlaceholder', () => {
      openedMarker = null;
      if (testNewLocalBounds()) {
        openNewPlaceModal();
      } else {
        const mapCenter = map.getCenter();
        const coords = mapCenter.lat() + mapCenter.lng();
        ga('send', 'event', 'Local', `out of bounds - ${coords}`);
        swal({
          title: 'Ops',
          text:
            'Foi mal, por enquanto ainda não dá pra adicionar bicicletários nesta região.\
            <br><br>\
            <small><i>Acompanhe nossa <a href="https://www.facebook.com/bikedeboaapp">página no Facebook</a> para saber novidades sobre nossa cobertura, e otras cositas mas. :)</i></small>',
          type: 'warning',
          html: true
        });
      }
    });

    $('body').on('click', '.typeIcon', e => {
      $(e.currentTarget).siblings('.typeIcon').removeClass('active');
      $(e.currentTarget).addClass('active');
    });

    $('body').on('change input click','#newPlaceModal input, #newPlaceModal .typeIcon', () => {
      // this has to be AFTER the typeIcon click trigger
      validateNewPlaceForm();
    });


    $('body').on('click', '#saveNewPlaceBtn', createOrUpdatePlace);

    $('body').on('click', '#editPlaceBtn', openNewPlaceModal);

    $('body').on('click', '#deletePlaceBtn', deletePlace);

    $('#photoInput').change(function () {
      if (this.files && this.files[0] && this.files[0].type.match(/image.*/)) {
        showSpinner('Processando imagem...');

        var reader = new FileReader();
        reader.onload = photoUploadCB;
        reader.readAsDataURL(this.files[0]);
      } else {
        swal('Ops', 'Algo deu errado com a foto, por favor tente novamente.', 'error');
      }
    });

    $('body').on('click', '.description.collapsable h2', e => {
      $(e.currentTarget).parent().toggleClass('expanded');
    });

    /////////////////////
    // Review panel
    $('body').on('click', '#ratingDisplay .full-star, .openReviewPanelBtn', e => {
      openReviewPanel($(e.target).data('value'));
    });

    $('body').on('change', '#reviewPanel .rating', e => {
      currentPendingRating = $(e.target).val();
      validateReviewForm();
    });

    $('body').on('click', '#sendReviewBtn', () => {
      sendReviewBtnCB();
    });


    /////////////////////////
    // Local Details panel
    $('body').on('click', '#checkinBtn', sendCheckinBtn);

    $('body').on('click', '.photo-container img', e => {
      toggleExpandModalHeader();
    });

    $('body').on('click', '.directionsBtn', e => {
      ga('send', 'event', 'Local', 'directions', ''+openedMarker.id);
    });


    /////////////////////////
    // Send Revision Panel
    $('body').on('click', '#createRevisionBtn', openRevisionPanel);
    $('body').on('click', '#sendRevisionBtn', sendRevisionBtn);
  }

  function hideAllModals() {
    $('.modal').modal('hide');
  }

  // Setup must only be called *once*, differently than init() that may be called to reset the app state.
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
      zoomControl: _isDesktop,
      styles: _gmapsCustomStyle,
    });

    _mapBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(_mapBoundsCoords.sw.lat, _mapBoundsCoords.sw.lng),
        new google.maps.LatLng(_mapBoundsCoords.ne.lat, _mapBoundsCoords.ne.lng)
    );

    google.maps.event.addListener(map, 'zoom_changed', () => {
      const prevZoomLevel = _mapZoomLevel;

      _mapZoomLevel = map.getZoom() <= 13 ? 'mini' : 'full';

      if (prevZoomLevel !== _mapZoomLevel) {
        setMarkersIcon(_mapZoomLevel);
      }
    });

    const isMobileListener = window.matchMedia("(max-width: ${MOBILE_MAX_WIDTH})");
    isMobileListener.addListener((isMobileListener) => {
      _isMobile = isMobileListener.matches;
    });
    const isDesktopListener = window.matchMedia("(min-width: ${DESKTOP_MIN_WIDTH})");
    isDesktopListener.addListener((isDesktopListener) => {
      _isMobile = isDesktopListener.matches;
    });


    // If permission to geolocation was already granted we already center the map
    if (navigator.permissions) {
      navigator.permissions.query({'name': 'geolocation'})
        .then( permission => {
          if (permission.state === 'granted') {
            _geolocate(true, null, true);
          }
        }
      );
    }

    // User is within Facebook browser.
    // thanks to: https://stackoverflow.com/questions/31569518/how-to-detect-facebook-in-app-browser
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    _isFacebookBrowser = (userAgent.indexOf('FBAN') > -1) || (userAgent.indexOf('FBAV') > -1);


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
        scaledSize: new google.maps.Size(16, 16), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(8, 8), // anchor
      }
    });

    _geolocationRadius = new google.maps.Circle({
      map: map,
      clickable: false,
      fillColor: 'lightblue', //color,
      fillOpacity: '0.4', //opacity from 0.0 to 1.0,
      strokeColor: 'transparent', //stroke color,
      strokeOpacity: '0' //opacity from 0.0 to 1.0
    });

    _initTriggers();

    _initTemplates();

    // Bind trigger for history changes
    History.Adapter.bind(window,'statechange',function(){
      const state = History.getState();

      if (state.title === 'bike de boa') {
        hideAllModals();
      }
    });

    // Set up Service Worker
    if (window.UpUp) {
      UpUp.start({
        'content': 'Foi mal, o Bike De Boa ainda não funciona offline.',
        'cache-version': 'v2.1',
        assets: [ 
          '/css/vendors.min.css',
          '/css/main.min.css',
          '/js/vendors.min.js',
          '/js/app.min.js',
          '/img/banner.svg',
          '/img/bg_header.png',
          '/img/current_position.svg',
          '/img/geolocation.svg',
          '/img/icon_photo.svg',
          '/img/icon_private.svg',
          '/img/icon_public.svg',
          '/img/icon_star.svg',
          '/img/icon_star_empty.svg',
          '/img/icon_star_gray.svg',
          '/img/icon_user.svg',
          '/img/logo.png',
          '/img/pin_bike.svg',
          '/img/pin_gray.png',
          '/img/pin_gray.svg',
          '/img/pin_gray_mini.svg',
          '/img/pin_green.png',
          '/img/pin_green.svg',
          '/img/pin_green_mini.svg',
          '/img/pin_red.png',
          '/img/pin_red.svg',
          '/img/pin_red_mini.svg',
          '/img/pin_yellow.png',
          '/img/pin_yellow.svg',
          '/img/pin_yellow_mini.svg',
          '/img/radio.svg',
          '/img/radio_checked.svg',
          '/img/spinner.svg',
          '/img/spinner_animated.svg',
          '/img/target.svg',
          '/img/tipo_deroda.svg',
          '/img/tipo_grade.svg',
          '/img/tipo_other.svg',
          '/img/tipo_suspenso.svg',
          '/img/tipo_trave.svg',
          '/img/tipo_uinvertido.svg',
        ]
      });
    }

    // Set up Sweet Alert
    swal.setDefaults({
      animation: false,
      confirmButtonColor: '#30bb6a',
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancelar'
    });

    _sidenav = new SideNav();

    // Intercepts Progressive Web App event
    // source: https://developers.google.com/web/fundamentals/engage-and-retain/app-install-banners/
    window.addEventListener('beforeinstallprompt', e => {
      ga('send', 'event', 'Misc', 'beforeinstallprompt - popped');

      e.userChoice.then(function(choiceResult) {
        // console.log(choiceResult.outcome);
        if(choiceResult.outcome == 'dismissed') {
          // User cancelled home screen install
          ga('send', 'event', 'Misc', 'beforeinstallprompt - refused');
        }
        else {
          // User added to home screen
          ga('send', 'event', 'Misc', 'beforeinstallprompt - accepted');
        }
      });
    });
  }

  function handleLoggedUser() {
    // Setup little user label underneath the location search bar
    $('#locationSearch').append('<span class="login-display logged"><span class="glyphicon glyphicon-user"></span>'+loggedUser+'<button>✕</button></span>');
    $('.login-display button').on('click', () => {
      Cookies.remove('bikedeboa_user');
      window.location.reload();
    });
  }

  function login(isUserLogin = false) {
    // This is the only request allowed to be unauthenticated
    Database.getPlaces( () => {
      updateMarkers();

      // Hide spinner that is initialized visible on CSS
      hideSpinner();

      $('#locationSearch').velocity('transition.slideDownIn', {delay: 300, queue: false});
      $('#addPlace').velocity('transition.slideUpIn', {delay: 300, queue: false});
      $('#map').css('filter', 'none');
    });

    Database.authenticate(isUserLogin, () => {
      if (loggedUser) {
        handleLoggedUser();
      }

      Database.getAllTags();
    });
  }

  // Thanks https://stackoverflow.com/questions/17772260/textarea-auto-height/24676492#24676492
  window.autoGrowTextArea = function(element) {
    element.style.height = '5px';
    element.style.height = (element.scrollHeight+20)+'px';
  };


  // window.showMessage = function(_data) {
  //   const okCallback = () => {
  //     $('#messageModal').modal('hide');
  //   };

  //   let data = {
  //     messageClasses: _data && _data.type || 'success',
  //     messageContent: _data && _data.content || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque eleifend scelerisque scelerisque.',
  //     buttonLabel: _data && _data.buttonLabel ||  'Tá',
  //   };

  //   switch (data.messageClasses) {
  //     case 'success':
  //       data.glyphiconClass = 'glyphicon-ok-sign';
  //       break;
  //     case 'warning':
  //       data.glyphiconClass = 'glyphicon-info-sign';
  //       break;
  //     case 'error':
  //       data.glyphiconClass = 'glyphicon-remove-sign';
  //       break;
  //   }

  //   ////////////////////////////////
  //   // Render handlebars template //
  //   ////////////////////////////////
  //   $('#messageModalPlaceholder').html(templates.messageModalTemplate(data));

  //   $('#messageModalOkBtn').on('click', okCallback);

  //   $('#messageModal').modal('show');
  // };

  function localhostOverrides() {
    // if (_isLocalhost) {
    //   Database.API_URL = 'http://localhost:3000';
    // }
  }

  function init() {
    // Reset URL
    History.replaceState({}, 'bike de boa', '/');

    if (isDemoMode) {
      Database = BIKE.MockedDatabase;
    } else {
      Database = BIKE.Database;
    }

    // Use external service to get user's IP
    $.getJSON('//ipinfo.io/json', data => {
      if (data && data.ip) {
        Database._setOriginHeader(data.ip);
      } else {
        console.error('Something went wrong when trying to retrieve user IP.');
        ga('send', 'event', 'Misc', 'IP retrieval error');
      }

      // Coords via IP
      // if (data && data.loc) {
      //   const coords = data.loc.split(',');
      //   const pos = {
      //     lat: parseFloat(coords[0]),
      //     lng: parseFloat(coords[1])
      //   };

      //   map.panTo(pos);
      // }
    });

    localhostOverrides();

    login();
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
  // _geolocate();
});
