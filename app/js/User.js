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

  login: function (socialProfile) {
    const self = this;

    if (this.isLoggedIn) {
      console.log('Already logged in!');
      return;
    }

    this.isLoggedIn = true;
    this.profile = socialProfile;
    this.isAdmin = this.profile === 'admin';

    const reviews = this.reviews && this.reviews.length > 0 ? this.reviews : null;
    const places = this.places && this.places.length > 0 ? this.places : null;
    const reviewsStr = reviews ? `<b>${reviews.length} avaliações</b>` : ''; 
    const placesStr = places ? `<b>${places.length} bicicletários</b>` : ''; 
    const dynamicStr = `${reviewsStr} ${reviewsStr && placesStr ? 'e' : ''} ${placesStr}`;

    if (reviews || places) {
      swal({
        title: 'Bem-vindo(a)!',
        html: `Você tinha criado ${dynamicStr} neste computador. Muito obrigado por contribuir! Deseja salvá-los no histórico do seu perfil?`,
        // type: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sim',
        cancelButtonText: 'Não, apagar histórico',
      }).then(function () {
        BDB.Database.importUserPlaces(places).then(() => {
          toastr['success'](`${places.length} bicicletários salvos.`, '');
          self._deletePlacesFromCookies();

          BDB.Database.importUserReviews(reviews).then(() => {
            toastr['success'](`${reviews.length} avaliações salvas.`, '');
            self._deleteReviewsFromCookies();
          });
        });
      }).catch(dismiss => {
        if (dismiss === 'cancel') {
          self._deletePlacesFromCookies();
          self._deleteReviewsFromCookies(); 
        }
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
        this.places.push(BDB.Places.getMarkerById(id));
      }
    }
  },

  checkEditPermission: function (id) {
    if (id) {
      if (this.isLoggedIn) {
        return this.places.find( i => i.id === id );
      } else {
        return Cookies.get('bikedeboa_local_' + id);
      }
    } else {
      return;
    }
  },

  getReviewByPlaceId: function (placeId) {
    if (!this.reviews) {
      return;
    } else {
      return this.reviews.find( i => i.placeId === placeId );
    }
  },

  _saveReviewToCookie: function (reviewObj) {
    const reviews = this.reviews;

    // Search for previously entered review
    let review;
    if (reviews && reviews.length > 0) {
      review = reviews.find( i => i.placeId === reviewObj.placeId );
    }
 
    if (review) {
      // Update current review
      review.placeId = reviewObj.placeId;
      review.rating = reviewObj.rating;
      review.tags = reviewObj.tags;
      review.databaseId = reviewObj.databaseId; 
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
