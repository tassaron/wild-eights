# Wild Eights
A 2-player card game using HTML5 canvas. There's a Flask API to create new rooms, join existing rooms, and poll for gamestate updates. In `/static` is what started as a copy of my [canvas-game](https://github.com/tassaron/canvas-game) template for the game itself.

**Currently unfinished**

# How to Play
There will be an in-game tutorial eventually

# Requirements
* Python 3.8
* Flask 2.0.1
* uWSGI

# Developing Yourself
1. Make a Python virtual environment.
2. `pip install flask uwsgi`
3. `./uwsgi.sh`

# Graphics Attribution
* The card graphics, `/static/assets/cards.png` are in the public domain. They were created by GreyWyvern.
* Wood background texture is an edited version of qubodup's creation on OpenGameArt: <https://opengameart.org/content/light-wood-1024x1024>