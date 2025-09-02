/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/* eslint-disable */
window.PXUTheme.jsGallery = {
  init: function($section) {
    window.PXUTheme.jsGallery = $.extend(this, window.PXUTheme.getSectionData($section));

    if (this.use_mobile_slider) {
      this.createSlider($section);
    }

    if (this.crop_images_mobile && window.PXUTheme.media_queries.medium.matches) {
      this.cropMobileImages($section, true);
    }

    $(window).on('resize', () => {
      if (this.crop_images_mobile && window.PXUTheme.media_queries.medium.matches) {
        this.cropMobileImages($section, true);
      } else if (this.crop_images_mobile && window.PXUTheme.media_queries.large.matches) {
        this.cropMobileImages($section, false);
      }
    });

    if (this.gallery_type === 'vertical-masonry' && (!this.use_mobile_slider || window.PXUTheme.media_queries.large.matches)) {
      this.enableVerticalMasonry();
    } else if (this.gallery_type === 'horizontal-masonry' && (!this.use_mobile_slider || window.PXUTheme.media_queries.large.matches)) {
      this.enableHorizontalMasonry();
    }
  },
  createSlider: function($section) {
    const $prevButton = $section.find('.gallery__nav--prev');
    const $nextButton = $section.find('.gallery__nav--next');
    const $gallerySlider = $section.find('[data-gallery-wrapper]');

    const $flickitySlider = $gallerySlider.flickity({
      initialIndex: 0,
      prevNextButtons: false,
      wrapAround: true,
      pageDots: this.show_navigation_dots,
      watchCSS: true,
      imagesLoaded: true,
      adaptiveHeight: this.crop_images_mobile && window.PXUTheme.media_queries.medium.matches ? false : true
    });

    $flickitySlider.on('settle.flickity', () => $flickitySlider.flickity('resize'));
    $prevButton.on('click', () => $flickitySlider.flickity('previous'));
    $nextButton.on('click', () => $flickitySlider.flickity('next'));
  },
  cropMobileImages: function($section, setHeightOnMobile) {
    const galleryItems = $section.find('[data-gallery-item]');

    if (setHeightOnMobile) {
      // Reset the height of all gallery items before calculating the tallest height
      galleryItems.each(function() {
        $(this).css('height', 'auto');
      });

      // Calculate the tallest height among gallery items
      let tallestHeight = 0;

      galleryItems.each(function() {
        const itemHeight = $(this).outerHeight();
        if (itemHeight > tallestHeight) {
          tallestHeight = itemHeight;
        }
      });

      // Set the calculated height to all gallery items
      galleryItems.each(function() {
        $(this).css('height', tallestHeight + 'px');
      });
    } else {
      // Reset the height to "auto" on desktop
      galleryItems.css('height', 'auto');
    }
  },
  enableVerticalMasonry: function() {
    let gutterSize = 0;

    if (this.show_gutter) {
      gutterSize = 20;
    }

    window.PXUTheme.applyMasonry('.gallery__item', gutterSize);
  },
  enableHorizontalMasonry: function() {
    window.PXUTheme.applyHorizontalMasonry();
  },
  unload($section) {
    const $slider = $section.find('.flickity-enabled');
    $slider.flickity('destroy');
    $('.gallery__nav--prev').off();
    $('.gallery__nav--next').off();
  },
};

/******/ })()
;