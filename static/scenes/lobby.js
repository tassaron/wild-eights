import { WorldScene } from "./world.js";
import { Button } from "../button.js";

const SERVER = "";

export class LobbyScene {
    constructor(game, data) {
        this.drawn = false;
        this.backbutton = new BackButton((game.ctx.canvas.width / 2) - 128, (game.ctx.canvas.height / 2) + 128);
        if (data === null) {return}
        this.rid = data["rid"];
        this.rowid = data["rowid"];
        this.uid1 = data["uid1"];
        this.uid2 = data["uid2"];
        this.cards = data["cards"];
        this.pile = data["pile"];
        this.pickedUp = data["pickedUp"];
        this.pickedUpNum = data["pickedUpNum"];
        // odd turns determines who plays on turns 1, 3, 5, etc.
        // uid2 will be the first to enter WorldScene so they go first
        this.odd_turns = data["uid2"] === null ? false : true;
        this.loading = false;
    }

    update(ratio, keyboard, mouse) {
        if (this.uid2) {
            this.game.changeScene(new WorldScene(this.game, this.rowid, this.odd_turns, this.odd_turns ? this.uid2 : this.uid1, this.cards, this.pile, this.pickedUp, this.pickedUpNum));
        } else if (this.uid1 && this.game.timer[0] == 0.0 && !this.loading) {
            this.game.setTimer(600.0, this.syncWithServer, this);
            this.loading = true;
        }
        this.backbutton.update(ratio, keyboard, mouse, this.goBack, this);
    }

    draw(ctx, drawSprite) {
        if (this.drawn) {return}
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.clearRect(200, 200, 500, 500);
        ctx.fillStyle = "white";
        let text1, text2;
        if (!this.rid) {
            text1 = "Could not connect to server";
            text2 = "";
        } else {
            text1 = "Room Code:"
            text2 = `${this.rid[0]} ${this.rid[1]} ${this.rid[2]} ${this.rid[3]}`;
        }
        ctx.font = "28pt Sans";
        ctx.fillText(text1, ctx.canvas.width/2-(ctx.measureText(text1).width/2), (ctx.canvas.height/2) - 64);
        ctx.font = "48pt Sans";
        ctx.fillStyle = "black";
        ctx.fillText(text2, ctx.canvas.width/2-(ctx.measureText(text2).width/2) - 2, ctx.canvas.height/2);
        ctx.fillText(text2, ctx.canvas.width/2-(ctx.measureText(text2).width/2) + 2, ctx.canvas.height/2);
        ctx.fillText(text2, ctx.canvas.width/2-(ctx.measureText(text2).width/2), (ctx.canvas.height/2) - 2);
        ctx.fillText(text2, ctx.canvas.width/2-(ctx.measureText(text2).width/2), (ctx.canvas.height/2) + 2);
        ctx.font = "48pt Sans";
        ctx.fillStyle = "white";
        ctx.fillText(text2, ctx.canvas.width/2-(ctx.measureText(text2).width/2), ctx.canvas.height/2);
        this.backbutton.draw(ctx, drawSprite);
        this.drawn = true;
    }

    syncWithServer(self) {
        fetch(
            `${SERVER}/lobby`, {
                method: "POST",
                credentials: "same-origin",
                body: JSON.stringify({
                    "rid": self.rowid,
                    "uid": self.uid1,
                }),
                cache: "no-cache",
                headers: new Headers({
                    "content-type": "application/json"
                })
            }
        ).then(
            response => response.ok ? response.json() : null
        ).then(
            data => {
                if (data === null || data["joined"] === false) {self.loading = false; return}
                // uid2 has connected!!
                self.game.changeScene(new WorldScene(self.game, self.rowid, self.odd_turns, self.uid1, data["cards"], data["pile"], data["pickedUp"], data["pickedUpNum"], data["turn"], data["wildcardSuit"]));
            }
        ).catch(
            e => self.goBack(self)
        )
    }

    goBack(self) {
        self.game.changeScene(self.game.prevScene);
        self.game.ctx.clearRect(0, 0, 900, 900);
    }
}

class BackButton extends Button {
    constructor(x, y) {
        let outline = "black";
        let colour = "rgb(55, 95, 145)";
        super(x, y, 256, 48, "← Back", outline, colour);
    }
}