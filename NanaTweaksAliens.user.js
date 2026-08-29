// ==UserScript==
// @name         NanaTweaks Aliens Mode
// @namespace    https://xtsusaku.net/
// @version      0.0.3
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
                    alienList = [];
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

function findPlayer(acceptVotes, message) {
    let rawVoteStr = message.trim();
    let findVotePlayer = DiceSimilarity.matchNames(acceptVotes, rawVoteStr, { threshold: similarityThreshold });
    if (!findVotePlayer || findVotePlayer.length === 0) return;
    let bestMatch = findVotePlayer.sort((a, b) => b.score - a.score)[0];
    if (bestMatch.score < similarityThreshold) return;
    let matchedPlayer = acceptVotes.find(p => p._name === bestMatch.name);
    if (!matchedPlayer) return;
}

function registerListener() {
    [
        [
            "answer results",
            async (result) => {
                if (!isAlienOn) return;
                const currentRound = Number(quiz.infoContainer.$currentSongCount.text());
                let currentPlayers = Object.values(quiz.players).sort((a, b) => Number(a.gamePlayerId) - Number(b.gamePlayerId)).map(ppp => {
                    const resultPlayer = result.players.find(rpp => rpp.gamePlayerId === ppp.gamePlayerId)
                    return { ...ppp, correct: resultPlayer.correct, answerTimeing: resultPlayer.answerTimeing }
                });
                const foundedAlien = Object.values(alienList).filter((a) => {
                    return a.founded === true;
                })
                document.NanaTweaksChatCommands.sendChat(`${skipPrefix}`);
                document.NanaTweaksChatCommands.sendChat(`${skipPrefix}=========`);
                document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Founded:`);
                document.NanaTweaksChatCommands.sendChat(skipPrefix + foundedAlien.map(a => a._name).join(", "));
                socket.sendCommand({
                    type: "quiz",
                    command: "quiz pause"
                })
                fastestPlayers = currentPlayers.filter(pp => pp.correct).map(pp => {
                    let advantageEntry = Object.entries(adventagePlayer).find(([key, value]) => key.toLowerCase() === pp._name.toLowerCase());
                    let bonusTime = advantageEntry ? advantageEntry[1] : 0;
                    return { ...pp, answerTimeing: Number(pp.answerTimeing) + bonusTime };
                }).sort((a, b) => a.answerTimeing - b.answerTimeing).filter(ppp => foundedAlien.map(fa => fa._name).includes(ppp._name));
                if (fastestPlayers.length <= 0) {
                    socket.sendCommand({
                        type: "quiz",
                        command: "quiz unpause"
                    })
                    document.NanaTweaksChatCommands.sendChat(`${skipPrefix}No player answer correctly, unpause!`);
                    return;
                }
                if (currentRound % 10 === 0) {
                    document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Type ${alienList.length} player name to vote who goes checked`);
                    acceptVotes = currentPlayers.map(p => p._name);
                } else {
                    document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Fastest Player: ${fastestPlayers[0]._name}`);
                    document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Type ${alienList.length} player name spaced to guess the aliens`);
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

                    let rawVoteStr = message.message.trim();
                    let findVotePlayer = DiceSimilarity.matchNames(acceptVotes, rawVoteStr, { threshold: similarityThreshold });
                    if (!findVotePlayer || findVotePlayer.length === 0) return;
                    let bestMatch = findVotePlayer.sort((a, b) => b.score - a.score)[0];
                    if (bestMatch.score < similarityThreshold) return;
                    let matchedPlayer = acceptVotes.find(p => p._name === bestMatch.name);
                    if (!matchedPlayer) return;
                    p.vote = matchedPlayer._name;

                    if (fastestPlayers.every(pp => pp.vote !== undefined)) {
                        let rankingVote = {}
                        fastestPlayers.forEach(pp => {
                            if (!rankingVote[pp.vote]) rankingVote[pp.vote] = 0;
                            rankingVote[pp.vote] += 1;
                        })
                        let rankingVoteList = Object.entries(rankingVote).sort((a, b) => b[1] - a[1])
                        rankingVoteList.forEach(([name, vote]) => {
                            let pp = currentPlayers.find(p => p._name === name)
                            if (!pp) return;
                            document.NanaTweaksChatCommands.sendChat(`${skipPrefix}${pp._name}: ${vote}`)
                        })

                        let tieInfo = checkTie(rankingVoteList)
                        document.NanaTweaksChatCommands.sendChat(`${skipPrefix}${tieInfo.message}`)
                        if (tieInfo.isTie) {
                            acceptVotes = tieInfo.tiedNames;
                            fastestPlayers.forEach(f => f.vote = undefined);
                            document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Accept Vote: ${acceptVotes.join(", ")}`);
                        } else {
                            let checkedPlayer = currentPlayers.find(p => p._name === tieInfo.winner);
                            let alienCheckedPlayer = alienList.find(a => a._name === checkedPlayer._name);
                            if (checkedPlayer && alienCheckedPlayer) {
                                document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Correct guess! ${checkedPlayer._name} is an alien`);
                                alienCheckedPlayer.founded = true;
                            } else {
                                document.NanaTweaksChatCommands.sendChat(`${skipPrefix}Wrong guess! ${checkedPlayer._name} is not an alien`);
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
                    if (message.sender !== fastestPlayers[0]._name) return
                    if (message.message.trim().toLowerCase() !== "ok") {
                        let data = message.message.split(" ").map(s => s.trim()).filter(s => s !== "");
                        if (data.length !== alienList.length) return
                        let isAllAliens = true;
                        data.forEach(i => {
                            if (alienList.find(a => a._name === i) === undefined) {
                                isAllAliens = false;
                                return;
                            }
                        })
                        if (isAllAliens) {
                            data.forEach(i => {
                                alienList.find(a => a._name === i).founded = true;
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


class DiceSimilarity {
    /**
     * Generate bigrams (pairs of adjacent characters) from a string.
     * Ignores case and optionally strips whitespace.
     */
    static getBigrams(str, { ignoreCase = true, stripSpaces = false } = {}) {
        let s = String(str);
        if (ignoreCase) s = s.toLowerCase();
        if (stripSpaces) s = s.replace(/\s+/g, "");

        const bigrams = [];
        for (let i = 0; i < s.length - 1; i++) {
            bigrams.push(s.substring(i, i + 2));
        }
        return bigrams;
    }

    /**
     * Compute Dice's Coefficient between two strings.
     * Returns a value between 0 (no similarity) and 1 (identical).
     */
    static compare(str1, str2, options = {}) {
        if (!str1 || !str2) return 0;
        if (str1 === str2) return 1;

        const bigrams1 = this.getBigrams(str1, options);
        const bigrams2 = this.getBigrams(str2, options);

        if (bigrams1.length === 0 || bigrams2.length === 0) return 0;

        // Count matches (accounting for duplicate bigrams properly)
        const map = new Map();
        for (const bg of bigrams1) {
            map.set(bg, (map.get(bg) || 0) + 1);
        }

        let intersectionSize = 0;
        for (const bg of bigrams2) {
            const count = map.get(bg) || 0;
            if (count > 0) {
                intersectionSize++;
                map.set(bg, count - 1);
            }
        }

        return (2 * intersectionSize) / (bigrams1.length + bigrams2.length);
    }

    /**
     * Check if a string contains a name-like match by scanning substrings.
     * Useful for finding a name inside a longer text, not just comparing
     * two full strings directly.
     */
    static findBestSubstringMatch(name, text, options = {}) {
        const nameLen = name.length;
        const textLen = text.length;
        if (nameLen === 0 || textLen === 0) return { score: 0, match: null };

        let best = { score: 0, match: null, index: -1 };

        // Slide a window roughly the size of `name` across `text`
        // (+/- a couple chars to tolerate minor length differences)
        const minWindow = Math.max(1, nameLen - 2);
        const maxWindow = nameLen + 2;

        for (let len = minWindow; len <= maxWindow; len++) {
            for (let i = 0; i <= textLen - len; i++) {
                const substr = text.substring(i, i + len);
                const score = this.compare(name, substr, options);
                if (score > best.score) {
                    best = { score, match: substr, index: i };
                }
            }
        }

        return best;
    }

    /**
     * Match a list of names against a block of text.
     * Returns matches above the given threshold, sorted by score descending.
     *
     * @param {string[]} names - list of names to search for
     * @param {string} text - text to search within
     * @param {object} opts
     * @param {number} opts.threshold - minimum similarity score to include (0-1)
     * @param {boolean} opts.wholeTextCompare - if true, compares name directly
     *        against the whole text instead of scanning substrings (faster,
     *        useful if text is already just a single name/short string)
     */
    static matchNames(names, text, opts = {}) {
        const {
            threshold = 0.5,
            wholeTextCompare = false,
            ignoreCase = true,
            stripSpaces = false,
        } = opts;

        const options = { ignoreCase, stripSpaces };
        const results = [];

        for (const name of names) {
            let result;
            if (wholeTextCompare) {
                const score = this.compare(name, text, options);
                result = { name, score, match: text };
            } else {
                const best = this.findBestSubstringMatch(name, text, options);
                result = { name, score: best.score, match: best.match };
            }

            if (result.score >= threshold) {
                results.push(result);
            }
        }

        return results.sort((a, b) => b.score - a.score);
    }
}
