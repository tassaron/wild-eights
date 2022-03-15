# Wild Eights

[**Play Game**](https://rainey.tech/game/wild-eights)

A 2-player card game using HTML5 canvas. There's a Flask API to create new rooms, join existing rooms, and poll for gamestate updates. In `/static` is what started as a copy of my [canvas-game](https://github.com/tassaron/canvas-game) template for the game itself.

# How to Play
Click the purple question mark at the bottom-right of the main menu for in-game instructions.

The goal of the game is to empty your hand before your opponent.

1. You can discard if the suit OR rank matches the topmost card on the discard pile.
2. You can play more than one card at a time if the ranks match.
3. You may draw a new card any time you have an opportunity to discard a card.
4. Eights are wild! You get to choose the suit when you play one.
5. Pick up two cards for every 2 played by your opponent.
6. Pick up five cards for the Queen of Spades.
7. Playing a Jack means you get to play again.

# Requirements
* Python 3.8
* Flask 2.0.1
* uWSGI
* python_dotenv

# Development
1. See [API documentation](API.md)
1. Install dependencies needed to compile uWSGI: `apt install build-essential gcc python3-dev`
1. Make a Python virtual environment.
1. `pip install flask uwsgi python_dotenv`
1. `./uwsgi.sh` for testing multiprocess, `flask run` if you want `print()` to work

# Production
1. Do first 3 development steps.
1. Make user for the app `adduser --system --home /srv/website website`
1. Copy `app.service` into `/etc/systemd/system/`
    - This systemd service will run `uwsgi --ini uwsgi.ini`
1. Edit `website.nginx` as needed. Certbot can create HTTPS config automatically

# Graphics Attribution
* The card graphics, `/static/assets/cards.png` are in the public domain. They were created by GreyWyvern.
* Wood background texture is an edited version of qubodup's creation on OpenGameArt: <https://opengameart.org/content/light-wood-1024x1024>