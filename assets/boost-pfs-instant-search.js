// Override Settings
var boostPFSInstantSearchConfig = {
	search: {
			
	}
};

(function () {  
	BoostPFS.inject(this);  

	// Customize style of Suggestion box
	SearchInput.prototype.customizeInstantSearch = function(suggestionElement, searchElement, searchBoxId) {
			 if (!suggestionElement) suggestionElement = this.$uiMenuElement;   
		if (!searchElement) searchElement = this.$element;  
		if (!searchBoxId) searchBoxId = this.id; 
	};

	BoostPFS.prototype.beforeBuildSearchBox = function (id) {

		// Remove theme's instant search events
		var cloneSearchBar = jQ(id).clone();
		jQ(id).replaceWith(cloneSearchBar);      
		
		
		if (Utils.InstantSearch.isFullWidthMobile()) {
			jQ(id).removeAttr('autofocus');
			if (jQ(id).is(':focus')) {
				jQ(id).blur();
			}
		}
	};

	BoostPFS.prototype.afterCloseSuggestionMobile = function(searchBoxId, isCloseSearchBox) {
		// Close theme's search pop up
		if (isCloseSearchBox && window.$ && $.fancybox){
			$.fancybox.close(true);
		}
	};
})();