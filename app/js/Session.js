var BDB = BDB || {};

BDB.Session = {
  ///////////////////
  // G L O B A L S //
  ///////////////////


  ///////////////////
  // M E T H O D S //
  ///////////////////

  isFirstAccessEver: function() {
    const hasAnalyticsCookies = !!Cookies.get('_ga');
    return hasAnalyticsCookies;
  },

  setPromoBannerViewed: function() {
    Cookies.set('bikedeboa_promobanner_questionario', 'true', { expires: 365 }); 
  },

  getPromoBannerViewed: function() {
    return Cookies.get('bikedeboa_promobanner_questionario');
  },

  hasUserSeenWelcomeMessage: function() {
    return this.isFirstAccessEver();
  }
};
