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
    this.showButtonEl = document.querySelector(`.js-menu-show-${id}`);
    this.hideButtonEl = document.querySelector(`#${id} .js-menu-hide`);
    this.sideNavEl = document.querySelector(`#${id}`);
    this.sideNavContainerEl = document.querySelector(`#${id} .js-side-nav-container`);
    
    if (!this.showButtonEl ||
        !this.hideButtonEl ||
        !this.sideNavEl ||
        !this.sideNavContainerEl) {
      console.error('Something went wrong when initializing sidenav ' + id);
      return;
    }

    // Control whether the container's children can be focused
    // Set initial state to inert since the drawer is offscreen

    this.options = options || {};

    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.blockClicks = this.blockClicks.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onTransitionEnd = this.onTransitionEnd.bind(this);
    this.update = this.update.bind(this);

    this.startX = 0;
    this.currentX = 0;
    this.touchingSideNav = false;
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
    this.showButtonEl.addEventListener('click', this.show);
    this.hideButtonEl.addEventListener('click', this.hide);
    if (!this.options.fixed) {
      this.sideNavEl.addEventListener('click', this.hide);
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

    if (this.options.inverted) {
      if (translateX > 0) {
        this.hide();
      }
    } else {
      if (translateX < 0) {
        this.hide();
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

    this.sideNavContainerEl.style.transform = `translateX(${translateX}px)`;
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
      $('.side-nav__content li')
        .css({opacity: 0})
        .velocity('transition.slideLeftIn', { delay: 120, stagger: 100, duration: 600 });
      // $('.side-nav__footer > *')
      //   .css({opacity: 0})
      //   .velocity('transition.slideUpIn', { delay: 120, duration: 1000 });
    }

    this.sideNavEl.classList.add('side-nav--animatable');
    this.sideNavEl.classList.add('side-nav--visible');
    this.sideNavEl.addEventListener('transitionend', this.onTransitionEnd);
  }

  hide () {
    this.sideNavEl.classList.add('side-nav--animatable');
    this.sideNavEl.classList.remove('side-nav--visible');
    this.sideNavEl.addEventListener('transitionend', this.onTransitionEnd);
  }
}
