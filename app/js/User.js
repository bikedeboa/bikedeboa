var BDB = BDB || {};

BDB.User = {
  ///////////////////
  // G L O B A L S //
  ///////////////////

  reviews: [],
  places: [],
  profile: null,
  loggedIn: false,


  ///////////////////
  // M E T H O D S //
  ///////////////////

  getReviews: function () {
    return Cookies.getJSON('bikedeboa_reviews') || [];
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
    const reviewsArray = this.getReviews();
    return reviewsArray.find( i => i.placeId === placeId );
  },

  saveReview: function (reviewObj) {
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

  saveNewPlace: function (placeId) {
    // const placesArray = Cookies.getJSON('bikedeboa_places') || [];
    // // Push new place
    // placesArray.push({
    //   placeId: placeObj.placeId,
    // });
    // Cookies.set('bikedeboa_places', placesArray, { expires: 1 });

    // User has 24 hours to edit that pin
    Cookies.set('bikedeboa_local_' + placeId, { expires: 1 });
  },
};
