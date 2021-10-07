/* Primary game scene in which the game actually occurs!! */
import { Thing } from "../thing.js";
import { Card, Cardback, OCard } from "../card.js";

const SERVER = "";

export class WorldScene {
    constructor(game, rid, odd_turns, uid, cards, pile, pickedUp) {
        this.loading = false;
        this.turnDisplay = new TurnDisplay(game.ctx.canvas.width - 100, game.ctx.canvas.height - 100);
        this.odd_turns = odd_turns;
        this.uid = uid;
        this.rid = rid;
        this.turn = 1;
        this.facedown = new Cardback(605, 305);
        this.cards = cards.map(card => new Card(card[0], card[1], 605, 305));
        pile = JSON.parse(pile);
        this.ocards = [];
        for (let i = 0; i < 8 - (pile.length-1); i++) {
            this.ocards.push(new OCard(605, 305 + 135));
        }
        if (pickedUp == 1) {this.ocards.push(new OCard(605, 305 + 135))}
        this.pile = [];
        for (let arr of pile) {
            this.pile.push(new Card(arr[0], arr[1], 305, 305));
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
        this.hasPickedUp = false;
        this.skippedTurn = false;
    }

    update(ratio, keyboard, mouse) {
        if (this.isMyTurn()) {
            let option = false;
            for (let i=0; i < this.cards.length; i++) {
                if (this.legalMove(this.cards[i])) {
                    option = true;
                    this.cards[i].update(ratio, keyboard, mouse, function(self) { self.playCard(self, self.cards[i]) }, this);
                }
            }
            if (!this.hasPickedUp) {
                this.facedown.update(ratio, keyboard, mouse, this.pickupCard, this);
            }
            if (!option && this.hasPickedUp) {
                this.turnDisplay.text = "You're forced to pass!";
                this.emptyPile(this);
                this.endTurn(this);
                this.turn++;
            }
        } else if (this.game.timer[0] == 0.0 && this.loading == false) {
            this.loading = true;
            this.game.setTimer(600.0, this.syncWithServer, this);
        }
        for (let card of this.cards) {
            card.travel(ratio);
        }
        for (let card of this.ocards) {
            card.travel(ratio);
        }
        for (let card of this.pile) {
            card.travel(ratio);
        }
        if (this.underpile.length < 5) {
            for (let card of this.underpile) {
                card.travel(ratio);
            }
        } else {
            for (let i = this.underpile.length - 5; i < this.underpile.length; i++) {
                this.underpile[i].travel(ratio);
            }
        }
    }

    draw(ctx, drawSprite) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        this.turnDisplay.draw(ctx, drawSprite);
        this.facedown.draw(ctx, drawSprite);
        for (let card of this.cards) {
            card.draw(ctx, drawSprite);
        }
        for (let card of this.ocards) {
            card.draw(ctx, drawSprite);
        }
        for (let card of this.underpile) {
            card.draw(ctx, drawSprite);
        }
        for (let card of this.pile) {
            card.draw(ctx, drawSprite);
        }
    }

    pickupCard(self) {
        self.turnDisplay.text = "asking server for a card...";
        fetch(
            `${SERVER}/newcard`, {
			    method: "POST",
			    credentials: "same-origin",
 			    body: JSON.stringify({
                    "rid": self.rid,
                    "uid": self.uid,
                    "number": 1
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
                self.turnDisplay.text = "Still your turn!";
                self.cards.push(new Card(data["cards"][0][0], data["cards"][0][1], 605, 305));
                self.hasPickedUp = true;
                self.adjustCardPos(self);
            }
        )
    }

    pickupCards(self, number, turn) {
        self.turnDisplay.text = `You have to pick up ${number}`;
        fetch(
            `${SERVER}/newcard`, {
			    method: "POST",
			    credentials: "same-origin",
 			    body: JSON.stringify({
                    "rid": self.rid,
                    "uid": self.uid,
                    "number": number
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
                for (let card of data["cards"]) {
                    self.cards.push(new Card(card[0], card[1], 605, 305));
                }
                self.adjustCardPos(self);
                self.turn = turn;
                self.loading = false;
                self.turnDisplay.text = "It's your turn!";
            }
        )
    }

    playCard(self, card) {
        if (!self.skippedTurn) {
            // Don't empty the pile if a Jack was played last time
            self.emptyPile(self);
        }
        self.pile.push(card);
        // search for other cards of the same rank
        for (let othercard of self.cards) {
            if (othercard.rank === card.rank && othercard.suit != card.suit) {
                self.pile.push(othercard);
            }
        }
        for (let pcard of self.pile) {
            self.cards = self.cards.filter(othercard => othercard.rank != pcard.rank || othercard.suit != pcard.suit);            
        }
        let twosInPile = countTwos(self.pile) * 2;
        for (let i = 0; i < twosInPile; i++) {
            self.ocards.push(new OCard(605, 305 + 135));
        }
        self.adjustCardPos(self);
        if (card.rank == 11) {
            self.skippedTurn = true;
            self.turnDisplay.text = "Play again!";
            return
        }
        self.skippedTurn = false;
        self.turn++;
        self.turnDisplay.text = "sending cards";
        self.endTurn(self);
    }

    emptyPile(self) {
        for (let pcard of self.pile) {
            self.underpile.push(pcard);
        }
        self.pile = [];
    }

    adjustCardPos(self) {
        for (let i=0; i < self.cards.length; i++) {
            self.cards[i].x = 90 + (90 * i) - 720 * (Math.floor(i / 8));
            self.cards[i].y = (900 - 305) + (105 * Math.floor(i / 8));
        }
        for (let i=0; i < self.ocards.length; i++) {
            self.ocards[i].x = 90 + (90 * i) - 720 * (Math.floor(i / 8));
            self.ocards[i].y = 135 + (65 * Math.floor(i / 8));
        }
        for (let card of self.pile) {
            card.x = 305;
            card.y = 305;
        }
    }

    isMyTurn(turn) {
        if (turn === undefined) {
            turn = this.turn;
        }
        return ((this.odd_turns && turn % 2 != 0) || (!this.odd_turns && turn % 2 == 0))
    }

    endTurn(self) {
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
                if (data === null) {
                    self.turnDisplay.text - "Error contacting server";
                    self.loading = false;
                    return
                }
                let new_pile = JSON.parse(data["pile"]);
                let turn = data["turn"];
                if (self.isMyTurn(turn)) {
                    if (data["pickedUp"]) {
                        self.ocards.push(new OCard(605, 305 + 135));
                        self.adjustCardPos(self);
                        self.game.setTimer(120.0, function(self) {self.startNextTurn(self, turn, new_pile)}, self);
                        return
                    }
                    self.startNextTurn(self, turn, new_pile);
                } else {
                    self.loading = false;
                }
            }
        )
    }

    startNextTurn(self, turn, new_pile) {
        /* Happens at the very end of an opponent's turn, starting the next turn */
        if (turn == self.turn) {
            console.log("bingo")
            return
        }
        self.hasPickedUp = false;
        self.emptyPile(self);
        let played_cards = self.ocards.splice((self.ocards.length) - new_pile.length, new_pile.length);
        for (let i=0; i < new_pile.length; i++) {
            self.pile.push(new Card(new_pile[i][0], new_pile[i][1], played_cards[i].x, played_cards[i].y - 135));
        }
        self.adjustCardPos(self)
        let twosInPile = countTwos(self.pile);
        if (twosInPile) {
            self.pickupCards(self, twosInPile*2, turn);
            return
        }
        self.turnDisplay.text = "It's your turn!";
        self.turn = turn;
        self.loading = false;
    }

    legalMove(card) {
        let pile;
        if (this.pile.length > 0) {
            pile = this.pile[this.pile.length - 1];
        } else {
            pile = this.underpile[this.underpile.length - 1];
        }
        return (card.rank == 8) || (card.rank == pile.rank) || (card.suit == pile.suit)
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

function countTwos(pile) {
    if (pile.length > 0 && pile[0].rank == 2) {return pile.length}
    return 0
}