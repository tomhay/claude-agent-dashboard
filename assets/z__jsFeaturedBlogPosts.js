/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/* eslint-disable */
window.PXUTheme.jsFeaturedBlogPosts = {
  init: function($section) {
    window.PXUTheme.jsFeaturedBlogPosts = $.extend(this, window.PXUTheme.getSectionData($section));

    if (this.use_mobile_slider) {
      this.createSlider($section);
    }
  },
  createSlider: function($section) {
    const $prevButton = $section.find('.blog-posts__nav--prev');
    const $nextButton = $section.find('.blog-posts__nav--next');
    const $blogPostsSlider = $section.find('[data-blog-posts-wrapper]');

    const $flickitySlider = $blogPostsSlider.flickity({
      initialIndex: 0,
      prevNextButtons: false,
      wrapAround: true,
      pageDots: this.show_navigation_dots,
      watchCSS: true,
      imagesLoaded: true,
    });

    $flickitySlider.on('settle.flickity', () => $flickitySlider.flickity('resize'));
    $prevButton.on('click', () => $flickitySlider.flickity('previous'));
    $nextButton.on('click', () => $flickitySlider.flickity('next'));
  },
  unload($section) {
    const $slider = $section.find('.flickity-enabled');
    $slider.flickity('destroy');
    $('.blog-posts__nav--prev').off();
    $('.blog-posts__nav--next').off();
  },
};

/******/ })()
;