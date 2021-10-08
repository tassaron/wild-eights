import flask
import os
import random
import logging
from uuid import uuid4
from string import ascii_uppercase

app = flask.Flask(__name__)
#app.secret_key = os.urandom(16)
LOG = logging.getLogger(__name__)
#app.config.update(
#    SESSION_COOKIE_SECURE=True,
#    SESSION_COOKIE_HTTPONLY=True,
#    SESSION_COOKIE_SAMESITE="Lax",
#)
rooms = {}

class GameRoom:
    @classmethod
    def new_room(cls):
        rid = four_letter_code()
        while rid in rooms.keys():
            rid = four_letter_code()
        return rid

    def __init__(self):
        self.rid = GameRoom.new_room()
        self.uid1 = uuid4()
        self.uid2 = None
        self.turn = 1
        self.pickedUp = 0
        self.pickedUpNum = 0
        self.wildcardSuit = None

    def createDeck(self):
        self.deck = []
        cards = list(range(1,53))
        for _ in range(52):
            ch = random.choice(cards)
            self.deck.append(ch)
            cards.remove(ch)
        for i, card in enumerate(self.deck[:]):
            if (card > 13 and card < 27):
                card -= 13
                self.deck[i] = (1, card)
            elif (card > 26 and card < 40):
                card -= 26
                self.deck[i] = (2, card)
            elif (card > 39):
                card -= 39
                self.deck[i] = (3, card)
            else:
                self.deck[i] = (0, card)

    def takeCards(self, num):
        returnval = []
        for _ in range(num):
            ch = random.choice(self.deck)
            returnval.append(ch)
            self.deck.remove(ch)
        return returnval


def is_valid(gamestate):
    return True


def four_letter_code():
    return "".join([random.choice(ascii_uppercase) for _ in range(4)])


@app.route("/newcard", methods=["POST"])
def newcard():
    data = flask.request.get_json()
    room = rooms[data["rid"]]
    try:
        number = int(data["number"])
    except ValueError:
        flask.abort(400)
    if number == 1:
        # this property represents when singular cards are picked up voluntarily
        if room.pickedUp == room.turn:
            room.pickedUpNum += 1
        else:
            room.pickedUp = room.turn
            room.pickedUpNum = 1
    return { "cards": room.takeCards(number) }, 200


@app.route("/lobby", methods=["POST"])
def refreshlobby():
    """Called by uid1 while waiting for uid2 to join the room"""
    data = flask.request.get_json()
    try:
        room = rooms[data["rid"]]
        if data["uid"] != str(room.uid1):
            flask.abort(401)
        if room.uid2 is None:
            return { "uid": None }, 200
        else:
            return {
                "uid": room.uid2,
                "cards": room.takeCards(8),
                "pile": room.pile,
                "pickedUp": room.pickedUp == room.turn - 1,
                "pickedUpNum": room.pickedUpNum,
                "turn": room.turn,
                "wildcardSuit": room.wildcardSuit,
            }, 200
    except KeyError:
        flask.abort(400)


@app.route("/refresh", methods=["POST"])
def refreshgame():
    data = flask.request.get_json()
    room = rooms[data["rid"]]
    resp = {
        "rid": room.rid,
        "turn": room.turn,
        "pile": room.pile,
        "wildcardSuit": room.wildcardSuit,
        "pickedUp": room.pickedUp == room.turn - 1,
        "pickedUpNum": room.pickedUpNum
    }
    return resp, 200


@app.route("/update", methods=["POST"])
def updategame():
    data = flask.request.get_json()
    room = rooms[data["rid"]]
    room.pile = data["pile"]
    room.wildcardSuit = data["wildcardSuit"]
    try:
        if room.pile[0][1] != 11:
            room.turn += 1
    except IndexError:
        room.turn += 1
    return {}, 200


@app.route("/newroom")
def newroom():
    new_room = GameRoom()
    response = flask.make_response(
        {
            "rid": new_room.rid,
            "uid1": new_room.uid1,
            "uid2": None,
        },
        200,
    )
    rooms[new_room.rid] = new_room
    return response


@app.route("/joinroom", methods=["POST"])
def joinroom():
    data = flask.request.get_json()
    data = data[:4].upper()
    for letter in data:
        if letter not in ascii_uppercase:
            flask.abort(400)
    if data not in rooms.keys():
        flask.abort(404)
    rooms[data].uid2 = uuid4()
    rooms[data].createDeck()
    cards = rooms[data].takeCards(9)
    firstcard = cards.pop()
    if firstcard[1] == 2:
        rooms[data].pickedUp = 1
        rooms[data].pickedUpNum = 2
    elif firstcard == (0, 12):
        rooms[data].pickedUp = 1
        rooms[data].pickedUpNum = 5
    rooms[data].pile = flask.json.dumps([firstcard])
    response = flask.make_response(
        {
            "rid": rooms[data].rid,
            "uid1": rooms[data].uid1,
            "uid2": rooms[data].uid2,
            "cards": cards,
            "pile": rooms[data].pile,
        },
        200,
    )
    rooms[data].turn = 1
    return response


@app.route("/")
def index():
    return flask.render_template("index.html")