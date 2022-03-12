import flask
import random
import os
from uuid import uuid4
from string import ascii_uppercase
from itsdangerous import URLSafeSerializer, BadSignature
import sqlite3
from ast import literal_eval
from time import time
from dotenv import load_dotenv


load_dotenv()
ROOT_DIR = os.environ.get("ROOT_DIR", "")


class MyFlask(flask.Flask):
    def add_url_rule(self, rule, *args, **kwargs):
        return super().add_url_rule(ROOT_DIR + rule, *args, **kwargs)


app = MyFlask(__name__)
try:
    with open("key.sav", "rb") as f:
        key = f.read(16)
except FileNotFoundError:
    key = os.urandom(16)
    with open("key.sav", "wb") as f:
        f.write(key)
app.secret_key = key
serializer = URLSafeSerializer(app.secret_key)


def createDatabase():
    connection = sqlite3.connect("wild-eights.db")
    with connection:
        connection.execute(
            "CREATE TABLE IF NOT EXISTS rooms "
            "(rowid INTEGER PRIMARY KEY AUTOINCREMENT, rid TEXT NOT NULL,"
            "uid1 TEXT NOT NULL, uid2 TEXT, turn INTEGER DEFAULT 1,"
            "pickedUp INTEGER DEFAULT 0, pickedUpNum INTEGER DEFAULT 0, wildcardSuit INTEGER,"
            "pile TEXT, shuffleable TEXT DEFAULT [], deck TEXT,"
            "time INTEGER NOT NULL)")


def connect():
    connection = sqlite3.connect("wild-eights.db")
    connection.row_factory = sqlite3.Row
    return connection


createDatabase()


def newRoom():
    with connect() as db:
        uid1 = uuid4().hex
        while True:
            rid = four_letter_code()
            result = db.execute("SELECT time, rowid FROM rooms WHERE rid=(?)", [rid]).fetchone()
            if result is None:
                db.execute("INSERT INTO rooms(rid, uid1, time) VALUES (?, ?, ?)", [rid, uid1, time()])
                room = db.execute("SELECT rowid FROM rooms WHERE rid=(?)", [rid]).fetchone()
                return rid, room["rowid"], uid1
            else:
                if time() - result["time"] > 10000:
                    db.execute("DELETE FROM rooms WHERE rowid=(?)", [result["rowid"]])


def createDeck():
    """Returns a new deck of 52 cards in the format (suit, rank)"""
    deck = list(range(1,53))
    random.shuffle(deck)
    for i, card in enumerate(deck[:]):
        if (card > 13 and card < 27):
            card -= 13
            deck[i] = (1, card)
        elif (card > 26 and card < 40):
            card -= 26
            deck[i] = (2, card)
        elif (card > 39):
            card -= 39
            deck[i] = (3, card)
        else:
            deck[i] = (0, card)
    return deck


def takeCards(deck, num, shuffleable):
    """Take num cards out of deck list and put into shuffleable list.
    Returns remaining deck and shuffleable cards as two separate lists"""
    cards = []
    for _ in range(num):
        try:
            ch = deck[num]
        except IndexError:
            random.shuffle(shuffleable)
            deck = shuffleable
            shuffleable = []
            ch = random.choice(deck)
        cards.append(ch)
        deck.remove(ch)
    return cards, deck, shuffleable


def four_letter_code():
    return "".join([random.choice(ascii_uppercase) for _ in range(4)])


@app.route("/newcard", methods=["POST"])
def newcard():
    data = flask.request.get_json()
    try:
        with connect() as db:
            room = db.execute("SELECT * FROM rooms WHERE rowid=(?)", [data["rid"]]).fetchone()
            if room is None:
                flask.abort(404)
            number = int(data["number"])
            if serializer.loads(data["uid"]) not in (room["uid1"], room["uid2"]):
                flask.abort(401)
            pickedUp = room["pickedUp"]
            pickedUpNum = room["pickedUpNum"]
            if number == 1:
                # this property represents when singular cards are picked up voluntarily
                if room["pickedUp"] == room["turn"]:
                    pickedUpNum += 1
                else:
                    pickedUp = room["turn"]
                    pickedUpNum = 1
            cards, deck, shuffleable = takeCards(literal_eval(room["deck"]), number, literal_eval(room["shuffleable"]))
            db.execute(
                "UPDATE rooms SET deck=(?),shuffleable=(?),pickedUp=(?),pickedUpNum=(?) WHERE rowid=(?)",
                [repr(deck), repr(shuffleable), pickedUp, pickedUpNum, room["rowid"]]
            )
    except ValueError:
        flask.abort(400)
    except BadSignature:
        flask.abort(401)
    return { "cards": cards }, 200


@app.route("/lobby", methods=["POST"])
def refreshlobby():
    """Called by uid1 while waiting for uid2 to join the room"""
    data = flask.request.get_json()
    try:
        with connect() as db:
            room = db.execute("SELECT * FROM rooms WHERE rowid=(?)", [data["rid"]]).fetchone()
            if room is None:
                flask.abort(404)
        if serializer.loads(data["uid"]) != room["uid1"]:
            flask.abort(401)
        if room["uid2"] is None:
            return { "joined": False }, 200
        else:
            cards, deck, shuffleable = takeCards(literal_eval(room["deck"]), 8, literal_eval(room["shuffleable"]))
            with connect() as db:
                db.execute(
                    "UPDATE rooms SET deck=(?),shuffleable=(?) WHERE rowid=(?)",
                    [repr(deck), repr(shuffleable), data["rid"]]
                )
            return {
                "joined": True,
                "cards": cards,
                "pile": room["pile"],
                "pickedUp": room["pickedUp"] == room["turn"] - 1,
                "pickedUpNum": room["pickedUpNum"],
                "turn": room["turn"],
                "wildcardSuit": room["wildcardSuit"],
            }, 200
    except BadSignature:
        flask.abort(401)


@app.route("/refresh", methods=["POST"])
def refreshgame():
    data = flask.request.get_json()
    try:
        with connect() as db:
            room = db.execute("SELECT * FROM rooms WHERE rowid=(?)", [data["rid"]]).fetchone()
            if room is None:
                flask.abort(404)
            if serializer.loads(data["uid"]) not in (room["uid1"], room["uid2"]):
                flask.abort(401)
    except BadSignature:
        flask.abort(401)
    resp = {
        "turn": room["turn"],
        "pile": room["pile"],
        "wildcardSuit": room["wildcardSuit"],
        "pickedUp": room["pickedUp"] == room["turn"] - 1,
        "pickedUpNum": room["pickedUpNum"]
    }
    return resp, 200


@app.route("/update", methods=["POST"])
def updategame():
    data = flask.request.get_json()
    try:
        with connect() as db:
            room = db.execute("SELECT * FROM rooms WHERE rowid=(?)", [data["rid"]]).fetchone()
            if room is None:
                flask.abort(404)
            if serializer.loads(data["uid"]) not in (room["uid1"], room["uid2"]):
                flask.abort(401)
            oldpile = flask.json.loads(room["pile"])
            shuffleable = literal_eval(room["shuffleable"])
            shuffleable.extend(oldpile)
            db.execute(
                "UPDATE rooms SET shuffleable=(?),pile=(?),turn=(?),wildcardSuit=(?),time=(?) WHERE rowid=(?)",
                [
                    repr(shuffleable),
                    data["pile"],
                    room["turn"] + 1,
                    data["wildcardSuit"],
                    time(),
                    room["rowid"]
                ]
            )
    except BadSignature:
        flask.abort(401)
    return {}, 200


@app.route("/newroom")
def newroom():
    rid, rowid, uid1 = newRoom()
    response = flask.make_response(
        {
            "rid": rid,
            "rowid": rowid,
            "uid1": serializer.dumps(uid1),
            "uid2": None,
        },
        200,
    )
    return response


@app.route("/joinroom", methods=["POST"])
def joinroom():
    rid = flask.request.get_json()
    rid = rid[:4].upper()
    for letter in rid:
        if letter not in ascii_uppercase:
            flask.abort(400)
    with connect() as db:
        room = db.execute("SELECT rowid, uid2 FROM rooms WHERE rid=(?)", [rid]).fetchone()
        if room is None:
            flask.abort(404)
        if room["uid2"] is not None:
            flask.abort(401)
        uid2 = uuid4().hex
        deck = createDeck()
        cards, deck, shuffleable = takeCards(deck, 9, [])
        firstcard = cards.pop()
        pickedUp = 0
        pickedUpNum = 0
        if firstcard[1] == 2:
            pickedUp = 1
            pickedUpNum = 2
        elif firstcard == (0, 12):
            pickedUp = 1
            pickedUpNum = 5
        pile = flask.json.dumps([firstcard])
        db.execute(
            "UPDATE rooms SET uid2=(?),deck=(?),shuffleable=(?),pickedUp=(?),pickedUpNum=(?),pile=(?),turn=1 WHERE rowid=(?)",
            [uid2, repr(deck), repr(shuffleable), pickedUp, pickedUpNum, pile, room["rowid"]]
        )
    response = flask.make_response(
        {
            "rid": rid,
            "rowid": room["rowid"],
            "uid1": None,
            "uid2": serializer.dumps(uid2),
            "cards": cards,
            "pile": pile,
        },
        200,
    )
    return response


@app.route("/")
def index():
    return flask.render_template("index.html")