### Feature: Theme-Based Turn Game with Player-Controlled Positioning

#### Scenario 0: Set up online game session and wait for players

**Given** a user creates a new online game session
**When** they become the host and receive a shareable room code and invite link
**Then** they can share the link with others to join the game
**And** see a lobby with a list of joined players, their assigned colors, and the total number of participants updating in real time

---

#### Scenario 0.1: Join game via shared link

**Given** a user opens a shared invite link
**When** they access the game room
**Then** they must input a display name
**And** the system assigns a random color from a predefined palette to the player

---

#### Scenario 0.2: Join game by room code

**Given** a user opens the app manually
**And** they enter a room code
**When** they connect to the room
**Then** they must input a display name
**And** the system assigns a random color from a predefined palette to the player

---

#### Scenario 0.3: Host selects a theme and edits suggested prompts

**Given** a host has created a new game session
**When** they choose a theme from a predefined list
**Then** the system suggests a list of prompts related to the theme
**And** the host can edit the list by adding or removing prompts before confirming

---

#### Scenario 0.4: Host creates prompt list from scratch

**Given** a host has created a new game session
**When** they decide not to select a predefined theme
**Then** they can manually input a list of prompts to be used in each round of the game

---

#### Scenario 0.5: Prompt input interface behavior

**Given** the host is entering prompts manually
**When** they type multiple lines in a textarea
**Then** each line is parsed into a prompt once a line break is entered
**And** each prompt is displayed as a chip with a close ("x") icon for removal
**And** when the host places the cursor in a chip's text line, it switches back to editable form

---

#### Scenario 1: Lobby and host control before game start

**Given** all players are taken to a lobby where they wait for others to join
**And** each player can optionally change their card color
**And** the host has a control to start the game when ready

---

#### Scenario 2: Start a new game with a prompt

**Given** a user starts the game
**When** the host selects the  prompt from a predefined list of prompts
**Then** the game should set that prompt for all players
**And** assign each player a hidden number between 0 and 100

---

#### Scenario 3: Player creates and places a situation based on their number

**Given** a player has received their hidden number
**When** it is their turn
**Then** they write a situation related to the theme that reflects that number
**And** place it directly into the public sequence at the position they feel best represents the number on a 0 to 100 scale, where the leftmost position is 0 and the rightmost is 100
**And** the situation becomes visible to all players
**And** the number remains hidden from other players

---

#### Scenario 4: Public order visibility and movement

**Given** the current player has placed their situation into the sequence
**And** the order of all situations is publicly visible to all players
**And** players are only allowed to move their own situation within the sequence
**When** the player adjusts the position of their own situation
**Then** the updated order is visible to all players in real time
**And** the new position is saved for this player’s turn

---

#### Scenario 5: Turn passes to the next player

**Given** a player has moved their situation in the sequence
**When** they click “Next”
**Then** the game locks their move
**And** the turn advances to the next player

---

#### Scenario 6: Free-hand round after turn-based phase

**Given** all players have submitted their ordering
**When** the game reaches the end of the turn-based phase
**Then** a free-hand round begins where all players can collaboratively move their own situation within the public sequence to a new position they believe fits better

---

#### Scenario 7: Reveal final results

**Given** all players have confirmed their final placements in the free-hand round
**When** the round ends
**Then** the game should reveal the actual numbers behind each situation
**And** show how close the final order was to the correct sequence
**And** display the cards in the correct order and also show the cards in the player's submitted order side by side
**And** highlight mismatches between the two orders visually

---

#### Scenario 8: Start a new match with new prompt

**Given** the current match has ended and results have been shown
**When** the host chooses to start a new match
**Then** they are prompted to select a new prompt from the list of remaining prompts
**And** the game begins a new round using the newly selected prompt
   
Scenario 9: Host views match summary

**Given** the host has completed one or more matches with players
**When** they choose to view the match summary
**Then** the system displays a list of all completed prompts and their corresponding final orders
**And** shows mismatches and player accuracy for each round

---
