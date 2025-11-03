/* Copyright (c) 2021-25 MIT 6.102/6.031 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import assert from 'node:assert';
import fs from 'node:fs';

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


/**
 * TODO specification
 * Mutable and concurrency safe.
 */
export class Board {

    // TODO fields
    private rows: number;
    private cols: number;
    private grid: Card[][];  
    
    public getRows(): number {
        return this.rows;
      }
      
      public getCols(): number {
        return this.cols;
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

    async flipCard(row: number, col: number, playerId: number): Promise<void>  {
        const rowArray = this.grid[row];
        if (!rowArray || !rowArray[col]) {
            throw new Error("Card position out of bounds");
        }
        if (rowArray[col].state !== "down") {
            throw new Error("Card is already flipped."); // rejected promise
        }
        rowArray[col].flipUp();
    }

    public toString(): string {
        return this.grid.map(row => row.map(card => card.toString()).join(" ")).join("\n");
}

}
