// ==UserScript==
// @name         NanaTweaks Chat Commands
// @namespace    https://xtsusaku.net/
// @version      0.0.8
// @description  AMQ Tweaks (request made)
// @author       xTsuSaKu
// @match        http*://*.animemusicquiz.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=animemusicquiz.com
// @downloadURL  https://github.com/xtsusaku/amq-scripts/raw/main/NanaTweaksChatCommands.user.js
// @updateURL    https://github.com/xtsusaku/amq-scripts/raw/main/NanaTweaksChatCommands.user.js
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

class SendQueue {
    static queue = [];
    static isProcessing = false;
    static DELAY_MS = 300;

    static enqueue(fn) {
        this.queue.push(fn);
        this.process();
    }

    static process() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        const run = () => {
            if (this.queue.length === 0) {
                this.isProcessing = false;
                return;
            }
            const fn = this.queue.shift();
            try {
                fn();
            } catch (e) {
                console.error("SendQueue error:", e);
            }
            setTimeout(run, this.DELAY_MS);
        };

        run();
    }
}

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
        SendQueue.enqueue(() => {
            socket.sendCommand({
                type: "lobby",
                command: "game chat message",
                data: {
                    msg,
                    teamMessage,
                },
            });
        });
    }

    static sendMessage(target, message, isOpenchat = false) {
        if (isOpenchat) {
            socialTab.chatBar.getChat(target);
            socialTab.chatBar.getChat(target).open();
        }
        if (target === selfName) {
            // local echo, no need to rate-limit
            socialTab.chatBar.getChat(target).writeMessage(selfName, message, {
                customEmojis: [],
                emotes: [],
                shotCodes: [],
            });
            return;
        }
        SendQueue.enqueue(() => {
            socket.sendCommand({
                type: "social",
                command: "chat message",
                data: {
                    target,
                    message,
                },
            });
        });
    }
}
