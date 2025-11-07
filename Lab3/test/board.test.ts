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
        const boardStr = board.toString();
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

        const originalState = board.getCard(0, 0).state;

        // Define an async transformer function (simulating async delay)
        const f = async (value: string) => {
            // small delay to simulate async operation
            await new Promise(res => setTimeout(res, 10));
            if (value === '🦄') return 'lollipop';
            if (value === '🌈') return 'sunshine';
            return value; // unchanged otherwise
        };

        await board.map(f);

         // Convert to string
         const boardStr = board.toString();
         console.log('Board after map():\n', boardStr);

        assert.ok(!boardStr.includes('🦄'), 'Unicorns should be replaced');
        assert.ok(!boardStr.includes('🌈'), 'Rainbows should be replaced');
        assert.ok(boardStr.includes('lollipop'), 'Lollipops should appear');
        assert.ok(boardStr.includes('sunshine'), 'Sunshine should appear');

        const sameCardAfter = board.getCard(0, 0);
        assert.strictEqual(
            sameCardAfter.state,
            originalState,
            'Card state should remain unchanged after map()'
        );
    });
});
