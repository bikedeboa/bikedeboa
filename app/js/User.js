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
    // this.fetchPlaces();
  },

  login: function (userInfo) {
    this.isLoggedIn = true;
    this.profile = userInfo;
    this.fetchReviews();
    // this.fetchPlaces();
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
    if (this.isLoggedIn) {
      if (!this.reviews) {
        BDB.Database.getLoggedUserReviews()
          .then( data => {
            this.reviews = data;
            this._populateReviewsPlaces();
          }
        );
      }
    } else {
      this.reviews = Cookies.getJSON('bikedeboa_reviews') || [];
      this._populateReviewsPlaces();
    }
  },

  canEditPlace: function (placeId) {
    // const placesArray = Cookies.getJSON('bikedeboa_places') || [];
    // return placesArray.find( i => i.placeId === placeId );
    
    if (placeId) {
      return Cookies.get('bikedeboa_local_' + placeId);
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
    const reviewsArray = this.getReviews();

    // Search for previously entered review
    let review;
    if (reviewsArray && reviewsArray.length > 0) {
      review = reviewsArray.find( i => i.placeId === reviewObj.placeId );
    }

    if (review) {
      // Update current review
      review.placeId = reviewObj.placeId;
      review.rating = reviewObj.rating;
      review.tags = reviewObj.tags;
      review.databaseId = reviewObj.databaseId; 
    } else {
      // Push a new one
      reviewsArray.push({
        placeId: reviewObj.placeId,
        rating: reviewObj.rating,
        tags: reviewObj.tags,
        databaseId: reviewObj.databaseId
      });
    }

    Cookies.set('bikedeboa_reviews', reviewsArray, { expires: 365 });
  },

  saveReview: function (reviewObj) {
    if (this.isLoggedIn) {
      // BD.Database.persistReview(reviewObj);
    } else {
      this._saveReviewToCookie(reviewObj);
    }
  },

  _savePlaceToCookie(placeId) {
    // User has 24 hours to edit that pin
    Cookies.set('bikedeboa_local_' + placeId, { expires: 1 });
  },

  saveNewPlace: function (placeId) {
    if (this.isLoggedIn) {
      // BD.Database.persistReview(reviewObj);
    } else {
      this._savePlaceToCookie(placeId);
    }
  },
};
