// ==UserScript==
// @name         NanaTweaks Aliens Mode
// @namespace    https://xtsusaku.net/
// @version      0.0.6
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

let playerData = []
let isHostKnown = true;
let adventagePlayer = {
    nekomeiji: 3,
    iamluxin: 3
}
let fastestPlayers = [];
let acceptVotes = [];
let settingsCode = "m2s0k1111011001130k000031110000000k11111111111100a011o000000f352143331110000k012r02i0a46533a11002s01111110011100140111002s01a111111111102a111111111050017pr11hg1ka03-11111--";
let rules = [];
let similarityThreshold = 0.5
let maxAmmo = 1;
let killerRound = 10;

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
                case "reset":
                case "restart": {
                    isAlienOn = false;
                    playerData = [];
                    fastestPlayers = [];
                    acceptVotes = [];
                    document.NanaTweaksChatCommands.sendChat(`/aliens restart`);
                    document.NanaTweaksChatCommands.sendChat(`Variable Reset!`);
                    break;
                }
                case "settings":
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
                case "cm":
                case "checkammo": {
                    if (!isAlienOn) return;

                    playerData.forEach((player) => {
                        document.NanaTweaksChatCommands.sendChat(`${player.name}: ${player.ammo}`);
                    })
                    break;
                }
                case "ma":
                case "maxammo": {
                    maxAmmo = Number(args[0] ?? 1);
                    document.NanaTweaksChatCommands.sendChat(`Max ammo set to ${maxAmmo}`);
                    break;
                }
                case "kr":
                case "killerround": {
                    killerRound = Number(args[0] ?? 10);
                    document.NanaTweaksChatCommands.sendChat(`Killer round set to ${killerRound}`);
                    break;
                }
                default: {
                    document.NanaTweaksChatCommands.sendChat(`/aliens ${subCommand}`);
                    const count = Number(subCommand)
                    if (!isNaN(count)) {
                        playerData = Object.values(lobby.players).map(p => {
                            return {
                                name: p._name,
                                gamePlayerId: p.gamePlayerId,
                                isAlien: false,
                                responseChat: false,
                                founded: false,
                                ammo: 0,
                                adventage: adventagePlayer[p._name] ?? 0,
                                correct: false,
                                answerTimeing: -1
                            }
                        }).sort((a, b) => a.gamePlayerId - b.gamePlayerId);
                        let playerCloned = [...playerData];
                        for (let i = 0; i < count; i++) {
                            let player = playerCloned.splice(Math.floor(Math.random() * playerCloned.length), 1)[0]
                            if (player) playerData.find(p => p.gamePlayerId === player.gamePlayerId).isAlien = true;
                        }
                        playerData.filter(p => p.isAlien).forEach(a => {
                            setTimeout(() => document.NanaTweaksChatCommands.sendMessage(a.name, `Aliens: ${playerData.filter(p => p.isAlien).map(p => p.name).join(", ")}`, isHostKnown), 0)
                            setTimeout(() => document.NanaTweaksChatCommands.sendMessage(a.name, `Please send back "ok" to confirm list`, isHostKnown), 1000)
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

function findPlayer(acceptVotes, message) {
    let rawVoteStr = message.trim();
    console.log("acceptVotes", acceptVotes)
    console.log("rawVoteStr", rawVoteStr)
    let findVotePlayer = DiceCoefficient.matchNames(acceptVotes, rawVoteStr, { threshold: similarityThreshold });
    console.log("findVotePlayer", findVotePlayer)
    if (!findVotePlayer || findVotePlayer.length === 0) return;
    let bestMatch = findVotePlayer.sort((a, b) => b.score - a.score)[0];
    console.log("bestMatch", bestMatch)
    if (bestMatch.score < similarityThreshold) return;
    let matchedPlayer = acceptVotes.find(p => p === bestMatch.name);
    console.log("matchedPlayer", matchedPlayer)
    if (!matchedPlayer) return;
    return matchedPlayer
}

function registerListener() {
    [
        [
            "answer results",
            async (result) => {
                if (!isAlienOn) return;
                const currentRound = Number(quiz.infoContainer.$currentSongCount.text());
                playerData.forEach(ppp => {
                    const resultPlayer = result.players.find(rpp => rpp.gamePlayerId === ppp.gamePlayerId)
                    if (resultPlayer) {
                        ppp.correct = resultPlayer.correct
                        ppp.answerTimeing = resultPlayer.answerTimeing
                    }
                });
                const foundedAlien = Object.values(playerData).filter((a) => {
                    return a.isAlien && a.founded === true;
                })
                document.NanaTweaksChatCommands.sendChat(`${skipPrefix}`);
                document.NanaTweaksChatCommands.sendChat(`${skipPrefix}=========`);
                document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Founded:`);
                document.NanaTweaksChatCommands.sendChat(skipPrefix + foundedAlien.map(a => a.name).join(", "));
                socket.sendCommand({
                    type: "quiz",
                    command: "quiz pause"
                })
                fastestPlayers = playerData.filter(pp => pp.correct).map(pp => {
                    let advantageEntry = Object.entries(adventagePlayer).find(([key, value]) => key.toLowerCase() === pp.name.toLowerCase());
                    let bonusTime = advantageEntry ? advantageEntry[1] : 0;
                    return { ...pp, answerTimeing: Number(pp.answerTimeing) + bonusTime };
                }).sort((a, b) => a.answerTimeing - b.answerTimeing).filter(ppp => !foundedAlien.find(fa => fa.name === ppp.name && fa.founded === true));
                if (fastestPlayers.length <= 0) {
                    socket.sendCommand({
                        type: "quiz",
                        command: "quiz unpause"
                    })
                    document.NanaTweaksChatCommands.sendChat(`${skipPrefix}No player answer correctly, unpause!`);
                    return;
                }
                if (currentRound % 10 === 0) {
                    document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Type 1 player name to vote who goes checked`);
                    acceptVotes = playerData.map(p => p.name);
                } else {
                    document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Fastest Player: ${fastestPlayers[0].name}`);
                    document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Type ${playerData.filter(p => p.isAlien).length} player name spaced to guess the aliens`);
                    document.NanaTweaksChatCommands.sendChat(`${skipPrefix}If ask list, please ask and response with ok!`);
                }
            },
        ],
        [
            "chat message",
            (result) => {
                const alienPlayer = playerData.find(a => a.isAlien && a.name === result.sender)
                if (playerData.filter(p => p.isAlien).length !== 0 && alienPlayer && alienPlayer.responseChat === false && result.message.toLowerCase() === "ok") {
                    alienPlayer.responseChat = true;
                    const allAlienConfirmed = playerData.filter(p => p.isAlien).every((r) => r.responseChat === true);
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
                const currentRound = Number(quiz.infoContainer.$currentSongCount.text());
                const totalSongCount = Number(quiz.infoContainer.$totalSongCount.text());
                if (currentRound % 10 === 0) {
                    const p = fastestPlayers.find(p => p.name === message.sender)
                    if (!p) return;
                    if (message.message.split(" ").map(s => s.trim()).filter(s => s !== "").length !== 1) return;

                    let foundName = findPlayer(acceptVotes, message.message)
                    if (!foundName) return;
                    p.vote = foundName;

                    if (fastestPlayers.every(pp => pp.vote !== undefined)) {
                        let rankingVote = {}
                        fastestPlayers.forEach(pp => {
                            if (!rankingVote[pp.vote]) rankingVote[pp.vote] = 0;
                            rankingVote[pp.vote] += 1;
                        })
                        let rankingVoteList = Object.entries(rankingVote).sort((a, b) => b[1] - a[1])
                        rankingVoteList.forEach(([name, vote]) => {
                            document.NanaTweaksChatCommands.sendChat(`${skipPrefix}${name}: ${vote}`)
                        })

                        let tieInfo = checkTie(rankingVoteList)
                        document.NanaTweaksChatCommands.sendChat(`${skipPrefix}${tieInfo.message}`)
                        if (tieInfo.isTie) {
                            acceptVotes = tieInfo.tiedNames;
                            fastestPlayers.forEach(f => f.vote = undefined);
                            document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Accept Vote: ${acceptVotes.join(", ")}`);
                        } else {
                            let checkedPlayer = playerData.find(p => p.name === tieInfo.winner);
                            let alienCheckedPlayer = playerData.find(a => a.isAlien && a.name === checkedPlayer.name);
                            if (checkedPlayer && alienCheckedPlayer) {
                                document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Correct guess! ${checkedPlayer.name} is an alien`);
                                alienCheckedPlayer.founded = true;
                            } else {
                                document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Wrong guess! ${checkedPlayer.name} is not an alien`);
                                fastestPlayers = [];
                                acceptVotes = [];
                            }
                            socket.sendCommand({
                                type: "quiz",
                                command: "quiz unpause"
                            })
                        }

                    }
                } else {
                    if (message.sender !== fastestPlayers[0].name) return
                    const sender = playerData.find(p => p.name === message.sender)
                    if (message.message.trim().toLowerCase() !== "ok") {
                        if (sender.ammo <= 0 & totalSongCount - currentRound > killerRound) {
                            document.NanaTweaksChatCommands.sendChat(`${skipPrefix}${sender.name} - Ammo exhausted!`);
                            return;
                        }
                        let data = message.message.split(" ").map(s => s.trim()).filter(s => s !== "").map(player => {
                            console.log("player", player)
                            const foundName = findPlayer(playerData.map(pl => pl.name), player)
                            console.log("foundName", foundName)
                            if (!foundName) return
                            return foundName
                        }).filter(p => p !== undefined);
                        if (data.length !== playerData.filter(p => p.isAlien).length) {
                            document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Your guess is incorrect!`);
                            return
                        }
                        let isAllAliens = true;
                        data.forEach(i => {
                            if (playerData.find(a => a.isAlien && a.name === i) === undefined) {
                                isAllAliens = false;
                                return;
                            }
                        })
                        if (isAllAliens) {
                            data.forEach(i => {
                                playerData.find(a => a.isAlien && a.name === i).founded = true;
                            })
                            document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Correct guess!\nAll Aliens: ${playerData.filter(p => p.isAlien).map(a => a.name).join(", ")}`);
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
                            sender.ammo = Math.max(0, sender.ammo - 1)
                        }
                    }
                    fastestPlayers = [];
                    acceptVotes = [];
                    sender.ammo = Math.min(maxAmmo, sender.ammo + 1)
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


class DiceCoefficient {
    /**
     * Generates character bigrams (pairs of adjacent characters) from a string.
     * @param {string} str
     * @returns {Map<string, number>}
     */
    static getBigrams(str) {
        const cleaned = str.toLowerCase().trim();
        const bigrams = new Map();

        if (cleaned.length < 2) return bigrams;

        for (let i = 0; i < cleaned.length - 1; i++) {
            const bigram = cleaned.slice(i, i + 2);
            bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
        }

        return bigrams;
    }

    /**
     * Calculates the Sorensen-Dice coefficient between two strings.
     * @param {string} str1
     * @param {string} str2
     * @returns {number} Score between 0 and 1
     */
    static compare(str1, str2) {
        const s1 = str1.toLowerCase().trim();
        const s2 = str2.toLowerCase().trim();

        if (s1 === s2) return 1;
        if (s1.length < 2 || s2.length < 2) return 0;

        const bigrams1 = DiceCoefficient.getBigrams(s1);
        const bigrams2 = DiceCoefficient.getBigrams(s2);

        let intersectionSize = 0;
        let totalBigrams1 = 0;
        let totalBigrams2 = 0;

        for (const [bigram, count1] of bigrams1.entries()) {
            totalBigrams1 += count1;
            if (bigrams2.has(bigram)) {
                intersectionSize += Math.min(count1, bigrams2.get(bigram));
            }
        }

        for (const count2 of bigrams2.values()) {
            totalBigrams2 += count2;
        }

        return (2 * intersectionSize) / (totalBigrams1 + totalBigrams2);
    }

    /**
     * Matches a raw input against an array of target strings filtering by threshold.
     * @param {string[]} targets - Array of target strings to search against.
     * @param {string} rawInput - The query string to match.
     * @param {number} [threshold=0] - Minimum similarity score (0 to 1) required.
     * @returns {Array<{ target: string, score: number }>} Sorted from best match to lowest score.
     */
    static match(targets = [], rawInput = '', threshold = 0) {
        return targets
            .map((target) => ({
                target,
                score: DiceCoefficient.compare(rawInput, target),
            }))
            .filter((item) => item.score >= threshold)
            .sort((a, b) => b.score - a.score);
    }
}

// Example usage:
const candidates = ["night", "nacht", "knight", "light", "alligator"];

const results = DiceCoefficient.match(candidates, "night", 0.4);
console.log(results);
/*
Output:
[
  { target: 'night', score: 1 },
  { target: 'knight', score: 0.8 },
  { target: 'light', score: 0.75 }
]
*/
