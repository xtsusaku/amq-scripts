// ==UserScript==
// @name         NanaTweaks Utilities
// @namespace    https://xtsusaku.net/
// @version      0.0.2
// @description  AMQ Tweaks (request made)
// @author       You
// @match        http*://*.animemusicquiz.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=animemusicquiz.com
// @require      https://github.com/xtsusaku/amq-scripts/raw/main/NanaTweaksKeybinds.user.js
// @downloadURL  https://github.com/xtsusaku/amq-scripts/raw/main/NanaTweaksUtilities.user.js
// @updateURL    https://github.com/xtsusaku/amq-scripts/raw/main/NanaTweaksUtilities.user.js
// ==/UserScript==

"use strict";

if (typeof Listener === "undefined") return;

let NanaTweaksUtilitiesLoadInterval = setInterval(() => {
  if ($("#loadingScreen").hasClass("hidden")) {
    clearInterval(NanaTweaksUtilitiesLoadInterval);
    setup();
  }
}, 500);

let old_function = [];

function setup() {
  setupPersistantMixMode();

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

function menuSetup() {}
function keybindSetup() {
  setupMultipleChoiceKeybinds();
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
  document.NanaTweaksKeybinds.addAction(
    "xtsk_mc_1",
    "Select MC 1",
    () => {
      if (
        !lobby.inputModeSelector.$multipleChoiceOption.hasClass("selected") ||
        quiz.answerInput.multipleChoice.answerOptions[0].disabled
      )
        return;
      quiz.answerInput.multipleChoice.handleClick(
        quiz.answerInput.multipleChoice.answerOptions[0]
      );
    },
    1
  );
  document.NanaTweaksKeybinds.addAction(
    "xtsk_mc_2",
    "Select MC 2",
    () => {
      if (
        !lobby.inputModeSelector.$multipleChoiceOption.hasClass("selected") ||
        quiz.answerInput.multipleChoice.answerOptions[1].disabled
      )
        return;
      quiz.answerInput.multipleChoice.handleClick(
        quiz.answerInput.multipleChoice.answerOptions[1]
      );
    },
    2
  );
  document.NanaTweaksKeybinds.addAction(
    "xtsk_mc_3",
    "Select MC 3",
    () => {
      if (
        !lobby.inputModeSelector.$multipleChoiceOption.hasClass("selected") ||
        quiz.answerInput.multipleChoice.answerOptions[2].disabled
      )
        return;
      quiz.answerInput.multipleChoice.handleClick(
        quiz.answerInput.multipleChoice.answerOptions[2]
      );
    },
    3
  );
  document.NanaTweaksKeybinds.addAction(
    "xtsk_mc_4",
    "Select MC 4",
    () => {
      if (
        !lobby.inputModeSelector.$multipleChoiceOption.hasClass("selected") ||
        quiz.answerInput.multipleChoice.answerOptions[3].disabled
      )
        return;
      quiz.answerInput.multipleChoice.handleClick(
        quiz.answerInput.multipleChoice.answerOptions[3]
      );
    },
    4
  );
}
