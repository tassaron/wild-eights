import { Thing } from "./thing.js";
import { Button } from "./button.js";

export class Card {
    constructor(s, r, x, y) {
        this._x = x;
        this._y = y;
        this.xDest = x;
        this.yDest = y;
        this.width = 90;
        this.height = 135;
        this.suit = s;
        this.rank = r;
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

    draw(ctx, drawSprite) {
        drawSprite.card(this.suit, this.rank, Math.floor(this._x), Math.floor(this._y));
    }

    update(ratio, keyboard, mouse, func=function() {}, self=this) {
        if (mouse.leftClick && this.cooldown == 0.0 && this.collides(mouse)) {
            func(self);
            this.cooldown = 30.0;
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

    collides(other) {
        return (this._x + this.width > other.x && this._x < other.x + other.width && other.y + other.height > this._y && other.y < this._y + this.height);
    }
}

export class Cardback extends Thing {
    constructor(x, y) {
        super(x, y, 90, 135, "cardback");
    }

    update(ratio, keyboard, mouse) {
    }
}