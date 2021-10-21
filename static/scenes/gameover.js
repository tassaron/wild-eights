import { MenuScene } from "./menu.js";

export class GameOverScene {
    constructor(game, win) {
        this.game = game;
        this.win = win;
        game.game_over = true;
        this.cooldown = 300.0;
    }

    update(ratio, keyboard, mouse) {
        this.game.prevScene.update(ratio, keyboard, mouse);
        if (this.cooldown < 0.0 && mouse.leftClick) {
            this.game.game_over = false;
            this.game.changeScene(new MenuScene(this.game));
        } else if (this.cooldown >= 0.0) {
            this.cooldown -= ratio;
        }
    }

    draw(ctx, drawSprite) {
        this.game.prevScene.draw(ctx, drawSprite);
        this.game.darkenCanvas(ctx);
        ctx.fillStyle = "#000";
        ctx.fillRect(ctx.canvas.width / 4, (ctx.canvas.height / 3) - ctx.canvas.height / 6, ctx.canvas.width / 2, ctx.canvas.height / 4);
        let text;
        if (this.win) {
            text = "You Won!!";
            ctx.fillStyle = "rgb(55, 145, 95)";
        } else {
            ctx.fillStyle = "#800000";
            text = "You Lost";
        }
        ctx.fillRect((ctx.canvas.width / 4) + 2, ((ctx.canvas.height / 3) - ctx.canvas.height / 6) + 2, (ctx.canvas.width / 2) - 4, (ctx.canvas.height / 4) - 4);
        ctx.font = "36pt Sans";
        ctx.fillStyle = "#fff";
        ctx.fillText(text, (ctx.canvas.width / 2) - (ctx.measureText(text).width / 2), ctx.canvas.height / 3 - 32);
        ctx.font = "16pt Sans";
        ctx.fillText("tap or click to restart", ctx.canvas.width / 2 - 92, ctx.canvas.height / 3 + 22);
    }
}