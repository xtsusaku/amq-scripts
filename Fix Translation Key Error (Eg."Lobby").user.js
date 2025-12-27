// ==UserScript==
// @name         Fix Translation Key Error (Eg."Lobby")
// @namespace    https://xtsusaku.net/
// @version      2025-12-27
// @description  Fix Translation Key Error (Eg."Lobby")
// @author       xTsuSaKu
// @match        https://animemusicquiz.com/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=animemusicquiz.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

   LocalizationPage.prototype.updateLanguage = function updateLanguage(newLanguage) {
		if (newLanguage === this.currentLanguage) {
			return;
		}
		this.currentLanguage = newLanguage;
		this.$page.find("[data-i18n]").each((index, element) => {
			let $element = $(element);
			let key = $element.data("i18n");
			let args = $element.data("i18ndata");
			let placeholder = $element.data("i18nplaceholder");
			let contentPlaceholder = $element.data("i18ncontent");
			let dataTranslate = $element.data("i18ndata-translate");
			if (args) {
				if (typeof args === "string") {
					args = JSON.parse(args);
				} else {
					args = { ...args };
				}
				if (dataTranslate) {
					Object.keys(args).forEach((argKey) => {
                        if(typeof args[argKey] === "string")
    						args[argKey] = this.translationCallback(args[argKey]);
					});
				}
			}

			let translation = (typeof key === "string") ? this.translationCallback(key, args) : "NO_TRANSLATION";
			if (placeholder) {
				$element.attr("placeholder", translation);
			} else if (contentPlaceholder) {
				$element.attr("data-label", translation);
			} else {
				$element.html(translation);
			}
		});

		if (this.$page.is(":visible")) {
			this.updateTextSizing(newLanguage);
		}
	}
})();
