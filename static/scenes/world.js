/* Primary game scene in which the game actually occurs!! */
import { SpriteThing } from "../thing.js";
import { Card, Cardback, OCard } from "../card.js";
import { WildcardScene } from "./wildcard.js";
import { GameOverScene } from "./gameover.js";

const SERVER = "";

export class WorldScene {
    constructor(game, rid, odd_turns, uid, cards, pile, pickedUp, pickedUpNum, turn=1, wildcardSuit=null) {
        this.loading = false;
        this.turnDisplay = new TurnDisplay(game, game.ctx.canvas.width - 100, game.ctx.canvas.height - 100);
        this.odd_turns = odd_turns;
        this.uid = uid;
        this.rid = rid;
        this.turn = turn;
        this.facedown = new Cardback(600, 300);
        this.cards = cards.map(card => new Card(card[0], card[1], 600, 300));
        pile = JSON.parse(pile);
        this.ocards = [];
        let numOcards = 8 - (turn == 1 ? 0 : pile.length);
        for (let i = 0; i < numOcards; i++) {
            this.ocards.push(new OCard(600, 300 + 135));
        }
        if (pickedUp) {
            this.facedown.quantity -= pickedUpNum;
            for (let i = 0; i < pickedUpNum; i++) {
                this.ocards.push(new OCard(600, 300 + 135))
            }
        }
        this.pile = [];
        for (let arr of pile) {
            this.pile.push(new Card(arr[0], arr[1], pilePos(), pilePos()));
        }
        this.underpile = [];
        this.adjustCardPos(this);
        if (!this.odd_turns) {
            if (turn == 2) {
                this.turnDisplay.text = "It's your turn already!";
            } else {
                this.turnDisplay.text = "waiting for the other player...";
            }
        }
        this.hasPickedUp = false;
        this.skippedTurn = false;
        if (this.pile.length > 0) {this.pile[this.pile.length-1].wildcardSuit = wildcardSuit}
        if (turn == 1 && this.odd_turns || turn == 2) {
            let twosInPile = countTwos(this.pile);
            if (twosInPile) {this.pickupCards(this, twosInPile*2, turn)}
            if (queenOfSpades(this.pile)) {this.pickupCards(this, 5, turn)}
        }
    }

    update(ratio, keyboard, mouse) {
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
        if (this.game.game_over) {return}

        if (this.facedown.quantity < 1) {
            this.facedown.quantity = this.facedown.offset
            this.underpile = this.pile.length > 0 ? [] : [this.underpile[this.underpile.length-1]];
        }

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
                if (!this.skippedTurn) {this.emptyPile(this)}
                this.endTurn(this);
                this.turn++;
            }
        } else if (this.game.timer[0] == 0.0 && this.loading == false) {
            this.loading = true;
            this.game.setTimer(600.0, this.syncWithServer, this);
        }
    }

    draw(ctx, drawSprite) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
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
        this.turnDisplay.draw(ctx, drawSprite);
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
                if (data === null) {
                    self.turnDisplay.text = "Error contacting server. Retrying...";
                    self.loading = false;
                    return
                }
                self.turnDisplay.text = "Still your turn!";
                self.facedown.quantity -= 1;
                self.cards.push(new Card(data["cards"][0][0], data["cards"][0][1], 600, 300));
                self.hasPickedUp = true;
                self.adjustCardPos(self);
            }
        ).catch(
            function(e) {
                self.turnDisplay.text = `${e.message} Retrying...`
                self.loading = false;
            }
        )
    }

    pickupCards(self, number, turn) {
        self.turnDisplay.text = `asking server for ${number} cards...`;
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
                if (data === null) {
                    self.turnDisplay.text = "Error contacting server. Retrying...";
                    self.loading = false;
                    return
                }
                self.facedown.quantity -= number;
                for (let card of data["cards"]) {
                    self.cards.push(new Card(card[0], card[1], 600, 300));
                }
                self.adjustCardPos(self);
                self.turn = turn;
                self.loading = false;
                self.turnDisplay.text = `Picked up ${number} cards. Your turn!`;
            }
        ).catch(
            function(e) {
                self.turnDisplay.text = `${e.message} Retrying...`
                self.loading = false;
            }
        )
    }

    playCard(self, card) {
        if (card.rank == 8 && card.wildcardSuit === null) {
            self.game.changeScene(new WildcardScene(card));
            return
        }
        if (!self.skippedTurn) {
            // Don't empty the pile if a Jack (skip turn) was played last time
            if (self.pile.length != 0) {
                self.pile[self.pile.length-1].wildcardSuit = null;
            } else if (self.underpile.length > 0) {
                self.underpile[self.underpile.length-1].wildcardSuit = null;
            }
            self.emptyPile(self);
        }
        if (card.wildcardSuit === null) {
            // chosen card goes at the bottom if not a wildcard
            self.pile.push(card);
        }
        // search for other cards of the same _suit (real suit, not chosen suit)
        for (let othercard of self.cards) {
            if (othercard.rank === card.rank && othercard._suit != card._suit) {
                self.pile.push(othercard);
            }
        }
        if (card.wildcardSuit != null) {
            // chosen card goes at the top if it's a wildcard
            self.pile.push(card);
        }
        for (let pcard of self.pile) {
            self.cards = self.cards.filter(othercard => othercard.rank != pcard.rank || othercard._suit != pcard._suit);            
        }
        let twosInPile = countTwos(self.pile) * 2;
        self.facedown.quantity -= twosInPile;
        for (let i = 0; i < twosInPile; i++) {
            self.ocards.push(new OCard(600, 300 + 135));
        }
        if (queenOfSpades(self.pile)) {
            self.facedown.quantity -= 5;
            for (let i = 0; i < 5; i++) {
                self.ocards.push(new OCard(600, 300 + 135));
            }
        }
        self.adjustCardPos(self);
        if (card.rank == 11) {
            self.skippedTurn = true;
            self.hasPickedUp = false;
            self.turnDisplay.text = "Play again!";
            return
        }
        self.skippedTurn = false;
        self.turn++;
        self.turnDisplay.text = "sending cards...";
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
        for (let card of self.pile.filter(c => c.x < 285 || c.x > 305 || c.y < 285 || c.y > 305)) {
            card.x = pilePos();
            card.y = pilePos();
        }
    }

    isMyTurn(turn) {
        if (turn === undefined) {
            turn = this.turn;
        }
        return ((this.odd_turns && turn % 2 != 0) || (!this.odd_turns && turn % 2 == 0))
    }

    endTurn(self) {
        let request = {
            "rid": self.rid,
            "uid": self.uid,
            "pile": JSON.stringify(piledump(self.pile)),
            "wildcardSuit": null
        }
        if (self.pile.length > 0 && self.pile[self.pile.length-1].rank == 8) {
            request.wildcardSuit = self.pile[self.pile.length-1].wildcardSuit;
        }
        fetch(
            `${SERVER}/update`, {
                method: "POST",
                credentials: "same-origin",
                body: JSON.stringify(request),
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
                    self.turnDisplay.text = "Error contacting server. Retrying...";
                    self.loading = false;
                    return
                }
                for (let i = 1; i < self.pile.length-1; i++) {
                    self.underpile[self.underpile.length-i].wildcardSuit = null;
                }
                if (self.cards.length == 0) {
                    self.game.changeScene(new GameOverScene(self.game, true));
                    self.turnDisplay.text = ":D";
                    return
                }
                self.turnDisplay.text = "waiting for the other player...";
                self.game.setTimer(1000.0, self.syncWithServer, self);
            }
        ).catch(
            function(e) {
                self.turnDisplay.text = `${e.message} Retrying...`
                self.loading = false;
            }
        )
    }

    syncWithServer(self) {
        self.turnDisplay.text = "contacting server...";
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
                    self.turnDisplay.text = "Error contacting server. Retrying...";
                    self.loading = false;
                    return
                }
                let new_pile = JSON.parse(data["pile"]);
                let turn = data["turn"];
                if (self.isMyTurn(turn) && self.turn != turn) {
                    if (data["pickedUp"]) {
                        self.facedown.quantity -= data["pickedUpNum"];
                        for (let i = 0; i < data["pickedUpNum"]; i++) {
                            self.ocards.push(new OCard(600, 300 + 135))
                        }
                        self.adjustCardPos(self);
                        self.game.setTimer(120.0, function(self) {self.startNextTurn(self, turn, new_pile, data["wildcardSuit"])}, self);
                        return
                    }
                    self.startNextTurn(self, turn, new_pile, data["wildcardSuit"]);
                } else {
                    self.turnDisplay.text = "waiting for the other player...";
                    self.loading = false;
                }
            }
        ).catch(
            function(e) {
                self.turnDisplay.text = `${e.message} Retrying...`
                self.loading = false;
            }
        )
    }

    startNextTurn(self, turn, new_pile, wildcardSuit) {
        /* Happens at the very end of an opponent's turn, starting the next turn */
        if (turn == self.turn) {
            // timing glitch to be ignored
            return
        }
        self.hasPickedUp = false;
        self.emptyPile(self);
        let played_cards = self.ocards.splice((self.ocards.length) - new_pile.length, new_pile.length);
        for (let i=0; i < new_pile.length; i++) {
            self.pile.push(new Card(new_pile[i][0], new_pile[i][1], played_cards[i].x, played_cards[i].y - 135));
            let ucard = self.underpile[self.underpile.length-(1+i)];
            if (ucard) {ucard.wildcardSuit = null;}
        }
        if (wildcardSuit != null) {
            self.pile[self.pile.length-1].wildcardSuit = wildcardSuit;
        }
        self.adjustCardPos(self)
        if (self.ocards.length == 0) {
            self.game.changeScene(new GameOverScene(self.game, false));
            self.turnDisplay.text = ":(";
            return
        }
        let twosInPile = countTwos(self.pile);
        if (twosInPile) {
            self.pickupCards(self, twosInPile*2, turn);
            return
        }
        if (queenOfSpades(self.pile)) {
            self.pickupCards(self, 5, turn)
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

class TurnDisplay extends SpriteThing {
    constructor(game, x, y) {
        super(x, y, 0, 0);
        this.text = "You play first!";
        this.game = game;
    }

    draw(ctx, drawSprite) {
        let width = ctx.measureText(this.text).width;
        ctx.fillStyle = "black";
        ctx.fillRect((this.x - width) - 8, this.y - 24, width + 16, 32);
        ctx.fillStyle = "white";
        ctx.fillRect((this.x - width) - 6, this.y - 22, width + 12, 28);
        ctx.fillStyle = `rgba(135, 206, 250, ${this.game.timer[0] <= 0.0 ? 0.0 : Math.min(1.0, 1.0 - (this.game.timer[0] / 600.0)) * 1.0})`;
        ctx.fillRect((this.x - width) - 6, this.y - 22, this.game.timer[0] <= 0.0 ? 0 : Math.floor(Math.min(1.0, (this.game.timer[0] / 600.0)) * (width + 12)), 28);
        ctx.fillStyle = "black";
        ctx.font = "16pt Sans";
        ctx.fillText(this.text, this.x - width, this.y);
    }
}

function piledump(pile) {
    let arr = [];
    for (let card of pile) {
        arr.push([card._suit, card.rank]);
    }
    return arr
}

function countTwos(pile) {
    let count = 0
    for (let card of pile) {
        if (card.rank == 2) {count++}
    }
    return count
}

function queenOfSpades(pile) {
    for (let card of pile) {
        if (card.suit == 0 && card.rank == 12) {return true}
    }
    return false
}

function pilePos() {
    return Math.floor(285 + (Math.random() * 20))
}