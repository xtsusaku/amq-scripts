// ==UserScript==
// @name         NanaTweaks Utilities
// @namespace    https://xtsusaku.net/
// @version      0.1.0
// @description  AMQ Tweaks (request made)
// @author       You
// @match        http*://*.animemusicquiz.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=animemusicquiz.com
// @downloadURL  https://github.com/xtsusaku/amq-scripts/raw/main/NanaTweaksUtilities.user.js
// @updateURL    https://github.com/xtsusaku/amq-scripts/raw/main/NanaTweaksUtilities.user.js
// ==/UserScript==

/**
 * Changelog:
 * 0.1.0 - 2025-10-12
 * - Added: Keybinds for Boss Hints
 * - Added: Option to enable random select on idle
 * - Added: Option to enable extra choice name on multiple choice
 * - Fixed: Persistant mix mode not working
 * - Fixed: Multiple choice keybinds not working if not mix mode
 */

"use strict";

if (typeof Listener === "undefined") return;

function randomIntFromInterval(min = 1, max = 6) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

let NanaTweaksUtilitiesLoadInterval = setInterval(() => {
  if ($("#loadingScreen").hasClass("hidden")) {
    clearInterval(NanaTweaksUtilitiesLoadInterval);
    setup();
  }
}, 500);

let old_function = [];

function setup() {
  window.NTUtilities = {};
  window.NTUtilities.allowRandomSelectOnIdle = localStorage.getItem(
    "xtsk.allow_random_select_on_idle"
  )
    ? localStorage.getItem("xtsk.allow_random_select_on_idle") === "true"
    : true;
  window.NTUtilities.allowMultipleChoiceNameCombine = localStorage.getItem(
    "xtsk.allow_multiple_choice_name_combine"
  )
    ? localStorage.getItem("xtsk.allow_multiple_choice_name_combine") === "true"
    : true;

  setupPersistantMixMode();
  setupMultipleChoiceRandomSelectOnIdle();
  if (window.NTUtilities.allowMultipleChoiceNameCombine)
    setupMultipleChoiceNameCombine();

  // Menu Utilities
  let menuClearTimeout = 5;
  let menuLoadInterval = setInterval(() => {
    if (document.NanaTweaksMenu) {
      clearInterval(menuLoadInterval);
      menuSetup();
    } else if (menuClearTimeout-- <= 0) {
      clearInterval(menuLoadInterval);
    }
  }, 1000);

  // Keybind Utilities
  let keybindClearTimeout = 5;
  let keybindLoadInterval = setInterval(() => {
    if (document.NanaTweaksKeybinds) {
      clearInterval(keybindLoadInterval);
      keybindSetup();
    } else if (keybindClearTimeout-- <= 0) {
      clearInterval(keybindLoadInterval);
    }
  }, 1000);
}

function menuSetup() {
  setupSettingsMenu();
}
function keybindSetup() {
  setupMultipleChoiceKeybinds();
}

function setupSettingsMenu() {
  if (document.querySelector("#ntUtilitiesSettings")) return;
  document.NanaTweaksMenu.addTabMenu("utilities", "Utilities");
  let container = document.querySelector(".nt_utilities.nanatweaksContainer");
  container.innerHTML = `<div><div class="customCheckbox">
								<input type="checkbox" id="nt_utilities_enable_extra_choice_name" ${
                  window.NTUtilities.allowMultipleChoiceNameCombine
                    ? "checked"
                    : ""
                } />
								<label for="nt_utilities_enable_extra_choice_name"><i class="fa fa-check" aria-hidden="true"></i></label>
							</div> Extra Choice Name on Multiple Choice</div><br><div><div class="customCheckbox">
								<input type="checkbox" id="nt_utilities_allow_random_select_on_idle" ${
                  window.NTUtilities.allowRandomSelectOnIdle ? "checked" : ""
                } />
								<label for="nt_utilities_allow_random_select_on_idle"><i class="fa fa-check" aria-hidden="true"></i></label>
							</div> Random Select On Idle</div>`;
  document
    .querySelector("#nt_utilities_enable_extra_choice_name")
    .addEventListener("change", (e) => {
      e.preventDefault();
      if (e.target.checked) {
        localStorage.setItem("xtsk.allow_multiple_choice_name_combine", true);
        window.NTUtilities.allowMultipleChoiceNameCombine = true;
        setupMultipleChoiceNameCombine();
      } else {
        localStorage.setItem("xtsk.allow_multiple_choice_name_combine", false);
        window.NTUtilities.allowMultipleChoiceNameCombine = false;
        resetMultipleChoiceNameCombine();
      }
    });
  document
    .querySelector("#nt_utilities_allow_random_select_on_idle")
    .addEventListener("change", (e) => {
      e.preventDefault();
      if (e.target.checked) {
        localStorage.setItem("xtsk.allow_random_select_on_idle", true);
        window.NTUtilities.allowRandomSelectOnIdle = true;
      } else {
        localStorage.setItem("xtsk.allow_random_select_on_idle", false);
        window.NTUtilities.allowRandomSelectOnIdle = false;
      }
    });
}

function setupMultipleChoiceRandomSelectOnIdle() {
  let songNextInterval;
  [
    [
      "play next song",
      () => {
        songNextInterval = setInterval(() => {
          if (
            parseInt(quiz.videoOverlay.$hiderText.text()) <= 5 &&
            document.querySelector(".qpMultipleChoiceEntryText").textContent !==
              "???" &&
            quiz.answerInput.multipleChoice.answerOptions.find((aOption) =>
              aOption.$body.hasClass("selected")
            ) === undefined &&
            window.NTUtilities.allowRandomSelectOnIdle
          ) {
            let randomChoice = randomIntFromInterval(1, 4);
            let randomTries = 0;
            while (
              quiz.answerInput.multipleChoice.answerOptions[randomChoice - 1]
                .disabled
            ) {
              randomChoice = randomIntFromInterval(1, 4);
              randomTries++;
              if (randomTries > 10) break;
            }
            quiz.answerInput.multipleChoice.handleClick(
              quiz.answerInput.multipleChoice.answerOptions[randomChoice - 1]
            );
          }
        }, 500);
      },
    ],
    [
      "answer results",
      () => {
        clearInterval(songNextInterval);
      },
    ],
  ].forEach((event) => {
    new Listener(event[0], event[1]).bindListener();
  });
}

function setupMultipleChoiceNameCombine() {
  // Create QPRow
  let qpMultipleChoiceContainer = document.querySelector(
    "#qpMultipleChoiceContainer"
  );
  let qpMultipleChoiceRow1 = document.createElement("div");
  qpMultipleChoiceRow1.classList.add("qpMultipleChoiceRow");
  qpMultipleChoiceRow1.innerHTML = `<div
  class="qpMultipleChoiceEntryContainer wrong"
  id="qpMultipleChoiceEntry1Extra"
>
  <div class="qpMultipleChoiceEntryShadow"></div>
  <div class="qpMultipleChoiceEntryContainerInner">
    <div class="qpMultipleChoiceEntry">
      <div class="qpMultipleChoiceEntryTextContainer">
        <div class="qpMultipleChoiceEntryText" style="font-size: 8px">
          ???
        </div>
      </div>
    </div>
  </div>
</div>
<div
  class="qpMultipleChoiceEntryContainer wrong"
  id="qpMultipleChoiceEntry2Extra"
>
  <div class="qpMultipleChoiceEntryShadow"></div>
  <div class="qpMultipleChoiceEntryContainerInner">
    <div class="qpMultipleChoiceEntry">
      <div class="qpMultipleChoiceEntryTextContainer">
        <div class="qpMultipleChoiceEntryText" style="font-size: 8px">
          ???
        </div>
      </div>
    </div>
  </div>
</div>`;
  let qpMultipleChoiceRow2 = document.createElement("div");
  qpMultipleChoiceRow2.classList.add("qpMultipleChoiceRow");
  qpMultipleChoiceRow2.innerHTML = `<div
  class="qpMultipleChoiceEntryContainer wrong"
  id="qpMultipleChoiceEntry3Extra"
>
  <div class="qpMultipleChoiceEntryShadow"></div>
  <div class="qpMultipleChoiceEntryContainerInner">
    <div class="qpMultipleChoiceEntry">
      <div class="qpMultipleChoiceEntryTextContainer">
        <div class="qpMultipleChoiceEntryText" style="font-size: 8px">
          ???
        </div>
      </div>
    </div>
  </div>
</div>
<div
  class="qpMultipleChoiceEntryContainer wrong"
  id="qpMultipleChoiceEntry4Extra"
>
  <div class="qpMultipleChoiceEntryShadow"></div>
  <div class="qpMultipleChoiceEntryContainerInner">
    <div class="qpMultipleChoiceEntry">
      <div class="qpMultipleChoiceEntryTextContainer">
        <div class="qpMultipleChoiceEntryText" style="font-size: 8px">
          ???
        </div>
      </div>
    </div>
  </div>
</div>`;

  qpMultipleChoiceContainer.insertBefore(
    qpMultipleChoiceRow1,
    qpMultipleChoiceContainer.firstChild
  );
  qpMultipleChoiceContainer.appendChild(qpMultipleChoiceRow2);

  old_function["quizAnswerInput_setName"] =
    quiz.answerInput.multipleChoice.answerOptions[0].setName;
  quiz.answerInput.multipleChoice.answerOptions.forEach((option, i) => {
    option.setName = function (name) {
      let targetName = options.useRomajiNames ? name.romaji : name.english;
      let altName = options.useRomajiNames ? name.english : name.romaji;
      quiz.answerInput.multipleChoice.answerOptions[i].$text.text(targetName);
      $(`#qpMultipleChoiceEntry${i + 1}Extra .qpMultipleChoiceEntryText`).text(
        altName
      );
      quiz.answerInput.multipleChoice.answerOptions[i].setPopoverName(
        targetName,
        altName
      );
      fitTextToContainer(
        quiz.answerInput.multipleChoice.answerOptions[i].$text,
        quiz.answerInput.multipleChoice.answerOptions[i].$textContainer,
        18,
        8
      );
      fitTextToContainer(
        $(`#qpMultipleChoiceEntry${i + 1}Extra .qpMultipleChoiceEntryText`),
        $(
          `#qpMultipleChoiceEntry${
            i + 1
          }Extra .qpMultipleChoiceEntryTextContainer`
        ),
        18,
        8
      );
      quiz.answerInput.multipleChoice.answerOptions[i].currentName = targetName;
      quiz.answerInput.multipleChoice.answerOptions[i].altName = altName;
      quiz.answerInput.multipleChoice.answerOptions[i].reset();
    };
  });
}

function resetMultipleChoiceNameCombine() {
  // Remove Extra QPRow
  $("#qpMultipleChoiceEntry1Extra").parent().remove();
  $("#qpMultipleChoiceEntry2Extra").parent().remove();
  $("#qpMultipleChoiceEntry3Extra").parent().remove();
  $("#qpMultipleChoiceEntry4Extra").parent().remove();

  old_function["quizAnswerInput_setName"] =
    quiz.answerInput.multipleChoice.answerOptions[0].setName;
  quiz.answerInput.multipleChoice.answerOptions.forEach((option, i) => {
    option.setName = function (name) {
      let targetName = options.useRomajiNames ? name.romaji : name.english;
      let altName = options.useRomajiNames ? name.english : name.romaji;
      quiz.answerInput.multipleChoice.answerOptions[i].$text.text(targetName);
      quiz.answerInput.multipleChoice.answerOptions[i].setPopoverName(
        targetName,
        altName
      );
      fitTextToContainer(
        quiz.answerInput.multipleChoice.answerOptions[i].$text,
        quiz.answerInput.multipleChoice.answerOptions[i].$textContainer,
        18,
        8
      );
      quiz.answerInput.multipleChoice.answerOptions[i].currentName = targetName;
      quiz.answerInput.multipleChoice.answerOptions[i].altName = altName;
      quiz.answerInput.multipleChoice.answerOptions[i].reset();
    };
  });
}

function setupPersistantMixMode() {
  localStorage.removeItem("xtsk.input_mode");
  old_function["setTypingSelected"] = lobby.inputModeSelector.setTypingSelected;
  old_function["setMultipleChoiceSelected"] =
    lobby.inputModeSelector.setMultipleChoiceSelected;
  old_function["displayOptionMessage"] =
    lobby.inputModeSelector.displayOptionMessage;

  lobby.inputModeSelector.setTypingSelected = function () {
    this.$typingOption.addClass("selected");
    this.$multipleChoiceOption.removeClass("selected");
    localStorage.setItem("xtsk.input_mode", "TYPING");
  };

  lobby.inputModeSelector.setMultipleChoiceSelected = function () {
    this.$typingOption.removeClass("selected");
    this.$multipleChoiceOption.addClass("selected");
    localStorage.setItem("xtsk.input_mode", "MULTIPLE_CHOICE");
  };
  lobby.inputModeSelector.displayOptionMessage = function () {
    let localMode = localStorage.getItem("xtsk.input_mode");
    if (localMode && localMode === "TYPING") {
      this.setTypingSelected();
      this.sendSelectionUpdate();
    } else if (localMode && localMode === "MULTIPLE_CHOICE") {
      this.setMultipleChoiceSelected();
      this.sendSelectionUpdate();
    } else
      messageDisplayer.displayOption(
        "Select Answer Mode",
        "Select the answer mode you want to use. You can change it later at the top right of the lobby.",
        "Typing",
        "Multiple Choice",
        () => {
          this.setTypingSelected();
          this.sendSelectionUpdate();
        },
        () => {
          this.setMultipleChoiceSelected();
          this.sendSelectionUpdate();
        },
        false
      );
  };
}

function setupMultipleChoiceKeybinds() {
  if (document.NanaTweaksKeybinds === undefined) return;

  /** Multiple Choice */
  document.NanaTweaksKeybinds.addAction(
    "xtsk_mc_1",
    "Select MC 1",
    () => {
      if (
        document.querySelector(".qpMultipleChoiceEntryText").textContent ===
          "???" ||
        quiz.answerInput.multipleChoice.answerOptions[0].disabled
      )
        return;
      quiz.answerInput.multipleChoice.handleClick(
        quiz.answerInput.multipleChoice.answerOptions[0]
      );
    },
    "1"
  );
  document.NanaTweaksKeybinds.addAction(
    "xtsk_mc_2",
    "Select MC 2",
    () => {
      if (
        document.querySelector(".qpMultipleChoiceEntryText").textContent ===
          "???" ||
        quiz.answerInput.multipleChoice.answerOptions[1].disabled
      )
        return;
      quiz.answerInput.multipleChoice.handleClick(
        quiz.answerInput.multipleChoice.answerOptions[1]
      );
    },
    "2"
  );
  document.NanaTweaksKeybinds.addAction(
    "xtsk_mc_3",
    "Select MC 3",
    () => {
      if (
        document.querySelector(".qpMultipleChoiceEntryText").textContent ===
          "???" ||
        quiz.answerInput.multipleChoice.answerOptions[2].disabled
      )
        return;
      quiz.answerInput.multipleChoice.handleClick(
        quiz.answerInput.multipleChoice.answerOptions[2]
      );
    },
    "3"
  );
  document.NanaTweaksKeybinds.addAction(
    "xtsk_mc_4",
    "Select MC 4",
    () => {
      if (
        document.querySelector(".qpMultipleChoiceEntryText").textContent ===
          "???" ||
        quiz.answerInput.multipleChoice.answerOptions[3].disabled
      )
        return;
      quiz.answerInput.multipleChoice.handleClick(
        quiz.answerInput.multipleChoice.answerOptions[3]
      );
    },
    "4"
  );

  /** Boss Hints */
  [
    ["nameHint", "z"],
    ["songHint", "x"],
    ["peakAnswers", "c"],
    ["moreTime", "v"],
    ["endGuessing", "b"],
    ["multipleChoice", "n"],
  ].forEach((hint, i) => {
    document.NanaTweaksKeybinds.addAction(
      `xtsk_bh_${hint[0]}`,
      `Select Boss Hint [${hint[0]}]`,
      () => {
        if (!quiz.bossModeDisplay.powerUpButtons[hint[0]].clickActive) return;
        socket.sendCommand({
          type: "quiz",
          command: "use boss ability",
          data: {
            abilityId: quiz.bossModeDisplay.powerUpButtons[hint[0]].powerUpId,
          },
        });
      },
      hint[1]
    );
  });
}
