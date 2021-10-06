/* Primary game scene in which the game actually occurs!! */
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
        this.facedown = new Cardback(505, 305);
        this.cards = cards.map(card => new Card(card[0], card[1], 505, 305));
        pile = JSON.parse(pile);
        this.pile = [];
        for (let arr of pile) {
            this.pile.push(new Card(arr[0], arr[1], 405, 305));
        }
        this.underpile = [];
        this.adjustCardPos(this);
        if (!this.odd_turns) {
            if (this.pile.length > 1) {
                this.turnDisplay.text = "It's your turn already!";
                this.turn = 2;
            } else {
                this.turnDisplay.text = "waiting for the other player...";
            }
        }
    }

    update(ratio, keyboard, mouse) {
        if (this.isMyTurn()) {
            for (let i=0; i < this.cards.length; i++) {
                this.cards[i].update(ratio, keyboard, mouse, function(self) { self.playCard(self, self.cards[i]) }, this);
            }
        } else if (this.game.timer[0] == 0.0) {
            this.game.setTimer(600.0, this.syncWithServer, this);
        }
        for (let card of this.cards) {
            card.travel(ratio);
        }
        for (let card of this.pile) {
            card.travel(ratio);
        }
    }

    draw(ctx, drawSprite) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        this.turnDisplay.draw(ctx, drawSprite);
        this.facedown.draw(ctx, drawSprite);
        for (let card of this.cards) {
            card.draw(ctx, drawSprite);
        }
        for (let card of this.underpile) {
            card.draw(ctx, drawSprite);
        }
        for (let card of this.pile) {
            card.draw(ctx, drawSprite);
        }
    }

    playCard(self, card) {
        self.turn++;
        for (let pcard of self.pile) {
            self.underpile.push(pcard);
        }
        self.pile = [];
        // search for other cards of the same rank
        for (let othercard of self.cards) {
            if (othercard.rank === card.rank) {
                self.pile.push(othercard);
            }
        }
        for (let pcard of self.pile) {
            self.cards = self.cards.filter(othercard => othercard.rank != pcard.rank || othercard.suit != pcard.suit);            
        }
        self.cards = self.cards.filter(othercard => othercard.rank != card.rank || othercard.suit != card.suit);
        self.pile.push(card);
        self.adjustCardPos(self);
        self.endTurn(self);
    }

    adjustCardPos(self) {
        for (let i=0; i < self.cards.length; i++) {
            self.cards[i].x = 90 + (90*i);
            self.cards[i].y = (900 - 405) + (135 * Math.floor(i / 9));
        }
        for (let card of self.pile) {
            card.x = 405;
            card.y = 305;
        }
    }

    isMyTurn() {
        return ((this.odd_turns && this.turn % 2 != 0) || (!this.odd_turns && this.turn % 2 == 0))
    }

    endTurn(self) {
        self.turnDisplay.text = "sending cards";
        fetch(
            `${SERVER}/update`, {
			    method: "POST",
			    credentials: "same-origin",
 			    body: JSON.stringify({
                    "rid": self.rid,
                    "uid": self.uid,
                    "pile": JSON.stringify(piledump(self.pile))
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
                self.turnDisplay.text = "waiting for the other player...";
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
                    self.pile = [];
                    for (let arr of JSON.parse(data["pile"])) {
                        self.pile.push(new Card(arr[0], arr[1], 405, 305));
                    }
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

function piledump(pile) {
    let arr = [];
    for (let card of pile) {
        arr.push([card.suit, card.rank]);
    }
    return arr
}