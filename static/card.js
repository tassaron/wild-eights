import { Thing } from "./thing.js";

class CardBase {
    constructor(x, y) {
        this._x = x;
        this._y = y;
        this.xDest = x;
        this.yDest = y;
        this.width = 90;
        this.height = 135;
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
            this.cooldown = 300.0;
        } else if (this.cooldown < 0.0) {
            this.cooldown = 0.0;
        } else if (this.cooldown > 0.0) {
            this.cooldown -= ratio;
        }
    }

    collides(other) {
        return (this.x + this.width > other.x && this.x < other.x + other.width && other.y + other.height > this.y && other.y < this.y + this.height);
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
        this.suit = s;
        this.rank = r;
        this.cooldown = 100.0;
    }

    draw(ctx, drawSprite) {
        drawSprite.card(this.suit, this.rank, Math.floor(this._x), Math.floor(this._y));
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