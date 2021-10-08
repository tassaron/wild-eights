import { LobbyScene } from "./lobby.js";
import { Button } from "../button.js";

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
    }

    update(ratio, keyboard, mouse) {
        this.newbutton.update(ratio, keyboard, mouse, this.requestNewRoom, this);
        this.joinbutton.update(ratio, keyboard, mouse, this.inputbox ? this.submitJoinRequest : this.requestJoinRoom, this);
        if (keyboard.enter && this.inputbox !== null) {
            this.submitJoinRequest(this);
        }
    }

    draw(ctx, drawSprite) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = "black";
        ctx.font = "36pt sans";
        let text = "Wild Eights";
        ctx.fillText(text, this.newbutton.x + (this.newbutton.width/2) - (ctx.measureText(text).width/2), this.newbutton.y - 28);
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