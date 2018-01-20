var BDB = BDB || {};

BDB.Database = {
  ///////////////////
  // G L O B A L S //
  ///////////////////

  // variable replaced by Gulp
  API_URL: '<DATABASE_URL>', 
  // API_URL: 'http://localhost:3000', 
  isAuthenticated: false,  
  _authToken: '',
  _headers: {},
  _authenticationAttemptsLeft: 3,
  _isAuthenticated: false,
 
  _currentIDToAdd: 1306,


  ///////////////////
  // M E T H O D S //
  ///////////////////
  _setOriginHeader: function(ip) {
    this._headers.ip_origin = ip; 
  },

  customAPICall: function(type, endpoint, data, quiet = false) {
    const self = this;

    if (!type) {
      console.error('no type');
    }
    if (!endpoint) {
      console.error('no endpoint');
    }

    return new Promise((resolve, reject) => {
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

          resolve(data);
        },
        error: function(error) {
          reject(error)
        }
      });
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

  logoutUser: function() {
    this.isAuthenticated = false;
    this._authToken = null;
    this._headers['x-access-token'] = null;

    this.authenticate();
  },

  authenticate: function(callback) {
    const self = this;

    $.ajax({
      type: 'post',
      headers: self._headers,
      url: self.API_URL + '/token',
      data: {
        username: 'client',
        password: 'deboanalagoa'
      },
      success: function(data) {
        if (data.token && data.token.length > 0) {
          console.debug('API connected.');

          // Set headers for future calls 
          self.isAuthenticated = true;
          self._authToken = data.token;
          self._headers['x-access-token'] = data.token;

          if (callback && typeof callback === 'function') {
            callback();
          }
        }
      },
      error: function(data) {
        ga('send', 'event', 'Login', 'client authentication fail');

        BDB.Database._authenticationAttemptsLeft--;
        if (BDB.Database._authenticationAttemptsLeft > 0) {
          console.error(`Authentication failed, ${BDB.Database._authenticationAttemptsLeft} attempts left. Trying again in 2s...`);
          setTimeout( () => {
            self.authenticate(callback);
          }, 2000);
        } else {
          // Permanently failed
          // setOfflineMode();
        }
      }
    });
  },

  getLoggedUserReviews: function() {
    const self = this;

    return new Promise((resolve, reject) => {
      $.ajax({
        type: 'get',
        headers: self._headers,
        url: self.API_URL + '/user/reviews',
        success: function(data) { 
          let reviews = data.Reviews;

          for(let i=0; i < reviews.length; i++) {
            reviews[i].placeId = reviews[i].local_id;
            reviews[i].tags = reviews[i].Tags;
            reviews[i].databaseId = reviews[i].id;
          }

          resolve(reviews);
        },
        error: function(error) {
          reject(error);
        }
      });
    });
  },

  getLoggedUserPlaces: function() {
    const self = this;

    return new Promise((resolve, reject) => {
      $.ajax({
        type: 'get',
        headers: self._headers,
        url: self.API_URL + '/user/locals',
        success: function(data) { 
          let places = data.Locals;

          // for(let i=0; i < places.length; i++) {
          //   places[i].placeId = places[i].local_id;
          // }

          resolve(places);
        },
        error: function(error) {
          reject(error);
        }
      });
    });
  },

  socialLogin: function(loginData) {
    const self = this;

    return new Promise((resolve, reject) => {
      $.ajax({
        type: 'post',
        headers: self._headers,
        url: self.API_URL + '/token',
        data: loginData, 
        success: function(data) { 
          if (data.token && data.token.length > 0) {
            // loggedUser = true;

            ga('send', 'event', 'Login', 'social login success', `${loginData.fullname} @ ${loginData.network}`);
            if (data.isNewUser) {
              ga('send', 'event', 'Login', 'new user created', `${loginData.fullname} @ ${loginData.network}`);
            }

            // Set headers for future calls
            self.isAuthenticated = true;
            self._authToken = data.token;
            self._headers['x-access-token'] = data.token;

            resolve(data);
          }
        },
        error: function(error) {
          ga('send', 'event', 'Login', 'social login FAIL', `${loginData.fullname} @ ${loginData.network}`);

          reject(error);
        }
      });
    });
  },

  importUserReviews: function(reviews) {
    const self = this;

    return new Promise((resolve, reject) => {
      if (!reviews || !BDB.User.isLoggedIn) {
        reject();
      }

      const reviewsIds = reviews.map( r => { return {databaseId: r.databaseId}; });
 
      if (reviews.length > 0) {
        $.ajax({
          type: 'post',
          headers: self._headers,
          url: self.API_URL + '/user/import-reviews',
          data: {reviews: reviewsIds}, 
          success: resolve,
          error: reject
        });
      } else {
        resolve('No data to import.');
      }
    });
  },

  importUserPlaces: function(places) {
    const self = this;

    return new Promise((resolve, reject) => {
      if (!places || !BDB.User.isLoggedIn) {
        reject();
      }
      
      const placesIds = places.map( p => { return {id: p.id}; } );

      if (places.length > 0) {
        $.ajax({
          type: 'post',
          headers: self._headers,
          url: self.API_URL + '/user/import-locals',
          data: {locals: placesIds}, 
          success: resolve,
          error: reject
        });
      } else {
        resolve('No data to import.');
      }
    });
  },

  deleteReview: function(reviewId, callback) {
    const self = this;

    if (!reviewId) {
      console.error('ERROR no review ID to delete.');
      return;
    }

    $.ajax({
      type: 'delete',
      headers: self._headers,
      url: self.API_URL + '/review/' + reviewId,
      error: function(e) {
        requestFailHandler();
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

        BDB.User.fetchReviews();

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

        BDB.User.fetchReviews();

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
      xhr: () => this.getUploadProgressHandler(),
      type: 'post',
      headers: self._headers,
      url: self.API_URL + '/local',
      data: place,
      success: function(data) {
        console.debug('Addition success!');
        console.debug(data);

        BDB.User.fetchPlaces();

        if (callback && typeof callback === 'function') {
          callback(data);
        }
      },
      error: function(e) {
        requestFailHandler();
        console.error(e);
      },
    });
  },

  getUploadProgressHandler: function() {
    let xhr = new window.XMLHttpRequest();

    // Upload progress
    xhr.upload.addEventListener("progress", function (evt) {
      if (evt.lengthComputable) {
        const percentComplete = evt.loaded / evt.total;
        // console.log(percentComplete);
        updateSpinnerProgress(percentComplete);
      }
    }, false);

    return xhr;
  },

  updatePlace: function(placeId, place, callback) {
    const self = this;

    console.debug('Updating place:');
    console.debug(place);
 
    $.ajax({
      xhr: () => this.getUploadProgressHandler(),
      type: 'put',
      headers: self._headers,
      url: self.API_URL + '/local/' + placeId,
      data: place,
      success: function(data) {
        console.debug('Update successful!');

        BDB.User.fetchPlaces();

        if (callback && typeof callback === 'function') {
          callback();
        }
      },
      error: function(e) {
        requestFailHandler();
        console.error(e);
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
        requestFailHandler();
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

        // Alphabetically sort by tag names
        // @todo temp: filter out 'Coberto' while I haven't deleted this tag from the DB
        tags = data
        .filter( tag => tag.name !== 'Coberto' )
        .sort((a, b) => {
          var nameA = a.name.toLowerCase(), nameB = b.name.toLowerCase();
          if (nameA < nameB)
            return -1;
          if (nameA > nameB)
            return 1;
          return 0;
        });

        // Update id<->tagname maps
        idToTag = {};
        tagToId = {};
        tags.forEach(tagObj => {
          idToTag[tagObj.id] = tagObj.name;
          tagToId[tagObj.name] = tagObj.id;
        });
        $(document).trigger('tags:loaded');
        if (successCB && typeof successCB === 'function') {
          successCB();
        }
      } else {
        requestFailHandler();

        if (failCB && typeof failCB === 'function') {
          failCB();
        }
      }
    })
    .fail(() => {
      requestFailHandler();

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
      // xhr: function () {
      //   var xhr = new window.XMLHttpRequest();
      //   // Download progress
      //   xhr.addEventListener("progress", function (evt) {
      //     console.log('download progress');
      //     if (evt.lengthComputable) {
      //       var percentComplete = evt.loaded / evt.total;
      //       //Do something with download progress
      //       console.log(percentComplete);
      //     }
      //   }, false);
      //   return xhr;
      // },
    }).done(function(data) {
      console.debug('Retrieved ' + data.length + ' locations from API.');

      markers = data;

      BDB.saveMarkersToLocalStorage(markers);

      for(let i=0; i < markers.length; i++) {
        const m = markers[i];
        // Mark that no markers have retrieved their details
        m._hasDetails = false;

        // Massage average format
        if (typeof m.average === 'string') {
          m.average = parseFloat(m.average);
        }
      }

      if (successCB && typeof successCB === 'function') {
        successCB(markers);
      }
    })
    .fail(() => {
      requestFailHandler();

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

  getPlaceDetails: function(placeId) {
    const self = this;

    console.debug('Getting place detail...');
 
    return new Promise((resolve, reject) => {
      function justDoIt() {
        $.ajax({
          type: 'get',
          headers: self._headers,
          url: self.API_URL + '/local/' + placeId
        }).done(function (data) {
          if (data) {
            console.debug('Got place detail:');
            console.debug(data);

            // Combine detailed data with what we had
            let updatedMarker = markers.find(m => { return m.id === placeId; });
            Object.assign(updatedMarker, data);

            // Set flag
            updatedMarker._hasDetails = true;

            // Update offline-stored markers with new state
            BDB.saveMarkersToLocalStorage(markers);

            resolve(updatedMarker);
          }
        })
        .fail(() => {
          requestFailHandler();

          reject();
        })
      }

      this.waitAuthentication(justDoIt);
    });
  },
};
