import { SpriteThing } from "./thing.js";

export class Suit extends SpriteThing {
    constructor(s, x, y) {
        super(x, y, 54, 54);
        this.suit = s;
        this.cooldown = 0.0;
    }

    draw(ctx, drawSprite) {
        drawSprite.suit(this.suit, this.x, this.y);
    }

    update(ratio, keyboard, mouse, func=function() {}, self=this) {
        if (mouse.leftClick && this.cooldown == 0.0 && this.collides(mouse)) {
            func(self);
            this.cooldown = 300.0;
        } else if (this.cooldown < 0.0) {
            this.cooldown = 0.0;
        } else if (this.cooldown > 0.0) {
            this.cooldown -= ratio;
        }
    }
}