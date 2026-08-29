// ==UserScript==
// @name         NanaTweaks Chat Commands
// @namespace    https://xtsusaku.net/
// @version      0.0.6
// @description  AMQ Tweaks (request made)
// @author       You
// @match        http*://*.animemusicquiz.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=animemusicquiz.com
// @downloadURL  https://github.com/xtsusaku/amq-scripts/raw/main/NanaTweaksKeybinds.user.js
// @updateURL    https://github.com/xtsusaku/amq-scripts/raw/main/NanaTweaksKeybinds.user.js
// ==/UserScript==

"use strict";

if (typeof Listener === "undefined") return;

let NanaTweaksNanaTweaksChatCommandsLoadInterval = setInterval(() => {
    if ($("#loadingScreen").hasClass("hidden")) {
        clearInterval(NanaTweaksNanaTweaksChatCommandsLoadInterval);
        NanaTweaksChatCommands.setup();
        document.NanaTweaksChatCommands = NanaTweaksChatCommands;
    }
}, 500);

class NanaTweaksChatCommands {
    // Example - { name: "potatoes", desc:"Potatoes GameMode", cb: (subs:string[]) => {} }
    static commandList = [];

    static setup() {
        this.commandList = this.commandList || [];

        document.querySelector("#gcInput").addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                const cmdSplit = event.target.value.split(" ");
                const cmd = cmdSplit.shift().replace(/^\//g, "").toLowerCase();
                for (const { name, cb } of this.commandList) {
                    if (cmd === name) {
                        cb(cmdSplit);
                    }
                }
                if (this.commandList.find((c) => c.name === cmd)) {
                    event.preventDefault();
                    document.querySelector("#gcInput").value = "";
                }
            }
        });
    }

    static addCommand(name, desc, cb) {
        if (this.commandList.find((a) => a.name === name))
            array.splice(
                this.commandList.findIndex((a) => a.name === name),
                1,
            );
        this.commandList.push({ name, desc, cb });
    }

    static sendChat(msg, teamMessage = false) {
        socket.sendCommand({
            type: "lobby",
            command: "game chat message",
            data: {
                msg,
                teamMessage,
            },
        });
    }

    static sendMessage(target, message, isOpenchat = false) {
        console.log(`send ${message} to ${target}`)
        if(isOpenchat) socialTab.chatBar.getChat(target)
        if(target === selfName) socialTab.chatBar.getChat(target).writeMessage(selfName, message, {customEmojis: [], emotes:[], shotCodes: []})
        else socket.sendCommand({
            type: "social",
            command: "chat message",
            data: {
                target,
                message
            },
        });
    }
}
