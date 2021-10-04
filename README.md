# 2-player HTML canvas game
A template for a 2-player HTML5 canvas game using room codes. Basically there's a Flask API to create new rooms, join existing rooms, and poll for gamestate updates. In `/static` is a copy of my [canvas-game](https://github.com/tassaron/canvas-game) template for the game itself.

# Requirements
* Python 3.8
* Flask 2.0.1
* uWSGI

# Developing Yourself
1. Make a Python virtual environment.
2. `pip install flask uwsgi`
3. `./uwsgi.sh`
4. 