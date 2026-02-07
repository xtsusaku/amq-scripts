// ==UserScript==
// @name         Import Custom List
// @namespace    xTsuSaKu
// @version      0.0.1
// @description  Import Community to CustomList
// @author       xTsuSaKu
// @match        http*://*.animemusicquiz.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=animemusicquiz.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function chunkArray(arr, size) {
        // Validate inputs
        if (!Array.isArray(arr)) {
            throw new TypeError("First argument must be an array.");
        }
        if (typeof size !== "number" || size <= 0) {
            throw new RangeError("Chunk size must be a positive number.");
        }

        const result = [];
        for (let i = 0; i < arr.length; i += size) {
            result.push(arr.slice(i, i + size));
        }
        return result;
    }

    var setupCallback = new Listener("login complete", function (payload) {
        //console.log(payload)
        injectUI();
    }).bindListener();


    // ======[ Feature: Import/Export Content & Statistics UI ]======
    const injectUI = () => {
        const backButton = document.getElementById('elCustomListBackButton');
        const buttonContainer = backButton?.parentElement;
        if (!buttonContainer || document.getElementById('amq-custom-btn-import')) return;
        /*
        const exportButton = saveButton.cloneNode(true);
        exportButton.id = 'amq-btn-export';
        const exportIcon = exportButton.querySelector('i');
        const exportText = exportButton.querySelector('div');
        if(exportIcon) exportIcon.className = 'fa fa-upload';
        if(exportText) exportText.textContent = 'Export';
        exportButton.style.backgroundColor = '#337ab7';
*/
        const importButton = backButton.cloneNode(true);
        importButton.id = 'amq-custom-btn-import';
        importButton.textContent = 'Import';
        importButton.classList.remove("hide")
        importButton.style.backgroundColor = '#5cb85c';
        /*
        const statsButton = saveButton.cloneNode(true);
        statsButton.id = 'amq-btn-stats';
        const statsIcon = statsButton.querySelector('i');
        const statsText = statsButton.querySelector('div');
        if(statsIcon) statsIcon.className = 'fa fa-bar-chart';
        if(statsText) statsText.textContent = 'Statistics';
        statsButton.style.backgroundColor = '#f0ad4e';
*/
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'amq-custom-file-input';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';

        //buttonContainer.appendChild(exportButton);
        buttonContainer.appendChild(importButton);
        //buttonContainer.appendChild(statsButton);
        buttonContainer.appendChild(fileInput);
        /*
        const statsModal = createElement('div', { id: 'cqcStatsModal', className: 'cqc-modal' });
        statsModal.innerHTML = `
            <div class="cqc-modal-content">
                <div class="cqc-modal-header">
                    <span id="cqcStatsModalClose" class="cqc-modal-close">&times;</span>
                    <h2>Quiz Statistics</h2>
                </div>
                <div id="cqcStatsModalBody" class="cqc-modal-body">
                    <p>Loading statistics...</p>
                </div>
            </div>
        `;
        document.getElementById('customQuizCreatorPage').appendChild(statsModal);
*/

        addEventListeners();
    };



    const addEventListeners = () => {
        const fileInput = document.getElementById('amq-custom-file-input');
        const exportButton = document.getElementById('amq-custom-btn-export');
        const importButton = document.getElementById('amq-custom-btn-import');
        //const statsButton = document.getElementById('amq-btn-stats');
        //const statsModal = document.getElementById('cqcStatsModal');
        //const statsModalClose = document.getElementById('cqcStatsModalClose');
        /*
        $(exportButton).popover({
            placement: "bottom",
            trigger: "hover",
            content: "Export songs from the selected Rule block",
            container: "#customQuizCreatorPage"
        });
*/
        $(importButton).popover({
            placement: "bottom",
            trigger: "hover",
            content: "Import songs into the selected Rule block",
            container: "#customQuizCreatorPage"
        });
        /*
         $(statsButton).popover({
            placement: "bottom",
            trigger: "hover",
            content: "Show a summary of the entire quiz",
            container: "#customQuizCreatorPage"
        });
*/
        /*
        exportButton.addEventListener('click', () => {
            const selectedRuleBlock = customQuizCreator.builder.selectedRuleBlock;
            if (!selectedRuleBlock) return;

            const blockData = selectedRuleBlock.generateBlockSave();
            const contentToExport = blockData.blocks;
            const jsonString = JSON.stringify(contentToExport, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'amq-quiz-content.json';
            a.click();
            URL.revokeObjectURL(url);
        });*/

        importButton.addEventListener('click', () => {
            //const targetRuleBlock = customQuizCreator.builder.selectedRuleBlock;
            //if (!targetRuleBlock) return;
            fileInput.click();
        });
        /*
        statsButton.addEventListener('click', () => {
            updateQuizStatistics();
            statsModal.style.display = 'block';
        });

        statsModalClose.addEventListener('click', () => {
            statsModal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target == statsModal) {
                statsModal.style.display = 'none';
            }
        });
*/
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const importedContent = JSON.parse(e.target.result);
                    if (!Array.isArray(importedContent)) throw new Error("Invalid format");
                    let newBlocksAdded = 0;

                    let list_name = document.querySelector("#elCustomListNameInput").value
                    let list = [...customListHandler.customListMap].find(a => a[1].name === list_name)[0]
                    let chunks = chunkArray(importedContent, 50);

                    for await(const chunk of chunks){
                        for await(const innerBlockInfo of chunk){
                            if(innerBlockInfo.annId){
                                customListHandler.addAnimeToActiveList(innerBlockInfo.annId)
                                socket.sendCommand({
                                    command: "add song to list",
                                    type: "customList",
                                    data: {
                                        annId: innerBlockInfo.annId,
                                        customListId: list.customListId,
                                    },
                                });
                            }
                            if(innerBlockInfo.annSongId){
                                customListHandler.addSongToActiveList(innerBlockInfo.annSongId)
                                socket.sendCommand({
                                    command: "add song to list",
                                    type: "customList",
                                    data: {
                                        annSongId: innerBlockInfo.annSongId,
                                        customListId: list.customListId,
                                    },
                                });
                            }
                        }
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                    alert(`Import complete!`);
                } catch (error) {
                    console.error("Import failed:", error);
                } finally {
                    fileInput.value = '';
                }
            };
            reader.readAsText(file);
        });
    };
})();