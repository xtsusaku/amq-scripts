// ==UserScript==
// @name         AMQ Custom Language Load Fix
// @namespace    xTsuSaKu
// @version      2025-10-26
// @description  Fix JSON Load Data
// @author       You
// @match        http*://*.animemusicquiz.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=animemusicquiz.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    if (typeof Listener === "undefined") return;

    localizationHandler.loadCustomLanguage = function(url, changeDoneCallback = () => {}) {
        $.ajax({
            url: url,
            type: "GET",
            success: (jsonData) => {
                try {
                    jsonData = JSON.parse(jsonData)
                    i18next.addResourceBundle("custom", "translation", jsonData, true, true);
                    this.switchLanguage("custom", changeDoneCallback);
                    Cookies.set("custom_lang_url", url, { expires: 365 });
                    this.writeCustomStatusOutput(jsonData, url);
                } catch (err) {
                    Swal.fire({
                        title: this.translate("menu_bar.settings.language.custom_wrong_format.title"),
                        text: this.translate("menu_bar.settings.language.custom_wrong_format.text"),
                    });
                    console.error("Failed to parse custom language file:", err);
                    changeDoneCallback();
                    return;
                }
            },
            error: () => {
                Swal.fire({
                    title: this.translate("menu_bar.settings.language.custom_failed_to_load.title"),
                    text: this.translate("menu_bar.settings.language.custom_failed_to_load.text"),
                });
                changeDoneCallback();
            },
        });
    }
})();
