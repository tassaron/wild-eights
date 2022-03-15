# Wild Eights card game API
Documented in the order they occur in the code during a game session.

General concepts:
- The server handles shuffling the deck and dealing new cards. Clients only know about their current cards and the discard pile.
-  Each client has a UUID signed with Flask's secret key so it cannot be altered by the client. The client only knows its own UUID.
-  Each room is identified primarily by its `rowid` in the database
-  Turn number (`turn`) starts at 1
-  `uid1` plays when `turn` is an even number
-  `uid2` plays when `turn` is an odd number
- Cards are in the format `[ (suit, rank), ... ]`
- The following integers represent suits:
   -  `0`: spades
   -  `1`: hearts
   -  `2`: diamonds
   -  `3`: clubs

---
## `GET /newroom` (used by Player 1)
Triggered from Menu scene when New Game button is clicked.

Response:
-  `rid`: The four-letter room code shown to the player
-  `rowid`: ID of room in the database
-  `uid1`: Newly-created UUID of the client that made this request (signed)
-  `uid2`: None

---
## `POST /lobby` (used by Player 1)
Occurs in Lobby scene periodically to check if player 2 has joined.

Request:
-  `rid`: The `rowid` of this room in the database
-  `uid`: Signed UUID of the client making this request

Response:
-  `joined`: boolean
-  `cards`: list of tuples representing player's cards `[ (suit, rank), ... ]`
-  `pile`: list of tuples representing discarded cards `[ (suit, rank), ... ]`
-  `pickedUp`: turn number when someone picked up cards
-  `pickedUpNum`: number of cards picked up on the `pickedUp` turn number
-  `turn`: current turn number
-  `wildcardSuit`: nullable int representing a suit

---
## `POST /joinroom` (used by Player 2)
Triggered from Menu scene when "Join Room" text-field is submitted.

Request:
- four-letter room code as a string

Response:
-  `rid`: The same four-letter room code
-  `rowid`: ID of room in the database
-  `uid1`: None
-  `uid2`: Newly-created UUID of the client that made this request (signed)
-  `cards`: list of tuples representing player's cards `[ (suit, rank), ... ]`
-  `pile`: list of tuples representing discarded cards `[ (suit, rank), ... ]`

---
## `POST /refresh`
Occurs in World scene periodically to check if the other player is done playing their turn.

Request:
-  `rid`: The `rowid` of this room in the database
-  `uid`: Signed UUID of the client making this request

Response:
-  `turn`: current turn number
-  `pile`: list of tuples representing discarded cards `[ (suit, rank), ... ]`
-  `wildcardSuit`: nullable int representing a suit
-  `pickedUp`: turn number when someone picked up cards
-  `pickedUpNum`: number of cards picked up on the `pickedUp` turn number


---
## `POST /update`
Triggered from World scene at the end of the player's turn, sending their moves to the server.

Request:
-  `rid`: The `rowid` of this room in the database
-  `uid`: Signed UUID of the client making this request
-  `pile`: list of tuples representing discarded cards `[ (suit, rank), ... ]`
-  `wildcardSuit`: nullable int representing a suit

Response:
-  `HTTP 204` for success
-  `HTTP 401` for unauthorized (bad signature, possibly tampered with UUID)
-  `HTTP 404` for a nonexistent room


---
## `POST /newcard`
Triggered from World scene when the active player draws new cards from the deck.

Request:
-  `rid`: The `rowid` of this room in the database
-  `uid`: Signed UUID of the client making this request
-  `number`: Number of cards to pick up

Response:
-  `cards`: list of tuples representing newly drawn cards `[ (suit, rank), ... ]`