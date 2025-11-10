/* Copyright (c) 2021-25 MIT 6.102/6.031 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import { Board } from '../src/board.js';


/**
 * Tests for the Board abstract data type.
 */
describe('Board', function() {
    // Testing strategy
    //   TODO
});


/**
 * Example test case that uses async/await to test an asynchronous function.
 * Feel free to delete these example tests.
 */
describe('async test cases', function() {

    it('should parse a valid board file correctly', async function() {
        const board = await Board.parseFromFile('boards/ab.txt');

        // Basic dimension check
        assert.strictEqual(board.getRows(), 5);
        assert.strictEqual(board.getCols(), 5);

        // Board string check
        const boardStr = board.toString("testPlayer");
        console.log('Parsed board:\n', boardStr);
        assert.ok(boardStr.includes('down'), 'All cards should be initially down');
    });

    it('should reject a board file with invalid dimensions', async function() {
        await assert.rejects(
            Board.parseFromFile('boards/invalid.txt'),
            /Invalid board file format/
        );
    });

    it('reads a file asynchronously', async function() {
        const fileContents = (await fs.promises.readFile('boards/ab.txt')).toString();
        assert(fileContents.startsWith('5x5'));
    });

    it('should apply async map() correctly and preserve card states', async function() {
        const board = await Board.parseFromFile('boards/perfect.txt');
    
        // Async transformer function
        const f = async (value: string) => {
            await new Promise(res => setTimeout(res, 10));
            if (value === '🦄') return 'lollipop';
            if (value === '🌈') return 'sunshine';
            return value;
        };
    
        // Apply map
        await board.map(f);
    
        // Check values directly
        let values: string[] = [];
        for (let r = 0; r < board.getRows(); r++) {
            for (let c = 0; c < board.getCols(); c++) {
                values.push(board.getCard(r, c).getValue());
            }
        }
    
        // Assertions
        assert.ok(values.includes('lollipop'), 'Lollipops should appear');
        assert.ok(values.includes('sunshine'), 'Sunshine should appear');
        assert.ok(!values.includes('🦄'), 'Unicorns should be replaced');
        assert.ok(!values.includes('🌈'), 'Rainbows should be replaced');
    
        // Check states remain unchanged (all should still be 'down')
        for (let r = 0; r < board.getRows(); r++) {
            for (let c = 0; c < board.getCols(); c++) {
                assert.strictEqual(board.getCard(r, c).getState(), 'down', 'Card state should remain unchanged');
            }
        }
    });
});