import { Button } from "../button.js";

const rules = [
    ["• The goal is to have no cards in your hand.", 0, null],
    ["• You can discard if suit OR rank matches the discard pile.", 28, 0],
    ["• You can play more than one card if the ranks match.", 134, 1],
    ["• Eights are wild! Choose the suit when you play one.", 240, 2],
    ["• Pick up two cards for every 2 played by your opponent.", 346, null],
    ["• Pick up five cards for the Queen of Spades.", 374, null],
    ["• Playing a Jack means you get to play again.", 402, 3],
    ["• You may draw a new card any time you have an opportunity", 512, null],
    ["to discard a card. If you can't play then you MUST draw.", 540, null]
]

export class TutorialScene {
    constructor(game) {
        this.game = game;
        this.button1 = new BackButton(game.ctx.canvas.width - 128, game.ctx.canvas.height - 128);
        this.button2 = new CloseButton(game.ctx.canvas.width / 8, (game.ctx.canvas.height / 3) - game.ctx.canvas.height / 6);
        this.cooldown = 30.0;
    }

    update(ratio, keyboard, mouse) {
        this.game.prevScene.update(ratio, keyboard, mouse);
        if (this.cooldown > 0.0) {
            this.cooldown -= ratio;
        } else {
            this.button1.update(ratio, keyboard, mouse, this.closeScene, this)
        }
        this.button2.update(ratio, keyboard, mouse, this.closeScene, this);
    }

    draw(ctx, drawSprite) {
        this.game.prevScene.draw(ctx, drawSprite);
        ctx.fillStyle = "black";
        ctx.fillRect(ctx.canvas.width / 8, (ctx.canvas.height / 3) - ctx.canvas.height / 6, ctx.canvas.width - (ctx.canvas.width / 4), (ctx.canvas.height / 3)*2);
        ctx.fillStyle = "rgb(55, 145, 95)";
        ctx.fillRect((ctx.canvas.width / 8) + 2, ((ctx.canvas.height / 3) - ctx.canvas.height / 6) + 2, (ctx.canvas.width - (ctx.canvas.width / 4)) - 4, ((ctx.canvas.height / 3)*2) - 4);
        ctx.font = "18pt Sans";
        ctx.fillStyle = "#fff";
        let lpad = Math.floor(ctx.canvas.width / 8) + 32;
        let tpad = Math.floor((ctx.canvas.height / 3) - ctx.canvas.height / 6) + 40;
        for (let i = 0; i < rules.length; i++) {
            ctx.fillText(rules[i][0], lpad, tpad + (rules[i][1]), 632);
            if (rules[i][2] != null) {
                drawSprite.help(rules[i][2], lpad + 36, tpad + (rules[i][1]) + 6)
            }
        }
        this.button1.draw(ctx, drawSprite);
        this.button2.draw(ctx, drawSprite);
    }

    closeScene(self) {
        self.game.changeScene(self.game.prevScene);
        self.game.cooldown = 30.0;
        self.game.ctx.clearRect(
            self.game.ctx.canvas.width / 8,
            ((self.game.ctx.canvas.height / 3) - self.game.ctx.canvas.height / 6) - 1,
            self.game.ctx.canvas.width - (self.game.ctx.canvas.width / 4),
            ((self.game.ctx.canvas.height / 3)*2) + 2
        );
    }
}

class BackButton extends Button {
    constructor(x, y) {
        let outline = "black";
        let colour = "rgb(55, 95, 145)";
        super(x, y, 48, 48, "←", outline, colour);
    }
}

class CloseButton extends Button {
    constructor(x, y) {
        let outline = "black";
        let colour = "red";
        super(x, y, 28, 28, "x", outline, colour);
    }
}