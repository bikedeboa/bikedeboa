var BIKE = BIKE || {};

BIKE.Database = {
  ///////////////////
  // G L O B A L S //
  ///////////////////

  // API path, without the final slash ('/')
  API_URL: 'https://bikedeboa-api.herokuapp.com',
  // API_URL: 'http://localhost:3000',
  _authToken: '',
  _headers: {},


  ///////////////////
  // M E T H O D S //
  ///////////////////

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

  customAPICall: function(type, endpoint, data, callback) {
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
        console.log(data);

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

  authenticate: function(callback) {
    const self = this;

    // Custom login
    const isLogin = window.location.pathname === '/admin';
    let user = Cookies.get('bikedeboa_user');
    let pw;
    if (isLogin && !user) {
      user = prompt('Usuário:','');
    }

    $.ajax({
      type: 'post',
      headers: self._headers,
      url: self.API_URL + '/token',
      data: {
        username: user || 'cristiano',
        password: pw || 'abcd123'
      },
      success: function(data) {
        if (data.token && data.token.length > 0) {
          console.log('Authentication successful.');

          if (user) {
            // This is the only place that should set 'loggedUser'
            loggedUser = user;

            // Save username in session
            Cookies.set('bikedeboa_user', loggedUser, { expires: 7 });

            // Clean URL
            // History.replaceState({}, 'bike de boa', '/');
          }

          // Set headers for future calls
          self._authToken = data.token;
          self._headers = {
            'x-access-token': data.token
          };

          if (callback && typeof callback === 'function') {
            callback();
          }
        }
      },
      error: function(data) {
        self.authenticate(callback);
      }
    });
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

  sendPlace: function(place, callback) {
    const self = this;

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

        if (callback && typeof callback === 'function') {
          callback();
        }
      }
    });
  },

  updatePlace: function(placeId, data, callback) {
    const self = this;

    $.ajax({
      type: 'put',
      headers: self._headers,
      url: self.API_URL + '/local/' + placeId,
      data: data,
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
