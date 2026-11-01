// Add a hook for QUnit to report when tests are done.
// This will be called by Puppeteer.
QUnit.done(function (details) {
    if (window.onQunitDone) {
        window.onQunitDone(details);
    }
});

// Log individual test assertions to the console for more detailed debugging
QUnit.log(function (details) {
    if (!details.result) {
        let message = `QUnit Assertion Failed: ${details.module} > ${details.name}\n`
        message += `Message: ${details.message}\n`
        if (details.actual !== details.expected) {
            message += `Expected: ${details.expected}, Actual: ${details.actual}\n`
        }
        if (details.source) {
            message += `Source: ${details.source}\n`
        }
        console.error(message);
    }
});


QUnit.module('Typing Tutor', function (hooks) {
    let typingTutorInstance; // Declare a variable to hold the instance

    // This will run once before all tests in this module
    hooks.before(function () {
        typingTutorInstance = new TypingTutor();
        window.typingTutor = typingTutorInstance;
    });

    // Before each test, reset the state by calling initLesson on the instance
    hooks.beforeEach(function () {
        if (typingTutorInstance) {
            typingTutorInstance.initLesson();
        }
    });

    QUnit.test('initLesson: should initialize the lesson correctly', function (assert) {
        console.log('=====================');
        console.log('Running test: initLesson: should initialize the lesson correctly');
        const actualLessonText = window.typingTutor.lessonTextElement.textContent.trim().replace(/\s+/g, ' ');
        assert.equal(actualLessonText, 'the quick brown fox jumps over the lazy dog', 'Lesson text should be loaded correctly');
        assert.equal(window.typingTutor.userInputElement.value, '', 'User input should be cleared');
        assert.equal(window.typingTutor.wpmElement.textContent, '0', 'WPM should be reset to 0');
        assert.equal(window.typingTutor.accuracyElement.textContent, '100%', 'Accuracy should be reset to 100%');
        assert.equal(window.typingTutor.currentWordIndex, 0, 'currentWordIndex should be 0');
        assert.equal(window.typingTutor.currentCharIndex, 0, 'currentCharIndex should be 0');

        console.log('========= TEST DONE ============');
    });

    QUnit.test('handleLessonProgress: should advance to next word and clear input after completing a word', function (assert) {
        console.log('=====================');
        console.log('Running test: handleLessonProgress: should advance to next word and clear input after completing a word');
        // Type the full first word "the" plus a space to complete the word
        window.typingTutor.userInputElement.value = 'the ';
        window.typingTutor.userInputElement.dispatchEvent(new Event('input'));

        assert.equal(window.typingTutor.currentWordIndex, 1, 'currentWordIndex should advance after completing the first word');
        // The input is no longer cleared on word completion, so it should retain the typed text
        assert.equal(window.typingTutor.userInputElement.value, 'the ', 'User input should retain the typed word after completing a word');

        console.log('========= TEST DONE ============');
    });

    QUnit.test('User Input: should handle incorrect character input', function (assert) {
        console.log('=====================');
        console.log('Running test: User Input: should handle incorrect character input');
        // Simulate typing an incorrect character
        window.typingTutor.userInputElement.value = 'z';
        window.typingTutor.userInputElement.dispatchEvent(new Event('input'));

        const firstCharSpan = window.typingTutor.lessonTextElement.querySelector('.char-span');
        assert.ok(firstCharSpan.classList.contains('incorrect-char'), 'First character should be marked as incorrect');

        console.log('========= TEST DONE ============');
    });

    QUnit.test('User Input: updateCharacterFeedback should advance current-char and counters', function (assert) {
        console.log('=====================');
        console.log('Running test: User Input: updateCharacterFeedback should advance current-char and counters');
        // Arrange
        const done = assert.async();
        const originalHighlightCurrentKey = window.typingTutor.highlightCurrentKey;
        const highlightCalls = [];
        window.typingTutor.highlightCurrentKey = function (nextChar) {
            highlightCalls.push(nextChar);
        };

        // All character spans in the lesson text (outer span wraps inner per-character spans)
        const charSpans = window.typingTutor.lessonTextElement.querySelectorAll('.char-span');
        assert.ok(charSpans.length >= 2, 'Lesson should contain at least two characters for this test');

        // Act: type the first character
        window.typingTutor.userInputElement.value = charSpans[0].textContent;
        window.typingTutor.userInputElement.dispatchEvent(new Event('input'));

        // Assert after first character
        assert.ok(charSpans[0].classList.contains('correct-char'), 'First character should be marked as correct after first input');
        assert.ok(charSpans[1].classList.contains('current-char'), 'Second character should be highlighted as current after first input');

        if (typeof window.typingTutor.correctChars !== 'undefined' && typeof window.typingTutor.totalChars !== 'undefined') {
            assert.strictEqual(window.typingTutor.correctChars, 1, 'correctChars should be 1 after first correct input');
            assert.strictEqual(window.typingTutor.totalChars, 1, 'totalChars should be 1 after first input');
        }

        assert.ok(highlightCalls.length >= 1, 'highlightCurrentKey should be called after first input');
        if (highlightCalls.length >= 1) {
            const expectedNextChar = charSpans[1].textContent;
            assert.strictEqual(highlightCalls[highlightCalls.length - 1], expectedNextChar, 'highlightCurrentKey should be called with the next character after first input');
        }

        // Act: type the second character (append to existing value)
        window.typingTutor.userInputElement.value += charSpans[1].textContent;
        window.typingTutor.userInputElement.dispatchEvent(new Event('input'));

        // Assert after second character
        assert.ok(charSpans[0].classList.contains('correct-char'), 'First character should remain correct after second input');
        assert.ok(charSpans[1].classList.contains('correct-char'), 'Second character should be marked as correct after second input');
        if (charSpans.length > 2) {
            assert.ok(charSpans[2].classList.contains('current-char'), 'Third character should be highlighted as current after second input');
        }

        if (typeof window.typingTutor.correctChars !== 'undefined' && typeof window.typingTutor.totalChars !== 'undefined') {
            assert.strictEqual(window.typingTutor.correctChars, 2, 'correctChars should be 2 after two correct inputs');
            assert.strictEqual(window.typingTutor.totalChars, 2, 'totalChars should be 2 after two inputs');
        }

        assert.ok(highlightCalls.length >= 2, 'highlightCurrentKey should be called again after second input');
        if (highlightCalls.length >= 2 && charSpans.length > 2) {
            const expectedNextChar = charSpans[2].textContent;
            assert.strictEqual(highlightCalls[highlightCalls.length - 1], expectedNextChar, 'highlightCurrentKey should be called with the next character after second input');
        }

        // Cleanup
        window.typingTutor.highlightCurrentKey = originalHighlightCurrentKey;
        done();

        console.log('========= TEST DONE ============');
    });

    QUnit.test('User Input: updateCharacterFeedback should complete lesson and clear highlight', function (assert) {
        console.log('=====================');
        console.log('Running test: User Input: updateCharacterFeedback should complete lesson and clear highlight');
        // Arrange
        const done = assert.async();
        const originalHighlightCurrentKey = window.typingTutor.highlightCurrentKey;
        const highlightCalls = [];
        window.typingTutor.highlightCurrentKey = function (nextChar) {
            highlightCalls.push(nextChar);
        };

        const charSpans = window.typingTutor.lessonTextElement.querySelectorAll('.char-span');
        const totalLength = charSpans.length;
        assert.ok(totalLength > 0, 'Lesson should contain at least one character');

        // Build the full lesson string from the character spans
        let fullLessonText = '';
        charSpans.forEach(function (span) {
            fullLessonText += span.textContent;
        });

        // Act: type the full lesson text in one go
        window.typingTutor.userInputElement.value = fullLessonText;
        window.typingTutor.userInputElement.dispatchEvent(new Event('input'));

        // Assert: all characters are correct
        charSpans.forEach(function (span, index) {
            assert.ok(span.classList.contains('correct-char'), 'Character at index ' + index + ' should be marked as correct after completing lesson');
            assert.notOk(span.classList.contains('current-char'), 'No character should remain highlighted as current after completing lesson');
        });

        if (typeof window.typingTutor.correctChars !== 'undefined' && typeof window.typingTutor.totalChars !== 'undefined') {
            assert.strictEqual(window.typingTutor.correctChars, totalLength, 'correctChars should equal total lesson length when the lesson is completed');
            assert.strictEqual(window.typingTutor.totalChars, totalLength, 'totalChars should equal total lesson length for all-correct input');
        }

        assert.ok(highlightCalls.length >= 1, 'highlightCurrentKey should be called at least once while completing the lesson');
        if (highlightCalls.length >= 1) {
            assert.strictEqual(highlightCalls[highlightCalls.length - 1], '', 'highlightCurrentKey should be called with an empty string when the lesson is complete');
        }

        // Cleanup
        window.typingTutor.highlightCurrentKey = originalHighlightCurrentKey;
        done();

        console.log('========= TEST DONE ============');
    });

    QUnit.test('updateStats: should handle near-zero elapsed time without Infinity or NaN', function (assert) {
        console.log('=====================');
        console.log('Running test: updateStats: should handle near-zero elapsed time without Infinity or NaN');
        // Arrange: simulate a small but non-zero amount of typing
        window.typingTutor.correctChars = 10;
        window.typingTutor.totalChars = 10;

        // Set the start time to "now" so elapsed time is effectively zero
        window.typingTutor.startTime = Date.now();

        // Act
        window.typingTutor.updateStats();

        // Assert: WPM should be a finite, non-negative number
        const wpmText = (window.typingTutor.wpmElement && window.typingTutor.wpmElement.textContent) || '';
        const wpmValue = parseFloat(wpmText);

        assert.ok(Number.isFinite(wpmValue), 'WPM should be a finite number for near-zero elapsed time');
        assert.ok(wpmValue >= 0, 'WPM should not be negative for near-zero elapsed time');

        console.log('========= TEST DONE ============');
    });

    QUnit.test('updateStats: should treat 0/0 characters as 100% accuracy', function (assert) {
        console.log('=====================');
        console.log('Running test: updateStats: should treat 0/0 characters as 100% accuracy');
        // Arrange: no characters typed yet
        window.typingTutor.correctChars = 0;
        window.typingTutor.totalChars = 0;

        // Use a non-zero elapsed time so we isolate the 0/0 accuracy behavior
        window.typingTutor.startTime = Date.now() - 5000; // 5 seconds ago

        // Act
        window.typingTutor.updateStats();

        // Assert: accuracy should remain at 100% when no characters have been typed
        const accuracyText = (window.typingTutor.accuracyElement && window.typingTutor.accuracyElement.textContent) || '';
        assert.ok(
            accuracyText.indexOf('100') !== -1,
            'Accuracy should be displayed as 100% when no characters have been typed (0/0 case)'
        );

        console.log('========= TEST DONE ============');
    });

    QUnit.test('startTimer: initializes startTime and schedules timer interval', function (assert) {
        console.log('=====================');
        console.log('Running test: startTimer: initializes startTime and schedules timer interval');
        const done = assert.async();

        // Arrange: ensure timer-related globals are in a known state
        window.typingTutor.startTime = 0;
        if (typeof window.typingTutor.timerInterval !== 'undefined' && window.typingTutor.timerInterval) {
            clearInterval(window.typingTutor.timerInterval);
            window.typingTutor.timerInterval = null;
        }

        const originalSetInterval = window.setInterval;
        let setIntervalCalled = false;

        // Spy on setInterval to verify that a timer is scheduled
        window.setInterval = function (callback, delay) {
            setIntervalCalled = true;
            // Call through to preserve existing behavior
            return originalSetInterval(callback, delay);
        };

        // Act: call startTimer when startTime is 0
        window.typingTutor.startTimer();

        // Assert: startTime should be initialized
        assert.ok(window.typingTutor.startTime > 0, 'startTimer should set startTime when it was previously 0');
        assert.ok(setIntervalCalled, 'startTimer should schedule a timer via setInterval');

        // Cleanup: restore original setInterval
        window.setInterval = originalSetInterval;

        done();

        console.log('========= TEST DONE ============');
    });

    QUnit.test('updateStats: when startTime is 0 it should not update WPM or accuracy', function (assert) {
        console.log('=====================');
        console.log('Running test: updateStats: when startTime is 0 it should not update WPM or accuracy');
        const done = assert.async();

        // Arrange: ensure no timer is running and startTime is 0
        window.typingTutor.startTime = 0;
        if (typeof window.typingTutor.timerInterval !== 'undefined' && window.typingTutor.timerInterval) {
            clearInterval(window.typingTutor.timerInterval);
            window.typingTutor.timerInterval = null;
        }

        // Give WPM and accuracy elements known initial values
        if (window.typingTutor.wpmElement) {
            window.typingTutor.wpmElement.textContent = 'WPM: 0';
        }
        if (window.typingTutor.accuracyElement) {
            window.typingTutor.accuracyElement.textContent = 'Accuracy: 100%';
        }

        const initialWpmText = window.typingTutor.wpmElement && window.typingTutor.wpmElement.textContent;
        const initialAccuracyText = window.typingTutor.accuracyElement && window.typingTutor.accuracyElement.textContent;

        // Act: call updateStats with startTime === 0
        window.typingTutor.updateStats();

        // Assert: WPM and accuracy text should remain unchanged
        assert.strictEqual(
            window.typingTutor.wpmElement && window.typingTutor.wpmElement.textContent,
            initialWpmText,
            'WPM should not change when startTime is 0'
        );
        assert.strictEqual(
            window.typingTutor.accuracyElement && window.typingTutor.accuracyElement.textContent,
            initialAccuracyText,
            'Accuracy should not change when startTime is 0'
        );

        done();

        console.log('========= TEST DONE ============');
    });

    QUnit.test('updateStats: should calculate WPM and accuracy correctly', function (assert) {
        console.log('=====================');
        console.log('Running test: updateStats: should calculate WPM and accuracy correctly');
        // We need to control time for this test, so we'll simulate the passage of time
        const done = assert.async();

        // Simulate typing a word
        window.typingTutor.userInputElement.value = "the ";
        window.typingTutor.correctChars = 4;
        window.typingTutor.totalChars = 4;

        // Manually set the start time to 12 seconds ago (0.2 minutes)
        // WPM = (chars / 5) / minutes = (4 / 5) / 0.2 = 0.8 / 0.2 = 4 WPM
        window.typingTutor.startTime = new Date().getTime() - 12000;

        window.typingTutor.updateStats();

        assert.equal(window.typingTutor.wpmElement.textContent, '4', 'WPM should be calculated correctly');
        assert.equal(window.typingTutor.accuracyElement.textContent, '100%', 'Accuracy should be 100%');

        // Now, simulate an error
        window.typingTutor.userInputElement.value = "the z";
        window.typingTutor.correctChars = 4;
        window.typingTutor.totalChars = 5;

        window.typingTutor.updateStats();

        assert.equal(window.typingTutor.accuracyElement.textContent, '80%', 'Accuracy should be updated to 80%');

        done();

        console.log('========= TEST DONE ============');
    });

    QUnit.test('Virtual Keyboard: should highlight the current key to be pressed', function (assert) {
        console.log('=====================');
        console.log('Running test: Virtual Keyboard: should highlight the current key to be pressed');
        window.typingTutor.initLesson(); // Ensure we are at the start of the lesson

        // The first character is 't'
        window.typingTutor.highlightCurrentKey('t');
        let activeKey = window.typingTutor.virtualKeyboardElement.querySelector('.key.active');
        assert.ok(activeKey, 'A key should be active');
        assert.equal(activeKey.dataset.key, 't', 'The key "t" should be highlighted');

        // Simulate typing 't' and a space, next char is 'q' from "quick"
        window.typingTutor.highlightCurrentKey('q');
        activeKey = window.typingTutor.virtualKeyboardElement.querySelector('.key.active');
        assert.ok(activeKey, 'A new key should be active');
        assert.equal(activeKey.dataset.key, 'q', 'The key "q" should be highlighted after "t "');

        console.log('========= TEST DONE ============');
    });

    QUnit.test('Virtual Keyboard: should highlight space key and clear other highlights', function (assert) {
        console.log('=====================');
        console.log('Running test: Virtual Keyboard: should highlight space key and clear other highlights');
        window.typingTutor.initLesson();

        // Start with a normal character highlighted
        window.typingTutor.highlightCurrentKey('t');
        let activeKeys = window.typingTutor.virtualKeyboardElement.querySelectorAll('.key.active');
        assert.ok(activeKeys.length >= 1, 'At least one key should be active after highlighting "t"');

        // Now highlight space and ensure only the space key is active
        window.typingTutor.highlightCurrentKey(' ');
        activeKeys = window.typingTutor.virtualKeyboardElement.querySelectorAll('.key.active');
        assert.equal(activeKeys.length, 1, 'Only one key should be active for space');
        assert.equal(activeKeys[0].dataset.key, 'space', 'The space key should be highlighted');

        console.log('========= TEST DONE ============');
    });

    QUnit.test('Virtual Keyboard: should highlight punctuation keys when present', function (assert) {
        console.log('=====================');
        console.log('Running test: Virtual Keyboard: should highlight punctuation keys when present');
        window.typingTutor.initLesson();

        // Highlight comma; highlightCurrentKey has special handling for punctuation
        window.typingTutor.highlightCurrentKey(',');
        let activeKey = window.typingTutor.virtualKeyboardElement.querySelector('.key.active');
        assert.ok(activeKey, 'A key should be active for comma');
        assert.equal(activeKey.dataset.key, ',', 'The "," key should be highlighted');

        console.log('========= TEST DONE ============');
    });

    QUnit.test('Virtual Keyboard: should clear highlights when given empty input', function (assert) {
        console.log('=====================');
        console.log('Running test: Virtual Keyboard: should clear highlights when given empty input');
        window.typingTutor.initLesson();

        // Highlight a normal key first
        window.typingTutor.highlightCurrentKey('t');
        let activeKey = window.typingTutor.virtualKeyboardElement.querySelector('.key.active');
        assert.ok(activeKey, 'A key should be active after highlighting "t"');
        assert.equal(activeKey.dataset.key, 't', 'The "t" key should initially be highlighted');

        // Now clear highlights
        window.typingTutor.highlightCurrentKey('');
        activeKey = window.typingTutor.virtualKeyboardElement.querySelector('.key.active');
        assert.strictEqual(activeKey, null, 'No key should be active after clearing highlights');

        console.log('========= TEST DONE ============');
    });

    QUnit.test('Virtual Keyboard: physical key events highlight keys when input is focused', function (assert) {
        console.log('=====================');
        console.log('Running test: Virtual Keyboard: physical key events highlight keys when input is focused');
        // Ensure input is focused so global handlers are active
        window.typingTutor.userInputElement.focus();

        function triggerKey(key, eventType) {
            const event = new KeyboardEvent(eventType, { key });
            document.dispatchEvent(event);
        }

        // Space key -> expect normalized "space"
        triggerKey(' ', 'keydown');
        let activeKey = window.typingTutor.virtualKeyboardElement.querySelector('.key.active');
        assert.ok(activeKey, 'A key should be active after space keydown');
        assert.equal(activeKey.dataset.key, 'space', 'Spacebar should map to data-key="space"');

        triggerKey(' ', 'keyup');
        activeKey = window.typingTutor.virtualKeyboardElement.querySelector('.key.active');
        assert.notOk(activeKey, 'No key should remain active after space keyup');

        // Enter key -> expect normalized "enter"
        triggerKey('Enter', 'keydown');
        activeKey = window.typingTutor.virtualKeyboardElement.querySelector('.key.active');
        assert.ok(activeKey, 'A key should be active after Enter keydown');
        assert.equal(activeKey.dataset.key, 'enter', 'Enter should map to data-key="enter"');

        triggerKey('Enter', 'keyup');
        activeKey = window.typingTutor.virtualKeyboardElement.querySelector('.key.active');
        assert.notOk(activeKey, 'No key should remain active after Enter keyup');

        console.log('========= TEST DONE ============');
    });

    QUnit.test('Virtual Keyboard: physical key events are ignored when input is not focused', function (assert) {
        console.log('=====================');
        console.log('Running test: Virtual Keyboard: physical key events are ignored when input is not focused');
        // Explicitly blur the input to ensure it is not focused
        window.typingTutor.userInputElement.blur();

        function triggerKey(key, eventType) {
            const event = new KeyboardEvent(eventType, { key });
            document.dispatchEvent(event);
        }

        triggerKey(' ', 'keydown');
        triggerKey('Enter', 'keydown');

        const activeKey = window.typingTutor.virtualKeyboardElement.querySelector('.key.active');
        assert.notOk(activeKey, 'No key should be active when input is not focused');

        // Even after keyup, there still should be no active key
        triggerKey(' ', 'keyup');
        triggerKey('Enter', 'keyup');

        const activeKeyAfterKeyup = window.typingTutor.virtualKeyboardElement.querySelector('.key.active');
        assert.notOk(activeKeyAfterKeyup, 'No key should be active after keyup when input is not focused');

        console.log('========= TEST DONE ============');
    });

    function selectLessonLength(length) {
        window.typingTutor.lessonLengthElement.value = length;
        window.typingTutor.lessonLengthElement.dispatchEvent(new Event('change'));
    }

    QUnit.test('Lesson Length: lessons get longer from short to long and are typeable', function (assert) {
        const wordCounts = { short: [1, 15], medium: [20, 40], long: [60, 100] };

        Object.keys(wordCounts).forEach(function (length) {
            const [min, max] = wordCounts[length];
            window.typingTutor.lessons[length].forEach(function (lesson) {
                const count = lesson.split(' ').length;
                assert.ok(count >= min && count <= max, `${length} lesson should have ${min}-${max} words, has ${count}`);
                assert.ok(/^[a-z]+( [a-z]+)*$/.test(lesson), `${length} lesson should only use lowercase words and single spaces`);
            });
        });
    });

    QUnit.test('Lesson Length: changing the length loads its first lesson and resets progress', function (assert) {
        window.typingTutor.currentLessonIndex = 2;
        window.typingTutor.userInputElement.value = 'the ';
        window.typingTutor.userInputElement.dispatchEvent(new Event('input'));

        ['medium', 'long', 'short'].forEach(function (length) {
            selectLessonLength(length);

            assert.equal(window.typingTutor.currentLesson.join(' '), window.typingTutor.lessons[length][0], `First ${length} lesson should be loaded`);
            assert.equal(window.typingTutor.lessonTextElement.textContent, window.typingTutor.lessons[length][0], `First ${length} lesson should be rendered`);
            assert.equal(window.typingTutor.userInputElement.value, '', 'User input should be cleared');
            assert.equal(window.typingTutor.currentWordIndex, 0, 'currentWordIndex should be reset');
        });
    });

    QUnit.test('Lesson Length: restarting keeps the selected length and lesson', function (assert) {
        selectLessonLength('long');
        window.typingTutor.restartButton.click();

        assert.equal(window.typingTutor.currentLesson.join(' '), window.typingTutor.lessons.long[0], 'Long lesson should still be loaded after restart');
    });

    QUnit.test('Lesson Length: completing a lesson moves to the next one of the same length', function (assert) {
        const done = assert.async();
        const originalAlert = window.alert;
        window.alert = function () {};

        selectLessonLength('medium');
        window.typingTutor.userInputElement.value = window.typingTutor.lessons.medium[0];
        window.typingTutor.userInputElement.dispatchEvent(new Event('input'));

        setTimeout(function () {
            assert.equal(window.typingTutor.currentLesson.join(' '), window.typingTutor.lessons.medium[1], 'Second medium lesson should be loaded');

            window.alert = originalAlert;
            window.typingTutor.currentLessonIndex = 0;
            done();
        }, 200);
    });

    QUnit.test('Lesson Length: repeatedly changing the length does not stack input listeners', function (assert) {
        selectLessonLength('medium');
        selectLessonLength('long');
        window.typingTutor.restartButton.click();

        const originalUpdateStats = window.typingTutor.updateStats;
        let calls = 0;
        window.typingTutor.updateStats = function () {
            calls++;
        };

        window.typingTutor.userInputElement.value = 'l';
        window.typingTutor.userInputElement.dispatchEvent(new Event('input'));

        assert.equal(calls, 1, 'A single input event should be handled exactly once');

        window.typingTutor.updateStats = originalUpdateStats;
    });
});