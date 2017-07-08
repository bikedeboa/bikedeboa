var BIKE = BIKE || {};

BIKE.Database = {
  ///////////////////
  // G L O B A L S //
  ///////////////////

  // API path, without the final slash ('/')
  API_URL: (location.hostname === 'www.bikedeboa.com.br') ? 'https://bdb-api.herokuapp.com' : 'https://bdb-test-api.herokuapp.com',
  // API_URL: 'https://bdb-test-api.herokuapp.com',
  // API_URL: 'http://localhost:3000',
  isAuthenticated: false,  
  _authToken: '',
  _headers: {},
  _authenticationAttemptsLeft: 3,

  _currentIDToAdd: 1306,


  ///////////////////
  // M E T H O D S //
  ///////////////////

  _redoLogEntry: (logEntry, cb) => {
    console.debug('redoing log entry', logEntry);

    const reducedEndpoint = logEntry.endpoint.split('bdb-api.herokuapp.com/')[1]

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
  _getDatabaseBackupJSON: () => {
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

        console.debug('Database backup DONE');
        console.debug(json);
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
        console.debug(desc);
        BIKE.Database.customAPICall('PUT', 'local/'+m.id,
          {description: desc},
          () => {this._fillAllDescriptionsRec(index+1);}
        );
      } else {
        this._fillAllDescriptionsRec(index+1);
      }
    }
  },

  _fillAllDescriptions: () => {
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
        // console.debug(m.address);
        this._fillMarkersAddresses(i+1, onlyIfMissing);
      } else {
        BIKE.geocodeLatLng(
          m.lat, m.lng,
          (address) => {
            console.debug(m.lat, m.lng, m.id);
            console.debug(address);
            this.customAPICall('PUT','local/'+m.id, {address: address}, () => {
              this._fillMarkersAddresses(i+1, onlyIfMissing);
            });
          }, () => {
            setTimeout(() => {
              this._fillMarkersAddresses(i, onlyIfMissing);
            }, 2000);
          }
        );
      }
    }
  },

  _removeAll: () => {
    const self = this;

    console.debug('Removing all entries in 5 seconds...');

    setTimeout(() => {
      $.ajax({
        url: self.API_URL + '/local',
        type: 'DELETE',
        headers: self._headers,
      }).done(function(data) {
        console.debug(data);
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


    console.debug('Sending ALL ' + allMarkers.length + ' places.');

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
        console.debug('_customCall success.');

        if (!quiet) {
          console.debug(data);
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
        console.debug('Check-in success.');

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
          console.debug('API connected.');

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
          self.isAuthenticated = true;
          self._authToken = data.token;
          self._headers['x-access-token'] = data.token;

          if (callback && typeof callback === 'function') {
            callback(loggedUser);
          }
        }
      },
      error: function(data) {
        ga('send', 'event', 'Login', 'fail', user);

        BIKE.Database._authenticationAttemptsLeft--;
        if (BIKE.Database._authenticationAttemptsLeft > 0) {
          console.error(`Authentication failed, ${BIKE.Database._authenticationAttemptsLeft} attempts left. Trying again in 2s...`);
          setTimeout( () => {
            self.authenticate(isUserLogin, callback);
          }, 2000);
        } else {
          // Permanently failed
          setOfflineMode();
        }
      }
    });
  },

  authenticate: function(isUserLogin, callback) {
    const self = this;

    if (isUserLogin) {
      // user = prompt('Usuário:','');
      swal({
          title: 'Login',
          text: 'Em breve todos poderão criar um login no Bike de Boa, mas por enquanto este login é apenas para administradores.',
          input: 'text',
          showCancelButton: true,
          inputPlaceholder: "Nome de usuário"
      }).then((input) => {
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
      });
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
        defaultFailCallback();
        console.error(e);
      },
      success: function(data) {
        console.debug('Review deletion successful.');

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
        console.debug('Review update successful.');

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
        console.debug('Review creation successful.');
        console.debug(data);

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
        console.debug('Revision creation successful.');
        console.debug(data);

        if (callback && typeof callback === 'function') {
          callback(data.id);
        }
      }
    });
  },

  sendPlace: function(place, callback) {
    const self = this;

    place.authorIP = this._headers.ip_origin;

    console.debug('Sending new place:');
    console.debug(place);

    $.ajax({
      type: 'post',
      headers: self._headers,
      url: self.API_URL + '/local',
      data: place,
      error: function(e) {
        defaultFailCallback();
        console.error(e);
      },
      success: function(data) {
        console.debug('Addition success!');
        console.debug(data);

        if (callback && typeof callback === 'function') {
          callback(data);
        }
      }
    });
  },

  updatePlace: function(placeId, place, callback) {
    const self = this;

    console.debug('Updating place:');
    console.debug(place);

    $.ajax({
      type: 'put',
      headers: self._headers,
      url: self.API_URL + '/local/' + placeId,
      data: place,
      error: function(e) {
        defaultFailCallback();
        console.error(e);
      },
      success: function(data) {
        console.debug('Update successful!');

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
        defaultFailCallback();
        console.error(e);
      },
      success: function(data) {
        console.debug('Delete successful!');

        if (callback && typeof callback === 'function') {
          callback();
        }
      }
    });
  },

  getAllTags: function(successCB, failCB, alwaysCB) {
    const self = this;

    console.debug('Getting tags...');

    $.ajax({
      type: 'get',
      headers: self._headers,
      url: self.API_URL + '/tag'
    }).done(function(data) {
      if (data && data.length > 0) {
        console.debug('Successfully retrieved ' + data.length + ' tags.');

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
      } else {
        defaultFailCallback();

        if (failCB && typeof failCB === 'function') {
          failCB();
        }
      }
    })
    .fail(() => {
      defaultFailCallback();

      if (failCB && typeof failCB === 'function') {
        failCB();
      }
    })
    .always(() => {
      if (alwaysCB && typeof alwaysCB === 'function') {
        alwaysCB();
      }
    });
  },

  getPlaces: function(successCB, failCB, alwaysCB, getFullData = false) {
    const self = this;

    console.debug('Getting all places...');

    $.ajax({
      type: 'get',
      headers: self._headers,
      url: self.API_URL + '/local/' + (getFullData ? '' : 'light'),
    }).done(function(data) {
      console.debug('Retrieved ' + data.length + ' locations from API.');

      markers = data;

      BIKE.saveMarkersToLocalStorage(markers);

      for(let i=0; i < markers.length; i++) {
        const m = markers[i];
        // Mark that no markers have retrieved their details
        m._hasDetails = false;

        // Massage average format
        if (typeof m.average === 'string') {
          m.average = parseFloat(m.average);
        }
      };

      if (successCB && typeof successCB === 'function') {
        successCB(markers);
      }
    })
    .fail(() => {
      defaultFailCallback();

      if (failCB && typeof failCB === 'function') {
        failCB();
      }
    })
    .always(() => {
      if (alwaysCB && typeof alwaysCB === 'function') {
        alwaysCB();
      }
    });
  },

  waitAuthentication: function(callback) {
    if (this.isAuthenticated) {
      callback();
    } else {
      console.debug('Waiting authentication...');
      setTimeout(this.waitAuthentication.bind(this, callback), 1000);  
    }
  },

  getPlaceDetails: function(placeId, successCB, failCB, alwaysCB) {
    const self = this;

    console.debug('Getting place detail...');

    function justDoIt() { 
      $.ajax({
        type: 'get', 
        headers: self._headers,
        url: self.API_URL + '/local/' + placeId
      }).done(function(data) {
        if (data) {
          console.debug('Got place detail:');
          console.debug(data);

          // Combine detailed data with what we had
          let updatedMarker = markers.find(m => {return m.id === placeId; });
          Object.assign(updatedMarker, data);

          // Set flag
          updatedMarker._hasDetails = true;

          // Update offline-stored markers with new state
          BIKE.saveMarkersToLocalStorage(markers);

          if (successCB && typeof successCB === 'function') {
            successCB();
          }
        }
      })
      .fail(() => {
        defaultFailCallback();

        if (failCB && typeof failCB === 'function') {
          failCB();
        }
      })
      .always(() => {
        if (alwaysCB && typeof alwaysCB === 'function') {
          alwaysCB();
        }
      });
    }

    this.waitAuthentication(justDoIt); 
  },
};
