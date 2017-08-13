var BDB = BDB || {};

BDB.Session = {
  ///////////////////
  // G L O B A L S //
  ///////////////////


  ///////////////////
  // M E T H O D S //
  ///////////////////

  setPromoBannerViewed: () => {
    Cookies.set('bikedeboa_promobanner_questionario', 'true', { expires: 365 }); 
  },

  getPromoBannerViewed: () => {
    return Cookies.get('bikedeboa_promobanner_questionario');
  }


};
