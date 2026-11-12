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

    function typeIntoInput(text) {
        window.typingTutor.userInputElement.value = text;
        window.typingTutor.userInputElement.dispatchEvent(new Event('input'));
    }

    function charSpans() {
        return window.typingTutor.lessonTextElement.querySelectorAll('.char-span');
    }

    function activeKeyName() {
        const activeKey = window.typingTutor.virtualKeyboardElement.querySelector('.key.active');
        return activeKey ? activeKey.dataset.key : null;
    }

    QUnit.test('initLesson: should initialize the lesson correctly', function (assert) {
        const actualLessonText = window.typingTutor.lessonTextElement.textContent.trim().replace(/\s+/g, ' ');
        assert.equal(actualLessonText, 'the quick brown fox jumps over the lazy dog', 'Lesson text should be loaded correctly');
        assert.equal(window.typingTutor.userInputElement.value, '', 'User input should be cleared');
        assert.equal(window.typingTutor.wpmElement.textContent, '0', 'WPM should be reset to 0');
        assert.equal(window.typingTutor.accuracyElement.textContent, '100%', 'Accuracy should be reset to 100%');
        assert.ok(charSpans()[0].classList.contains('current-char'), 'First character should be the current one');
        assert.equal(window.typingTutor.lessonTextElement.querySelectorAll('.current-char').length, 1, 'Only one character should be current');
    });

    QUnit.test('User Input: completing a word keeps the input and moves on to the next word', function (assert) {
        typeIntoInput('the ');

        const spans = charSpans();
        for (let i = 0; i < 4; i++) {
            assert.ok(spans[i].classList.contains('correct-char'), `Character ${i} of "the " should be marked as correct`);
        }
        assert.ok(spans[4].classList.contains('current-char'), 'First character of "quick" should be the current one');
        assert.equal(activeKeyName(), 'q', 'The "q" key should be highlighted next');
        assert.equal(window.typingTutor.userInputElement.value, 'the ', 'User input should retain the typed word after completing a word');
    });

    QUnit.test('User Input: should handle incorrect character input', function (assert) {
        typeIntoInput('z');

        assert.ok(charSpans()[0].classList.contains('incorrect-char'), 'First character should be marked as incorrect');
        assert.ok(charSpans()[1].classList.contains('current-char'), 'Second character should be the current one');
        assert.equal(activeKeyName(), 'h', 'The key for the second character should be highlighted');
    });

    QUnit.test('User Input: typing shows accuracy straight away', function (assert) {
        typeIntoInput('tz');
        assert.equal(window.typingTutor.accuracyElement.textContent, '50%', 'One of two characters correct');

        typeIntoInput('t');
        assert.equal(window.typingTutor.accuracyElement.textContent, '100%', 'Backspacing over the mistake forgets it');
    });

    QUnit.test('User Input: completing the lesson marks everything correct and clears the key highlight', function (assert) {
        const done = assert.async();
        const originalAlert = window.alert;
        window.alert = function () {};

        typeIntoInput(window.typingTutor.lessons.short[0]);

        charSpans().forEach(function (span, index) {
            assert.ok(span.classList.contains('correct-char'), 'Character at index ' + index + ' should be marked as correct');
        });
        assert.equal(window.typingTutor.lessonTextElement.querySelectorAll('.current-char').length, 0, 'No character should remain current');
        assert.strictEqual(activeKeyName(), null, 'No key should be highlighted');
        assert.true(window.typingTutor.userInputElement.disabled, 'Input should be disabled until the next lesson loads');

        setTimeout(function () {
            window.alert = originalAlert;
            window.typingTutor.currentLessonIndex = 0;
            done();
        }, 200);
    });

    QUnit.test('User Input: the first keystroke starts one stats timer', function (assert) {
        typeIntoInput('t');
        const timer = window.typingTutor.timerInterval;
        assert.notStrictEqual(timer, null, 'A timer should be running after the first keystroke');

        typeIntoInput('th');
        assert.strictEqual(window.typingTutor.timerInterval, timer, 'Later keystrokes should not start another timer');

        window.typingTutor.restartButton.click();
        assert.strictEqual(window.typingTutor.timerInterval, null, 'Restarting should stop the timer');
    });

    QUnit.test('Virtual Keyboard: should highlight the current key to be pressed', function (assert) {
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
    });

    QUnit.test('Virtual Keyboard: should highlight space key and clear other highlights', function (assert) {
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
    });

    QUnit.test('Virtual Keyboard: should highlight punctuation keys when present', function (assert) {
        window.typingTutor.initLesson();

        // Highlight comma; highlightCurrentKey has special handling for punctuation
        window.typingTutor.highlightCurrentKey(',');
        let activeKey = window.typingTutor.virtualKeyboardElement.querySelector('.key.active');
        assert.ok(activeKey, 'A key should be active for comma');
        assert.equal(activeKey.dataset.key, ',', 'The "," key should be highlighted');
    });

    QUnit.test('Virtual Keyboard: should clear highlights when given empty input', function (assert) {
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
    });

    QUnit.test('Virtual Keyboard: physical key events highlight keys when input is focused', function (assert) {
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
    });

    QUnit.test('Virtual Keyboard: physical key events are ignored when input is not focused', function (assert) {
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
    });

    function selectLessonLength(length) {
        window.typingTutor.lessonLengthElement.value = length;
        window.typingTutor.lessonLengthElement.dispatchEvent(new Event('change'));
    }

    QUnit.test('Lesson Length: lessons get longer from short to long and are typeable', function (assert) {
        const wordCounts = { short: [5, 12], medium: [25, 30], long: [70, 80] };

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

            assert.equal(window.typingTutor.session.lessonText, window.typingTutor.lessons[length][0], `First ${length} lesson should be loaded`);
            assert.equal(window.typingTutor.lessonTextElement.textContent, window.typingTutor.lessons[length][0], `First ${length} lesson should be rendered`);
            assert.equal(window.typingTutor.userInputElement.value, '', 'User input should be cleared');
            assert.equal(window.typingTutor.session.snapshot().nextIndex, 0, 'Progress should be reset');
        });
    });

    QUnit.test('Lesson Length: restarting resets progress but keeps the selected length and lesson', function (assert) {
        selectLessonLength('long');
        window.typingTutor.currentLessonIndex = 1;
        window.typingTutor.initLesson();

        const lesson = window.typingTutor.lessons.long[1];
        window.typingTutor.userInputElement.value = lesson.split(' ')[0] + ' ';
        window.typingTutor.userInputElement.dispatchEvent(new Event('input'));
        assert.ok(window.typingTutor.session.snapshot().nextIndex > 0, 'Progress should be made before restarting');

        window.typingTutor.restartButton.click();

        assert.equal(window.typingTutor.userInputElement.value, '', 'User input should be cleared after restart');
        assert.equal(window.typingTutor.session.snapshot().nextIndex, 0, 'Progress should be reset after restart');
        assert.equal(window.typingTutor.session.snapshot().correctChars, 0, 'Correct characters should be reset after restart');
        assert.equal(window.typingTutor.lessonLengthElement.value, 'long', 'Selected length should be kept after restart');
        assert.equal(window.typingTutor.session.lessonText, lesson, 'Current long lesson should be kept after restart');

        window.typingTutor.currentLessonIndex = 0;
    });

    QUnit.test('Lesson Length: completing a lesson moves to the next one of the same length', function (assert) {
        const done = assert.async();
        const originalAlert = window.alert;
        window.alert = function () {};

        selectLessonLength('medium');
        window.typingTutor.userInputElement.value = window.typingTutor.lessons.medium[0];
        window.typingTutor.userInputElement.dispatchEvent(new Event('input'));

        setTimeout(function () {
            assert.equal(window.typingTutor.session.lessonText, window.typingTutor.lessons.medium[1], 'Second medium lesson should be loaded');

            window.alert = originalAlert;
            window.typingTutor.currentLessonIndex = 0;
            done();
        }, 200);
    });

    QUnit.test('Lesson Length: repeatedly changing the length does not stack input listeners', function (assert) {
        selectLessonLength('medium');
        selectLessonLength('long');
        window.typingTutor.restartButton.click();

        const session = window.typingTutor.session;
        let calls = 0;
        session.type = function (...args) {
            calls++;
            return TypingSession.prototype.type.apply(this, args);
        };

        window.typingTutor.userInputElement.value = 'l';
        window.typingTutor.userInputElement.dispatchEvent(new Event('input'));

        assert.equal(calls, 1, 'A single input event should be handled exactly once');
    });

    QUnit.module('Theme', function (themeHooks) {
        const originalMatchMedia = window.matchMedia;

        function stubSystemTheme(theme) {
            window.matchMedia = function (query) {
                return { matches: query === `(prefers-color-scheme: ${theme})` };
            };
        }

        themeHooks.beforeEach(function () {
            localStorage.removeItem('theme');
            window.typingTutor.applyTheme('light');
        });

        themeHooks.afterEach(function () {
            window.matchMedia = originalMatchMedia;
            localStorage.removeItem('theme');
            window.typingTutor.applyTheme('light');
        });

        QUnit.test('toggle: switches the theme both ways and updates the label', function (assert) {
            const toggle = window.typingTutor.themeToggleElement;
            assert.equal(toggle.textContent, 'Dark mode', 'Light theme offers dark mode');

            toggle.click();
            assert.equal(document.documentElement.dataset.theme, 'dark', 'Dark theme should be applied');
            assert.equal(toggle.textContent, 'Light mode', 'Dark theme offers light mode');

            toggle.click();
            assert.equal(document.documentElement.dataset.theme, 'light', 'Light theme should be applied');
            assert.equal(toggle.textContent, 'Dark mode', 'Light theme offers dark mode again');
        });

        QUnit.test('toggle: saves the choice, which wins over the system preference', function (assert) {
            window.typingTutor.themeToggleElement.click();
            assert.equal(localStorage.getItem('theme'), 'dark', 'Choice should be saved');

            stubSystemTheme('light');
            assert.equal(window.typingTutor.getInitialTheme(), 'dark', 'Saved choice should win');
        });

        QUnit.test('getInitialTheme: follows the system preference when nothing is saved', function (assert) {
            stubSystemTheme('dark');
            assert.equal(window.typingTutor.getInitialTheme(), 'dark', 'Should follow a dark system');

            stubSystemTheme('light');
            assert.equal(window.typingTutor.getInitialTheme(), 'light', 'Should follow a light system');
        });

        QUnit.test('getInitialTheme: ignores an unknown saved value', function (assert) {
            localStorage.setItem('theme', 'sepia');
            stubSystemTheme('dark');
            assert.equal(window.typingTutor.getInitialTheme(), 'dark', 'Should fall back to the system preference');
        });

        QUnit.test('toggle: keeps lesson progress and returns focus to the input', function (assert) {
            const input = window.typingTutor.userInputElement;
            input.value = 'the ';
            input.dispatchEvent(new Event('input'));

            window.typingTutor.themeToggleElement.focus();
            window.typingTutor.themeToggleElement.click();

            assert.equal(input.value, 'the ', 'Typed text should be kept');
            assert.equal(window.typingTutor.session.snapshot().nextIndex, 4, 'Progress should be kept');
            assert.equal(document.activeElement, input, 'Focus should return to the input');
        });

        QUnit.test('initLesson: keeps the current theme and does not stack toggle listeners', function (assert) {
            window.typingTutor.themeToggleElement.click();
            window.typingTutor.initLesson();
            assert.equal(document.documentElement.dataset.theme, 'dark', 'Theme should survive a restart');
            assert.equal(window.typingTutor.themeToggleElement.textContent, 'Light mode', 'Label should match the theme');

            window.typingTutor.themeToggleElement.click();
            assert.equal(document.documentElement.dataset.theme, 'light', 'One click should switch the theme exactly once');
        });

        QUnit.test('toggle: tells the user when the choice cannot be saved', function (assert) {
            const originalSetItem = Storage.prototype.setItem;
            Storage.prototype.setItem = function () {
                throw new Error('Storage is blocked');
            };

            const toggle = window.typingTutor.themeToggleElement;
            const status = window.typingTutor.themeStatusElement;
            assert.equal(status.textContent, '', 'No message before a failed save');

            toggle.click();
            assert.equal(document.documentElement.dataset.theme, 'dark', 'Theme should still be applied');
            assert.ok(status.textContent.includes('reset'), 'Message should explain the theme will reset');
            assert.equal(document.activeElement, window.typingTutor.userInputElement, 'Focus should return to the input');

            Storage.prototype.setItem = originalSetItem;

            toggle.click();
            assert.equal(status.textContent, '', 'Message should clear after a successful save');
        });

        QUnit.test('initLesson: still works on a page without the toggle button', function (assert) {
            window.typingTutor.themeToggleElement.remove();
            window.typingTutor.initLesson();

            assert.equal(window.typingTutor.themeToggleElement, null, 'Toggle should be missing');
            assert.ok(window.typingTutor.virtualKeyboardElement.querySelector('.key'), 'Lesson should still be set up');
        });

        QUnit.test('storage event: follows a theme change from another tab', function (assert) {
            localStorage.setItem('theme', 'dark');
            window.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: 'dark' }));

            assert.equal(document.documentElement.dataset.theme, 'dark', 'Theme should follow the other tab');
            assert.equal(window.typingTutor.themeToggleElement.textContent, 'Light mode', 'Label should match the theme');

            window.typingTutor.themeToggleElement.click();
            assert.equal(localStorage.getItem('theme'), 'light', 'The next toggle should start from the synced theme');
        });

        QUnit.test('storage event: falls back to the system preference when storage is cleared', function (assert) {
            stubSystemTheme('dark');
            window.dispatchEvent(new StorageEvent('storage', { key: null }));

            assert.equal(document.documentElement.dataset.theme, 'dark', 'Theme should follow the system preference');
        });

        QUnit.test('storage event: ignores changes to other keys', function (assert) {
            localStorage.setItem('theme', 'dark');
            window.dispatchEvent(new StorageEvent('storage', { key: 'something-else' }));

            assert.equal(document.documentElement.dataset.theme, 'light', 'Theme should not change');
        });
    });
});