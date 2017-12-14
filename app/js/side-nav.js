/**
 *
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

class SideNav {
  constructor (id, options) {
    this.id = id;

    // this.showButtonEls = document.querySelectorAll(`.js-menu-show-${id}`);
    this.hideButtonEl = document.querySelector(`#${id} .js-menu-hide`);
    this.sideNavEl = document.querySelector(`#${id}`);
    this.sideNavContainerEl = document.querySelector(`#${id} .js-side-nav-container`);
    
    if (!this.hideButtonEl ||
        !this.sideNavEl ||
        !this.sideNavContainerEl) {
      throw Error('Something went wrong when initializing sidenav ' + id);
    }

    // Control whether the container's children can be focused
    // Set initial state to inert since the drawer is offscreen

    this.options = options || {};

    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this._hide = this._hide.bind(this);
    this.blockClicks = this.blockClicks.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onTransitionEnd = this.onTransitionEnd.bind(this);
    this.update = this.update.bind(this);

    this.startX = 0;
    this.currentX = 0;
    this.touchingSideNav = false;
    this.panelWidth = this.sideNavContainerEl.getBoundingClientRect().width;
    this.viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

    this.supportsPassive = undefined;
    this.addEventListeners();
  }

  // apply passive event listening if it's supported
  applyPassive () {
    if (this.supportsPassive !== undefined) {
      return this.supportsPassive ? {passive: true} : false;
    }
    // feature detect
    let isSupported = false;
    try {
      document.addEventListener('test', null, {get passive () {
        isSupported = true;
      }});
    } catch (e) { }
    this.supportsPassive = isSupported;
    return this.applyPassive();
  }

  addEventListeners () {
    // this.showButtonEls.forEach( i => i.addEventListener('click', this.show) );
    this.hideButtonEl.addEventListener('click', this._hide);
    if (!this.options.fixed) {
      this.sideNavEl.addEventListener('click', this._hide);
    }
    this.sideNavContainerEl.addEventListener('click', this.blockClicks);

    this.sideNavEl.addEventListener('touchstart', this.onTouchStart, this.applyPassive());
    this.sideNavEl.addEventListener('touchmove', this.onTouchMove, this.applyPassive());
    this.sideNavEl.addEventListener('touchend', this.onTouchEnd);
  }

  onTouchStart (evt) {
    if (!this.sideNavEl.classList.contains('side-nav--visible'))
      return;

    this.startX = evt.touches[0].pageX;
    this.currentX = this.startX;

    this.touchingSideNav = true;
    requestAnimationFrame(this.update);
  }

  onTouchMove (evt) {
    if (!this.touchingSideNav)
      return;

    this.currentX = evt.touches[0].pageX;
  }

  onTouchEnd (evt) {
    if (!this.touchingSideNav)
      return;

    this.touchingSideNav = false;

    let translateX;
    if (this.options.inverted) {
      translateX = Math.max(0, this.currentX - this.startX);
    } else {
      translateX = Math.min(0, this.currentX - this.startX);
    }
    this.sideNavContainerEl.style.transform = '';
    this.sideNavContainerEl.style.transition = '';

    if (this.options.inverted) {
      if (translateX > this.panelWidth/4) {
        this._hide();
      }
    } else {
      if (translateX < -this.panelWidth/4) {
        this._hide();
      }
    }
  }

  update () {
    if (!this.touchingSideNav)
      return;

    requestAnimationFrame(this.update);

    let translateX;
    if (this.options.inverted) {
      translateX = Math.max(0, this.currentX - this.startX);
    } else {
      translateX = Math.min(0, this.currentX - this.startX);
    }

    this.sideNavContainerEl.style.transform = `translateX(${translateX}px) translateZ(0px)`;
    this.sideNavContainerEl.style.transition = 'none';
  }

  blockClicks (evt) {
    evt.stopPropagation();
  }

  onTransitionEnd (evt) {
    this.sideNavEl.classList.remove('side-nav--animatable');
    this.sideNavEl.removeEventListener('transitionend', this.onTransitionEnd);
  }

  show () {
    // $('.side-nav__header span').velocity('transition.slideDownIn');
    if (!this.options.dontAnimate) {
      $(`#${this.id} .side-nav--animate-in`)
        .css({opacity: 0})
        .velocity(
          this.options.inverted ? 'transition.slideRightIn' : 'transition.slideLeftIn',
          { delay: 300, stagger: 70, duration: 500, display: null } 
        );
        // .css({opacity: 0, translateX: (this.options.inverted ? '100px' : '-100px')})
        // .velocity( 
        //   // this.options.inverted ? 'transition.slideRightIn' : 'transition.slideLeftIn',
        //   { translateX: 0, opacity: 1 },
        //   { delay: 300, stagger: 100, duration: 600 }
        // );
    }

    this.sideNavEl.classList.add('side-nav--animatable');
    this.sideNavEl.classList.add('side-nav--visible');
    this.sideNavEl.addEventListener('transitionend', this.onTransitionEnd);
  }

  _hide () {
    if (this.options.hideCallback) {
      this.options.hideCallback();
    }

    this.hide();
  }

  hide () {
    if (this.sideNavEl.classList.contains('side-nav--visible')) {
      this.sideNavEl.classList.add('side-nav--animatable');
      this.sideNavEl.classList.remove('side-nav--visible');
      this.sideNavEl.addEventListener('transitionend', this.onTransitionEnd);
    }
  }
}
