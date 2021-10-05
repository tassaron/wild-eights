import { Thing } from "./thing.js";
import { Button } from "./button.js";

export class Card extends Button {
    constructor(s, r, x, y) {
        super(x, y, 90, 135);
        this.suit = s;
        this.rank = r;
    }

    draw(ctx, drawSprite) {
        drawSprite.card(this.suit, this.rank, this.x, this.y);
    }
}

export class Cardback extends Thing {
    constructor(x, y) {
        super(x, y, 90, 135, "cardback");
    }

    update(ratio, keyboard, mouse) {
    }
}