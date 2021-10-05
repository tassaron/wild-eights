import { Thing } from "../thing.js";
import { Card, Cardback } from "../card.js";

const SERVER = "";

export class WorldScene {
    constructor(game, rid, odd_turns, uid, cards, pile) {
        this.turnDisplay = new TurnDisplay(game.ctx.canvas.width - 100, game.ctx.canvas.height - 100);
        this.odd_turns = odd_turns;
        this.uid = uid;
        this.rid = rid;
        this.turn = 1;
        this.cards = cards;
        this.cardThings = this.cards.map(card => new Card(card[0], card[1], 0, 0));
        this.pile = [pile, new Card(pile[0], pile[1], 405, 305)];
        this.underpile = [];
        this.adjustCardPos();
        if (!this.odd_turns) {this.turnDisplay.text = "waiting for the other player...";}
    }

    update(ratio, keyboard, mouse) {
        if (this.isMyTurn()) {
            //this.turnDisplay.update(ratio, keyboard, mouse, this.endTurn, this);
            for (let card of this.cardThings) {
                card.update(ratio, keyboard, mouse, function(self) { self.playCard(self, card) }, this);
            }
        } else if (this.game.timer[0] == 0.0) {
            this.game.setTimer(600.0, this.syncWithServer, this);
        }
    }

    draw(ctx, drawSprite) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        this.turnDisplay.draw(ctx, drawSprite);
        for (let card of this.cardThings) {
            card.draw(ctx, drawSprite);
        }
        for (let card of this.underpile) {
            card.draw(ctx, drawSprite);
        }
        this.pile[1].draw(ctx, drawSprite);
    }

    playCard(self, card) {
        console.log(self);
        console.log(card)
    }

    adjustCardPos() {
        for (let i=0; i < this.cardThings.length; i++) {
            this.cardThings[i].x = 90 + (90*i);
            this.cardThings[i].y = (900 - 405) + (135 * Math.floor(i / 9));
        }
    }

    isMyTurn() {
        return ((this.odd_turns && this.turn % 2 != 0) || (!this.odd_turns && this.turn % 2 == 0))
    }

    endTurn(self) {
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
                    self.turnDisplay.text = "It's your turn!";
                    self.explosion.x = data["gamestate"]["explosion"];
                }
            }
        )
    }
}

class TurnDisplay extends Thing {
    constructor(x, y) {
        super(x, y, 0, 0);
        this.text = "You play first!";
    }

    draw(ctx, drawSprite) {
        let width = ctx.measureText(this.text).width;
        ctx.fillStyle = "black";
        ctx.fillRect((this.x - width) - 8, this.y - 24, width + 16, 32);
        ctx.fillStyle = "white";
        ctx.fillRect((this.x - width) - 6, this.y - 22, width + 12, 28);
        ctx.fillStyle = "black";
        ctx.font = "16pt Sans";
        ctx.fillText(this.text, this.x - width, this.y);
    }
}