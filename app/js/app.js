/* eslint no-console: ["warn", { allow: ["log", "warn", "error"] }] */
/* eslint-env node, jquery */

$(() => {
  function getPinColorFromAverage(average) {
    if (typeof average === 'string') {
      average = parseFloat(average);
    }

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

  function openShareDialog() {
    // const shareUrl = window.location.origin + BDB.Places.getMarkerShareUrl(openedMarker);
    const shareUrl = 'https://www.bikedeboa.com.br' + BDB.Places.getMarkerShareUrl(openedMarker);

    swal({  
      imageUrl: _isMobile ? '' : '/img/icon_share.svg',
      imageWidth: 80,
      imageHeight: 80,
      customClass: 'share-modal',
      html:
        `Compartilhe este bicicletário<br><br>
        <div class="share-icons">
          <iframe src="https://www.facebook.com/plugins/share_button.php?href=${encodeURIComponent(shareUrl)}&layout=button&size=large&mobile_iframe=true&width=120&height=28&appId=1814653185457307" width="120" height="28" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowTransparency="true"></iframe>
          <a target="_blank" href="https://twitter.com/share" data-size="large" class="twitter-share-button"></a>
          <button class="share-email-btn">
            <a target="_blank" href="mailto:?subject=Saca só esse bicicletário&amp;body=${shareUrl}" title="Enviar por email">
              <img src="/img/icon_mail.svg" class="icon-mail"/><span class="share-email-label unstyled-link">Email</span> 
            </a>
          </button>
        </div>
        <hr>
        ...ou clique para copiar o link<br><br>
        <div class="share-url-container">
          <span class="glyphicon glyphicon-link share-url-icon"></span>
          <textarea id="share-url-btn" onclick="this.focus();this.select();" readonly="readonly" rows="1" data-toggle="tooltip" data-trigger="manual" data-placement="top" data-html="true" data-title="Copiado!">${shareUrl}</textarea>
        </div>`,
      showConfirmButton: false,
      showCloseButton: true,
      onOpen: () => {
        // Initializes Twitter share button
        twttr.widgets.load();

        // Copy share URL to clipboard
        $('#share-url-btn').on('click', e => {
          ga('send', 'event', 'Local', 'share - copy url to clipboard', ''+openedMarker.id);

          copyToClipboard(e.currentTarget);
 
          // Tooltip
          $('#share-url-btn').tooltip('show');
          $('#share-url-btn').one('mouseout', () => {
            $('#share-url-btn').tooltip('hide');
          });
        });
      }
    });
  }

  function initHelpTooltip(selector) {
    if (!_isMobile) {
      $(selector).tooltip({
        trigger: 'focus'
      }); 
    } else {
      $(selector).off('click').on('click', e => {
        const $tooltipEl =$(e.currentTarget);
        swal({
          customClass: 'tooltip-modal',
          html: $tooltipEl.data('title')
        });
      });
    }
  }

  function openDetailsModal(marker) {
    if (!marker) {
      console.error('Trying to open details modal without a marker.');
      return;
    }

    openedMarker = marker;
    const m = openedMarker;
 
    if (addLocationMode) {
      return false;
    }

    ga('send', 'event', 'Local', 'view', ''+m.id);

    let templateData = {};

    templateData.title = m.text;
    templateData.address = m.address;
    templateData.description = m.description;

    // Average
    templateData.pinColor = getPinColorFromAverage(m.average);
    templateData.average = formatAverage(m.average);

    const staticImgDimensions = _isMobile ? '400x70' : '1000x100';
    templateData.mapStaticImg = `https://maps.googleapis.com/maps/api/staticmap?size=${staticImgDimensions}&markers=icon:https://www.bikedeboa.com.br/img/pin_${templateData.pinColor}.png|${m.lat},${m.lng}&key=${GOOGLEMAPS_KEY}&${_gmapsCustomStyleStaticApi}`;

    // Tags
    if (m.tags && m.tags.length > 0) {
      const MAX_TAG_COUNT = m.reviews;
      const MIN_TAG_OPACITY = 0.3;

      let allTags = [];
      tags.forEach( t => {
        const found = m.tags.find( el => el.name === t.name );
        if (found) {
          allTags.push(found);
        } else {
          allTags.push({name: t.name, count: 0});
        }
      });

      // templateData.tags = m.tags
      templateData.tags = allTags 
        .sort((a, b) => {return b.count - a.count;})
        .map(t => {
          // Tag opacity is proportional to count
          // @todo refactor this to take into account Handlebars native support for arrays
          const opacity = t.count/MAX_TAG_COUNT + MIN_TAG_OPACITY;
          // return t.count > 0 ? `<span class="tagDisplay" style="opacity: ${opacity}">${t.name} <span class="tag-count">${t.count}</span></span>` : '';
          return `
            <span class="tagDisplayContainer">
              <span class="tagDisplay" style="opacity: ${opacity}">
                ${t.name} <span class="tag-count">${t.count}</span>
              </span>
            </span>
          `;
        })
        .join('');
    }

    // Reviews, checkins
    if (m.reviews === '0') {
      templateData.numReviews = 'Nenhuma avaliação :(';
    } else if (m.reviews === '1') {
      templateData.numReviews = '1 avaliação';
    } else {
      templateData.numReviews = `${m.reviews} avaliações`;
    }
    
    // templateData.numCheckins = m.checkin && (m.checkin + ' check-ins') || '';

    if (BDB.User.isAdmin) {
      templateData.isAdmin = true;
      templateData.canModify = true;
    } else {
      if (BDB.User.checkEditPermission(m.id)) {
        templateData.canModify = true;
      }
    }


    // Route button 
    templateData.gmapsRedirectUrl = `https://www.google.com/maps/preview?daddr=${m.lat},${m.lng}&dirflg=b`;

    // Photo
    templateData.photoUrl = m.photo;

    // Is public? 
    if (m.isPublic != null) {
      templateData.isPublic = m.isPublic === true;
    } else {
      templateData.noIsPublicData = true;
    }

    if (m.isCovered != null) {
      templateData.isCovered = m.isCovered === true;
    } else {
      templateData.noIsCoveredData = true;
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
      templateData.structureTypeCode = m.structureType;
      templateData.structureTypeLabel = STRUCTURE_CODE_TO_NAME[m.structureType];
    }
    templateData.structureTypeIcon = structureTypeIcon;

    // Retrieves a previous review saved in session
    const previousReview = BDB.User.getReviewByPlaceId(m.id);
    if (previousReview) {
      templateData.savedRating = previousReview.rating;
    }


    ////////////////////////////////
    // Render handlebars template //
    ////////////////////////////////
    $('#placeDetailsModalTemplatePlaceholder').html(templates.placeDetailsModalTemplate(templateData));

    if (m.average) {
      $('input[name=placeDetails_rating]').val(['' + Math.round(m.average)]);
    } else {
      $('#ratingDisplay').addClass('empty');
    }

    $('.photo-container img').on('load', e => {
      $(e.target).parent().parent().removeClass('loading');
    });
 
    // Init click callbacks
    // $('#checkinBtn').on('click', sendCheckinBtn);
    $('.rating-input-container .full-star, .openReviewPanelBtn').off('click').on('click', e => {
      openReviewModal($(e.target).data('value'));
    });
    $('.shareBtn').off('click').on('click', e => {
      ga('send', 'event', 'Local', 'share', ''+openedMarker.id);
      
      openShareDialog();
    });
    $('.photo-container img').off('click').on('click', e => {
      toggleExpandModalHeader();
    });
    $('.directionsBtn').off('click').on('click', e => {
      ga('send', 'event', 'Local', 'directions', ''+openedMarker.id);
    });
    $('#editPlaceBtn').off('click').on('click', queueUiCallback.bind(this, openNewOrEditPlaceModal));
    $('#deletePlaceBtn').off('click').on('click', queueUiCallback.bind(this, deletePlace));
    $('#createRevisionBtn').off('click').on('click', queueUiCallback.bind(this, () => {
      if (!BDB.User.isLoggedIn) {
        // @todo fix to not need to close the modal
        hideAll();
        openLoginDialog(true);
      } else {
        openRevisionDialog();
      }
    }));

    // Display the modal
    if (!$('#placeDetailsModal').is(':visible')) {
      // $('section, .modal-footer').css({opacity: 0});

      $('#placeDetailsModal')
        .one('show.bs.modal', () => { 
          // Global states
          $('body').addClass('details-view');
          if (previousReview) {
            $('body').addClass('already-reviewed');
          } else {
            $('body').removeClass('already-reviewed');
          }
          // if (m.photo) {
          //   $('body').addClass('gradient-topbar');
          // }
        }) 
        .one('shown.bs.modal', () => { 
          // Animate modal content
          // $('section, .modal-footer').velocity('transition.slideDownIn', {stagger: STAGGER_NORMAL, queue: false});
          // if (!templateData.savedRating) {
          //   $('#bottom-mobile-bar').velocity("slideDown", { easing: 'ease-out', duration: 700 });
          // }

          // Fixes bug in which Bootstrap modal wouldnt let anything outside it be focused
          // Thanks to https://github.com/limonte/sweetalert2/issues/374
          $(document).off('focusin.modal');

          // @todo do this better please
          if (window._openLocalCallback && typeof window._openLocalCallback === 'function') {
            window._openLocalCallback();
            window._openLocalCallback = undefined;
          }
        })
        .one('hidden.bs.modal', () => {
          $('body').removeClass('details-view');
          // $('body').removeClass('gradient-topbar');
        })
        .modal('show');
    } else { 
      // Just fade new detailed content in
      // $('#placeDetailsModal .photo-container, #placeDetailsModal .tagsContainer').velocity('transition.fadeIn', {stagger: STAGGER_NORMAL, queue: false});
      $('#placeDetailsModal .tagsContainer').velocity('transition.fadeIn', {stagger: STAGGER_NORMAL, queue: false});
    }

    // Tooltips
    if(!_isTouchDevice) {
      $('#placeDetailsModal .full-star').tooltip({
        toggle: 'tooltip',
        placement: 'bottom', 
        'delay': {'show': 0, 'hide': 100}
      });
    }
    initHelpTooltip('#placeDetailsModal .help-tooltip-trigger');

    $('#public-access-help-tooltip').off('show.bs.tooltip').on('show.bs.tooltip', () => {
      ga('send', 'event', 'Misc', 'tooltip - pin details public access');
    });
    $('#private-access-help-tooltip').off('show.bs.tooltip').on('show.bs.tooltip', () => {
      ga('send', 'event', 'Misc', 'tooltip - pin details private access');
    });
    $('#uinvertido-type-help-tooltip').off('show.bs.tooltip').on('show.bs.tooltip', () => {
      ga('send', 'event', 'Misc', 'tooltip - pin details uinvertido type');
    });
    $('#deroda-type-help-tooltip').off('show.bs.tooltip').on('show.bs.tooltip', () => {
      ga('send', 'event', 'Misc', 'tooltip - pin details deroda type');
    });
    $('#trave-type-help-tooltip').off('show.bs.tooltip').on('show.bs.tooltip', () => {
      ga('send', 'event', 'Misc', 'tooltip - pin details trave type');
    });
    $('#suspenso-type-help-tooltip').off('show.bs.tooltip').on('show.bs.tooltip', () => {
      ga('send', 'event', 'Misc', 'tooltip - pin details suspenso type');
    });
    $('#grade-type-help-tooltip').off('show.bs.tooltip').on('show.bs.tooltip', () => {
      ga('send', 'event', 'Misc', 'tooltip - pin details grade type');
    });
    $('#other-type-help-tooltip').off('show.bs.tooltip').on('show.bs.tooltip', () => {
      ga('send', 'event', 'Misc', 'tooltip - pin details other type');
    });
  }

  function updateCurrentPosition(position) {
    const pos = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };

    if (map) {
      _geolocationMarker.setPosition(pos);

      _geolocationRadius.setCenter(pos);
      _geolocationRadius.setRadius(position.coords.accuracy);
    }
  }

  function geolocate(toCenter, callback, quiet = false) {
    if (navigator.geolocation) {
      // @todo split both behaviors into different functions
      if (_geolocationInitialized) {
        if (map) {
          const markerPos = _geolocationMarker.getPosition();
          const pos = {
            lat: markerPos.lat(),
            lng: markerPos.lng()
          };

          map.panTo(pos);
          
          // Set minimum map zoom
          if (map.getZoom() < 17) {
            map.setZoom(17);
          }
        }
      } else {
        if (!quiet) {
          $('#geolocationBtn').addClass('loading');
        }

        _geolocationInitialized = false;

        const options = {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            position => {
              console.debug(position);

              _geolocationInitialized = true;

              ga('send', 'event', 'Geolocation', 'init', `${position.coords.latitude},${position.coords.longitude}`);

              updateCurrentPosition(position);

              $('#geolocationBtn').addClass('active');
              
              if (map) {
                _geolocationRadius.setVisible(true);
                if (markers && markers.length) {
                  _geolocationMarker.setZIndex(markers.length);
                }

                if (toCenter) {
                  const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                  };

                  map.panTo(pos);
                  
                  // Set minimum map zoom
                  if (map.getZoom() < 17) {  
                    map.setZoom(17);
                  }
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
                  swal('Ops', 'A geolocalização do seu dispositivo parece não estar funcionando agora. Mas tente de novo que deve dar ;)', 'warning');
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

  // function geolocationBtn() {
  //   let controlDiv = document.createElement('div');
  //   let controlUI = document.createElement('div');
  //   controlUI.id = 'geolocationBtn';
  //   controlUI.title = 'Onde estou?';
  //   controlUI.className = 'caption-tooltip'; 

  //   controlDiv.appendChild(controlUI);

  //   // Set CSS for the control interior.
  //   let controlText = document.createElement('div');
  //   controlText.style.color = '#30bb6a';
  //   controlText.style.width = '100%';
  //   controlText.style.paddingTop = '13px';
  //   controlText.innerHTML = '<img src="/img/geolocation.svg" style="width: 20px;"/>';
  //   controlUI.appendChild(controlText);

  //   // Setup the click event listeners
  //   controlUI.addEventListener('click', () => {
  //     ga('send', 'event', 'Geolocation', 'geolocate button click');
  //     geolocate(true, () => {
  //       $('#geolocationBtn').removeClass('loading');
  //     });
  //   });

  //   return controlDiv;
  // }
 
  // Just delegate the action to the route controller
  function openLocal(marker, callback) {
    let url = BDB.Places.getMarkerShareUrl(marker);
 
    window._openLocalCallback = callback;

    marker.url = url;
    setView(marker.text || 'Detalhes do bicicletário', url);
  }

  function openLocalById(id, callback) {
    const place = BDB.Places.getMarkerById(id, callback);
    this.openLocal(place, callback);
  }

  function _openLocal(marker, callback) {
    if (marker) {
      openDetailsModal(marker, callback);

      if (!marker._hasDetails) {
        // Request content
        Database.getPlaceDetails(marker.id, () => {
          if (openedMarker && openedMarker.id === marker.id) {
            openDetailsModal(marker, callback);
          }
        });
      }
    }
  }

  function updateFilters() {
    let filters = [];
    $('.filter-checkbox:checked').each( (i, f) => {
      const p = $(f).data('prop');
      let v = $(f).data('value'); 

      filters.push({prop: p, value: v});
    });
 
    const resultsCount = applyFilters(filters);
    if (filters.length > 0) {
      $('#filter-results-counter').html(resultsCount);
      $('#active-filters-counter').html(filters.length);
      $('#filterBtn').toggleClass('active', true);
      $('#filter-results-counter-container').velocity({ opacity: 1 });
      $('#clear-filters-btn').velocity({ opacity: 1 });
    } else {
      $('#filter-results-counter-container').velocity({ opacity: 0 });
      $('#clear-filters-btn').velocity({ opacity: 0 });
      $('#active-filters-counter').html('');
      $('#filterBtn').toggleClass('active', false);
    }
  }

  // Array of filters in the form of [{prop: 'a property', value: 'a value'}, ...]
  // Logical expression: 
  //   showIt = (prop1_val1 OR ... OR prop1_valN) AND
  //            (prop2_val1 OR ... OR prop2_valN) AND 
  //            ...
  //            (propN_val1 OR ... OR propN_valN)
  function applyFilters(filters = []) {
    let cont = 0;

    const isPublicFilters = filters.filter(i => i.prop === 'isPublic');
    const isCoveredFilters = filters.filter(i => i.prop === 'isCovered');
    const ratingFilters = filters.filter(i => i.prop === 'rating');
    const structureFilters = filters.filter(i => i.prop === 'structureType');
    const categories = [isPublicFilters, isCoveredFilters, ratingFilters, structureFilters];

    for(let i=0; i < markers.length; i++) {
      const m = markers[i];
      let showIt = true;

      // Apply all filters to this marker
      for(let cat=0; cat < categories.length && showIt; cat++) {
        let catResult = false;
        
        if (categories[cat].length) {
          for(let f_index=0; f_index < categories[cat].length && showIt; f_index++) {
            const f = categories[cat][f_index];
            let testResult;

            if (f.prop !== 'rating') {
              testResult = m[f.prop] === f.value;
            } else {
              // Custom test case: rating range
              switch (f.value) {
              case 'good':
                testResult = m.average >= 3.5;
                break;
              case 'medium':
                testResult = m.average > 2 && m.average < 3.5;
                break;
              case 'bad':
                testResult = m.average > 0 && m.average <= 2;
                break;
              case 'none':
                testResult = m.average === null;
                break;
              }
            }
            
            // Filters inside each category are compared with OR
            catResult = catResult || testResult;
          }
          
          // Category are compared with each other with AND
          showIt = showIt && catResult;
        }
      }

      // _gmarkers[i].setMap(showIt ? map : null);
      _gmarkers[i].setIcon(showIt ? m.icon : m.iconMini);
      _gmarkers[i].setOptions({clickable: showIt, opacity: (showIt ? 1 : 0.3)});
      _gmarkers[i].collapsed = !showIt;
      cont += showIt ? 1 : 0;
    }

    _activeFilters = filters.length;

    return cont;
  }

  function clearFilters() {
    _activeFilters = null;
    setMapOnAll(map);
  }

  function formatAverage(avg) {
    if (avg) {
      avg = parseFloat(avg);
      if (avg.toFixed && avg !== Math.round(avg)) {
        avg = avg.toFixed(1);
      }
      avg = '' + avg;
    }

    return avg;
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

          if (map) {
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
              _gmarkers.push(new google.maps.Marker({
                position: {
                  lat: parseFloat(m.lat),
                  lng: parseFloat(m.lng)
                },
                map: map,
                icon: m.icon,
                // title: m.text,
                // label: labelStr && {
                //   text: labelStr,
                //   color: 'white',
                //   fontFamily: 'Roboto'
                // },
                zIndex: i, //markers should be ordered by average
                // opacity: 0.1 + (m.average/5).
              }));

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
                pinColor: getPinColorFromAverage(m.average)
              };
 
              // @todo: encapsulate both the next 2 in one method
              // Reviews count
              if (m.reviews === 0) {
                templateData.numReviews = '';
              } else if (m.reviews === '1') {
                templateData.numReviews = '1 avaliação';
              } else {
                templateData.numReviews = `${m.reviews} avaliações`;
              }

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

              const contentString = templates.infoWindowTemplate(templateData);

              if (_isTouchDevice) {
                // Infobox preview on click
                _gmarkers[i].addListener('click', () => {
                  ga('send', 'event', 'Local', 'infobox opened', m.id); 

                  map.panTo(_gmarkers[i].getPosition());

                  _infoWindow.setContent(contentString);
                  _infoWindow.open(map, _gmarkers[i]);
                  _infoWindow.addListener('domready', () => {
                    $('.infobox--img img').off('load').on('load', e => {
                      $(e.target).parent().removeClass('loading');
                    });

                    $('.infoBox').off('click').on('click', () => {
                      openLocal(markers[i]);
                      _infoWindow.close();
                    });
                  });
                });

                map.addListener('click', () => {
                  _infoWindow.close();
                });
              } else {
                // No infobox, directly opens the details modal
                _gmarkers[i].addListener('click', () => {
                  openLocal(markers[i]);
                });

                // Infobox preview on hover
                _gmarkers[i].addListener('mouseover', () => {
                  ga('send', 'event', 'Local', 'infobox opened', m.id); 

                  _infoWindow.setContent(contentString); 
                  _infoWindow.open(map, _gmarkers[i]);
                  _infoWindow.addListener('domready', () => {
                    $('.infobox--img img').off('load').on('load', e => {
                      $(e.target).parent().removeClass('loading');
                    });
                  });
                });

                _gmarkers[i].addListener('mouseout', () => {
                  _infoWindow.close();
                });
              }
            } else {
              console.error('error: pin with no latitude/longitude');
            }
          }

        } else {
          console.error('marker is weirdly empty on addMarkerToMap()');
        }
      }
    }

    if (map) {
      _geolocationMarker.setZIndex(markers.length);
    } 
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
    if (_gmarkers && Array.isArray(_gmarkers)) {
      for (let i = 0; i < _gmarkers.length; i++) {
        _gmarkers[i].setOptions({clickable: false, opacity: 0.3});
      }
    }
  }

  // Shows any markers currently in the array.
  function showMarkers () {
    if (_gmarkers && Array.isArray(_gmarkers)) {
      for (let i = 0; i < _gmarkers.length; i++) {
        _gmarkers[i].setOptions({clickable: true, opacity: 1});
      }
    }
  }

  // Switches all marker icons to the full or the mini scale
  // scale := 'mini' | 'full'
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
      // showMarkers();
      setMarkersIcon('full');
      areMarkersHidden = false;
    } else {
      // hideMarkers();
      setMarkersIcon('mini'); 
      areMarkersHidden = true;
    }
  }

  function isPosWithinBounds(pos) {
    const ret = _mapBounds.contains(pos);
    return ret;
  }

  function mapCenterChanged() {
    // Makes sure this doesnt destroy the overall performance by limiting these calculations 
    //   to not be executed more then 20 times per second (1000ms/50ms = 20x).
    // (I'm not entirely sure this is needed though, but why not)
    clearTimeout(_centerChangedTimeout);
    _centerChangedTimeout = setTimeout( () => {
      // console.log('centerchanged');

      // Check center
      const isCenterWithinBounds = isPosWithinBounds(map.getCenter());
      $('#newPlaceholder').toggleClass('invalid', !isCenterWithinBounds);

      // Check visible bounds
      if (map.getBounds()) {
        const isViewWithinBounds = map.getBounds().intersects(_mapBounds);        
        $('#out-of-bounds-overlay').toggleClass('showThis', !isViewWithinBounds); 
      }
    }, 50);
  }

  function toggleLocationInputMode() {
    addLocationMode = !addLocationMode;
    const isTurningOn = addLocationMode;

    if (isTurningOn) {
      $('body').addClass('position-pin-mode');
      
      // Change Maps style that shows Points of Interest
      map.setOptions({styles: _gmapsCustomStyle_withLabels});

      $('#newPlaceholder').on('click', queueUiCallback.bind(this, () => {
        // Queries Google Geocoding service for the position address
        const mapCenter = map.getCenter();
        
        // Saves this position for later
        _newMarkerTemp = {lat: mapCenter.lat(), lng: mapCenter.lng()};
        BDB.geocodeLatLng(
          _newMarkerTemp.lat, _newMarkerTemp.lng,
          (address) => {
            // console.log('Resolved location address:');
            // console.log(address);
            _newMarkerTemp.address = address;
          }, () => {
            // nothing here.
          }
        );

        if (openedMarker) {
          // Was editing the marker position, so return to Edit Modal
          const mapCenter = map.getCenter();
          openedMarker.lat = mapCenter.lat();
          openedMarker.lng = mapCenter.lng();
          openNewOrEditPlaceModal();
        } else {
          if (isPosWithinBounds(map.getCenter())) {
            openNewOrEditPlaceModal();
          } else {
            const mapCenter = map.getCenter();
            ga('send', 'event', 'Local', 'out of bounds', `${mapCenter.lat()}, ${mapCenter.lng()}`); 

            swal({
              title: 'Ops',
              html:
                `Foi mal, o bike de boa ainda não chegou aqui!
                <br><br>
                <small>
                  <i>Acompanha nosso <a target="_blank" href="https://www.facebook.com/bikedeboaapp">
                  Facebook</a> para saber novidades sobre nossa cobertura, e otras cositas mas. :)</i>
                </small>`,
              type: 'warning',
            });
          }
        }

        toggleLocationInputMode();
      }));

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
      // Turning OFF

      map.setOptions({styles: _gmapsCustomStyle});

      $('#newPlaceholder').off('click');
      $(document).off('keyup.disableInput');
      $('body').removeClass('position-pin-mode');
      
      // Clear centerChanged event
      // if (map) {
      //   google.maps.event.clearInstanceListeners(map);
      // }
    }

    toggleMarkers();
    $('#addPlace').toggleClass('active');
    $('#addPlace > span').toggle();
    $('#newPlaceholder').toggleClass('active');
    $('#newPlaceholderShadow').toggle();
    $('#newPlaceholderTarget').toggle();
    $('#geolocationBtnBtn').toggle();

    if (!isTurningOn && openedMarker) { 
      // Was editing the marker position, so return to Edit Modal
      openNewOrEditPlaceModal();
    }
  }

  function showUI() {
    // $('#locationSearch').velocity('transition.slideDownIn', {queue: false});
    // $('#addPlace').velocity('transition.slideUpIn');
    $('.cool-hide').removeClass('cool-hidden');
  }

  function hideUI() {
    // $('#locationSearch').velocity('transition.slideUpOut', {queue: false});
    // $('#addPlace').velocity('transition.slideDownOut');
    $('.cool-hide').addClass('cool-hidden');
  }

  // @todo refactor this, it's fuckin confusing
  function finishCreateOrUpdatePlace() {
    const updatingMarker = openedMarker;
    openedMarker = null;
    
    goHome();
    showSpinner('Salvando bicicletário...');

    let place = {};

    // If we were editing this place's position
    if (_newMarkerTemp) {
      place.lat = _newMarkerTemp.lat;
      place.lng = _newMarkerTemp.lng;
      if (_newMarkerTemp.address) {
        place.address = _newMarkerTemp.address;
      }
      _newMarkerTemp = null;
    }

    // Reset form fields
    // @todo replace this to use a rendered template
    place.text = $('#newPlaceModal #titleInput').val();
    // place.isPublic = $('#newPlaceModal input:radio[name=isPublicRadioGrp]:checked').val();
    place.isPublic = $('#newPlaceModal .acess-types-group .active').data('value') === 'public';
    place.isCovered = $('#newPlaceModal .covered-group .active').data('value') === 'covered';
    place.structureType = $('#newPlaceModal .custom-radio-group .active').data('value');
    place.photo = _uploadingPhotoBlob;
    place.description = $('#newPlaceModal #descriptionInput').val();

    const onPlaceSaved = newPlace => {
      if (!updatingMarker) {
        BDB.User.saveNewPlace(newPlace.id);
      }

      Database.getPlaces( () => {
        updateMarkers();
        
        hideSpinner();

        if (updatingMarker) {
          toastr['success']('Bicicletário atualizado.'); 
        } else { 
          swal({
            title: 'Bicicletário criado',
            text: 'Valeu! Sua contribuição irá ajudar outros ciclistas a encontrar onde deixar a bici e ficar de boa. :)',
            type: 'success',
            allowOutsideClick: false, // because this wouldnt trigger the callback @todo
            allowEscapeKey: false,    // because this wouldnt trigger the callback @todo
          }).then(() => {
            // Clicked OK or dismissed the modal
            const newMarker = markers.find( i => i.id === newPlace.id );
            if (newMarker) {
              openLocal(newMarker, () => {
                promptPWAInstallPopup();

                // $('.rating-input-container').velocity('callout.bounce');
                $('.openReviewPanelBtn').tooltip('show');
                setTimeout(() => { 
                  $('.openReviewPanelBtn').tooltip('hide');
                }, 5000);
              });
            }
          });
        }
      });
    };

    if (updatingMarker) {
      ga('send', 'event', 'Local', 'update', ''+updatingMarker.id);
      Database.updatePlace(updatingMarker.id, place, onPlaceSaved);
    } else {
      ga('send', 'event', 'Local', 'create');
      Database.sendPlace(place, onPlaceSaved);
    }
  }

  function setupAutocomplete() {
    const inputElem = document.getElementById('locationQueryInput');
    // Limits the search to the our bounding box
    const options = {
      bounds: _mapBounds,
      strictBounds: true
    };
    let autocomplete = new google.maps.places.Autocomplete(inputElem, options);
    // autocomplete.bindTo('bounds', map);

    // var infowindow = new google.maps.InfoWindow();
    _searchResultMarker = new google.maps.Marker({
      map: map,
      clickable: false,
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

      img.onload = () => {
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
        $('#newPlaceModal #photoInput+label').addClass('photo-input--edit-mode');
      };
      
      img.src = e.target.result;
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

    let placeDetailsModalTemplate = $('#placeDetailsModalTemplate').html();
    if (placeDetailsModalTemplate) {
      templates.placeDetailsModalTemplate = Handlebars.compile(placeDetailsModalTemplate);
    }

    let placeDetailsModalLoadingTemplate = $('#placeDetailsModalLoadingTemplate').html();
    if (placeDetailsModalLoadingTemplate) {
      templates.placeDetailsModalLoadingTemplate = Handlebars.compile(placeDetailsModalLoadingTemplate);
    }

    let infoWindowTemplate = $('#infoWindowTemplate').html();
    if (infoWindowTemplate) {
      templates.infoWindowTemplate = Handlebars.compile(infoWindowTemplate);
    }

    let profileModalTemplate = $('#profileModalTemplate').html();
    if (profileModalTemplate) {
      templates.profileModalTemplate = Handlebars.compile(profileModalTemplate);
    }

  }

  function validateNewPlaceForm() {
    const textOk = $('#newPlaceModal #titleInput').is(':valid');
    const isOk =
      textOk &&
      // $('#newPlaceModal input:radio[name=isPublicRadioGrp]:checked').val() &&
      $('#newPlaceModal .acess-types-group .active').data('value') &&
      $('#newPlaceModal .covered-group .active').data('value') &&
      $('#newPlaceModal .custom-radio-group .active').data('value');

    // console.log('validating');

    $('#newPlaceModal #saveNewPlaceBtn').prop('disabled', !isOk);
  }

  // @todo clean up this mess
  function openNewOrEditPlaceModal() {
    // Reset fields
    _uploadingPhotoBlob = '';
    $('#newPlaceModal #saveNewPlaceBtn').prop('disabled', true);
    $('#newPlaceModal #titleInput').val('');
    $('#newPlaceModal .typeIcon').removeClass('active');
    // $('#newPlaceModal input[name=isPublicRadioGrp]').prop('checked',false);
    $('#newPlaceModal #photoInputBg').attr('src', '');
    $('#newPlaceModal #descriptionInput').val('');
    $('#newPlaceModal .description.collapsable').removeClass('expanded');
    
    $('#newPlaceModal #photoInput+label').removeClass('photo-input--edit-mode');
    $('#newPlaceModal h1').html(openedMarker ? 'Editando bicicletário' : 'Novo bicicletário'); 
    $('#newPlaceModal .minimap-container').toggle(!!openedMarker);
    $('#newPlaceModal #cancelEditPlaceBtn').toggle(!!openedMarker);

    // $('#newPlaceModal .tagsContainer button').removeClass('active');

    // Not creating a new one, but editing
    if (openedMarker) {
      // @todo refactor all of this, probably separate into different functions for NEW and EDIT modes
      const m = openedMarker;

      setView('Editar bicicletário', '/editar');

      ga('send', 'event', 'Local', 'update - pending', ''+m.id);

      $('#newPlaceModal #titleInput').val(m.text);
      $('#newPlaceModal #saveNewPlaceBtn').prop('disabled', false);
      $(`#newPlaceModal .custom-radio-group [data-value="${m.structureType}"]`).addClass('active');
      if (m.isPublic != null) {
        $(`#newPlaceModal .acess-types-group [data-value="${m.isPublic ? 'public' : 'private'}"]`).addClass('active');
      }
      if (m.isCovered != null) { 
        $(`#newPlaceModal .covered-group [data-value="${m.isCovered ? 'covered' : 'uncovered'}"]`).addClass('active');
      }
      // $(`#newPlaceModal input[name=isPublicRadioGrp][value="${m.isPublic}"]`).prop('checked', true);
      $('#newPlaceModal #photoInputBg').attr('src', m.photo);
      $('#newPlaceModal #descriptionInput').val(m.description);

      // Minimap
      // @todo generalize this
      const staticImgDimensions = _isMobile ? '400x100' : '1000x100';
      const minimapUrl = `https://maps.googleapis.com/maps/api/staticmap?zoom=20&size=${staticImgDimensions}&markers=icon:https://www.bikedeboa.com.br/img/pin_${getPinColorFromAverage(m.average)}.png|${m.lat},${m.lng}&key=${GOOGLEMAPS_KEY}&${_gmapsCustomStyleStaticApi}`;
      $('#newPlaceModal .minimap').attr('src', minimapUrl);

      // More info section
      if (m.description && m.description.length > 0) {
        $('#newPlaceModal .description').addClass('expanded');
      }

      if (openedMarker.photo.length > 0) {
        $('#newPlaceModal #photoInput+label').addClass('photo-input--edit-mode');
      }

      // $('#placeDetailsModal').modal('hide');
    } else {
      setView('Novo bicicletário', '/novo');
      ga('send', 'event', 'Local', 'create - pending');

      initHelpTooltip('#newPlaceModal .help-tooltip-trigger');

      $('#access-general-help-tooltip').off('show.bs.tooltip').on('show.bs.tooltip', () => {
        ga('send', 'event', 'Misc', 'tooltip - new pin access help');
      });
      $('#type-general-help-tooltip').off('show.bs.tooltip').on('show.bs.tooltip', () => {
        ga('send', 'event', 'Misc', 'tooltip - new pin type help');
      });
    }

    // Initialize callbacks
    $('.typeIcon').off('click.radio').on('click.radio', e => {
      $(e.currentTarget).siblings('.typeIcon').removeClass('active');
      $(e.currentTarget).addClass('active');

      // const currentStep = $(e.currentTarget).parent().data('form-step');
      // const nextStep = parseInt(currentStep) + 1;
      // const nextStepEl = $(`[data-form-step="${nextStep}"]`);
      // $('#newPlaceModal').animate({
      //   scrollTop: $(`[data-form-step="${2}"]`).offset().top
      // });

      // $('#newPlaceModal').animate({ 
      //   scrollTop: $(e.currentTarget).parent().offset().top
      // });
    });
    // this has to be AFTER the typeIcon click trigger
    $('#newPlaceModal input, #newPlaceModal .typeIcon')
      .off('change.validate input.validate click.validate')
      .on(' change.validate input.validate click.validate', () => {
        validateNewPlaceForm();
      });
    validateNewPlaceForm();
    
    $('#newPlaceModal textarea').off('keyup').on('keyup', e => {
      autoGrowTextArea(e.currentTarget); 
    });

    $('#saveNewPlaceBtn').off('click').on('click', queueUiCallback.bind(this, finishCreateOrUpdatePlace));

    // Edit only buttons
    if (openedMarker) {
      $('#cancelEditPlaceBtn').off('click').on('click', () => {
        hideAll().then(() => {
          openLocal(openedMarker);
        });
      });

      $('#editPlacePositionBtn').off('click').on('click', () => {
        // Ask to keep opened marker temporarily
        hideAll(true);
        
        map.setCenter({
          lat: parseFloat(openedMarker.lat),
          lng: parseFloat(openedMarker.lng)
        });

        // Set minimum map zoom
        if (map.getZoom() < 19) {
          map.setZoom(19);
        }
        
        toggleLocationInputMode();
      });
    }
    
    $('#photoInput').off('change').on('change', e => {
      // for some weird compiling reason using 'this' doesnt work here
      const self = document.getElementById('photoInput');
      const files = self.files ;

      if (files && files[0] && files[0].type.match(/image.*/)) {
        showSpinner('Processando imagem...');

        queueUiCallback(() => {
          let reader = new FileReader();
          reader.onload = photoUploadCB;
          reader.readAsDataURL(self.files[0]);
        });
      } else {
        swal('Ops', 'Algo deu errado com a foto, por favor tente novamente.', 'error');
      }
    });
    $('.description.collapsable').off('click').on('click', e => {
      $(e.currentTarget).addClass('expanded'); 
    }); 

    // Finally, display the modal
    const showModal = () => {
      // We can only set the nav title after the modal has been opened
      setPageTitle(openedMarker ? 'Editar bicicletário' : 'Novo bicicletário');

      $('#newPlaceModal')
        .one('shown.bs.modal', () => {
          $('#titleInput').focus();
        })
        .modal('show');
    }
    if (openedMarker && $('#placeDetailsModal').is(':visible')) {
      $('#placeDetailsModal')
        .one('hidden.bs.modal', () => { 
          showModal();
        })
        .modal('hide'); 
    } else {
      showModal();
    }
  }

  function deletePlace() {
    if (openedMarker) {
      swal({
        title: "Deletar bicicletário",
        text: "Tem certeza disso?",
        type: "warning",
        showCancelButton: true,
        confirmButtonText: "Deletar",
        confirmButtonColor: '#FF8265'
      }).then(() => {
        ga('send', 'event', 'Local', 'delete', ''+openedMarker.id);

        showSpinner();
        Database.deletePlace(openedMarker.id, () => {
          goHome();
          Database.getPlaces( () => {
            updateMarkers();
            hideSpinner();
            swal('Bicicletário deletado', 'Espero que tu saiba o que tá fazendo. :P', 'error');
          });
        });
      });
    }
  }

  function openReviewModal(prepopedRating) {
    const m = openedMarker;
    const previousReview = BDB.User.getReviewByPlaceId(m.id);
    _updatingReview = previousReview;

    // Tags toggle buttons
    let tagsButtons = tags.map(t => {
      let isPrepoped = false;
      if (previousReview && previousReview.tags && previousReview.tags.length > 0) {
        isPrepoped = previousReview.tags.find( i => parseInt(i.id) === t.id );
      }

      return `
        <button  
            class="btn btn-tag ${isPrepoped ? 'active' : ''}"
            data-toggle="button"
            data-value="${t.id}">
          ${t.name}
        </button>
      `;
    }).join(''); 

    swal({ 
      // title: 'Avaliar bicicletário',
      customClass: 'review-modal',
      html: `
        <section>
          <div class="review" {{#if pinColor}}data-color={{pinColor}}{{/if}}>
              <h2>Dê sua nota</h2>
              <fieldset class="rating">
                  <input type="radio" id="star5" name="rating" value="5" /> <label class="full-star" data-value="5" for="star5" title="De boa!"></label>
                  <input type="radio" id="star4" name="rating" value="4" /> <label class="full-star" data-value="4" for="star4" title="Bem bom"></label>
                  <input type="radio" id="star3" name="rating" value="3" /> <label class="full-star" data-value="3" for="star3" title="Médio"></label>
                  <input type="radio" id="star2" name="rating" value="2" /> <label class="full-star" data-value="2" for="star2" title="Ruim"></label>
                  <input type="radio" id="star1" name="rating" value="1" /> <label class="full-star" data-value="1" for="star1" title="Horrivel"></label>
              </fieldset>
          </div>
        </section>

        <section class="step-2">
          <h2>
            Vantagens
          </h2>
          <p class="small">Opcional. Selecione quantas achar necessário.</p>
          <div class="tagsContainer">
              ${tagsButtons}
          </div>
        </section>`,
      confirmButtonText: "Enviar",
      confirmButtonClass: 'btn green sendReviewBtn',
      showCloseButton: true,
      showLoaderOnConfirm: true,
      onOpen: () => {
        if(!_isTouchDevice) {
          $('.review-modal .full-star').tooltip({
            toggle: 'tooltip',
            placement: 'bottom',
            'delay': {'show': 0, 'hide': 100}
          });
        }
 
        // Prepopulate rating
        if (previousReview) {
          currentPendingRating = previousReview.rating;
          $('.review-modal input[name=rating]').val([previousReview.rating]);

          ga('send', 'event', 'Review', 'update - pending', ''+m.id);
        } else if (prepopedRating) {
          currentPendingRating = prepopedRating;
          $('.review-modal input[name=rating]').val([prepopedRating]);
        } else {
          ga('send', 'event', 'Review', 'create - pending', ''+m.id);
        }

        // Init callbacks
        $('.review-modal .rating').off('change').on('change', e => {
          currentPendingRating = $(e.target).val();
          validateReviewForm();
        });

        validateReviewForm();
      },
      preConfirm: sendReviewBtnCB
    }).then( () => {
      // hideSpinner();
      if (_updatingReview) {
        ga('send', 'event', 'Review', 'update', ''+m.id, parseInt(currentPendingRating));

        toastr['success']('Avaliação atualizada.'); 
      } else {
        ga('send', 'event', 'Review', 'create', ''+m.id, parseInt(currentPendingRating));

        $('body').addClass('already-reviewed');

        swal({ 
          title: 'Valeu!',
          html: 'Sua avaliação é muito importante! Juntos construímos a cidade que queremos.',
          type: 'success',
          onOpen: () => {
            startConfettis();
          },
          onClose: () => {
            stopConfettis();
            promptPWAInstallPopup();
          } 
        });
      }

      // Update marker data
      Database.getPlaceDetails(m.id, () => {
        updateMarkers();
        openDetailsModal(m);
      });
    });
  }

  function validateReviewForm() {
    const isOk = currentPendingRating;
    $('.sendReviewBtn').prop('disabled', !isOk);
    // $('.review-modal .step-2').velocity('fadeIn');
  }

  function toggleExpandModalHeader() {
    ga('send', 'event', 'Local', 'photo click', ''+openedMarker.id);

    // $('.photo-container').toggleClass('expanded');
  }

  function toggleClearLocationBtn(stateStr) {
    if (stateStr === 'show') {
      $('#clearLocationQueryBtn').addClass('clear-mode');
    } else if (stateStr === 'hide') {
      $('#clearLocationQueryBtn').removeClass('clear-mode');
    } else {
      console.error('Invalid arg in toggleClearLocationBtn()');
    }
  }

  function startConfettis() {
    window.confettiful = new Confettiful(document.querySelector('.confetti-placeholder'));
  }

  function stopConfettis() {
    clearTimeout(window.confettiful.confettiInterval);
  }

  function sendReviewBtnCB() {
    return new Promise(function (resolve, reject) {
      const m = openedMarker;

      const activeTagBtns = $('.review-modal .tagsContainer .btn.active');
      let reviewTags = [];
      for(let i=0; i<activeTagBtns.length; i++) {
        reviewTags.push( {id: ''+activeTagBtns.eq(i).data('value')} );
      }

      // showSpinner();

      const reviewObj = {
        placeId: m.id,
        rating: currentPendingRating,
        tags: reviewTags
      };

      const callback = () => {
        Database.sendReview(reviewObj, reviewId => {
          reviewObj.databaseId = reviewId;
          BDB.User.saveReview(reviewObj);

          resolve();
        });
      }; 

      const previousReview = BDB.User.getReviewByPlaceId(m.id);
      if (previousReview) {
        // Delete previous
        Database.deleteReview(previousReview.databaseId, callback);
      } else {
        callback();
      }
    });
  }

  function openRevisionDialog() {
    swal({ 
      // title: 'Sugerir correção',
      customClass: 'revision-modal',
      html:
        `<p>
          Este bicicletário está desatualizado ou está faltando uma informação importante? Aproveite este espaço pra nos ajudar a manter o mapeamento sempre atualizado e útil. :)
        </p>

        <p>
          <textarea id="revisionText" maxlength="250" onload="autoGrowTextArea(this)" 
          onkeyup="autoGrowTextArea(this)" type="text" class="text-input" placeholder="Sua sugestão"></textarea>
        </p>

        <p class="disclaimer">
          Para qualquer comentário sobre o site em geral, lembre que estamos sempre de olho no 
          <a href="mailto:bikedeboa@gmail.com"><img src="/img/icon_mail.svg" class="icon-mail"/> 
          email</a> e no <a target="_blank" rel="noopener" href="https://www.facebook.com/bikedeboaapp">Facebook</a>.
        </p>`,
      confirmButtonText: "Enviar",
      showCloseButton: true
    }).then(() => {
      showSpinner();

      const revisionObj = {
        placeId: openedMarker.id,
        content: $('#revisionText').val()
      };

      Database.sendRevision(revisionObj, revisionId => {
        hideSpinner();
        swal('Sugestão enviada', `Obrigado por contribuir com o bike de boa! Sua sugestão será 
          avaliada pelo nosso time de colaboradores o mais rápido possível.`, 'success');
      });
    });
  }

  function enterLocationSearchMode() {
    $('#map, #addPlace, .login-display, #filterBtn').velocity({ opacity: 0 }, { 'display': 'none' });
  }

  function exitLocationSearchMode() {
    $('#map, #addPlace, .login-display, #filterBtn').velocity({ opacity: 1 }, { 'display': 'block' });
  }

  function setPageTitle(text) {
    text = text || '';

    // Header that imitates native mobile navbar
    $('#top-mobile-bar-title').text(openedMarker ? '' : text);

    // Basic website metatags
    if (!text || text.length == 0) {
      text = 'bike de boa';
    }
    document.title = text; 
    $('meta[name="og:title"]').attr('content', text);

    // Special metatags for Details View
    if (openedMarker) {
      // Open Graph Picture
      if (openedMarker.photo) {
        $('meta[name="og:image"]').attr('content', openedMarker.photo);
      }

      // Custom Open Graph Description
      if (openedMarker.address) {
        let desc = 'Informações e avaliações deste bicicletário na ';
        desc += openedMarker.address;

        $('meta[name="og:title"]').attr('content', desc); 
      }
    }
  }

  function setView(title, view, isReplaceState) {
    _currentView = view;

    let data = {};
    if (title === 'bike de boa') {
      data.isHome = true;
    }

    // hideAll().then(() => {
      if (isReplaceState) {
        History.replaceState(data, title, view);
      } else {
        History.pushState(data, title, view);
      }

      // Force new pageview for Analytics
      // https://developers.google.com/analytics/devguides/collection/analyticsjs/single-page-applications
      ga('set', 'page', view);
      ga('send', 'pageview');
    // });
  }

  function goHome() {
    setView('bike de boa', '/');
  }

  function queueUiCallback(callback) {
    if (window.requestAnimationFrame) {
      requestAnimationFrame( () => {
        requestAnimationFrame( () => {
          callback();
        });
      });
    } else {
      callback();
    }
  }

  function returnToPreviousView() {
    if (_isDeeplink) {
      goHome();
    } else {
      History.back();
    }
  }

  function _initGlobalCallbacks() {
    $('#logo').on('click', () => {
      goHome();
    });

    $('.js-menu-show-hamburger-menu').on('click', queueUiCallback.bind(this, () => {
      // Menu open is already triggered inside the menu component.
      ga('send', 'event', 'Misc', 'hamburger menu opened');
      setView('', '/nav');
    }));
    
    $('.js-menu-show-filter-menu').on('click', queueUiCallback.bind(this, () => {
      // Menu open is already triggered inside the menu component.
      ga('send', 'event', 'Filter', 'filter menu opened');
      setView('', '/filtros');
    }));

    $('#show-bike-layer').on('change', e => {
      const $target = $(e.currentTarget);

      if ($target.is(':checked')) {
        ga('send', 'event', 'Filter', 'bike layer - SHOW');
        showBikeLayer();
      } else {
        ga('send', 'event', 'Filter', 'bike layer - HIDE');
        hideBikeLayer();
      }
    });

    $('.facebook-social-link').on('click', () => {
      ga('send', 'event', 'Misc', 'facebook hamburger menu link click');
    });

    $('.instagram-social-link').on('click', () => {
      ga('send', 'event', 'Misc', 'instagram hamburger menu link click');
    });

    $('.github-social-link').on('click', () => {
      ga('send', 'event', 'Misc', 'github hamburger menu link click');
    });

    $('.openProfileBtn').on('click', queueUiCallback.bind(this, () => {
      hideAll();
      setView('Contribuições', '/contribuicoes', true);
    }));
 
    $('.loginBtn').on('click', queueUiCallback.bind(this, () => {
      hideAll();
      // setView('Login Administrador', '/login', true);
      // login(true);

      openLoginDialog();
    }));
    
    $('.openAboutBtn').on('click', queueUiCallback.bind(this, () => {
      hideAll();
      ga('send', 'event', 'Misc', 'about opened');
      setView('Sobre', '/sobre', true);
    }));

    $('body').on('click', '.facebookLoginBtn', () => {
      hideAll();
      hello('facebook').login({scope: 'email'});
    }); 

    $('body').on('click', '.googleLoginBtn', () => {
      hideAll();
      hello('google').login({scope: 'email'}); 
    });

    $('body').on('click', '.logoutBtn', () => { 
      hideAll();
      hello.logout('facebook');
      hello.logout('google');
    }); 

    $('#howToInstallBtn').on('click', queueUiCallback.bind(this, () => {
      hideAll();

      ga('send', 'event', 'Misc', 'how-to-install opened');
      setView('Como instalar o app', '/como-instalar', true);
    }));

    $('.open-faq-btn').on('click', queueUiCallback.bind(this, () => {
      hideAll();

      ga('send', 'event', 'Misc', 'faq opened');
      setView('Perguntas frequentes', '/faq', true);
    }));

    // SideNav has a callback that prevents click events from bubbling, so we have to target specifically its container
    $('.js-side-nav-container, body').on('click', '.open-guide-btn', queueUiCallback.bind(this, () => {
      ga('send', 'event', 'Misc', 'faq opened');
      hideAll().then(() => {
        setView('Guia de bicicletários', '/guia-de-bicicletarios', true);
      });
    }));

    // SideNav has a callback that prevents click events from bubbling, so we have to target specifically its container
    $('.js-side-nav-container, body').on('click', '.open-aboutdata-btn', queueUiCallback.bind(this, () => {
      hideAll();

      ga('send', 'event', 'Misc', 'about data opened');
      setView('Sobre nossos dados', '/sobre-nossos-dados', true);
    }));

    $('.contact-btn').on('click', queueUiCallback.bind(this, () => {
      hideAll();

      ga('send', 'event', 'Misc', 'contact opened');
      
      swal('Contato', '', 'info');
      swal({
        title: 'Contato',
        html:
          `<a href="mailto:bikedeboa@gmail.com"><img src="/img/icon_mail.svg" class="icon-mail"/> bikedeboa@gmail.com</a>`,
      });
    }));

    $('.go-to-poa').on('click', queueUiCallback.bind(this, () => {
      map.setCenter(_portoAlegrePos);
      map.setZoom(6);
    }));

    $('#geolocationBtn').on('click', queueUiCallback.bind(this, () => {
      ga('send', 'event', 'Geolocation', 'geolocate button click');
      geolocate(true, () => {
        $('#geolocationBtn').removeClass('loading');
      });
    }));

    $('#addPlace').on('click', queueUiCallback.bind(this, () => {
      // This is only available to logged users
      if (!BDB.User.isLoggedIn) {
        openLoginDialog(true);
      } else {
        // Make sure the new local modal won't think we're editing a local
        if (!$('#addPlace').hasClass('active')) {
          openedMarker = null;
        }

        ga('send', 'event', 'Local', 'toggle create pin mode');
        toggleLocationInputMode();
      }
    }));

    $('#clear-filters-btn').on('click', () => {
      $('.filter-checkbox:checked').prop('checked', false);

      ga('send', 'event', 'Filter', 'clear filters');
      
      updateFilters();
    });

    $('.filter-checkbox').on('change', e => {
      // ga('send', 'event', 'Misc', 'launched with display=standalone');
      const $target = $(e.currentTarget);

      ga('send', 'event', 'Filter', `${$target.data('prop')} ${$target.data('value')} ${$target.is(':checked') ? 'ON' : 'OFF'}`);

      queueUiCallback(updateFilters);
    });

    $('body').on('click', '.back-button', e => {
      // If was creating a new local
      // @todo Do this check better
      if (_isMobile && History.getState().title === 'Novo bicicletário') {
        swal({
          text: 'Tu estava adicionando um bicicletário. Tem certeza que quer descartá-lo?',
          type: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#FF8265',
          confirmButtonText: 'Descartar', 
          allowOutsideClick: false
        }).then(() => {
          returnToPreviousView();
        }
        );
      } else {
        returnToPreviousView();
      }
    });

    $('body').on('click', '.modal, .close-modal', e => {
      // If click wasn't on the close button or in the backdrop, but in any other part of the modal
      if (e.target != e.currentTarget) {
        return;
      }

      goHome();
    });

    // Modal callbacks
    $('body').on('show.bs.modal', '.modal', e => {
      // Replace bootstrap modal animation with Velocity.js
      // $('.modal-dialog')
      //   .velocity('transition.slideDownBigIn', {duration: MODAL_TRANSITION_IN_DURATION})
      //   .velocity({display: 'table-cell'});

      // Set mobile navbar with modal's title
      const openingModalTitle = $(e.currentTarget).find('.view-name').text();
      if (openingModalTitle) {
        setPageTitle(openingModalTitle);
      }

      // Mobile optimizations
      if (_isMobile) {
        $('#map, #addPlace').addClass('optimized-hidden');
      } else {
        hideUI();

        if ($(e.currentTarget).hasClass('clean-modal')) {
          $('body').addClass('clean-modal-open');
        }
      }
    });

    $('body').on('hide.bs.modal', '.modal', e => {
      // $('.modal-dialog').velocity('transition.slideDownBigOut');

      if (_isMobile) {
        $('#map, #addPlace').removeClass('optimized-hidden');

        // Fix thanks to https://stackoverflow.com/questions/4064275/how-to-deal-with-google-map-inside-of-a-hidden-div-updated-picture
        if (map) {
          google.maps.event.trigger(map, 'resize');
          map.setCenter(map.getCenter());
        }
      } else {
        showUI();
        
        $('body').removeClass('clean-modal-open');
      }
    }); 

    // Any click to a lightbox picture
    // $('body').on('click', '[data-featherlight]', e => {
    //   setView('Foto', 'foto');
    // }); 
    
    // Location Search Mode control
    // $('#locationQueryInput').on('focus', e => { 
    //   if (_isMobile) {
    //     enterLocationSearchMode();
    //   }
    // });
    // $('#locationQueryInput').on('blur', e => {
    //   if (_isMobile) {
    //     exitLocationSearchMode();
    //   }
    // });

    // Location Search
    $('#locationQueryInput').on('input', queueUiCallback.bind(this, () => {
      toggleClearLocationBtn($('#locationQueryInput').val().length > 0 ? 'show' : 'hide');
    }));

    $('#clearLocationQueryBtn').on('click', queueUiCallback.bind(this, () => {
      // if (_isMobile) {
      //   exitLocationSearchMode();
      // }
      $('#locationQueryInput').val('');
      toggleClearLocationBtn('hide');
      _searchResultMarker.setVisible(false);
    }));
  }

  function hideAll(keepOpenedMarker) {
    return new Promise( (resolve, reject) => {
      // Close any sidenavs
      if (_hamburgerMenu && _filterMenu) {
        _hamburgerMenu.hide({dontMessWithState: false});
        _filterMenu.hide({dontMessWithState: false});
      }

      const openLightbox = $.featherlight.current();
      if (openLightbox) {
        openLightbox.close();
      }

      // @todo explain this hack plz
      if (!keepOpenedMarker) {
        openedMarker = null;
      }

      const $visibleModals = $('.modal').filter(':visible');
      if ($visibleModals.length > 0) {
        $visibleModals
          .one('hidden.bs.modal', resolve)
          .modal('hide');
      } else {
        resolve();
      }
    });
  }

  function showBikeLayer() {
    map.setOptions({styles: _gmapsCustomStyle_bikeLayerOptimized});
    
    // Bike layer from Google Maps
    _bikeLayer.setMap(map);
    
    // GeoJSON data from #datapoa/EPTC
    map.data.setMap(map);
  }

  function hideBikeLayer() {
    map.setOptions({styles: _gmapsCustomStyle});
    
    _bikeLayer.setMap(null);
    map.data.setMap(null);
  }

  function promptPWAInstallPopup() { 
    // Deferred prompt handling based on:
    //   https://developers.google.com/web/fundamentals/engage-and-retain/app-install-banners/
    if (_deferredPWAPrompt !== undefined) {
      // The user has had a postive interaction with our app and Chrome
      // has tried to prompt previously, so let's show the prompt.
      _deferredPWAPrompt.prompt(); 

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

      _deferredPWAPrompt = false;

      return true;
    } else {
      return false;
    }
  }

  function openHowToInstallModal() {
    const hasNativePromptWorked = promptPWAInstallPopup(); 

    if (!hasNativePromptWorked) {
      if (_isMobile) {
        // Tries to guess the user agent to initialize the correspondent accordion item opened
        const userAgent = window.getBrowserName();
        switch (userAgent) {
        case 'Chrome':
          $('#collapse-chrome').addClass('in');
          break;
        case 'Firefox':
          $('#collapse-firefox').addClass('in');
          break;
        case 'Safari':
          $('#collapse-safari').addClass('in');
          break;
        }
      }

      // Lazy load gifs when modal is shown
      $('#howToInstallModal .tutorial-gif').each( (i, v) => {
        $(v).attr('src', $(v).data('src'));
      });

      $('#howToInstallModal').modal('show');

      $('#howToInstallModal article > *').css({opacity: 0}).velocity('transition.slideDownIn', { stagger: STAGGER_NORMAL });
    }
  }

  function openFaqModal() { 
    $('#faqModal').modal('show');
    $('#faqModal .panel').css({opacity: 0}).velocity('transition.slideDownIn', { stagger: STAGGER_NORMAL });

    $('#faq-accordion').off('show.bs.collapse').on('show.bs.collapse', e => {
      const questionTitle = $(e.target).parent().find('.panel-title').text();
      ga('send', 'event', 'FAQ', 'question opened', questionTitle);
    });
  }

  function openProfileModal() { 
    function createdAtToDaysAgo(createdAtStr) {
      const createdAtDate = Date.parse(createdAtStr);
      const msAgo = Date.now() - createdAtDate;
      return Math.floor(msAgo/(1000*60*60*24));
    }

    let templateData = {};
    templateData.profile = BDB.User.profile;
    templateData.isAdmin = BDB.User.isAdmin;
    templateData.reviews = BDB.User.reviews;
    templateData.places = BDB.User.places;

    // Massage reviews list
    if (templateData.reviews) {
      templateData.nreviews = templateData.reviews.length;

      for(let i=0; i < templateData.reviews.length; i++) {
        let r = templateData.reviews[i];
        
        // Created X days ago
        if (r.createdAt) {
          r.createdDaysAgo = createdAtToDaysAgo(r.createdAt);
        }

        r.color = getPinColorFromAverage(r.rating);
      }

      templateData.reviews.sort( (a,b) => { return a.createdDaysAgo - b.createdDaysAgo; } );
    }

    // Massage places list
    if (templateData.places) {
      templateData.nplaces = templateData.places.length;

      for(let i=0; i < templateData.places.length; i++) {
        let p = templateData.places[i];
        // Created X days ago
        if (p.createdAt) {
          p.createdDaysAgo = createdAtToDaysAgo(p.createdAt);
        }
      }
      
      templateData.places.sort( (a,b) => { return a.createdDaysAgo - b.createdDaysAgo; } );
    }

    ////////////////////////////////
    // Render handlebars template //
    ////////////////////////////////
    $('#modalPlaceholder').html(templates.profileModalTemplate(templateData));
    $('#profileModal').modal('show');

    $('.go-to-place-btn').off('click').on('click', e => {
      const $target = $(e.currentTarget);
      const id = $target.data('id');
      const place = BDB.Places.getMarkerById(id);

      $('#profileModal').modal('hide').one('hidden.bs.modal', () => {
        openLocal(place);
      });
    });

    // $('#aboutModal').modal('show') ;
    // $('#aboutModal article > *').css({opacity: 0}).velocity('transition.slideDownIn', { stagger: STAGGER_NORMAL });
  }

  function openGuideModal() {
    $('#guideModal').modal('show');
    $('#guideModal article > *').css({opacity: 0}).velocity('transition.slideDownIn', { stagger: STAGGER_NORMAL });

    // Lazy load gifs when modal is shown
    $('#guideModal .guide-img-row img').each( (i, v) => {
      $(v).attr('src', $(v).data('src'));
    });
  } 
 
  function openDataModal() {
    $('#dataModal').modal('show');
    $('#dataModal article > *').css({opacity: 0}).velocity('transition.slideDownIn', { stagger: STAGGER_NORMAL });
  } 

  function openAboutModal() {
    $('#aboutModal').modal('show');
    $('#aboutModal article > *').css({opacity: 0}).velocity('transition.slideDownIn', { stagger: STAGGER_NORMAL });
  }

  function handleRouting() { 
    const urlBreakdown = window.location.pathname.split('/');
    let match = urlBreakdown[1];

    switch (urlBreakdown[1]) {
    case 'b':
      if (urlBreakdown[2]) {
        let id = urlBreakdown[2].split('-')[0];
        if (id) {
          id = parseInt(id);
          _deeplinkMarker = BDB.Places.getMarkerById(id);
          _openLocal(_deeplinkMarker);
        }
      }
      break;
    case 'faq':
      openFaqModal();
      break;
    case 'como-instalar':
      openHowToInstallModal();
      break;
    case 'guia-de-bicicletarios':
      openGuideModal();
      break;
    case 'sobre':
      $('#aboutModal').modal('show');
      $('#aboutModal article > *').css({opacity: 0}).velocity('transition.slideDownIn', { stagger: STAGGER_NORMAL });
      break;
    case 'sobre-nossos-dados':
      openDataModal();
      break;
    case 'contribuicoes':
      openProfileModal();
      break;
    // case 'nav':
    // case 'filtros':
    //   hideAll();
    default:
      match = false;
      break;
    }

    return match;
  }

  function setupGoogleMaps(wasDeeplink) {
    let initialCenter;
    if (wasDeeplink && _deeplinkMarker) {
      initialCenter = {
        lat: parseFloat(_deeplinkMarker.lat),
        lng: parseFloat(_deeplinkMarker.lng)
      };
    } else {
      initialCenter = _portoAlegrePos;
    }

    map = new google.maps.Map(document.getElementById('map'), {
      center: initialCenter,
      zoom: wasDeeplink ? 18 : 15,
      disableDefaultUI: true,
      scaleControl: false,
      clickableIcons: false,
      styles: _gmapsCustomStyle,
      mapTypeControl: false,
      // mapTypeControl: _isDesktop,
      // mapTypeControlOptions: {
      //     style: google.maps.MapTypeControlStyle.DROPDOWN_MENU, 
      //     position: google.maps.ControlPosition.RIGHT_CENTER
      // },
      zoomControl: _isDesktop,
      zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_CENTER
      },
      // streetViewControl: _isDesktop,
      // streetViewControlOptions: {
      //     position: google.maps.ControlPosition.RIGHT_CENTER
      // },
      // fullscreenControl: true
    });

    _mapBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(_mapBoundsCoords.sw.lat, _mapBoundsCoords.sw.lng),
        new google.maps.LatLng(_mapBoundsCoords.ne.lat, _mapBoundsCoords.ne.lng)
    );

    mapCenterChanged();
    map.addListener('center_changed', mapCenterChanged);

    const infoboxWidth = _isMobile ? $(window).width() * 0.95 : 300;
    const myOptions = {
      maxWidth: 0,
      pixelOffset: new google.maps.Size(-infoboxWidth/2, _isMobile ? 10 : 20),
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
    
    // Override with custom transition
    // const oldDraw = _infoWindow.draw; 
    // _infoWindow.draw = function() {
    //    oldDraw.apply(this);
    //    $(_infoWindow.div_).velocity('transition.slideUpIn', {display: 'flex', duration: 250}); 
    // }

    google.maps.event.addListener(map, 'zoom_changed', () => {
      const prevZoomLevel = _mapZoomLevel;

      _mapZoomLevel = map.getZoom() <= 13 ? 'mini' : 'full';

      if (prevZoomLevel !== _mapZoomLevel) {
        if (!_activeFilters) {
          setMarkersIcon(_mapZoomLevel);
        }
      }
    });

    geocoder = new google.maps.Geocoder();

    setupAutocomplete();

    // Bike Layer: google maps bycicling layer
    window._bikeLayer = new google.maps.BicyclingLayer();
    
    // Bike layer: GeoJSON from #datapoa
    map.data.map = null;
    map.data.loadGeoJson('/geojson/ciclovias_portoalegre.json');
    map.data.setStyle({
      strokeColor: 'green',
      strokeWeight: 5
    });

    // map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(document.getElementById('addPlace'));

    // // Geolocalization button
    // if (navigator.geolocation) {
    //   const btn = document.getElementById('geolocationBtn');
    //   map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(btn);
    // }

    // // if (_isMobile) {
    //   const filterBtnEl = document.getElementById('filterBtn');
    //   map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(filterBtnEl);
    // // }

    // These were initialized hidden in CSS
    // $('#geolocationBtn').show();
    // $('#filterBtn').show();
    // $('#addPlace').show(); 

    // Especial tooltips for map UI buttons that have only an icon
    if(!_isTouchDevice) {
      $('.caption-tooltip').tooltip({
        toggle: 'tooltip', 
        trigger: 'hover',
        placement: 'left', 
        'delay': {'show': 0, 'hide': 0}
      });
    }

    _geolocationMarker = new google.maps.Marker({
      map: map,
      clickable: false,
      icon: {
        url: '/img/current_position.svg', // url
        scaledSize: new google.maps.Size(CURRENT_LOCATION_MARKER_W, CURRENT_LOCATION_MARKER_H), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(CURRENT_LOCATION_MARKER_W/2, CURRENT_LOCATION_MARKER_H/2), // anchor
      }
    });

    _geolocationRadius = new google.maps.Circle({
      map: map,
      clickable: false,
      fillColor: '#705EC7',
      fillOpacity: '0.2',
      strokeColor: 'transparent',
      strokeOpacity: '0'
    });

    // Finally, enable the basic UI
    showUI();
    // $('#locationSearch').velocity('transition.slideDownIn', {delay: 300, queue: false});
    // $('#addPlace').velocity('transition.slideUpIn', {delay: 300, queue: false});
    // $('#map').css('filter', 'none');
  }

  function openLoginDialog(showPermissionDisclaimer = false) {
    // let permissionDisclaimer = '';
    // if (showPermissionDisclaimer) {
    //   permissionDisclaimer = `
    //     <p>
    //       Você precisa estar logado pra fazer isso. Esta é a melhor forma de garantirmos a qualidade do mapeamento. :)
    //     </p>
    //   `;
    // }

    // Returns the dialog promise
    return swal({ 
      title: showPermissionDisclaimer ? 'Você precisa fazer login' : 'Login', 
      html: `
        <br> 
 
        <p>
          Fazendo login você pode acessar todas contribuições que já fez e adicionar novos bicicletários no mapa.
        </p>

        <div>
          <button class="customLoginBtn facebookLoginBtn">
            Facebook
          </button>
        </div>

        <div>
          <button class="customLoginBtn googleLoginBtn">
            Google
          </button>
        </div>

        <br>

        <p style="
          font-style: italic;
          font-size: 12px;
          text-align: center;
          max-width: 300px;
          margin: 0 auto;">
          Nós <b>jamais</b> iremos vender os seus dados, mandar spam ou postar no seu nome sem sua autorização.
        </p>
        `,
      showCloseButton: true,
      showConfirmButton: false,
      onOpen: () => {
        window._isLoginDialogOpened = true;
      }
    }); 
  }

  function onSocialLogin(auth) {
    console.log('auth', auth);
    $('#userBtn').addClass('loading');

    if (window._isLoginDialogOpened) {
      swal.close(); 
      window._isLoginDialogOpened = false;
    }

    // Save the social token
    _socialToken = auth.authResponse.access_token;

    // Get user information for the given network
    hello(auth.network).api('me').then(function(userInfo) { 
      console.log('userInfo', userInfo);

      Database.socialLogin({
        network: auth.network,
        socialToken: _socialToken,
        fullname: userInfo.name,
        email: userInfo.email 
      }).then( data => { 
        console.log('social login successful'); 

        // UI
        $('#userBtn').removeClass('loading');
        $('#userBtn .avatar').attr('src', userInfo.thumbnail);
        // $('.openProfileBtn, .openProfileDivider').show();
        $('.openProfileBtn').attr('disabled', false);
        $('.logoutBtn').show(); 
        $('.loginBtn').hide();
        if (data.role === 'admin') {
          $('#userBtn').addClass('admin');
          userInfo.isAdmin = true;
        } else {
          userInfo.isAdmin = false;
        }
        
        userInfo.role = data.role;
        userInfo.isNewUser = data.isNewUser;
        
        BDB.User.login(userInfo);

        document.dispatchEvent(new CustomEvent('bikedeboa.login'));
      }).catch( error => {
        console.error('Error on social login', error); 
        toastr['warning']('Alguma coisa deu errado no login :/ Se continuar assim por favor nos avise!'); 

        $('#userBtn').removeClass('loading');
      });
    });
  }

  function onSocialLogout() {
    BDB.User.logout();

    // UI
    $('#userBtn .avatar').attr('src', '/img/icon_user_big.svg');
    $('#userBtn').removeClass('admin');
    $('.logoutBtn').hide();
    $('.loginBtn').show();
    $('.openProfileBtn').attr('disabled', true);

    document.dispatchEvent(new CustomEvent('bikedeboa.logout'));
  }

  // Setup must only be called *once*, differently than init() that may be called to reset the app state.
  function setup() {
    // Detect if webapp was launched from mobile homescreen (for Android and iOS)
    // References:
    //   https://developers.google.com/web/updates/2015/10/display-mode
    //   https://stackoverflow.com/questions/21125337/how-to-detect-if-web-app-running-standalone-on-chrome-mobile
    if (navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
      $('body').addClass('pwa-installed');
      ga('send', 'event', 'Misc', 'launched with display=standalone');
    }

    // Got Google Maps, either we're online or the SDK is in cache.
    if (window.google) {
      // On Mobile we defer the initialization of the map if we're in deeplink
      if (!_isMobile || (_isMobile && window.location.pathname === '/')) {
        setupGoogleMaps(); 
      }
    } else {
      setOfflineMode();
    }

    const isMobileListener = window.matchMedia('(max-width: ${MOBILE_MAX_WIDTH})');
    isMobileListener.addListener((isMobileListener) => {
      _isMobile = isMobileListener.matches;
    });
    const isDesktopListener = window.matchMedia('(min-width: ${DESKTOP_MIN_WIDTH})');
    isDesktopListener.addListener((isDesktopListener) => {
      _isDesktop = isDesktopListener.matches;
    });

    // Super specific mobile stuff
    if (_isMobile) {
      $('#locationQueryInput').attr('placeholder','Buscar endereço');

      $('.modal').removeClass('fade');
    } else {
      $('#locationQueryInput').attr('placeholder','Buscar endereço ou estabelecimento');
    }


    // If permission to geolocation was already granted we already center the map
    if (navigator.permissions) {
      navigator.permissions.query({'name': 'geolocation'})
        .then( permission => {
          if (permission.state === 'granted') {
            ga('send', 'event', 'Geolocation', 'geolocate on startup');
            geolocate(true, null, true); 
          }
        }
      );
    }

    // User is within Facebook browser.
    // thanks to: https://stackoverflow.com/questions/31569518/how-to-detect-facebook-in-app-browser
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    _isFacebookBrowser = (userAgent.indexOf('FBAN') > -1) || (userAgent.indexOf('FBAV') > -1);


    _initGlobalCallbacks();

    _initTemplates();

    // Bind trigger for history changes
    History.Adapter.bind(window, 'statechange', () => {
      const state = History.getState();

      if (_isFeatherlightOpen) {
        const openLightbox = $.featherlight.current();
        if (openLightbox) {
          openLightbox.close();
        }
        _isFeatherlightOpen = false;
      }

      if (state.data && state.data.isHome) {
        if (!map && !_isOffline) {
          setupGoogleMaps();
          updateMarkers();
        }

        if (_isDeeplink) {
          // $('#map').removeClass('mock-map');
          // $('#logo').removeClass('clickable');
          $('body').removeClass('deeplink');
          _isDeeplink = false;
        } 

        hideAll();
      } else {
        handleRouting();
      }
    });

    // Initialize router
    _onDataReadyCallback = () => {
      if (window.performance) {
        const timeSincePageLoad = Math.round(performance.now());
        ga('send', 'timing', 'Data', 'data ready', timeSincePageLoad);
      }

      const isMatch = handleRouting();

      BDB.User.init(); 
      
      if (isMatch) {
        _isDeeplink = true;

        // $('#logo').addClass('clickable'); 
        // $('#map').addClass('mock-map');
        $('body').addClass('deeplink'); 
        $('#top-mobile-bar-title').text('bike de boa');

        // Center the map on pin's position
        if (map && _deeplinkMarker) {
          map.setZoom(18);
          map.setCenter({
            lat: parseFloat(_deeplinkMarker.lat),
            lng: parseFloat(_deeplinkMarker.lng)
          });
        }
      } else {
        goHome();
      }
    };

    // Set up Sweet Alert
    swal.setDefaults({
      confirmButtonColor: '#30bb6a',
      confirmButtonText: 'OK',
      confirmButtonClass: 'btn green',
      cancelButtonText: 'Cancelar',
      cancelButtonClass: 'btn',
      buttonsStyling: false,
      allowOutsideClick: true
    });

    // Featherlight - photo lightbox lib
    // Extension to show the img alt tag as a caption within the image
    $.featherlight.prototype.afterContent = function() { 
      var caption = this.$currentTarget.find('img').attr('alt');
      this.$instance.find('.caption').remove();
      $('<div class="featherlight-caption">').text(caption).appendTo(this.$instance.find('.featherlight-content'));
    };
    $.featherlight.prototype.beforeOpen = function() { 
      History.pushState(null, null, 'foto');
      _isFeatherlightOpen = true; 
    };
    $.featherlight.defaults.closeOnEsc = false;
 
    // Toastr options
    toastr.options = {
      'positionClass': _isMobile ? 'toast-bottom-center' : 'toast-bottom-left',
      'closeButton': false,
      'progressBar': false,
    };

    // Sidenav (hamburger and filter menus)
    const sidenavHideCallback = () => {
      // @todo explain me
      setView('bike de boa', '/', true);
    };
    try {
      _hamburgerMenu = new SideNav(
        'hamburger-menu',
        {
          hideCallback: sidenavHideCallback
        }
      );
      _filterMenu = new SideNav(
        'filter-menu',
        {
          inverted: true,
          hideCallback: sidenavHideCallback
          /*fixed: true*/
        }
      );
    } catch (err) {
      _hamburgerMenu = _filterMenu = null;
    };

    // Hello.js
    hello.init({
        facebook: FACEBOOK_CLIENT_ID,
        google: GOOGLE_CLIENT_ID, 
        // windows: WINDOWS_CLIENT_ID,
    },{
      redirect_uri: window.location.origin
    });
    hello.on('auth.login', auth => {
      // Hack to fix what I think is the bug that was causing duplicate user entries
      if (!_loginMutexBlocked) {
        onSocialLogin(auth);
        _loginMutexBlocked = true;
        setTimeout(() => { 
          _loginMutexBlocked = false;
        }, 1500);
      } else {
        // block! 
        console.log('login called again in 1500ms window!');
        ga('send', 'event', 'Login', 'mutex-blocked: login called again in a 1500ms window');
      }
    });
    hello.on('auth.logout', () => {
      onSocialLogout(); 
    });

    initHelpTooltip('#filter-menu .help-tooltip-trigger');

    $('#ciclovias-help-tooltip').off('show.bs.tooltip').on('show.bs.tooltip', () => {
      ga('send', 'event', 'Misc', 'tooltip - ciclovias');
    });

    // Intercepts Progressive Web App event
    // source: https://developers.google.com/web/fundamentals/engage-and-retain/app-install-banners/
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      _deferredPWAPrompt = e;

      $('#howToInstallBtn').css({'font-weight': 'bold'});

      return false;
    });
  }

  function openWelcomeMessage() { 
    // setTimeout( () => {
    //   if (_isMobile) {
    //     $('.welcome-message-container').show();  
    //   } else {
    //     $('.welcome-message-container').velocity('fadeIn', { duration: 3000 }); 
    //   }
    // }, 2000); 

    if (_isMobile) {
      return;
    }
    
    $('.welcome-message-container').show(); 

    $('.welcome-message-container .welcome-message--close').on('click', e => {
      $('.welcome-message-container').remove();
      BDB.Session.setPromoBannerViewed(); 

      ga('send', 'event', 'Banner', 'promo banner - closed');
    });

    $('.welcome-message-container a').on('click', e => {
      $('.welcome-message-container').remove();
      // BDB.Session.setPromoBannerViewed();

      ga('send', 'event', 'Banner', 'promo banner - link click');
    });
  }
 
  function login() {
    Database.authenticate(() => {
      Database.getAllTags();
    });
  }

  function localhostOverrides() {
    // if (_isLocalhost) {
    //   Database.API_URL = 'http://localhost:3000';
    // }
  }

  function init() {
    if (isDemoMode) {
      Database = BDB.MockedDatabase;
    } else {
      Database = BDB.Database;
    }

    localhostOverrides();

    // Retrieve markers saved in a past access
    markers = BDB.getMarkersFromLocalStorage();
    if (markers && markers.length) {
      console.log(`Retrieved ${markers.length} locations from LocalStorage.`);
      updateMarkers();
      hideSpinner();
    } else {
      showSpinner('Carregando bicicletários...');
    }

    if (!_isOffline) {
      // Use external service to get user's IP
      $.getJSON('//ipinfo.io/json', data => {
        if (data && data.ip) {
          ga('send', 'event', 'Misc', 'IP retrival OK', ''+data.ip);
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

      // Authenticate to be ready for next calls
      login();

      // handleRouting();

      // This is the only request allowed to be unauthenticated
      Database.getPlaces( () => {
        $('#filter-results-counter').html(markers.length);
        $('#filter-results-total').html(markers.length);

        updateMarkers();

        // Hide spinner that is initialized visible on CSS
        hideSpinner();

        //
        if (_onDataReadyCallback && typeof _onDataReadyCallback === 'function') {
          _onDataReadyCallback();
          _onDataReadyCallback = null;
        }
      });
    }

    // if (!BDB.Session.hasUserSeenWelcomeMessage()) {
    //   openWelcomeMessage();
    // }
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
});
