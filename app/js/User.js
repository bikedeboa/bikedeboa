var BDB = BDB || {};

BDB.User = {
  ///////////////////
  // G L O B A L S //
  ///////////////////

  reviews: undefined,
  places: undefined,
  profile: undefined,
  isLoggedIn: false,


  ///////////////////
  // M E T H O D S //
  ///////////////////

  init: function () {
    this.fetchReviews();
    this.fetchPlaces();
  },

  login: function (userInfo) {
    const self = this;

    this.isLoggedIn = true; 
    this.profile = userInfo;

    const reviews = this.reviews;
    if (reviews && reviews.length > 0) {
      swal({
        title: 'Avaliações encontradas',
        text: 'Podemos salvar as avaliações que você tinha feito antes de logar?',
        type: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sim, pode salvar!',
        cancelButtonText: 'Não vlw',
      }).then(function () {
        BDB.Database.importUserReviews(reviews).then(() => {
          toastr['success'](`${reviews.length} avaliações salvas.`, '');
          self._deleteReviewsFromCookie();
        });
      });
    }
    
    this.fetchReviews();
    this.fetchPlaces();
  },

  logout: function () {
    this.isLoggedIn = false;
    this.profile = null;
    
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

  canEditPlace: function (id) {
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

  _deleteReviewsFromCookie: function () {
    Cookies.remove('bikedeboa_reviews');
  },

  saveReview: function (reviewObj) {
    if (!this.isLoggedIn) {
      this._saveReviewToCookie(reviewObj);
    }
  },

  _savePlaceToCookie(placeId) {
    // User has 24 hours to edit that pin
    Cookies.set('bikedeboa_local_' + placeId, { expires: 1 });
  },

  saveNewPlace: function (placeId) {
    if (!this.isLoggedIn) {
      this._savePlaceToCookie(placeId);
    }
  },
};