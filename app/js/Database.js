var BIKE = BIKE || {};

BIKE.Database = {
    ///////////////////
    // G L O B A L S //
    ///////////////////

    // API path, without the final slash ('/')
  API_URL: '',


    ///////////////////
    // M E T H O D S //
    ///////////////////

  _removeAll: function() {
    var self = this;

    console.log('Removing all entries in 5 seconds...');

    setTimeout(function() {
      $.ajax({
        url: self.API_URL + '/local',
        type: 'DELETE'
      }).done(function(data) {
        console.log(data);
      });
    }, 5000);
  },

  _sendAllMarkersToBackend: function() {
    var self = this;

    console.log('Sending ALL ' + allMarkers.length + ' places.');

    allMarkers.forEach(function(m){
      $.post(self.API_URL + '/local', m);
    });
  },

  sendCheckin: function(placeId, callback) {
    var self = this;

    $.post(
            self.API_URL + '/checkin',
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
  },

  sendReview: function(placeId, rating, callback) {
    var self = this;

    $.post(
            self.API_URL + '/review',
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
  },

  sendPlace: function(place, callback) {
    var self = this;

    console.log('Sending new place:');
    console.log(place);

    $.post(
            self.API_URL + '/local',
            place,
            function(data) {
              console.log('Addition success!');

              if (callback) {
                callback();
              }
            }
        );
  },

  getAllTags: function(successCB, failCB, alwaysCB) {
    var self = this;

    console.log('Getting tags...');

    $.ajax({
      url: self.API_URL + '/tag'
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
  },

  getPlaces: function(successCB, failCB, alwaysCB) {
    var self = this;

    console.log('Getting all places...');

    $.ajax({
      url: self.API_URL + '/local'
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
          if (alwaysCB && typeof alwaysCB === 'function') {
            alwaysCB();
          }
        });
  },
};