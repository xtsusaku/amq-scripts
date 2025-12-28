// ==UserScript==
// @name         Nekomeiji's SA Displayer
// @namespace    https://github.com/xtsusaku/amq-scripts
// @version      0.0.1
// @description  S/A Displayer for Anime Music Quiz (Nekomeiji's Codebase)
// @author       xTsuSaKu & Nekomeiji
// @match        https://animemusicquiz.com/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=animemusicquiz.com
// @grant        none
// @downloadURL  https://github.com/xtsusaku/amq-scripts/raw/refs/heads/main/Nekomeiji%20SA%20Displayer.user.js
// @updateURL    https://github.com/xtsusaku/amq-scripts/raw/refs/heads/main/Nekomeiji%20SA%20Displayer.user.js
// ==/UserScript==

const INCORRECT_STR = "❌️";
const CORRECT_STR = "✔️";
const INCORRECT_SINGLE_ARTIST = "❌️";
const CORRECT_SINGLE_ARTIST = "✔️";
let songInfoDisplay = null;
let enabled = false;

(function () {
  "use strict";

  let NanaTweaksMenuLoadInterval = setInterval(() => {
    console.log(
      "Nekomeiji's SA Displayer waiting for loading screen to hide..."
    );
    if ($("#loadingScreen").hasClass("hidden")) {
      clearInterval(NanaTweaksMenuLoadInterval);
      console.log("Nekomeiji's SA Displayer loaded");
      setup();
    }
  }, 500);

  async function onNextSong() {
    if (songInfoDisplay) songInfoDisplay.reset();
  }

  function onTeamMemberAnswer(payload) {
    if (
      (payload.answer.startsWith("*S") || payload.answer.startsWith("💀*S")) &&
      (payload.answer.includes(INCORRECT_STR) ||
        payload.answer.includes(CORRECT_STR))
    ) {
      enabled = true;
      const splitData = payload.answer.split(" ・ A");
      const songName = splitData.shift();
      const splitData2 = splitData.shift().split(")");
      const artistEnd = splitData2.pop().trim();
      const splitData3 = splitData2.join(")").split("(");
      splitData3.shift();
      const artistList = splitData3
        .join("(")
        .trim()
        .split(",")
        .map((name) => name.trim());
      let splitData4 = songName.split(")");
      let data1 = splitData4.pop();
      splitData4 = splitData4.join(")").split("(");
      splitData4.shift().split(" ").pop();
      const songNameClean = splitData4
        .join("(")
        .trim()
        .replace(INCORRECT_STR, "")
        .replace(CORRECT_STR, "")
        .trim();
      const aCSplit = artistEnd
        .replace(INCORRECT_STR, "")
        .replace(CORRECT_STR, "")
        .trim()
        .split(" ");
      const aCount = aCSplit
        .pop()
        .split("/")
        .map((s) => parseInt(s));
      const percent = parseInt(
        (data1.split(" ").find((s) => s.includes("%")) || "100%").replace(
          "%",
          ""
        )
      );
      const isArtistComplete = aCount[0] >= aCount[1];
      console.log(songNameClean);
      console.log(artistList);
      console.log(percent, isArtistComplete);
      songInfoDisplay.update2(
        songNameClean,
        percent,
        artistList,
        isArtistComplete
      );
    }
  }

  function setup() {
    songInfoDisplay = new SongInfoDisplay();

    new Listener("play next song", () => {
      onNextSong();
    }).bindListener();
    new Listener("team member answer", onTeamMemberAnswer).bindListener();

    injectStyles();
  }

  function injectStyles() {
    if (document.getElementById("esaStyles")) return;

    const style = document.createElement("style");
    style.id = "esaStyles";
    style.textContent = `
			.esaSongInfoList {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;

				overflow-y: auto;
				color: #d9d9d9;
				font-size: 12px;
				scrollbar-width: thin;

				display: flex;
				flex-direction: column;
				justify-content: flex-start;

				padding-top: 5px;
				box-sizing: border-box;
				background-color: rgba(40, 40, 40, 0.95);
				z-index: 10;
			}

			.esaSongInfoTitle {
				padding: 4px 8px;
				font-weight: bold;
				text-align: center;
				border-bottom: 1px solid #444;
				margin-bottom: 3px;
				font-size: 13px;
				flex-shrink: 0;
			}

			.esaSongInfoHeader {
				padding: 1px 8px;
				font-size: 12px;
				font-weight: bold;
				margin-top: 3px;
				color: #bbb;
				flex-shrink: 0;
			}

			.esaSongInfoMatch {
				padding: 1px 8px;
				display: flex;
				justify-content: space-between;
				align-items: center;
				gap: 5px;
				flex-shrink: 0;
			}

			.esaSongInfoItemName {
				font-size: 12px;
				overflow-wrap: break-word;
				word-wrap: break-word;
				max-width: 75%;
				font-family: monospace;
				text-align: left;
				line-height: 1.2;
			}

			.esaSongInfoItemScore {
				font-size: 10px;
				font-weight: bold;
				padding: 1px 5px;
				border-radius: 8px;
				min-width: 28px;
				text-align: center;
				color: #2e2c2c;
			}

			.esaCorrect { background-color: #4CAF50; color: #fff; }
			.esaPartial { background-color: #FFC107; color: #2e2c2c; }
			.esaIncorrect { background-color: #F44336; color: #fff; }
		`;
    document.head.appendChild(style);
  }

  class SongInfoDisplay {
    constructor() {
      this.container = document.getElementById("qpInfoHider");
    }

    setup() {
      if (!this.container)
        this.container = document.getElementById("qpInfoHider");
      if (!this.container) return;

      this.container.innerHTML = `
				<div class="esaSongInfoList" id="esaSongInfo">
					<div class="esaSongInfoTitle">S/A Info</div>
					<div id="esaSongInfoSongName">
						<div class="esaSongInfoHeader">Song Name</div>
						<div id="esaSongInfoSongNameBox"></div>
					</div>
					<div id="esaSongInfoArtists">
						<div class="esaSongInfoHeader">Artists</div>
						<div id="esaSongInfoArtistsBox"></div>
					</div>
				</div>
			`;
      this.show();
    }

    createMatchElement(text, scorePercent) {
      const div = document.createElement("div");
      div.className = "esaSongInfoMatch";

      const nameDiv = document.createElement("div");
      nameDiv.className = "esaSongInfoItemName";
      nameDiv.textContent = text || "???";

      const scoreDiv = document.createElement("div");
      let scoreClass = "esaIncorrect";
      if (scorePercent > 99.9) scoreClass = "esaCorrect";
      else if (scorePercent > 70) scoreClass = "esaPartial";

      scoreDiv.className = `esaSongInfoItemScore ${scoreClass}`;
      scoreDiv.textContent = Math.round(scorePercent) + "%";

      div.appendChild(nameDiv);
      div.appendChild(scoreDiv);
      return div;
    }

    update2(songName, songPercent, artistList, isAnsweredArtist) {
      if (!document.getElementById("esaSongInfo")) this.setup();

      const songBox = document.getElementById("esaSongInfoSongNameBox");
      if (songBox) {
        songBox.innerHTML = "";
        songBox.appendChild(this.createMatchElement(songName, songPercent));
      }

      const artistBox = document.getElementById("esaSongInfoArtistsBox");
      if (artistBox) {
        artistBox.innerHTML = "";

        const renderGroup = (list, label) => {
          if (label) {
            const header = document.createElement("div");
            header.className = "esaSongInfoHeader";
            header.textContent = label;
            header.style.borderTop = "1px dashed #555";
            header.style.marginTop = "4px";
            header.style.paddingTop = "2px";
            artistBox.appendChild(header);
          }

          list.sort((a, b) => b.rating - a.rating);

          list.forEach((artist) => {
            let displayName =
              artist.replace(CORRECT_STR, "").replace(INCORRECT_STR, "") ||
              "???";
            artistBox.appendChild(
              this.createMatchElement(
                displayName,
                artist.includes(CORRECT_STR) || isAnsweredArtist ? 100 : 0
              )
            );
          });
        };

        renderGroup(artistList, null);
      }

      this.show();
    }

    update(songData, artistList1, artistList2) {
      if (!document.getElementById("esaSongInfo")) this.setup();

      const songBox = document.getElementById("esaSongInfoSongNameBox");
      if (songBox) {
        songBox.innerHTML = "";
        const name = songData.guessed
          ? songData.correctName
          : songData.userAnswer;
        const score = songData.guessed ? 100 : songData.rawScore || 0;
        songBox.appendChild(this.createMatchElement(name, score));
      }

      const artistBox = document.getElementById("esaSongInfoArtistsBox");
      if (artistBox) {
        artistBox.innerHTML = "";

        const renderGroup = (list, label) => {
          if (label) {
            const header = document.createElement("div");
            header.className = "esaSongInfoHeader";
            header.textContent = label;
            header.style.borderTop = "1px dashed #555";
            header.style.marginTop = "4px";
            header.style.paddingTop = "2px";
            artistBox.appendChild(header);
          }

          list.sort((a, b) => b.rating - a.rating);

          list.forEach((artist) => {
            let displayName = artist.name || "???";
            artistBox.appendChild(
              this.createMatchElement(displayName, artist.rating * 100)
            );
          });
        };

        if (artistList2 && artistList2.length > 0) {
          renderGroup(artistList1, null);
          renderGroup(artistList2, "Artist 2");
        } else {
          renderGroup(artistList1, null);
        }
      }

      this.show();
    }

    show() {
      const info = document.getElementById("esaSongInfo");
      if (info) info.style.display = "block";
    }

    reset() {
      if (this.container) {
        this.container.innerHTML = "?";
        this.container.style.display = "";
      }
    }
  }
})();
