"use strict"
import { addEventListeners, keyboard, mouse } from "./ui.js";
import { Game } from "./game.js";
/*
*  Create the canvas
*/
const gamediv = document.getElementById("game");
const canvas = document.createElement("canvas");
gamediv.setAttribute("style", "background: url('/static/assets/wood.png'); width: 900px; height: 900px; margin: auto; border: 2px solid black;");
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
    "cards": new Image(),
    "suits": new Image(),
    "help": new Image()
}

const drawSprite = {
    // 0: spades, 1: hearts, 2: diamonds, 3: clubs
    card: function(s, r, x, y, scale=1) {
        ctx.drawImage(sprites.cards, (90 * (13 - r)) + ( (13*90)* s), 0, 90, 135, x, y, 90*scale, 135*scale);
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
    },
    suit: function(s, x, y) {
        ctx.beginPath();
        ctx.arc(x + 27, y + 27, 56, 0, Math.PI * 2);
        ctx.fillStyle = "black";
        ctx.fill();
        ctx.closePath();
        ctx.beginPath();
        ctx.arc(x + 27, y + 27, 52, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.closePath();
        ctx.drawImage(sprites.suits, (54 * s)-1, 0, 54, 54, x, y, 54, 54);
    },
    help: function(i, x, y) {
        let yc;
        switch(i) {
            case 0:
                yc = 0;
                break;
            case 1:
                yc = 81;
                break;
            case 2:
                yc = 162;
                break;
            case 3:
                yc = 243;
        }
        ctx.drawImage(sprites.help, 0, yc, 552, 80, x, y, 552, 81)
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

//const PREFIX = "/static/client/rainey_arcade/js/wild-eights/assets/"
const PREFIX = "/static/assets/"
sprites.cards.addEventListener("load", preload_success)
sprites.cards.src = PREFIX + "cards.png";
sprites.suits.addEventListener("load", preload_success)
sprites.suits.src = PREFIX + "suits.png";
sprites.help.addEventListener("load", preload_success)
sprites.help.src = PREFIX + "help.png";

function loop() {
    game.update(keyboard, mouse);
    game.draw(ctx, drawSprite);
    requestAnimationFrame(loop);
}