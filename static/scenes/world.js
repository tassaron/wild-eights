import { Button } from "../button.js";
import { AnimatedThing } from "../thing.js";

const SERVER = "";

export class WorldScene {
    constructor(game, rid, odd_turns, uid) {
        this.turnButton = new EndTurnButton(game, game.ctx.canvas.width - 100, game.ctx.canvas.height - 100);
        this.explosion = new Boom(300, 100);
        this.odd_turns = odd_turns;
        this.uid = uid;
        this.rid = rid;
        this.turn = 1;
        this.loading = false;
        if (!this.odd_turns) {this.turnButton.text = "..."}
    }

    update(ratio, keyboard, mouse) {
        this.explosion.update(ratio, keyboard, mouse);
        if (this.isMyTurn()) {
            this.turnButton.update(ratio, keyboard, mouse, this.endTurn, this);
        } else if (this.game.timer[0] == 0.0) {
            this.game.setTimer(600.0, this.syncWithServer, this);
        }
    }

    draw(ctx, drawSprite) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        this.explosion.draw(ctx, drawSprite);
        this.turnButton.draw(ctx, drawSprite);
    }

    isMyTurn() {
        return ((this.odd_turns && this.turn % 2 != 0) || (!this.odd_turns && this.turn % 2 == 0))
    }

    endTurn(self) {
        self.turnButton.text = "...";
        fetch(
            `${SERVER}/update`, {
			    method: "POST",
			    credentials: "same-origin",
 			    body: JSON.stringify({
                    "rid": self.rid,
                    "uid": self.uid,
                    "gamestate": {
                        "explosion": self.explosion.x
                    }
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
                self.turn++;
                self.game.setTimer(600.0, self.syncWithServer, self);
            }
        )
    }

    syncWithServer(self) {
        fetch(
            `${SERVER}/refresh`, {
			    method: "POST",
			    credentials: "same-origin",
 			    body: JSON.stringify({
                    "rid": self.rid,
                    "uid": self.uid
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
                if (data === null) {return}
                self.turn = data["turn"];
                if (self.isMyTurn()) {
                    self.turnButton.text = "End Turn";
                    self.explosion.x = data["gamestate"]["explosion"];
                }
            }
        )
    }
}

class Boom extends AnimatedThing {
    constructor(x, y) {
        super(x, y, 32, 32, 'explosion', 6, 4);
    }

    update(ratio, keyboard, mouse) {
        super.update(ratio, keyboard, mouse);
        if (mouse.leftClick && this.collides(mouse)) {
            this.x += 10;
        }
    }
}


class EndTurnButton extends Button {
    constructor(game, x, y) {
        let outline = "rgba(0, 0, 0, 1.0)";
        let colour = "rgba(0, 88, 88, 1.0)";
        super(x, y, 100, 100, "End Turn", outline, colour);
        this.game = game;
    }
}