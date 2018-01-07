var BDB = BDB || {};

BDB.Session = {
  ///////////////////
  // G L O B A L S //
  ///////////////////


  ///////////////////
  // M E T H O D S //
  ///////////////////

  setPromoBannerViewed: function() {
    Cookies.set('bikedeboa_promobanner_questionario', 'true', { expires: 365 }); 
  },

  getPromoBannerViewed: function() {
    return Cookies.get('bikedeboa_promobanner_questionario');
  },

  setWelcomeMessageViewed: function() {
    Cookies.set('bikedeboa__has_seen_welcome_message', 'true'); 
  },

  hasUserSeenWelcomeMessage: function() {
    const hasSeenWelcomeMessage = !!Cookies.get('bikedeboa__has_seen_welcome_message');

    return hasSeenWelcomeMessage;
  }
};
