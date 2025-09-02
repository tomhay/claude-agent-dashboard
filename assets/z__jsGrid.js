/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
window.PXUTheme.jsGrid = {
  init($section) {
    // Add settings from schema to current object
    window.PXUTheme.jsGrid = $.extend(this, window.PXUTheme.getSectionData($section));

    this.$section = $section;

    if (this.use_mobile_slider) {
      this.createSlider();
    }
  },

  createSlider() {
    const $prevButton = this.$section.find('.grid-section__nav--prev');
    const $nextButton = this.$section.find('.grid-section__nav--next');
    const $gridSectionSlider = this.$section.find('[data-grid-section-mobile-slider]');

    const $flickitySlider = $gridSectionSlider.flickity({
      initialIndex: 0,
      adaptiveHeight: true,
      prevNextButtons: false,
      wrapAround: true,
      pageDots: this.show_nav_buttons,
      watchCSS: true,
      imagesLoaded: true,
    });

    $flickitySlider.on('settle.flickity', () => $flickitySlider.flickity('resize'));
    $prevButton.on('click', () => $flickitySlider.flickity('previous'));
    $nextButton.on('click', () => $flickitySlider.flickity('next'));
  },

  blockSelect($section, blockId) {
    const $gridSectionSlider = $section.find('[data-grid-section-mobile-slider]');
    const slideIndex = $(`#shopify-section-${blockId}`).data('grid-index');
    $gridSectionSlider.flickity('select', slideIndex, true, true);
  },

  unload($section) {
    const $slider = $section.find('.flickity-enabled');
    $slider.flickity('destroy');
    $('.grid-section__nav--prev').off();
    $('.grid-section__nav--next').off();
  },
};

/******/ })()
;