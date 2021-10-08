import { LobbyScene } from "./lobby.js";
import { Button } from "../button.js";
import { Thing } from "../thing.js";

const SERVER = "";
const gamediv = document.getElementById("game");

export class MenuScene {
    constructor(game) {
        this.game = game;
        this.newbutton = new NewGameButton(game, game.ctx.canvas.width / 2 - 128, game.ctx.canvas.height / 2 - 64);
        this.joinbutton = new JoinGameButton(game, game.ctx.canvas.width / 2 - 128, game.ctx.canvas.height / 2);
        this.inputbox = null;
        this.inputlabel = null;
        this.loading = false;
        this.decorations = [
            new DecorativeCard(0, 205, 205),
            new DecorativeCard(1, 705, 205),
            new DecorativeCard(2, 205, 705),
            new DecorativeCard(3, 705, 705)
        ]
        game.ctx.clearRect(0, 0, game.ctx.canvas.width, game.ctx.canvas.height);
    }

    update(ratio, keyboard, mouse) {
        this.newbutton.update(ratio, keyboard, mouse, this.requestNewRoom, this);
        this.joinbutton.update(ratio, keyboard, mouse, this.inputbox ? this.submitJoinRequest : this.requestJoinRoom, this);
        if (keyboard.enter && this.inputbox !== null) {
            this.submitJoinRequest(this);
        }
        for (let decor of this.decorations) {
            decor.update(ratio, keyboard, mouse);
            for (let otherdecor of this.decorations) {
                if (otherdecor.x == decor.x) {continue}
                if (Thing.prototype.collides.call(decor, otherdecor)) {
                    if (Math.abs(decor.x - otherdecor.x) > Math.abs(decor.y - otherdecor.y)) {
                        decor.dx = decor.x - otherdecor.x < 0 ? -2 : 2;
                    } else {
                        decor.dy = decor.y - otherdecor.y < 0 ? -2 : 2;
                    }
                }
            }
        }
    }

    draw(ctx, drawSprite) {
        for (let decor of this.decorations) {
            decor.draw(ctx, drawSprite);
        }
        let text = "Wild Eights";
        ctx.font = "48pt sans";
        ctx.fillStyle = "black";
        ctx.fillRect(this.newbutton.x + (this.newbutton.width/2) - (ctx.measureText(text).width/2) - 4, this.newbutton.y - 96, ctx.measureText(text).width + 8, 78);
        ctx.fillStyle = "white";
        ctx.fillRect(this.newbutton.x + (this.newbutton.width/2) - (ctx.measureText(text).width/2) - 2, this.newbutton.y - 94, ctx.measureText(text).width + 4, 74);
        ctx.fillStyle = "black";
        ctx.fillText(text, this.newbutton.x + (this.newbutton.width/2) - (ctx.measureText(text).width/2), this.newbutton.y - 38);
        this.newbutton.draw(ctx, drawSprite);
        this.joinbutton.draw(ctx, drawSprite);
    }

    requestNewRoom(self) {
        if (self.loading) {return}
        self.loading = true;
        if (self.inputbox !== null) {
            gamediv.removeChild(self.inputbox);
            gamediv.removeChild(self.inputlabel);
        }
        fetch(
            `${SERVER}/newroom`
        ).then(
            response => response.ok ? response.json() : null
        ).then(
            data => self.game.changeScene(new LobbyScene(data))
        )
    }

    requestJoinRoom(self) {
        self.joinbutton.text = "Submit"
        self.inputbox = document.createElement("input");
        self.inputbox.setAttribute("type", "text");
        self.inputbox.setAttribute("id", "field");
        self.inputbox.setAttribute(
            "style",
            "position: absolute; bottom: 286px; left: 324px; width: 256px; height: 48px; box-sizing: border-box; text-transform: uppercase; text-align: center;" 
        )
        self.inputlabel = document.createElement("label");
        self.inputlabel.setAttribute("for", "field");
        self.inputlabel.innerHTML = "ENTER ROOM CODE"
        self.inputlabel.setAttribute(
            "style",
            "color:black; font-size: 14pt; position: absolute; bottom: 350px; left: 370px;" 
        )
        gamediv.appendChild(self.inputbox);
        gamediv.appendChild(self.inputlabel);
    }

    submitJoinRequest(self) {
        if (self.loading || self.inputbox.value.length < 4) {return}
        self.loading = true;
        fetch(
            `${SERVER}/joinroom`, {
			    method: "POST",
			    credentials: "same-origin",
			    body: JSON.stringify(self.inputbox.value),
			    cache: "no-cache",
			    headers: new Headers({
				    "content-type": "application/json"
			    })
            }
        ).then(
            response => response.ok ? response.json() : null
        ).then(
            data => {
                gamediv.removeChild(self.inputbox);
                gamediv.removeChild(self.inputlabel);
                self.game.changeScene(new LobbyScene(data))}
        )
    }
}

class NewGameButton extends Button {
    constructor(game, x, y) {
        let outline = "rgba(0, 0, 0, 1.0)";
        let colour = "rgba(55, 145, 95, 1.0)";
        super(x, y, 256, 48, "New Game", outline, colour);
        this.game = game;
    }
}

class JoinGameButton extends Button {
    constructor(game, x, y) {
        let outline = "rgba(0, 0, 0, 1.0)";
        let colour = "rgba(55, 95, 145, 1.0)";
        super(x, y, 256, 48, "Join Game", outline, colour);
        this.game = game;
    }
}

class DecorativeCard {
    constructor(s, x, y) {
        this.x = x;
        this.y = y;
        this.width = 90;
        this.height = 135;
        this.suit = s;
        this.dx = Math.random() > 0.5 ? -2 : 2;
        this.dy = Math.random() > 0.5 ? -2 : 2;
    }

    update(ratio, keyboard, mouse) {
        if (this.x > 900) {
            this.dx = -2;
        } else if (this.x < 0) {
            this.dx = 2;
        }
        if (this.y > 900) {
            this.dy = -2;
        } else if (this.y < 0) {
            this.dy = 2;
        }
        this.y += ratio * this.dy;
        this.x += ratio * this.dx;
    }

    draw(ctx, drawSprite) {
        drawSprite.card(this.suit, 8, this.x, this.y);
    }
}