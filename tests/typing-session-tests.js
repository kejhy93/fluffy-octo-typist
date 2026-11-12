QUnit.module('Typing Session', function () {
    QUnit.test('before any typing: everything pending, no stats yet', function (assert) {
        const session = new TypingSession('ab c');
        const snapshot = session.snapshot();

        assert.deepEqual(snapshot.chars, ['pending', 'pending', 'pending', 'pending']);
        assert.equal(snapshot.nextIndex, 0);
        assert.equal(snapshot.nextChar, 'a');
        assert.equal(snapshot.correctChars, 0);
        assert.equal(snapshot.totalChars, 0);
        assert.false(snapshot.complete);
        assert.equal(snapshot.wpm, 0);
        assert.equal(snapshot.accuracy, 100);
        assert.strictEqual(session.stats(60000), null, 'No stats before the first keystroke');
    });

    QUnit.test('marks each typed character correct or incorrect and moves to the next one', function (assert) {
        const session = new TypingSession('ab c');
        const snapshot = session.type('ax', 0);

        assert.deepEqual(snapshot.chars, ['correct', 'incorrect', 'pending', 'pending']);
        assert.equal(snapshot.nextIndex, 2);
        assert.equal(snapshot.nextChar, ' ');
        assert.equal(snapshot.correctChars, 1);
        assert.equal(snapshot.totalChars, 2);
        assert.equal(snapshot.accuracy, 50);
    });

    QUnit.test('rounds accuracy to a whole number', function (assert) {
        const session = new TypingSession('abc');
        assert.equal(session.type('axc', 0).accuracy, 67);
    });

    QUnit.test('backspacing over a mistake forgets it', function (assert) {
        const session = new TypingSession('abc');
        session.type('ax', 0);
        const snapshot = session.type('a', 100);

        assert.deepEqual(snapshot.chars, ['correct', 'pending', 'pending']);
        assert.equal(snapshot.accuracy, 100);
    });

    QUnit.test('is complete only when the typed text matches the lesson exactly', function (assert) {
        const session = new TypingSession('ab');
        assert.false(session.type('ax', 0).complete, 'Same length with a mistake is not complete');

        const snapshot = session.type('ab', 100);
        assert.true(snapshot.complete);
        assert.equal(snapshot.nextIndex, 2);
        assert.equal(snapshot.nextChar, '', 'Nothing left to type');
    });

    QUnit.test('ignores characters typed past the end of the lesson', function (assert) {
        const session = new TypingSession('ab');
        const snapshot = session.type('abzz', 0);

        assert.equal(snapshot.totalChars, 2);
        assert.equal(snapshot.correctChars, 2);
        assert.equal(snapshot.chars.length, 2);
        assert.false(snapshot.complete);
    });

    QUnit.test('WPM counts five correct characters as one word, from the first keystroke', function (assert) {
        const session = new TypingSession('abcde fghij');
        session.type('a', 1000);
        const snapshot = session.type('abcde zzzzz', 1000 + 60000);

        // 6 correct characters = 1.2 words in one minute; all 11 typed characters would give 2
        assert.equal(snapshot.wpm, 1);
    });

    QUnit.test('WPM is 0 when no time has passed', function (assert) {
        const session = new TypingSession('abcde');
        assert.equal(session.type('abcde', 5000).wpm, 0);
    });

    QUnit.test('the first keystroke starts the clock even when the text is empty', function (assert) {
        const session = new TypingSession('abcde');
        session.type('', 0);
        assert.deepEqual(session.stats(30000), { wpm: 0, accuracy: 100 });

        session.type('abcde', 30000);
        assert.equal(session.snapshot().wpm, 2, '1 word in half a minute');
    });

    QUnit.test('later keystrokes do not restart the clock', function (assert) {
        const session = new TypingSession('abcdefghij');
        session.type('a', 0);
        session.type('abcde', 30000);
        assert.equal(session.type('abcdefghij', 60000).wpm, 2);
    });

    QUnit.test('stats uses the latest typing at a later time', function (assert) {
        const session = new TypingSession('abcdefghij');
        session.type('abcdexxxxx', 0);

        assert.deepEqual(session.stats(60000), { wpm: 1, accuracy: 50 }, '5 correct of 10: 1 word in one minute (all 10 typed would give 2)');
    });

    QUnit.test('snapshot returns the latest result without changing it', function (assert) {
        const session = new TypingSession('ab');
        const expected = JSON.parse(JSON.stringify(session.type('a', 0)));

        assert.deepEqual(session.snapshot(), expected);
        assert.deepEqual(session.snapshot(), expected, 'Calling it twice gives the same answer');
    });
});
