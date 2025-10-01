// ==UserScript==
// @name         NanaTweaks Menu
// @namespace    https://xtsusaku.net/
// @version      0.0.1
// @description  AMQ Tweaks (request made)
// @author       You
// @match        http*://*.animemusicquiz.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=animemusicquiz.com
// @downloadURL  https://github.com/xtsusaku/amq-scripts/raw/main/NanaTweaksMenu.user.js
// @updateURL    https://github.com/xtsusaku/amq-scripts/raw/main/NanaTweaksMenu.user.js
// ==/UserScript==

(function() {
    'use strict';

    class NanaTweaksMenu {
        static selectTab(tabId) {
            // Deselect all tabs
            document.querySelectorAll(".nanatweaks.tab").forEach((tab) => {
                tab.classList.remove("selected");
            });
            // Hide all tab content containers
            document.querySelectorAll(".nanatweaksContainer").forEach((container) => {
                container.classList.add("hide");
            });
            // Select the new tab and show its content
            document
                .querySelector(`.${tabId}.nanatweaks.tab`)
                .classList.add("selected");
            document
                .querySelector(`.${tabId}.nanatweaksContainer`)
                .classList.remove("hide");
        }

        static addTabMenu(id, title) {
            let id_prefix = `nt_${id}`;
            let tabContainer = document.getElementById("nanatweaksTabContainer");
            let newTab = document.createElement("div");
            newTab.className = `${id_prefix} nanatweaks tab clickAble`;
            newTab.onclick = () => this.selectTab(id_prefix);
            newTab.innerHTML = `<h5>${title}</h5>`;
            tabContainer.appendChild(newTab);

            let modalBody = document.querySelector("#ntweaksModal .modal-body");
            let newContentContainer = document.createElement("div");
            modalBody.appendChild(newContentContainer);
            newContentContainer.className = `${id_prefix} nanatweaksContainer hide`;
            modalBody.appendChild(newContentContainer);

            if (tabContainer.children.length === 1) {
                this.selectTab(id_prefix);
            }
        }

        static setupBaseModal() {
            if (document.getElementById("ntweaksModal")) return;
            let modalBase = document.createElement("div");

            modalBase.innerHTML = `<div class="modal fade tab-modal" id="ntweaksModal" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <div>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">×</span>
                        </button>
                        <h4 class="modal-title">Nana Tweaks</h4>
                    </div>
                </div>
                <div class="tabContainer" id="nanatweaksTabContainer"></div>
                <div class="modal-body"></div>
            </div>
        </div>
    </div>`;

            document
                .querySelector("#mainContainer")
                .insertBefore(
                modalBase.firstChild,
                document.querySelector("#settingModal")
            );
            $("#optionListSettings").before(
                $("<li>", { class: "clickAble", text: "NTweaks" }).on("click", () => {
                    $("#ntweaksModal").modal("show");
                })
            );
        }
    }

    if (typeof Listener === "undefined") return;

    let loadInterval = setInterval(() => {
        if ($("#loadingScreen").hasClass("hidden")) {
            clearInterval(loadInterval);
            NanaTweaksMenu.setupBaseModal();
            document.NanaTweaksMenu = NanaTweaksMenu;
        }
    }, 500);
})();