import { MenuScene } from "./scenes/menu.js";

const fpsRatio = ms => { return Math.min(ms / (1000 / 60), 2) }
let then;

export class Game {
    constructor(ctx) {
        this.game_over = false;
        then = Date.now();
        this.ctx = ctx;
        this.scene = new MenuScene(this);
        this.prevScene = this.scene;
    }

    update(keyboard, mouse) {
        let now = Date.now();
        let delta = now - then;
        let ratio = fpsRatio(delta);
        this.scene.update(ratio, keyboard, mouse);
        then = Date.now();
    }

    draw(ctx, drawSprite) {
        this.scene.draw(ctx, drawSprite);
    }

    changeScene(scene) {
        scene.game = this;
        let prevScene = this.scene;
        this.prevScene = prevScene;
        this.scene = scene;
    }

    darkenCanvas(ctx) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}