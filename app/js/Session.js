var BIKE = BIKE || {};

BIKE.Session = {
  ///////////////////
  // G L O B A L S //
  ///////////////////


  ///////////////////
  // M E T H O D S //
  ///////////////////

  getPlaceFromSession: function (placeId) {
    const placesArray = Cookies.getJSON('bikedeboa_places') || [];
    return placesArray.find( i => i.placeId === placeId );
  },

  saveOrUpdatePlaceCookie: function (placeObj) {
    const placesArray = Cookies.getJSON('bikedeboa_places') || [];

    // Push new place
    placesArray.push({
      placeId: placeObj.placeId,
      rating: placeObj.rating,
      tags: placeObj.tags,
      databaseId: placeObj.databaseId
    });

    Cookies.set('bikedeboa_places', placesArray, { expires: 365 });
  },

  getReviewFromSession: function (placeId) {
    const reviewsArray = Cookies.getJSON('bikedeboa_reviews') || [];
    return reviewsArray.find( i => i.placeId === placeId );
  },

  saveOrUpdateReviewCookie: function (reviewObj) {
    const reviewsArray = Cookies.getJSON('bikedeboa_reviews') || [];

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


};
