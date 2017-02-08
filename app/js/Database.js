var BIKE = BIKE || {};

BIKE.Database = {
  ///////////////////
  // G L O B A L S //
  ///////////////////

  // API path, without the final slash ('/')
  API_URL: (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:3000' : 'https://bikedeboa-api.herokuapp.com',
  _authToken: '',
  _headers: {},

  _currentIDToAdd: 1306,


  ///////////////////
  // M E T H O D S //
  ///////////////////

  _redoLogEntry: (logEntry, cb) => {
    console.log('redoing log entry', logEntry);

    const reducedEndpoint = logEntry.endpoint.split('bikedeboa-api.herokuapp.com/')[1]

    BIKE.Database._headers.ip_origin = logEntry.ip_origin;

    if (logEntry.method==='POST' && reducedEndpoint === 'local') {
      logEntry.body.idLocal = BIKE.Database._currentIDToAdd;
      if (!logEntry.body.authorIP) {
        logEntry.body.authorIP = BIKE.Database._currentIDToAdd;
      }
    }

    BIKE.Database.customAPICall(logEntry.method, reducedEndpoint, logEntry.body, () => {
      logEntry.redone = true;

      if (logEntry.method==='POST' && reducedEndpoint === 'local') {
        BIKE.Database._currentIDToAdd++;
      }

      if (cb && typeof cb === 'function') {
        return cb();
      }
    });
  },

  // @todo Improve this to automatically save to a file.
  _getDatabaseBackupJSON: function() {
    BIKE.Database.customAPICall('get','local', {}, (data) => {
      let json = '';
      let fullMarkers = [];

      if (data && data.length > 0) {
        fullMarkers = data;

        fullMarkers.forEach( m => {
          // json += JSON.stringify({
          //   text: m.text,
          //   description: m.description,
          //   address: m.address,
          //   lat: m.lat,
          //   lng: m.lng,
          //   photo: m.photo,
          // });
          json += JSON.stringify(m);
        });

        console.log('Database backup DONE');
        console.log(json);
      }
    });
  },


  _fillAllDescriptionsRec: function(index = 0) {
    const max = markers.length;

    if (index!=markers.length) {
      let m = markers[index];

      console.warn(`${index} of ${max}`);

      const key = m.lat+m.lng;
      const desc = window._hashmap[key];
      if (desc) {
        console.log(desc);
        BIKE.Database.customAPICall('PUT', 'local/'+m.id,
          {description: desc},
          () => {this._fillAllDescriptionsRec(index+1);}
        );
      } else {
        this._fillAllDescriptionsRec(index+1);
      }
    }
  },

  _fillAllDescriptions: function() {
    var allMarkers = BIKE.MockedDatabase.allMarkers;
    window._hashmap = {};
    for(let i=0; i<allMarkers.length; i++) {
      const m = allMarkers[i];
      const key = m.lat+m.lng;

      if (m.description && m.description.length > 255) {
        console.error('Description too big for database!');
        console.error(m);
        return false;
      }

      if (window._hashmap[key]) {
        console.error('same key!');
        console.error(key + ' : ' + window._hashmap[key]);
        console.error(m);
      }

      window._hashmap[key] = m.description;
    }

    this._fillAllDescriptionsRec();
  },

  _fillMarkersAddressesOnlyIfMissing() {
    this.getPlaces(() => {
      this._fillMarkersAddresses(0, true);
    }, null, null, true);
  },

  _fillMarkersAddresses: function(i = 0, onlyIfMissing = false) {
    const max = markers.length;
    const MIN_ADDRESS_SIZE = 6;

    if (i!=markers.length) {
      let m = markers[i];

      console.warn(`${i} of ${max}`);

      if (onlyIfMissing && m.address && m.address.length > MIN_ADDRESS_SIZE) {
        // console.log(m.address);
        this._fillMarkersAddresses(i+1, onlyIfMissing);
      } else {
        BIKE.geocodeLatLng(
          m.lat, m.lng,
          (address) => {
            console.log(m.lat, m.lng, m.id);
            console.log(address);
            this.customAPICall('PUT','local/'+m.id, {address: address}, () => {
              this._fillMarkersAddresses(i+1, onlyIfMissing);
            });
          }, () => {
            // Failed, probably due to quota limites. Try again after 2s
            setTimeout(() => {
              this._fillMarkersAddresses(i, onlyIfMissing);
            }, 2000);
          }
        );
      }
    }
  },

  _removeAll: function() {
    const self = this;

    console.log('Removing all entries in 5 seconds...');

    setTimeout(function() {
      $.ajax({
        url: self.API_URL + '/local',
        type: 'DELETE',
        headers: self._headers,
      }).done(function(data) {
        console.log(data);
      });
    }, 5000);
  },

  _sendAllMarkersToBackend: function(isToMock) {
    const self = this;
    let allMarkers = BIKE.MockedDatabase.allMarkers;

    if (isToMock) {
      allMarkers = BIKE.MockedDatabase.mockData(allMarkers);
    } else if (isToMock !== false) {
      console.error('Please specify if you want to mock content or not.');
      return;
    }


    console.log('Sending ALL ' + allMarkers.length + ' places.');

    allMarkers.forEach(function(m){
      $.ajax({
        type: 'post',
        headers: self._headers,
        url: self.API_URL + '/local',
        data: m
      });
    });
  },

  _setOriginHeader: function(ip) {
    this._headers.ip_origin = ip;
  },

  customAPICall: function(type, endpoint, data, callback, quiet = false) {
    const self = this;

    if (!type) {
      console.error('no type');
    }
    if (!endpoint) {
      console.error('no endpoint');
    }

    $.ajax({
      type: type,
      headers: self._headers,
      url: self.API_URL + '/' + endpoint,
      data: data,
      success: function(data) {
        console.log('_customCall success.');

        if (!quiet) {
          console.log(data);
        }

        if (callback && typeof callback === 'function') {
          callback(data);
        }
      }
    });
  },

  sendCheckin: function(placeId, callback) {
    const self = this;

    $.ajax({
      type: 'post',
      headers: self._headers,
      url: self.API_URL + '/checkin',
      data: {
        idLocal: placeId,
      },
      success: function(data) {
        console.log('Check-in success.');

        if (callback && typeof callback === 'function') {
          callback();
        }
      }
    });
  },

  _loginPromptCallback(user, isUserLogin, callback) {
    const self = this;
    let pw;

    if (user && user !== 'client') {
      pw = 'abcd123';
    }

    $.ajax({
      type: 'post',
      headers: self._headers,
      url: self.API_URL + '/token',
      data: {
        username: user || 'client',
        password: pw || 'deboanalagoa'
      },
      success: function(data) {
        if (data.token && data.token.length > 0) {
          console.log('API connected.');

          if (user && user !== 'client') {
            // This is the only place that should set 'loggedUser'
            loggedUser = user;

            // Save username in session
            Cookies.set('bikedeboa_user', loggedUser, { expires: 7 });

            // Clean URL
            // History.replaceState({}, 'bike de boa', '/');

            ga('set', 'userId', loggedUser);
            ga('send', 'event', 'Login', 'success', user);
          } else {
            loggedUser = null;
          }

          // Set headers for future calls
          self._authToken = data.token;
          self._headers['x-access-token'] = data.token;

          if (callback && typeof callback === 'function') {
            callback(loggedUser);
          }
        }
      },
      error: function(data) {
        ga('send', 'event', 'Login', 'fail', user);

        console.error('Authentication failed. Trying again in 2s...');
        setTimeout( () => {
          self.authenticate(isUserLogin, callback);
        }, 2000);
      }
    });
  },

  authenticate: function(isUserLogin, callback) {
    const self = this;

    if (isUserLogin) {
      // user = prompt('Usuário:','');
      swal(
        {
          title: 'Login colaborador',
          text: 'Se você não é colaborador ainda e gostaria de ser, <a target="_blank" href="https://www.facebook.com/bikedeboaapp">fale com a gente</a>.',
          html: true,
          type: 'input',
          showCancelButton: true,
          closeOnConfirm: true,
          inputPlaceholder: "Nome de usuário"
        },
        (input) => {
          if (input) {
            // if (input === '') {
            //   swal.showInputError();
            //   return false;
            // } else {
              self._loginPromptCallback(input, isUserLogin, callback);
              return true;
            // }
          } else {
            return false;
          }
        }
      );
    } else {
      const user = Cookies.get('bikedeboa_user');
      self._loginPromptCallback(user, isUserLogin, callback);
    }
  },

  deleteReview: function(reviewId, callback) {
    const self = this;

    if (!reviewId) {
      console.error('ERROR no review ID to delete.')
      return;
    }

    $.ajax({
      type: 'delete',
      headers: self._headers,
      url: self.API_URL + '/review/' + reviewId,
      error: function(e) {
        console.error(e);
      },
      success: function(data) {
        console.log('Review deletion successful.');

        if (callback && typeof callback === 'function') {
          callback();
        }
      }
    });
  },

  updateReview: function(reviewObj, callback) {
    const self = this;

    $.ajax({
      type: 'put',
      headers: self._headers,
      url: self.API_URL + '/review/' + reviewObj.databaseId,
      data: reviewObj,
      success: function(data) {
        console.log('Review update successful.');

        if (callback && typeof callback === 'function') {
          callback();
        }
      }
    });
  },

  sendReview: function(reviewObj, callback) {
    const self = this;

    $.ajax({
      type: 'post',
      headers: self._headers,
      url: self.API_URL + '/review',
      data: {
        idLocal: reviewObj.placeId,
        rating: reviewObj.rating,
        tags: reviewObj.tags
      },
      success: function(data) {
        console.log('Review creation successful.');
        console.log(data);

        if (callback && typeof callback === 'function') {
          callback(data.id);
        }
      }
    });
  },

  sendRevision: function(revisionObj, callback) {
    const self = this;

    $.ajax({
      type: 'post',
      headers: self._headers,
      url: self.API_URL + '/revision',
      data: {
        local_id: revisionObj.placeId,
        comments: revisionObj.content,
      },
      success: function(data) {
        console.log('Revision creation successful.');
        console.log(data);

        if (callback && typeof callback === 'function') {
          callback(data.id);
        }
      }
    });
  },

  sendPlace: function(place, callback) {
    const self = this;

    place.authorIP = this._headers.ip_origin;

    console.log('Sending new place:');
    console.log(place);

    $.ajax({
      type: 'post',
      headers: self._headers,
      url: self.API_URL + '/local',
      data: place,
      error: function(e) {
        console.error(e);
      },
      success: function(data) {
        console.log('Addition success!');
        console.log(data);

        if (callback && typeof callback === 'function') {
          callback(data);
        }
      }
    });
  },

  updatePlace: function(placeId, place, callback) {
    const self = this;

    console.log('Updating place:');
    console.log(place);

    $.ajax({
      type: 'put',
      headers: self._headers,
      url: self.API_URL + '/local/' + placeId,
      data: place,
      error: function(e) {
        console.error(e);
      },
      success: function(data) {
        console.log('Update successful!');

        if (callback && typeof callback === 'function') {
          callback();
        }
      }
    });
  },

  deletePlace: function(placeId, callback) {
    const self = this;

    $.ajax({
      type: 'delete',
      headers: self._headers,
      url: self.API_URL + '/local/' + placeId,
      error: function(e) {
        console.error(e);
      },
      success: function(data) {
        console.log('Delete successful!');

        if (callback && typeof callback === 'function') {
          callback();
        }
      }
    });
  },

  getAllTags: function(successCB, failCB, alwaysCB) {
    const self = this;

    console.log('Getting tags...');

    $.ajax({
      type: 'get',
      headers: self._headers,
      url: self.API_URL + '/tag'
    }).done(function(data) {
      if (data && data.length > 0) {
        console.log('Successfully retrieved ' + data.length + ' tags.');

        tags = data;

        idToTag = {};
        tagToId = {};
        tags.forEach(tagObj => {
          idToTag[tagObj.id] = tagObj.name;
          tagToId[tagObj.name] = tagObj.id;
        });

        if (successCB && typeof successCB === 'function') {
          successCB();
        }
      } else if (failCB && typeof failCB === 'function') {
        failCB();
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
  },

  getPlaces: function(successCB, failCB, alwaysCB, getFullData = false) {
    const self = this;

    console.log('Getting all places...');

    $.ajax({
      type: 'get',
      headers: self._headers,
      url: self.API_URL + '/local/' + (getFullData ? '' : 'light'),
    }).done(function(data) {
      console.log('Successfully retrieved ' + data.length + ' places!');

      markers = data;

      markers.forEach(m => {
        // Mark that no markers have retrieved their details
        m._hasDetails = false;

        // Massage average format
        if (typeof m.average === 'string') {
          m.average = parseFloat(m.average);
        }
      });

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
  },

  getPlaceDetails: function(placeId, successCB, failCB, alwaysCB) {
    const self = this;

    console.log('Getting place detail...');

    $.ajax({
      type: 'get',
      headers: self._headers,
      url: self.API_URL + '/local/' + placeId
    }).done(function(data) {
      if (data) {
        console.log('Got place detail:');
        console.log(data);

        let updatedMarker = markers.find(m => {return m.id === placeId; });

        Object.assign(updatedMarker, data);

        updatedMarker._hasDetails = true;

        if (successCB && typeof successCB === 'function') {
          successCB();
        }
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
  },
};
