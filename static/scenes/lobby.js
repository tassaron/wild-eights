import { WorldScene } from "./world.js";

const SERVER = "";

export class LobbyScene {
    constructor(data) {
        this.drawn = false;
        if (data === null) {return}
        this.rid = data["rid"];
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
            this.game.changeScene(new WorldScene(this.game, this.rid, this.odd_turns, this.odd_turns ? this.uid2 : this.uid1, this.cards, this.pile, this.pickedUp, this.pickedUpNum));
        } else if (this.game.timer[0] == 0.0 && !this.loading) {
            this.game.setTimer(600.0, this.syncWithServer, this);
            this.loading = true;
        }
    }

    draw(ctx, drawSprite) {
        if (this.drawn) {return}
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "28pt Sans";
        let text;
        if (!this.rid) {
            text = "Could not connect to server"
        } else {
            text = `Room Code: ${this.rid}`;
        }
        ctx.fillText(text, ctx.canvas.width/2-(ctx.measureText(text).width/2), ctx.canvas.height/2);
        this.drawn = true;
    }

    syncWithServer(self) {
        fetch(
            `${SERVER}/lobby`, {
                method: "POST",
                credentials: "same-origin",
                body: JSON.stringify({
                    "rid": self.rid,
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
                if (data === null || data["uid"] === null) {self.loading = false; return}
                // uid2 has connected!!
                self.game.changeScene(new WorldScene(self.game, self.rid, self.odd_turns, self.uid1, data["cards"], data["pile"], data["pickedUp"], data["pickedUpNum"], data["turn"], data["wildcardSuit"]));
            }
        )
    }
}