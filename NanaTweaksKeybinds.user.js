// ==UserScript==
// @name         NanaTweaks Keybinds
// @namespace    https://xtsusaku.net/
// @version      0.0.4
// @description  AMQ Tweaks (request made)
// @author       You
// @match        http*://*.animemusicquiz.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=animemusicquiz.com
// @downloadURL  https://github.com/xtsusaku/amq-scripts/raw/main/NanaTweaksKeybinds.user.js
// @updateURL    https://github.com/xtsusaku/amq-scripts/raw/main/NanaTweaksKeybinds.user.js
// ==/UserScript==

"use strict";

if (typeof Listener === "undefined") return;

let NanaTweaksKeybindsLoadInterval = setInterval(() => {
  if (document.NanaTweaksMenu) {
    clearInterval(NanaTweaksKeybindsLoadInterval);
    NanaTweaksKeybinds.setup();
    document.NanaTweaksKeybinds = NanaTweaksKeybinds;
  }
}, 500);

class NanaTweaksKeybinds {
  static keybinds = {};
  // Example - { action: "autoKey", title: "Toggle Autokey", cb: () => {} }
  static actionList = [];

  static setup() {
    if (document.querySelector("#ntHotkeyTable")) return;
    this.loadSettings();
    this.setupModal();
    this.createHotkeyTable(this.actionList);
    this.keybinds = this.keybinds || {};
    this.actionList = this.actionList || [];

    document.addEventListener("keydown", (event) => {
      if (
        event.target.nodeName.toLowerCase() === "input" ||
        event.target.nodeName.toLowerCase() === "textarea" ||
        event.target.isContentEditable
      ) {
        return; // Ignore key events in input fields or textareas
      }
      const key = event.key.toUpperCase();
      const ctrl = event.ctrlKey;
      const alt = event.altKey;
      const shift = event.shiftKey;
      const match = (b) => {
        if (!b.key) return false;
        if (key !== b.key) return false;
        if (ctrl !== b.ctrl) return false;
        if (alt !== b.alt) return false;
        if (shift !== b.shift) return false;
        return true;
      };
      for (const [action, bind] of Object.entries(this.keybinds)) {
        if (match(bind)) {
          event.preventDefault();
          this.actionList.find((a) => a.action === action).cb();
        }
      }
    });
  }

  static addAction(action, title, cb, defaultKeybind = "") {
    if (this.actionList.find((a) => a.action === action))
      array.splice(
        this.actionList.findIndex((a) => a.action === action),
        1
      );
    this.actionList.push({ action, title, cb });
    this.keybinds[action] = this.keybinds[action] || {
      key:
        typeof defaultKeybind === "string" ? defaultKeybind.toUpperCase() : "",
      ctrl: false,
      alt: false,
      shift: false,
    };
    this.createHotkeyTable(this.actionList);
  }

  static setupModal() {
    if (document.querySelector("#ntHotkeyTable")) return;
    document.NanaTweaksMenu.addTabMenu("keybinds", "Keybinds");
    let container = document.querySelector(".nt_keybinds.nanatweaksContainer");
    container.innerHTML = `<table id="ntHotkeyTable"><thead><tr><th>Action</th><th>Keybind</th></tr></thead><tbody></tbody></table>`;
  }

  static loadSettings() {
    const saved = localStorage.getItem("xtsk.keybinds");
    if (saved) {
      this.keybinds = JSON.parse(saved);
    }
  }

  static saveSettings() {
    localStorage.setItem("xtsk.keybinds", JSON.stringify(this.keybinds));
  }

  /** Borrow From Mega Commands (https://github.com/kempanator/amq-scripts) */
  static createHotkeyTable(data) {
    const $tbody = $("#ntHotkeyTable tbody");
    $tbody.empty();
    for (const { action, title } of data) {
      const $input = $("<input>", {
        type: "text",
        style: "width: 200px;color: black;cursor: pointer;user-select: none;",
        readonly: true,
        "data-action": action,
      })
        .val(this.bindingToText(this.keybinds[action]))
        .on("click", this.startHotkeyRecord);
      $tbody.append(
        $("<tr>")
          .append($("<td>", { text: title }))
          .append($("<td>").append($input))
      );
    }
  }

  static startHotkeyRecord() {
    const $input = $(this);
    if ($input.hasClass("recording")) return;
    const action = $input.data("action");
    const capture = (e) => {
      e.stopImmediatePropagation();
      e.preventDefault();
      if (!e.key) return;
      if (["Shift", "Control", "Alt", "Meta"].includes(e.key)) return;
      if (
        (e.key === "Delete" || e.key === "Backspace" || e.key === "Escape") &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.metaKey
      ) {
        document.NanaTweaksKeybinds.keybinds[action] = {
          key: "",
          ctrl: false,
          alt: false,
          shift: false,
        };
      } else {
        document.NanaTweaksKeybinds.keybinds[action] = {
          key: e.key.toUpperCase(),
          ctrl: e.ctrlKey,
          alt: e.altKey,
          shift: e.shiftKey,
        };
      }
      document.NanaTweaksKeybinds.saveSettings();
      finish();
    };
    const finish = () => {
      document.removeEventListener("keydown", capture, true);
      $input
        .removeClass("recording")
        .val(
          document.NanaTweaksKeybinds.bindingToText(
            document.NanaTweaksKeybinds.keybinds[action]
          )
        )
        .off("blur", finish);
    };
    document.addEventListener("keydown", capture, true);
    $input.addClass("recording").val("Press keys…").on("blur", finish);
  }

  static bindingToText(b) {
    if (!b) return "";
    const keys = [];
    if (b.ctrl) keys.push("CTRL");
    if (b.alt) keys.push("ALT");
    if (b.shift) keys.push("SHIFT");
    if (b.key) keys.push(b.key === " " ? "SPACE" : b.key);
    return keys.join(" + ");
  }
}
