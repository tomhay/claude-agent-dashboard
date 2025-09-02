/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/* eslint-disable object-shorthand */
/* eslint-disable func-names */
window.PXUTheme.jsCollectionList = {
  init: function ($section) {
    window.PXUTheme.jsCollectionList = $.extend(this, window.PXUTheme.getSectionData($section));

    if (this.use_mobile_slider) {
      this.createSlider($section);
    }
  },
  createSlider: function ($section) {
    const $prevButton = $section.find('.collection-list__nav--prev');
    const $nextButton = $section.find('.collection-list__nav--next');
    const $collectionListSlider = $section.find('[data-collection-list-wrapper]');

    const $flickitySlider = $collectionListSlider.flickity({
      initialIndex: 0,
      prevNextButtons: false,
      wrapAround: true,
      pageDots: this.show_navigation_dots,
      watchCSS: true,
      imagesLoaded: true,
      adaptiveHeight: true,
    });

    $flickitySlider.on('settle.flickity', () => $flickitySlider.flickity('resize'));
    $prevButton.on('click', () => $flickitySlider.flickity('previous'));
    $nextButton.on('click', () => $flickitySlider.flickity('next'));
  },
  unload($section) {
    const $slider = $section.find('.flickity-enabled');
    $slider.flickity('destroy');
    $('.collection-list__nav--prev').off();
    $('.collection-list__nav--next').off();
  },
};

/******/ })()
;