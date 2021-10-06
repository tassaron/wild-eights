"use strict"
import { addEventListeners, keyboard, mouse } from "./ui.js";
import { Game } from "./game.js";
/*
*  Create the canvas
*/
const gamediv = document.getElementById("game");
const canvas = document.createElement("canvas");
gamediv.setAttribute("style", "background: url('/static/assets/wood.png')");
gamediv.appendChild(canvas);
canvas.width = gamediv.offsetWidth; canvas.height = gamediv.offsetHeight;
const ctx = canvas.getContext("2d");
let game;

/*
*  Preload assets
*/
ctx.fillStyle = "#000";
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.font = "48pt Sans";
ctx.fillStyle = "#fff";
ctx.fillText("loading", (canvas.width / 2) - (ctx.measureText("loading").width / 2), (canvas.height / 2) - (canvas.height / 6));
let preloaded = 0;

let sprites = {
    "cards": new Image()
}

const drawSprite = {
    // 0: spades, 1: hearts, 2: diamonds, 3: clubs
    card: function(s, r, x, y) {
        ctx.drawImage(sprites.cards, (90 * (13 - r)) + ( (13*90)* s), 0, 90, 135, x, y, 90, 135);
    },
    cardback: function(x, y) {
        ctx.drawImage(sprites.cards, (13*90)*4, 0, 90, 135, x, y, 90, 135);
    },
    ocard: function(x, y) {
        ctx.save()
        ctx.translate(x+90,y);
        ctx.scale(-1, -1);
        this.cardback(0, 0);
        ctx.restore();
    }
};

function preload_success() {
    preloaded += 1;
    if (preloaded == Object.keys(sprites).length) {
        addEventListeners(canvas);
        game = new Game(ctx);
        loop();
    }
}

sprites.cards.addEventListener("load", preload_success)
sprites.cards.src = "static/assets/cards.png";

/*
function pauseGame() {
    if (!game.game_over) {
        game.paused = !game.paused;
    }
}*/

function loop() {
    game.update(keyboard, mouse);
    game.draw(ctx, drawSprite);
    requestAnimationFrame(loop);
}
//document.getElementById("pause_button").addEventListener('click', pauseGame, false);