var BDB = BDB || {};

BDB.User = {
  ///////////////////
  // G L O B A L S //
  ///////////////////

  reviews: undefined,
  places: undefined,
  profile: undefined,
  isAdmin: undefined,
  isLoggedIn: false,


  ///////////////////
  // M E T H O D S //
  ///////////////////

  init: function () {
    this.fetchReviews();
    this.fetchPlaces();
  },

  login: function (profile) {
    const self = this;

    if (this.isLoggedIn) {
      console.log('Already logged in!');
      return;
    }

    this.isLoggedIn = true;
    this.profile = profile;
    this.isAdmin = profile.isAdmin;

    const prevReviews = this.reviews && this.reviews.length > 0 ? this.reviews : null;
    const prevPlaces = this.places && this.places.length > 0 ? this.places : null;
    
    let reviewsStr = '';
    if (prevReviews) {
      reviewsStr = `<b>${prevReviews.length} ${prevReviews.length === 1 ? 'avaliação' : 'avaliações'}</b>`; 
    }
    let placesStr = ''; 
    if (prevPlaces) {
      placesStr = `<b>${prevPlaces.length} ${prevPlaces.length === 1 ? 'bicicletário' : 'bicicletários'}</b>`; 
    } 
    
    const dynamicStr = `${reviewsStr} ${reviewsStr && placesStr ? 'e' : ''} ${placesStr}`;
    let message, title;
    if (this.profile.isNewUser) { 
      title = 'Bem-vindo(a)'; 
      message = `
        Você tinha criado ${dynamicStr} neste computador. Muito obrigado por contribuir. :) Eles serão automaticamente salvos nas suas contribuições.
      `; 
    } else {
      title = 'Oi de novo';
      message = `
        Você tinha criado ${dynamicStr} enquanto não estava logado. Massa! Eles serão automaticamente salvos nas suas contribuições.
      `;
    }
 
    if (prevReviews || prevPlaces) {
      swal({ 
        title: title,
        html: message,
      })
        .then(() => {
          if (prevPlaces) {
            BDB.Database.importUserPlaces(prevPlaces)
              .then(() => {
                ga('send', 'event', 'Login', 'import places', `${this.profile.name} imported ${prevPlaces.length} places`);
                
                toastr['success'](`${prevPlaces.length} bicicletários salvos.`, '');

                self._deletePlacesFromCookies();
                self.fetchPlaces();
              }).catch( err => {
                ga('send', 'event', 'Login', 'import places FAIL', `${this.profile.name} failed to import ${prevPlaces.length} places`);

                toastr.warning('Alguma coisa deu errado e não foi possível importar seus bicicletários agora :/ Tente novamente mais tarde.')
              });
          }

          if (prevReviews) {
            BDB.Database.importUserReviews(prevReviews)
              .then(data => {
                ga('send', 'event', 'Login', 'import reviews', `${this.profile.name} imported ${prevReviews.length} reviews`);
                
                if (data.numImports && data.numImports > 0) {
                  toastr['success'](`${data.numImports} avaliações salvas.`, '');
                }

                self._deleteReviewsFromCookies();
                self.fetchReviews();
              }).catch( err => {
                ga('send', 'event', 'Login', 'import reviews FAIL', `${this.profile.name} failed to import ${prevReviews.length} reviews`);

                toastr.warning('Alguma coisa deu errado e não foi possível importar suas avaliações agora :/ Tente novamente mais tarde.')
              });
          }
        }).catch(dismiss => {
          // if (dismiss === 'cancel') {
          //   self._deletePlacesFromCookies();
          //   self._deleteReviewsFromCookies(); 
          // }
        });
    }
    
    this.fetchReviews();
    this.fetchPlaces();
  },

  logout: function () {
    this.isLoggedIn = false;
    this.isAdmin = null;
    this.profile = null;

    BDB.Database.logoutUser();
    
    this.fetchReviews();
    this.fetchPlaces();
  },

  _populateReviewsPlaces: function () {
    // Retrive places objects to conveniently store them with each review
    for(let i=0; i < this.reviews.length; i++) { 
      const r = this.reviews[i];
      const id = r.placeId;
      r.placeObj = BDB.Places.getMarkerById(id);
    }
  },

  fetchReviews: function () {
    this.reviews = [];

    if (this.isLoggedIn) {
      BDB.Database.getLoggedUserReviews()
        .then( data => {
          this.reviews = data;
          this._populateReviewsPlaces();
        }
      );
    } else {
      this.reviews = Cookies.getJSON('bikedeboa_reviews') || [];
      this._populateReviewsPlaces();
    }
  },

  fetchPlaces: function () {
    this.places = [];

    if (this.isLoggedIn) {
      BDB.Database.getLoggedUserPlaces()
        .then( data => {
          this.places = data;
          // this._populateReviewsPlaces();
        }
      );
    } else {
      const cookies = Cookies.getJSON();
      const placesIds = Object.keys(cookies)
        .filter( i => i.indexOf('bikedeboa_local_') >= 0 )
        .map( i => i.split('bikedeboa_local_')[1] );

      for(let i=0; i < placesIds.length; i++) { 
        const id = parseInt(placesIds[i]);
        const marker = BDB.Places.getMarkerById(id);
        if (marker) {
          this.places.push(marker);
        }
      }
    }
  },

  checkEditPermission: function (id) {
    if (id && this.isLoggedIn) {
      return this.places.find( i => i.id === id );
    } else {
      return false;
    }
  },

  getReviewByPlaceId: function (placeId) {
    if (this.reviews) {
      return this.reviews.find( i => i.placeId === placeId );
    } else {
      return;
    }
  },

  _saveReviewToCookie: function (reviewObj) {
    const reviews = this.reviews;

    // Search for previously saved review
    let prevReview;
    if (reviews && reviews.length > 0) {
      prevReview = reviews.find( i => i.placeId === reviewObj.placeId );
    }
 
    if (prevReview) {
      // Update prevReview cookie
      prevReview.placeId = reviewObj.placeId;
      prevReview.rating = reviewObj.rating;
      prevReview.tags = reviewObj.tags;
      prevReview.id = reviewObj.id;
      prevReview.databaseId = reviewObj.databaseId;
    } else {
      // Push a new one
      reviews.push({
        placeId: reviewObj.placeId,
        rating: reviewObj.rating,
        tags: reviewObj.tags,
        databaseId: reviewObj.databaseId
      });
    }

    Cookies.set('bikedeboa_reviews', reviews, { expires: 365 });
  },

  _deleteReviewsFromCookies: function () {
    Cookies.remove('bikedeboa_reviews');
  },

  _deletePlacesFromCookies: function () {
    for(let i=0; i < this.places.length; i++) { 
      Cookies.remove(`bikedeboa_local_${this.places[i].id}`);
    }
  },

  saveReview: function (reviewObj) {
    if (!this.isLoggedIn) {
      this._saveReviewToCookie(reviewObj);
    }
  },

  _savePlaceToCookie(placeId) {
    // User has 24 hours to edit that pin
    Cookies.set(`bikedeboa_local_${placeId}`, { expires: 1 });
  },

  saveNewPlace: function (placeId) {
    if (!this.isLoggedIn) {
      this._savePlaceToCookie(placeId);
    }

    this.fetchPlaces();
  },
};
