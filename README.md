![Screenshot of webapp the main map view](https://cristianodalbem.com/static/afd41d2a56b99c56e9bc19930c5b2d84/711b2/cover.png)

# bike de boa 


**bike de boa** is an open and colaborative map of places to park your bike. It's focused on being super easy to use and also educative. With the app you can search for bike parkings nearby, and at the same time you learn if they are safe to use and why they are so.

We believe that the bicycle is the future of urban mobility, and that having better bike parkings is a great way of incentivating the bike culture in the cities. This project intends to push forward the discussion of what are good bike parkings, at the same time we collect data about the presence and evolution of this kind of structure in the cities of Brazil.

This project is a (Progressive) Web App, which means it loads and runs fast accross all platforms and device sizes, as well as is fully indexable by search engines.

## Data

This web client consumes from an open API. It licensed under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/). It basically means you can use its data to build your own bike app, academic research, as however you want - as long as you give us credit. :)
* Code: https://github.com/bikedeboa/bikedeboa-api
* Documentation: https://bdb-api.herokuapp.com/v1/doc

> If you're not a developer you can still easily access all of our data using our web dashboard at https://www.bikedeboa.com.br/dados. Visualize, search, filter and even download all of our data in several formats. Still not what you need? Let us know!

[![License: CC BY 4.0](https://licensebuttons.net/l/by/4.0/80x15.png)](http://creativecommons.org/licenses/by/4.0/)

### Contributing

We have dozens of cool things we want to do, from small bugfixes to whole new features. Our tasks are all neatly documented in the [Github Issues](https://github.com/bikedeboa/issues) session (sorry, Portuguese only). Please let us know if you'd like to help us. Feel free to propose new stuff as well! :)

Contributing should be super easy even if you have very basic Front-end skills. The web client was developed with popular libraries like JQuery and Twitter Bootstra aiming to be the most accessible possible for developers of any skill level. Still, always feel free to reach to us if you have any questions.

## Getting started

```bash
git clone https://github.com/bikedeboa.git
npm install
npm start
```

If you get errors make sure you have the Node version as specified in `package.json`. Pro tip: use `nvm` to easily manage multiple node versions on your machine.

## Branches & environments

The `master` branch is linked directly to prodution (www.bikedeboa.com.br), which runs on a Heroku paid server. You should never never commit directly to `master`. Commits should go to `develop`, which are linked to our development environment [bikedeboa-dev](https://bikedeboa-dev.herokuapp.com/), which runs on free Heroku server so expect a little slower performance, and major delays in case the server is sleeping (which it automatically does from time to time because it's free).

There's also a 3rd environment, [bikedeboa-dev2](https://bikedeboa-dev2.herokuapp.com/), which from time to time we point to different branches when we want to try something very new.


## License

The source code is available under a [MIT License](https://github.com/bikedeboa/bikedeboa/blob/master/LICENSE).

* * *


## Contact

**Come say hello to us!** Let's chat about urban cycling, mobility, UX Design, apps, PWAs, etc.

[Email](bikedeboa@gmail.com)・[Facebook](https://www.facebook.com/bikedeboaapp)・[Instagram](https://www.instagram.com/bikedeboa/)・[Medium](https://medium.com/bike-de-boa)
