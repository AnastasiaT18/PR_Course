/* Copyright (c) 2021-25 MIT 6.102/6.031 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import assert from 'node:assert';
import { Board } from './board.js';

/**
 * Example code for simulating a game.
 * 
 * PS4 instructions: you may use, modify, or remove this file,
 *   completing it is recommended but not required.
 * 
 * @throws Error if an error occurs reading or parsing the board
 */
async function simulationMain(): Promise<void> {
    const filename = 'boards/simple.txt';
    const board: Board = await Board.parseFromFile(filename);
    const size = 5;
    const players = 4;
    const tries = 100;
    const maxDelayMilliseconds = 100;

    // start up one or more players as concurrent asynchronous function calls
    const playerPromises: Array<Promise<void>> = [];
    for (let ii = 0; ii < players; ++ii) {
        playerPromises.push(player(ii));
    }
    // wait for all the players to finish (unless one throws an exception)
    await Promise.all(playerPromises);

    /** @param playerNumber player to simulate */
    async function player(playerNumber: number): Promise<void> {
        // TODO set up this player on the board if necessary

        for (let jj = 0; jj < tries; ++jj) {
            try {
                console.log("TRY NUMBER: ", jj);
                await timeout(0.1 + Math.random() * (2 - 0.1));
                // TODO try to flip over a first card at (randomInt(size), randomInt(size))
                //      which might wait until this player can control that card

                const r1 = randomInt(board.getRows());
                const c1 = randomInt(board.getCols());
                console.log(`Player ${playerNumber} tries to flip first card at (${r1}, ${c1})`);
                
                try {
                    await board.flipCard(r1, c1, playerNumber.toString());
                    console.log(`✅ Player ${playerNumber} successfully flipped first card`);
                } catch (err) {
                    console.log(`❌ Player ${playerNumber} failed first flip: ${err}`);
                    continue; // skip second flip if failed
                }

                // TODO and if that succeeded,
                //      try to flip over a second card at (randomInt(size), randomInt(size))
                const r2 = randomInt(board.getRows());
                const c2 = randomInt(board.getCols());
                console.log(`Player ${playerNumber} tries second flip at (${r2}, ${c2})`);

                try {
                    await board.flipCard(r2, c2, playerNumber.toString());
                    console.log(`SUCCESS! Player ${playerNumber} successfully flipped second card`);
                } catch (err) {
                    console.log(`FAIL! Player ${playerNumber} failed second flip: ${err}`);
                }

            } catch (err) {
                console.error('attempt to flip a card failed:', err);
            }
        }
    }
}

/**
 * Random positive integer generator
 * 
 * @param max a positive integer which is the upper bound of the generated number
 * @returns a random integer >= 0 and < max
 */
function randomInt(max: number): number {
    return Math.floor(Math.random() * max);
}


/**
 * @param milliseconds duration to wait
 * @returns a promise that fulfills no less than `milliseconds` after timeout() was called
 */
async function timeout(milliseconds: number): Promise<void> {
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, milliseconds);
    return promise;
}

void simulationMain();
