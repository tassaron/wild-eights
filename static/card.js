import { CollidableThing } from "./thing.js";

class CardBase extends CollidableThing {
    constructor(x, y) {
        super(x, y, 90, 135);
        this._x = x;
        this._y = y;
        this.xDest = x;
        this.yDest = y;
        this.cooldown = 0.0;
    }

    get x() { return this._x }
    get y() { return this._y }
    set x(val) { 
        this.xDest = val;
    }
    set y(val) {
        this.yDest = val;
    }

    update(ratio, keyboard, mouse, func=function() {}, self=this) {
        if (mouse.leftClick && this.cooldown == 0.0 && this.collides(mouse)) {
            func(self);
            this.cooldown = 100.0;
        } else if (this.cooldown < 0.0) {
            this.cooldown = 0.0;
        } else if (this.cooldown > 0.0) {
            this.cooldown -= ratio;
        }
    }

    travel(ratio) {
        if (this._x > this.xDest) {this._x -= ratio*4}
        if (this._x < this.xDest) {this._x += ratio*4}
        if (this._y > this.yDest) {this._y -= ratio*4}
        if (this._y < this.yDest) {this._y += ratio*4}
    }
}

export class Card extends CardBase{
    constructor(s, r, x, y) {
        super(x, y);
        this._suit = s;
        this.rank = r;
        this.cooldown = 100.0;
        this.wildcardSuit = null;
    }

    get suit() {return this.wildcardSuit === null ? this._suit : this.wildcardSuit}

    draw(ctx, drawSprite) {
        drawSprite.card(this._suit, this.rank, Math.floor(this._x), Math.floor(this._y));
        if (this.wildcardSuit != null) {
            drawSprite.suit(this.wildcardSuit, 205, 350);
        }
    }
}

export class Cardback extends CardBase {
    draw(ctx, drawSprite) {
        drawSprite.cardback(this.x, this.y);
    }
}

export class OCard extends CardBase {
    draw(ctx, drawSprite) {
        drawSprite.ocard(Math.floor(this.x), Math.floor(this.y));
    }
}
