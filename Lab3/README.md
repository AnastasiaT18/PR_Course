
# Lab 3: Multiplayer Game – Memory Scramble

Author: Anastasia Tiganescu

Based on: MIT 6.102/6.031 starter code (PS4 Memory Scramble
)

Backend: TypeScript (concurrent, multiplayer)


## Running

The frontend consists of a single static file, `./public/index.html`.

The backend has to be written by you.
You can use any language and libraries.

You can run it like this:
```
npm install
npm start
```


## 1. Overview


This lab implements a concurrent, multiplayer Memory Scramble game starting from the MIT starter code.

The game allows multiple players to flip cards, attempt matches, and remove cards while maintaining board consistency in a concurrency-safe manner.

The implementation uses:

- Card class – represents individual cards and their states

- Player class – tracks player interactions and selections

- Board class – concurrency-safe mutable game board

- Deffered class – handles asynchronous waiting for shared resources

The system exposes four primary asynchronous commands:

- look(board, playerId) – view board state

- flip(board, playerId, row, col) – flip a card

- map(board, playerId, f) – transform card values safely

- watch(board, playerId) – wait for board changes in real time

---

## 2. Main Classes 

### 2.1 Card

Represents a single card with value and state. It also tracks which player flipped it and who it's controlled by.


```
class Card {
    private value: string;
    private state: "none" | "down" | "up" | "controlled";
    private controller: string | null;
    private flipped_by: string | null;

    flipUp(): void { ... }
    control(playerId: string): void { ... }
    reset(): void { ... }
    remove(): void { ... }
    toString(): string { ... }

    //other functions...
}
```

### 2.2 Player

Tracks player ID and currently selected cards.

```
class Player {
  readonly id: string;
  private selected: [number, number][] = [];
  
  getSelected(): [number, number][] { ... }
  setSelected(positions: [number, number][]): void { ... }
  clearSelected(): void { ... }
}
```

### 2.3 Deffered

A simple promise wrapper to wait for card availability or board events:
```
class Deffered<T>{
    promise: Promise<T>;
    resolve!: (value: T | PromiseLike<T>) => void;
    reject!: (reason?: any) => void;

    constructor() {
        this.promise = new Promise<T>((res, rej) => {
            this.resolve = res;
            this.reject = rej;
        });
    }
}
```

### 2.4 Board

The main mutable, concurrency-safe game board.

Key features:

- Maintains rows × cols grid of cards

- Tracks multiple players

- Ensures safe concurrent access with deferred locks

- Handles card flips, matches, and transformations

```
export class Board {
  private rows: number;
  private cols: number;
  private grid: Card[][];
  private players: Map<string, Player> = new Map();
  private cardLocks: Map<string, Deffered<void>[]> = new Map();


  private checkRep(): void {}

  public static async parseFromFile(filename: string): Promise<Board> {}

  async flipCard(row: number, col: number, playerId: string): Promise<void>  {}

  private async flipFirst(player: Player, row: number, col: number): Promise<void> {}

  private flipSecond(player: Player, row: number, col: number): void {}

  private async resolvePreviousTurn(playerId: string): Promise<void> {}
   
  public async map(f: (card: string) => Promise<string>): Promise<void> {}

  public async waitForChange(playerId: string): Promise<void> {}

  private notifyChange(): void{}
}
```

## 3. Board Representation

### 3.1  Abstraction Function:

AF(this) = a rows×cols grid representing the Memory Scramble game board.

### 3.2 Representation Invariant:

- rows > 0, cols > 0

- grid has exactly rows rows and cols columns

- if card.state == "controlled", then card.controller != null

- if card.state != "controlled", then card.controller == null

### 3.3 Safety from Representation Exposure:

- All fields are private.

- No direct references to grid or its cards are returned.

- Players interact with immutable data or safe methods

## 4. Game Logic

### 4.1 flipCard(row, col, playerId)

- Handles first and second card flips

- Waits if a card is controlled by another player using Deffered

Implements the full card flipping logic:

- If it’s the player’s first card, it’s turned up and controlled.

- If it’s the second card, the system checks for a match:

- Match → both cards removed (none)

- No match → cards turned down again after delay

Handles concurrency using Deferred locks to make other players wait if they try to flip controlled cards.

Example snippet:

```
if (card.state === "controlled" && card.controller !== player.id) {
    const deferred = new Deferred<void>();
    const key = `${row},${col}`;
    if (!this.cardLocks.has(key)) this.cardLocks.set(key, []);
    this.cardLocks.get(key)!.push(deferred);
    await deferred.promise; // waits for card release
}
```

### 4.2 map(f)

Applies a transformation function f asynchronously to all cards:

- Example: replacing emojis (🦄 → lollipop, 🌈 → sunshine)

- Guarantees pairwise consistency — pairs remain matching during the transformation.

```
await board.map(async (value) => {
  if (value === "🦄") return "lollipop";
  if (value === "🌈") return "sunshine";
  return value;
});
```

### 4.3 watch(board, playerId)

Allows clients to wait for board changes without busy-looping.
When any card is flipped, controlled, or removed, notifyChange() resolves waiting promises.

This is useful for web clients that need real-time updates of the board state.

```
await board.waitForChange(playerId);
return board.toString(playerId);
```

## 5. Main Functions (Glue Code)

These functions connect the Board class to the game API, required by the MIT problem set.

```
export async function look(board: Board, playerId: string): Promise<string> {
    return board.toString(playerId);
}

export async function flip(board: Board, playerId: string, row: number, column: number): Promise<string> {
    await board.flipCard(row, column, playerId);
    return board.toString(playerId);
}

export async function map(board: Board, playerId: string, f: (card: string) => Promise<string>): Promise<string> {
    await board.map(f);
    return board.toString(playerId);
}

export async function watch(board: Board, playerId: string): Promise<string> {
    await board.waitForChange(playerId);
    return board.toString(playerId);
}

```

## 6. Testing
Tests use Mocha + assert for async validation.

```
it('parses a board file correctly', async function() {
  const board = await Board.parseFromFile('boards/ab.txt');
  assert.strictEqual(board.getRows(), 5);
  assert.ok(board.toString("p1").includes("down"));
});

```


## 7. Conclusion
The Memory Scramble Board implementation successfully demonstrates how asynchronous operations and synchronization can be managed in a concurrent system. Through the use of promises and deferred objects, the game maintains consistency even when multiple players act at the same time. Each command (flip, map, watch, and look) was carefully designed to operate safely on shared data without race conditions or state corruption.

The system also fulfills the abstraction and representation requirements: data encapsulation is fully respected, the board’s internal state remains consistent, and player interactions are clearly separated from the underlying logic. The Deferred-based locking mechanism ensures fair access to shared cards, while real-time updates via watch() make the experience reactive and event-driven.

Overall, this lab highlights the power of asynchronous programming in creating interactive, multi-user systems. It provides a solid foundation for understanding how concurrency, synchronization, and data safety can be integrated into complex applications — from simple games to real-world distributed systems.
