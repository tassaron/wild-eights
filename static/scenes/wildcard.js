import { Suit } from "../suit.js";

export class WildcardScene {
    constructor(card) {
        this.card = card;
        this.suits = [];
        for (let s=0; s < 4; s++) {
            this.suits.push(new Suit(s, 205, 205 + (116*s)));
        }
    }

    update(ratio, keyboard, mouse) {
        for (let suit of this.suits) {
            suit.update(ratio, keyboard, mouse, function(self) {self.selectSuit(self, suit.suit)}, this);
        }
    }

    draw(ctx, drawSprite) {
        this.game.prevScene.draw(ctx, drawSprite);
        this.game.darkenCanvas(ctx);
        for (let suit of this.suits) {
            suit.draw(ctx, drawSprite);
        }
        drawSprite.card(this.card._suit, this.card.rank, 405, 265, 2);
        ctx.font = "36pt Sans";
        ctx.fillStyle = "white";
        ctx.fillText("choose a suit", 350, 305 + (135*2) + 12);
    }

    selectSuit(self, suit) {
        self.card.wildcardSuit = suit;
        self.game.changeScene(self.game.prevScene);
        self.game.scene.playCard(self.game.scene, self.card)
    }
}