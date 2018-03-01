var BDB = BDB || {};

BDB.Session = {
  ///////////////////
  // G L O B A L S //
  ///////////////////


  ///////////////////
  // M E T H O D S //
  ///////////////////

  setPromoBannerViewed: function() {
    localStorage.setItem('bikedeboa_promobanner_questionario', true);
  },

  getPromoBannerViewed: function() {
    return localStorage.getItem('bikedeboa_promobanner_questionario');
  },

  setWelcomeMessageViewed: function() {
    localStorage.setItem('bikedeboa__has_seen_welcome_message', 'true'); 
  },

  hasUserSeenWelcomeMessage: function() {
    const hasSeenWelcomeMessage = !!localStorage.getItem('bikedeboa__has_seen_welcome_message');

    return hasSeenWelcomeMessage;
  }
};
