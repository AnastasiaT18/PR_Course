/* Copyright (c) 2021-25 MIT 6.102/6.031 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import { clearScreenDown } from 'node:readline';

class Card {
    public value: string;
    public state: "none" | "down" | "up" | "controlled";
    public controller: string | null;

    constructor(value: string) {
        this.value = value;
        this.state = "down";
        this.controller = null;
    }

    flipUp(): void{
        if (this.state !== "down") {
            throw new Error("Card is not face down");
        }
        this.state = "up";
    }

    control(playerId: string): void {
        if (this.state !== "up") throw new Error("Card must be face up first");
        this.state = "controlled";
        this.controller = playerId;
      }

    reset(): void {
      this.state = "down";
      this.controller = null;
    }

    remove(): void {
        this.state = "none";
        this.value = "";
        this.controller = null;
        }

    toString(): string {
        switch(this.state){
            case "none":
                return "none";
            case "down":
                return "down";
            case "up":
                return `up ${this.value}`;
            case "controlled":
                return `my ${this.value}`;
        }
    }



}

class Player {
  readonly id: string;
  private selected: [number, number][] = [];

  constructor(id: string) {
    this.id = id;
  }

  getSelected(): [number, number][] {
    return this.selected; // defensive copy
  }

  setSelected(positions: [number, number][]): void {
    this.selected = [...this.selected, ...positions];
  }

  clearSelected(): void {
    this.selected = [];
  }

}

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

/**
 * TODO specification
 * Mutable and concurrency safe.
 */
export class Board {

    // TODO fields
    private rows: number;
    private cols: number;
    private grid: Card[][];  

    private players: Map<string, Player> = new Map();
    private cardLocks: Map<string, Deffered<void>[]> = new Map();
    
    public getRows(): number {
        return this.rows;
      }
      
      public getCols(): number {
        return this.cols;
      }

    public getPlayers(): Map<string, Player> {
        return this.players;}
      
    public getCard(row: number, col: number) {
        if (this.grid[row] && this.grid[row][col]) {
            return this.grid[row][col];
        }
        throw new Error("Card at the specified position does not exist");
      }
      

    // Abstraction function:
    //   TODO
    // Representation invariant:
    //   TODO
    // Safety from rep exposure:
    //   TODO

    
  // Abstraction function:
  //   AF(this) = a rows×cols board representing the Memory Scramble grid.
  //
  // Representation invariant (RI):
  //   - rows > 0, cols > 0
  //   - grid has exactly `rows` rows and `cols` columns
  //   - if a card is "controlled", controller != null
  //   - if card is not "controlled", controller == null
  //
  // Safety from rep exposure:
  //   - All fields are private.
  //   - No method returns direct references to grid or cards.

    // TODO constructor
    constructor(rows: number, cols: number, grid: Card[][]) {
        this.rows = rows;
        this.cols = cols;
        this.grid = grid;
        this.checkRep();
      }

    // TODO checkRep

    private checkRep(): void {
        if (this.rows <= 0 || this.cols <= 0) {
            throw new Error("Board dimensions must be positive");
        }
        if (this.grid.length !== this.rows) {
            throw new Error("Grid row count does not match specified rows");
        }
        for (const row of this.grid) {
            if (row.length !== this.cols)
              throw new Error("Grid column mismatch");
            for (const card of row) {
              if (card.state === "controlled" && card.controller === null)
                throw new Error("Controlled card missing controller");
              if (card.state !== "controlled" && card.controller !== null)
                throw new Error("Uncontrolled card has controller");
            }
          }
    }

    // TODO other methods

    /**
     * Make a new board by parsing a file.
     * 
     * PS4 instructions: the specification of this method may not be changed.
     * 
     * @param filename path to game board file
     * @returns a new board with the size and cards from the file
     * @throws Error if the file cannot be read or is not a valid game board
     * @param rows number of rows
     * @param cols number of columns
     * @param grid 2D array of Card|null
     */
    public static async parseFromFile(filename: string): Promise<Board> {
        const data = await fs.promises.readFile(filename, 'utf-8');
        const lines = data.split(/\r?\n/);
        
        if (!lines[0]) {
            throw new Error("Invalid board file format: missing dimensions");
        }

        const [rows, cols] = lines[0].split("x").map(Number);

        if(!rows || !cols){
            throw new Error("Invalid board file format: invalid dimensions");
        }

        const grid: Card[][] = [];

        let index = 1;
        for(let r = 0; r < rows; r++) {
            const row: Card[] = [];
            for (let c = 0; c < cols; c++) {
                const line = lines[index++];
                if (line === undefined || line.trim() === "") {
                    throw new Error("Not enough or invalid card values in board file");
                }
                row.push(new Card(line));
            }
            grid.push(row);
        }

        return new Board(rows, cols, grid); // TODO: implement this
    }

    async flipCard(row: number, col: number, playerId: string): Promise<void>  {
      
      let player = this.players.get(playerId);


      if (player && player.getSelected().length > 0) {
        await this.resolvePreviousTurn(playerId);
      }


      if (!player) {
        player = new Player(playerId);
        this.players.set(playerId, player);
      }

      const selected = player.getSelected();
      console.log("Before flipping, selected =", selected);


      if (selected.length == 0) {
        await this.flipFirst(player, row, col);
        console.log("After flipping first:", player.getSelected());


      } else if (selected.length == 1) {
        this.flipSecond(player, row, col);
        console.log("After flipping second:", player.getSelected());

      } else {
        console.log(`[WARN] ${playerId} already selected two cards`);      }

    }


  private async flipFirst(player: Player, row: number, col: number): Promise<void> {
    // while (true){
    const card  = this.grid[row]?.[col];

      if (!card){
        throw new Error("1-A: No card there (empty space)");
      }

      switch(card.state){
        case "none":
          throw new Error("1-A: No card there (removed)");

        case "down":
          card.flipUp();
          card.control(player.id); // 1-B
          player.setSelected([[row, col]]);
          console.log(player.getSelected());
          console.log(`Card ${card.value} at (${row}, ${col}) was DOWN, now UP.`);
          console.log(`[FIRST CARD] ${player.id} flipped ${card.value}, at (${row}, ${col})`);
          break;

        case "up":
          if (card.controller === null) {
            // 1-C
            card.control(player.id);
            player.setSelected([[row, col]]);
            console.log(`Card ${card.value} at (${row}, ${col}) was UP and UNCONTROLLED.`);
            console.log(`[FIRST CARD] ${player.id} controls ${card.value}, at (${row}, ${col})`);
            break;

        } //else{
        //   throw new Error("1-D: Card controlled by another player (would wait)");
        // }
          break;

        case "controlled":
          if (card.controller === player.id) {
            // player already controls this card
            console.log("You already control this card, choose your second.");
            throw new Error("You already control this card, choose your second."); 
        } else {
            console.log("1-D: Card controlled by another player (would wait)");
            console.log(`[WAIT] ${player.id} waiting for card (${row}, ${col})`);
            // await this.waitForCard(row, col);

            const deferred = new Deffered<void>();
            const key = `${row},${col}`;
            if (!this.cardLocks.has(key)) this.cardLocks.set(key, []);
            this.cardLocks.get(key)!.push(deferred);

            await deferred.promise;
            console.log("Card is now free.");
            return this.flipFirst(player, row, col);
        }break;
      //}
      }
    }

    private flipSecond(player: Player, row: number, col: number): void {
      const card = this.grid[row]?.[col];
      if (!card) throw new Error("2-A: No card there");

      const selected = player.getSelected();
      const firstPos = selected[0];         // firstPos is [number, number] | undefined
      if (!firstPos) throw new Error("No first card recorded");
    
      const [fr, fc] = firstPos;            // destructure row & col of the first card
      const firstCard = this.grid[fr]?.[fc];
      if (!firstCard) throw new Error("First card not found on board");
      
      switch(card.state){
        case "none":
          firstCard.state = "up";
          firstCard.controller = null;
          // player.clearSelected();
          player.setSelected([firstPos, [row, col]]);
          throw new Error("2-A: No card there. Failed second card.Start again. First card remains up, uncontrolled.");
      
        case "controlled":
            //operation fails 2B
            firstCard.controller = null;
            firstCard.state = "up";
            // player.clearSelected();
            throw new Error("2-B: Card controlled by someone else. Failed second card.Start again. First card remains up, uncontrolled.");

        case "up":
            if (card.controller === null) {
              // 2--
              card.control(player.id);
              player.setSelected([[row, col]]);
              console.log(`[SECOND CARD] ${player.id} controls ${card.value}, at (${row}, ${col})`);}
              break;
        case "down":
          card.flipUp();
          card.control(player.id); // 2D
          player.setSelected([[row, col]]);
          console.log(player.getSelected());
          console.log(`[SECOND CARD] ${player.id} flipped ${card.value}, at (${row}, ${col})`);
          break;
        }

        console.log("checking now...");
        if(firstCard.value === card.value){
          // card.control(player.id);
          // player.setSelected([firstPos, [row, col]]);
          console.log(`[MATCH] ${player.id} found a pair: ${card.value}`);
      }else{
        // player.setSelected([firstPos, [row, col]]);
        firstCard.controller = null;
        firstCard.state = "up";
        card.controller = null;
        card.state = "up";
        // player.clearSelected();
        console.log(`[NO MATCH] `);

      }
        }

    private async resolvePreviousTurn(playerId: string): Promise<void> {
          const player = this.players.get(playerId);
          if (!player) return;

          const prev = player.getSelected();
          if (!prev || prev.length === 0) return;
      
          if (prev.length === 2) {
              const [pos1, pos2] = prev;

              if (!pos1 || !pos2) {
                throw new Error("Invalid stored positions for previous turn");
              }

              const card1 = this.grid[pos1[0]]![pos1[1]]!;
              const card2 = this.grid[pos2[0]]![pos2[1]]!;

              if (!card1 || !card2) throw new Error("Invalid stored card positions");

      
              if (card1.value === card2.value && card1.controller === playerId && card2.controller === playerId) {
                console.log("Player", player.id, "found match, cards are now being removed...");
                console.log("Board state now:");
                this.toString();
                  // 3-A: remove both
                card1.remove();
                console.log("Card 1 removed.");
                card2.remove();
                console.log("Card 2 removed.");
              } else {
                  // 3-B: flip back if not controlled by anyone
                  console.log("Player", player.id, "didn't find match. Cards are up, not controlled, they are being FLIPPED DOWN. ")
                  card1.reset();
                  card2.reset();
                  player.clearSelected();

              }
              this.resolveWaiters(pos1[0], pos1[1]);
              this.resolveWaiters(pos2[0], pos2[1]);
              player.clearSelected();

          }
          else{
            const [pos1] = prev;

            if (!pos1) {
              throw new Error("Invalid stored positions for previous turn");
            }

            const card1 = this.grid[pos1[0]]![pos1[1]]!;

            if (!card1) throw new Error("Invalid stored card positions");
            console.log(card1.state);
            if (card1.controller !== player.id){
              card1.reset();
              player.clearSelected();
              console.log("Clearing selected...");
            }

          }
          console.log("ARRAY IS: ", player.getSelected());
        }
      
    // private async waitForCard(row: number, col: number): Promise<void> {
    //   const key = `${row},${col}`;
    //   const deferred = new Deffered<void>();
    //   if (!this.cardLocks.has(key)) {
    //     this.cardLocks.set(key, []);
    //     }
    //   this.cardLocks.get(key)!.push(deferred);
    //   console.log("Card at (", row, ",", col, ") is now locked. Waiters:", this.cardLocks.get(key)!.length);
    //   await deferred.promise;
    // }

    private resolveWaiters(row: number, col: number): void {
      const key = `${row},${col}`;
      const waiters = this.cardLocks.get(key);
      console.log("Resolving waiters for card at (", row, ",", col, "). Waiters:", waiters ? waiters.length : 0);
      if (waiters) {
        for (const w of waiters) w.resolve();
        this.cardLocks.delete(key);
      }
    }
    

    public toString(): string {
      return `${this.rows}x${this.cols}\n` +
        this.grid.map(row =>
          row.map(card => {
            switch(card.state) {
              case "none": return "none -";
                case "down": return "down -";
              case "up": return `up ${card.value}`;
              case "controlled": return `my ${card.value}`;
            }
          }).join('\n')
        ).join('\n');
    }
    

    public async map(f: (card: string) => Promise<string>): Promise<void> {
      
      let valueMap = new Map<string, Promise<string>>();

      const transformPromises: Promise<void>[] = [];


      for(let r = 0; r < this.rows; r++) {
        for(let c = 0; c < this.cols; c++) {

          const card = this.grid[r]?.[c];
          if (!card) continue;

            if (!valueMap.has(card.value)) {
              valueMap.set(card.value, f(card.value));
            }

            const p = (async () => {
              const newValue = await valueMap.get(card.value)!;
              if (typeof newValue !== "string") {
                throw new Error(`Invalid mapped value for ${card.value}: ${newValue}`);
              }
              
              console.log(`Mapping ${card.value} -> ${newValue}`);

              card.value = newValue;
            })();
            
            transformPromises.push(p);

          }
        }

      await Promise.all(transformPromises);
    }
      


}
