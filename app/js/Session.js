var BIKE = BIKE || {};

BIKE.Session = {
  ///////////////////
  // G L O B A L S //
  ///////////////////


  ///////////////////
  // M E T H O D S //
  ///////////////////

  getPlaceFromSession: function (placeId) {
    // const placesArray = Cookies.getJSON('bikedeboa_places') || [];
    // return placesArray.find( i => i.placeId === placeId );
    
    if (placeId) {
      return Cookies.get('bikedeboa_local_' + placeId);
    } else {
      return;
    }
  },

  saveOrUpdatePlaceCookie: function (placeId) {
    // const placesArray = Cookies.getJSON('bikedeboa_places') || [];
    // // Push new place
    // placesArray.push({
    //   placeId: placeObj.placeId,
    // });
    // Cookies.set('bikedeboa_places', placesArray, { expires: 1 });

    // User has 24 hours to edit that pin
    Cookies.set('bikedeboa_local_' + placeId, { expires: 1 });
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

  setPromoBannerViewed: () => {
    Cookies.set('bikedeboa_promobanner_questionario', 'true', { expires: 365 }); 
  },

  getPromoBannerViewed: () => {
    return Cookies.get('bikedeboa_promobanner_questionario');
  }


};
