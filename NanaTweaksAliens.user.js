// ==UserScript==
// @name         NanaTweaks Aliens Mode
// @namespace    https://xtsusaku.net/
// @version      0.0.2
// @description  AMQ Tweaks (request made)
// @author       xTsuSaKu
// @match        http*://*.animemusicquiz.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=animemusicquiz.com
// @downloadURL  https://github.com/xtsusaku/amq-scripts/raw/main/NanaTweaksAliens.user.js
// @updateURL    https://github.com/xtsusaku/amq-scripts/raw/main/NanaTweaksAliens.user.js
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @connect      github.com
// ==/UserScript==

"use strict";

if (typeof Listener === "undefined") return;

let NanaTweaksAliensLoadInterval = setInterval(() => {
    if (document.NanaTweaksChatCommands) {
        clearInterval(NanaTweaksAliensLoadInterval);
        setup();
    }
}, 500);

function setup() {
    registerListener();
    chatCommandSetup();

    GM_xmlhttpRequest({
        method: "GET",
        url: "https://raw.githubusercontent.com/xtsusaku/amq-scripts/main/AliensRules.json",
        onload: function (response) {
            const data = JSON.parse(response.responseText);
            rules = data;
            console.info(`AMQ NanaTweaks Aliens Rules Loaded!`);
        },
        onerror: function (error) {
            console.error(`AMQ NanaTweaks Aliens Rules Failed to Load!`);
            console.error("Request failed:", error);
        }
    });

    console.info(`AMQ NanaTweaks Aliens Loaded!`);
    console.info(`Commands: /aliens <number> | /aliens restart | /aliens roomset`);
}

let skipPrefix = "#$ ";
let isAlienOn = false;
let alienList = [];
let isHostKnown = true;
let adventagePlayer = {
    nekomeiji: 3,
    iamLuxin: 3
}
let fastestPlayers = [];
let acceptVotes = [];
let settingsCode = "m2s0k1111011001130k000031110000000k11111111111100a011o000000f352143331110000k012r02i0a46533a11002s01111110011100140111002s01a111111111102a111111111050017pr11hg1ka03-11111--";
let rules = [];

function chatCommandSetup() {
    if (document.NanaTweaksChatCommands === undefined) return;

    document.NanaTweaksChatCommands.addCommand(
        "aliens",
        "Aliens Game Mode",
        (args) => {
            if (args.length === 0) {
                document.NanaTweaksChatCommands.sendChat("This Command Need Args.");
                return;
            }
            const subCommand = args.shift().toLowerCase();

            switch (subCommand) {
                case "restart": {
                    isAlienOn = false;
                    alienList = [];
                    fastestPlayers = [];
                    acceptVotes = [];
                    document.NanaTweaksChatCommands.sendChat(`/aliens restart`);
                    document.NanaTweaksChatCommands.sendChat(`Variable Reset!`);
                    break;
                }
                case "roomset": {
                    const settings = hostModal.settingStorage.serilizer.decode(settingsCode);
                    hostModal.changeSettings(settings);
                    document.NanaTweaksChatCommands.sendChat(`/aliens roomset`);
                    document.NanaTweaksChatCommands.sendChat(`Room settings applied!`);
                    break;
                }
                case "rules": {
                    let lang = args[0]?.toLowerCase() || "en";
                    if (!Object.keys(rules[0]).includes(lang)) lang = "en";
                    rules.forEach((rule) => {
                        document.NanaTweaksChatCommands.sendChat(rule[lang]);
                    })
                    break;
                }
                default: {
                    document.NanaTweaksChatCommands.sendChat(`/aliens ${subCommand}`);
                    const count = Number(subCommand)
                    if (!isNaN(count)) {
                        let allPlayers = Object.values(lobby.players)
                        alienList = [];
                        for (let i = 0; i < count; i++) {
                            let player = allPlayers.splice(Math.floor(Math.random() * allPlayers.length), 1)[0]
                            if (player) alienList.push(player);
                        }
                        alienList.forEach(a => {
                            setTimeout(() => document.NanaTweaksChatCommands.sendMessage(a._name, `Aliens: ${alienList.map(a => a._name).join(", ")}`, isHostKnown), 0)
                            setTimeout(() => document.NanaTweaksChatCommands.sendMessage(a._name, `Please send back "ok" to confirm list`, isHostKnown), 1000)
                            a.responseChat = false
                            a.founded = false
                        })
                        isAlienOn = true
                    } else document.NanaTweaksChatCommands.sendChat(`
                        Invalid arguments: expect number \n
                        Usage: /aliens <number>
                    `)
                    break;
                }
            }
        },
    );
}

function checkTie(entries) {
    const maxScore = Math.max(...entries.map(([name, score]) => score));
    const tied = entries.filter(([name, score]) => score === maxScore);

    if (tied.length > 1) {
        return {
            isTie: true,
            maxScore,
            tiedNames: tied.map(([name]) => name),
            message: `Tie at top (${maxScore}) between: ${tied.map(([n]) => n).join(", ")} — needs a re-vote`
        };
    }

    return {
        isTie: false,
        winner: tied[0][0],
        score: maxScore,
        message: `Clear winner: ${tied[0][0]} with score ${maxScore}`
    };
}

function registerListener() {
    [
        [
            "answer results",
            (result) => {
                if (!isAlienOn) return;
                const currentRound = Number(quiz.infoContainer.$currentSongCount.text());
                let currentPlayers = Object.values(quiz.players).sort((a, b) => Number(a.gamePlayerId) - Number(b.gamePlayerId)).map(ppp => {
                    const resultPlayer = result.players.find(rpp => rpp.gamePlayerId === ppp.gamePlayerId)
                    return { ...ppp, correct: resultPlayer.correct, answerTimeing: resultPlayer.answerTimeing }
                });
                const foundedAlien = Object.values(alienList).filter((a) => {
                    return a.founded === true;
                })
                console.log("result", result)
                console.log("Current Round", currentRound)
                console.log("currentPlayers", currentPlayers)
                console.log("alienList", alienList)
                console.log("foundedAlien", foundedAlien)
                document.NanaTweaksChatCommands.sendChat(`${skipPrefix}`);
                document.NanaTweaksChatCommands.sendChat(`${skipPrefix}=========`);
                document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Founded:`);
                foundedAlien.forEach(a => {
                    document.NanaTweaksChatCommands.sendChat(skipPrefix + a._name);
                })
                document.NanaTweaksChatCommands.sendChat(`${skipPrefix}`);
                document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Player List:`);
                currentPlayers.forEach((p, i) => {
                    document.NanaTweaksChatCommands.sendChat(`${skipPrefix}${p.gamePlayerId}. ${p._name} [${p.answerTimeing === undefined ? "Unknown" : p.answerTimeing}s]`);
                })
                document.NanaTweaksChatCommands.sendChat(`${skipPrefix}=========`);
                socket.sendCommand({
                    type: "quiz",
                    command: "quiz pause"
                })
                fastestPlayers = currentPlayers.filter(pp => pp.correct).map(pp => {
                    let adventagePlayerItem = Object.entries(adventagePlayer).find(([key, value]) => key.toLowerCase() === pp._name.toLowerCase()) || ["UNKNOWN", 0]
                    return { ...pp, answerTimeing: Number(pp.answerTimeing) + adventagePlayerItem }
                }).sort((a, b) => Number(a.answerTimeing) - Number(b.answerTimeing))
                if (fastestPlayers.length <= 0) {
                    socket.sendCommand({
                        type: "quiz",
                        command: "quiz unpause"
                    })
                    document.NanaTweaksChatCommands.sendChat(`${skipPrefix}No player answer correctly, unpause!`);
                    return;
                }
                if (currentRound % 10 === 0) {
                    document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Type ${alienList.length} number to vote who goes checked`);
                    acceptVotes = currentPlayers.map(p => p.gamePlayerId);
                } else {
                    document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Fastest Player: ${fastestPlayers[0]._name}`);
                    document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Type ${alienList.length} number spaced to guess the aliens`);
                    document.NanaTweaksChatCommands.sendChat(`${skipPrefix}If ask list, please ask and response with ok!`);
                }
            },
        ],
        [
            "chat message",
            (result) => {
                const alienPlayer = alienList.find(a => a._name === result.sender)
                if (alienList.length !== 0 && alienPlayer && alienPlayer.responseChat === false && result.message.toLowerCase() === "ok") {
                    alienPlayer.responseChat = true;
                    const allAlienConfirmed = alienList.every((r) => r.responseChat === true);
                    if (allAlienConfirmed) {
                        document.NanaTweaksChatCommands.sendChat(`All aliens have confirmed the list. Host can start game`);
                    }
                }
            }
        ],
        [
            "game chat update",
            (result) => {
                if (!isAlienOn) return;
                const message = result.messages[0]
                if (!message || message.sender === "") return;
                if (message.message.startsWith(skipPrefix)) return;
                let currentPlayers = Object.values(quiz.players).sort((a, b) => Number(a.gamePlayerId) - Number(b.gamePlayerId));
                const currentRound = Number(quiz.infoContainer.$currentSongCount.text());
                if (currentRound % 10 === 0) {
                    const p = fastestPlayers.find(p => p._name === message.sender)
                    if (!p) return;
                    if (message.message.split(" ").map(s => s.trim()).filter(s => s !== "").length !== 1) return;
                    let vote = Number(message.message.split(" ").map(s => s.trim()).filter(s => s !== "")[0]);
                    if (!acceptVotes.includes(vote)) return;
                    p.vote = vote;
                    if (fastestPlayers.every(pp => pp.vote !== undefined)) {
                        let rankingVote = {}
                        fastestPlayers.forEach(pp => {
                            if (!rankingVote[pp.vote]) rankingVote[pp.vote] = 0;
                            rankingVote[pp.vote] += 1;
                        })
                        let rankingVoteList = Object.entries(rankingVote).sort((a, b) => b[1] - a[1])
                        rankingVoteList.forEach(([id, vote]) => {
                            let pp = currentPlayers.find(p => p.gamePlayerId === Number(id))
                            if (!pp) return;
                            document.NanaTweaksChatCommands.sendChat(`${skipPrefix}${pp._name}: ${vote}`)
                        })

                        let tieInfo = checkTie(rankingVoteList)
                        document.NanaTweaksChatCommands.sendChat(`${skipPrefix}${tieInfo.message}`)
                        if (tieInfo.isTie) {
                            acceptVotes = tieInfo.tiedNames.map(Number);
                            fastestPlayers.forEach(f => f.vote = undefined);
                            acceptVotes.forEach(id => {
                                const aP = currentPlayers.find(p => p.gamePlayerId === id);
                                document.NanaTweaksChatCommands.sendChat(`${skipPrefix}${id}. ${aP._name}`);
                            })
                        } else {
                            let checkedPlayer = currentPlayers.find(p => p.gamePlayerId === Number(tieInfo.winner));
                            let alienCheckedPlayer = alienList.find(a => a._name === checkedPlayer._name);
                            if (checkedPlayer && alienCheckedPlayer) {
                                document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Correct guess! ${checkedPlayer._name} is an alien`);
                                alienCheckedPlayer.founded = true;
                            } else {
                                document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Wrong guess! ${checkedPlayer._name} is not an alien`);
                                fastestPlayers = [];
                                acceptVotes = [];
                                socket.sendCommand({
                                    type: "quiz",
                                    command: "quiz unpause"
                                })
                            }
                        }

                    }
                } else {
                    if (message.sender !== fastestPlayers[0]._name) return
                    if (message.message.trim().toLowerCase() !== "ok") {
                        let data = message.message.split(" ").map(Number)
                        if (data.length !== alienList.length) return
                        let isAllAliens = true;
                        data.forEach(i => {
                            if (alienList.find(a => a.gamePlayerId === i) === undefined) {
                                isAllAliens = false;
                                return;
                            }
                        })
                        if (isAllAliens) {
                            data.forEach(i => {
                                alienList.find(a => a.gamePlayerId === i).founded = true;
                            })
                            document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Correct guess!\nAll Aliens: ${alienList.map(a => a._name).join(", ")}`);
                            fastestPlayers = [];
                            acceptVotes = [];
                            isAlienOn = false;
                            setTimeout(() => {
                                socket.sendCommand({ type: "quiz", command: "start return lobby vote" })
                            }, 1000);
                        } else {
                            document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Wrong guess!`);
                            fastestPlayers = [];
                            acceptVotes = [];
                            socket.sendCommand({
                                type: "quiz",
                                command: "quiz unpause"
                            })
                        }
                    }
                    fastestPlayers = [];
                    acceptVotes = [];
                    socket.sendCommand({
                        type: "quiz",
                        command: "quiz unpause"
                    })
                }
            }
        ]
    ].forEach((event) => {
        new Listener(event[0], event[1]).bindListener();
    });
}
