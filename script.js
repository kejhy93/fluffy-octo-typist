class TypingTutor {
    constructor() {
        this.lessonTextElement = null;
        this.userInputElement = null;
        this.virtualKeyboardElement = null;
        this.wpmElement = null;
        this.accuracyElement = null;
        this.restartButton = null;
        this.lessonLengthElement = null;

        this.lessons = {
            short: [
                "the quick brown fox jumps over the lazy dog",
                "never underestimate the power of a good book",
                "practice makes perfect keep on typing",
                "type every day to improve your speed and accuracy",
                "hello world this is a typing test for you to try"
            ],
            medium: [
                "a steady rhythm matters more than raw speed when you are learning to type so keep your fingers on the home row and let your eyes stay on the screen",
                "the old lighthouse stood at the edge of the cliff and every night its bright beam swept across the dark water to guide the fishing boats safely home",
                "good habits are built slowly through small daily efforts and even ten minutes of focused practice each morning can make a real difference over a few short weeks",
                "the market opens early on saturday when farmers bring baskets of fresh apples warm bread and honey from the hills while children chase each other between the busy stalls",
                "when the rain finally stopped we packed our bags and walked along the river until the sun came out and the whole valley began to shine"
            ],
            long: [
                "learning to touch type feels awkward at first because your hands want to go back to the old habits they already know but the awkward stage does not last very long if you practice a little every day and resist the urge to look down at the keys soon your fingers begin to find their own way and the words start to flow from your mind to the screen without much thought at all",
                "the train left the city just before dawn and rolled slowly past empty factories and sleeping houses until the last street lights faded behind us by the time the sun rose we were climbing through green hills dotted with small farms and grazing sheep an old man across from me unwrapped a piece of bread and offered me half of it and we shared it in silence while the mountains grew larger in the window",
                "every good garden begins with patience and a willingness to get your hands dirty in early spring you turn the soil and pull the stubborn weeds and plant small seeds that look like they could never become anything at all then you water them and wait through the cool mornings and the warm afternoons until one day a thin green shoot pushes through the ground and all of that quiet work starts to make sense",
                "the small library on the corner has been open for almost a hundred years and it still smells of old paper and floor polish the children come after school to read about dragons and distant planets while the older visitors sit by the window with their newspapers and their reading glasses the woman at the front desk knows nearly everyone by name and she always seems to know which book you need before you ask",
                "cooking a meal for friends is one of the simplest ways to spend a good evening you start in the afternoon by chopping onions and garlic while the radio plays in the background then the kitchen slowly fills with the smell of butter and fresh herbs when your guests arrive they gather around the table and pour the wine and tell the same old stories and nobody really minds if the food comes out a little late"
            ]
        };

        this.currentLessonIndex = 0;
        this.currentLesson = []; // Array of words for the current lesson
        this.currentWordIndex = 0;
        this.currentCharIndex = 0;
        this.correctChars = 0;
        this.totalChars = 0;
        this.startTime = 0;
        this.timerInterval = null;
        this.lessonCompleteTimeout = null;

        this.keyboardLayout = [
            ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'backspace'],
            ['tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
            ['capslock', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\'', 'enter'],
            ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'shift'],
            ['ctrl', 'alt', 'space', 'alt', 'ctrl']
        ];

        // Stable references, so calling initLesson again doesn't stack duplicate listeners
        this.handleUserInput = this.handleUserInput.bind(this);
        this.initLesson = this.initLesson.bind(this);
        this.changeLessonLength = this.changeLessonLength.bind(this);
    }

    initLesson() {
        // Assign DOM elements inside initLesson, so they are retrieved when the DOM is ready or fixture is set
        this.lessonTextElement = document.getElementById('lesson-text');
        this.userInputElement = document.getElementById('user-input');
        this.virtualKeyboardElement = document.getElementById('virtual-keyboard');
        this.wpmElement = document.getElementById('wpm');
        this.accuracyElement = document.getElementById('accuracy');
        this.restartButton = document.getElementById('restart-button');
        this.lessonLengthElement = document.getElementById('lesson-length');

        this.currentLesson = this.lessons[this.lessonLengthElement.value][this.currentLessonIndex].split(' ');
        this.currentWordIndex = 0;
        this.currentCharIndex = 0;
        this.correctChars = 0;
        this.totalChars = 0;
        this.startTime = 0;
        this.wpmElement.textContent = '0';
        this.accuracyElement.textContent = '100%';
        this.userInputElement.value = '';
        this.userInputElement.disabled = false;
        this.userInputElement.focus();
        clearInterval(this.timerInterval);
        clearTimeout(this.lessonCompleteTimeout);
        this.renderLessonText();
        this.renderVirtualKeyboard();
        this.highlightCurrentKey(''); // Clear any previous key highlights

        // Re-attach event listeners here, as the elements might be re-created by QUnit fixture
        this.userInputElement.addEventListener('input', this.handleUserInput);
        this.restartButton.addEventListener('click', this.initLesson);
        this.lessonLengthElement.addEventListener('change', this.changeLessonLength);
    }

    changeLessonLength() {
        this.currentLessonIndex = 0;
        this.initLesson();
    }

    handleUserInput() {
        this.startTimer();
        this.updateCharacterFeedback();
        this.handleLessonProgress();
        this.updateStats();
    }

    updateCharacterFeedback() {
        const typedText = this.userInputElement.value;
        const lessonText = this.currentLesson.join(' ');
        const allSpans = this.lessonTextElement.querySelectorAll('.char-span');

        console.log('--- updateCharacterFeedback started ---');
        console.log('typedText:', typedText);
        console.log('lessonText:', lessonText);

        allSpans.forEach(span => span.classList.remove('correct-char', 'incorrect-char', 'current-char'));

        let newCorrectChars = 0;
        let newTotalChars = 0;
        let upToChar = -1;

        for (let i = 0; i < typedText.length; i++) {
            const charSpan = allSpans[i];
            if (!charSpan) {
                console.log(`Char span not found for index ${i}`);
                continue;
            }

            newTotalChars++;
            let charStatus = '';
            if (typedText[i] === lessonText[i]) {
                charSpan.classList.add('correct-char');
                newCorrectChars++;
                charStatus = 'correct-char';
            } else {
                charSpan.classList.add('incorrect-char');
                charStatus = 'incorrect-char';
            }
            upToChar = i;
            console.log(`Index: ${i}, Typed: '${typedText[i]}', Expected: '${lessonText[i]}', Status: ${charStatus}`);
        }
        
        this.correctChars = newCorrectChars;
        this.totalChars = newTotalChars;
        console.log('New correctChars:', this.correctChars);
        console.log('New totalChars:', this.totalChars);

        // Highlight the next character
        if (upToChar + 1 < allSpans.length) {
            allSpans[upToChar + 1].classList.add('current-char');
            this.highlightCurrentKey(lessonText[upToChar + 1]);
            console.log('Highlighting next char:', lessonText[upToChar + 1], 'at index', upToChar + 1);
        } else {
            // End of lesson, clear highlight
            this.highlightCurrentKey('');
            console.log('End of lesson, clearing key highlight.');
        }
        console.log('--- updateCharacterFeedback finished ---');
    }

    handleLessonProgress() {
        const typedText = this.userInputElement.value;
        const lessonText = this.currentLesson.join(' ');
        
        // Check for word completion
        const currentWordText = this.currentLesson[this.currentWordIndex];
        const typedWords = typedText.split(' ');
        const currentTypedWord = typedWords[this.currentWordIndex];

        if (currentTypedWord === currentWordText && typedText.endsWith(' ')) {
            // User has correctly typed a word and a space, advance
            this.currentWordIndex++;
            
            // The input will not be cleared on word completion; it will be cleared on lesson completion.
        }

        // Check for lesson completion
        console.log('--- handleLessonProgress: checking for lesson completion ---');
        console.log(`typedText: "${typedText}" (length: ${typedText.length})`);
        console.log(`lessonText: "${lessonText}" (length: ${lessonText.length})`);
        if (typedText === lessonText) {
            clearInterval(this.timerInterval);
            this.userInputElement.disabled = true;
            
            this.lessonCompleteTimeout = setTimeout(() => {
                alert('Lesson Completed! Well done!');
                this.currentLessonIndex = (this.currentLessonIndex + 1) % this.lessons[this.lessonLengthElement.value].length;
                this.initLesson();
            }, 100);
        }
    }


    renderLessonText() {
        this.lessonTextElement.innerHTML = '';
        this.currentLesson.forEach((word, wordIndex) => {
            const wordSpan = document.createElement('span');
            word.split('').forEach((char, charIndex) => {
                const charSpan = document.createElement('span');
                charSpan.textContent = char;
                charSpan.classList.add('char-span'); // Add the new class
                if (wordIndex === this.currentWordIndex && charIndex === this.currentCharIndex) {
                    charSpan.classList.add('current-char');
                }
                wordSpan.appendChild(charSpan);
            });
            this.lessonTextElement.appendChild(wordSpan);
            if (wordIndex < this.currentLesson.length - 1) {
                const spaceSpan = document.createElement('span');
                spaceSpan.textContent = ' ';
                spaceSpan.classList.add('char-span'); // Add the new class
                if (wordIndex === this.currentWordIndex - 1 && charIndex === this.currentCharIndex) { // Highlight space after completed word
                    spaceSpan.classList.add('current-char');
                }
                this.lessonTextElement.appendChild(spaceSpan);
            }
        });
    }

    renderVirtualKeyboard() {
        this.virtualKeyboardElement.innerHTML = '';
        this.keyboardLayout.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.classList.add('keyboard-row');
            row.forEach(keyText => {
                const keyDiv = document.createElement('div');
                keyDiv.classList.add('key');
                keyDiv.textContent = keyText.length > 1 ? keyText.charAt(0).toUpperCase() + keyText.slice(1) : keyText; // Capitalize for display
                if (keyText === 'space') {
                    keyDiv.classList.add('space');
                    keyDiv.textContent = ''; // Spacebar doesn't display text
                }
                // Add data attribute for easier lookup
                keyDiv.dataset.key = keyText;
                rowDiv.appendChild(keyDiv);
            });
            this.virtualKeyboardElement.appendChild(rowDiv);
        });
    }

    highlightCurrentKey(expectedChar) {
        console.log(`--- highlightCurrentKey started ---`);
        console.log(`Expected char: '${expectedChar}'`);
        // Clear previous highlights
        document.querySelectorAll('.key.active').forEach(key => key.classList.remove('active'));
        document.querySelectorAll('.key.correct').forEach(key => key.classList.remove('correct'));
        document.querySelectorAll('.key.incorrect').forEach(key => key.classList.remove('incorrect'));

        if (!expectedChar) {
            console.log('No expected character, clearing active highlights.');
            console.log(`--- highlightCurrentKey finished ---`);
            return;
        }

        // Find the key to highlight
        let targetKey = expectedChar.toLowerCase();
        if (expectedChar === ' ') {
            targetKey = 'space';
        }
        console.log(`Target key: '${targetKey}'`);

        const keyElement = this.virtualKeyboardElement.querySelector(`[data-key="${targetKey}"]`);
        if (keyElement) {
            keyElement.classList.add('active');
            console.log(`Highlighting key element:`, keyElement);
        } else {
            console.log(`No key element found for targetKey: '${targetKey}'`);
        }
        console.log(`--- highlightCurrentKey finished ---`);
    }

    startTimer() {
        if (this.startTime === 0) {
            this.startTime = new Date().getTime();
            this.timerInterval = setInterval(() => this.updateStats(), 1000);
        }
    }

    updateStats() {
        if (this.startTime === 0) return; // Do not update stats if the timer hasn't started

        const currentTime = new Date().getTime();
        const timeElapsedInMinutes = (currentTime - this.startTime) / 60000; // in minutes

        if (timeElapsedInMinutes > 0) {
            const wordsTyped = this.correctChars / 5; // Average word length is 5 characters
            const wpm = Math.round(wordsTyped / timeElapsedInMinutes);
            this.wpmElement.textContent = wpm;
        }

        const accuracy = this.totalChars > 0 ? Math.round((this.correctChars / this.totalChars) * 100) : 100;
        this.accuracyElement.textContent = `${accuracy}%`;
    }

    normalizeKey(key) {
        if (key === ' ') return 'space';
        if (key === 'Backspace') return 'backspace';
        if (key === 'Shift') return 'shift';
        if (key === 'Control') return 'ctrl';
        if (key === 'Alt') return 'alt';
        if (key === 'Enter') return 'enter';
        if (key === 'Tab') return 'tab';
        if (key === 'CapsLock') return 'capslock';
        return key.toLowerCase();
    }
}

window.TypingTutor = TypingTutor;
window.typingTutor = new TypingTutor();

// For local testing, you might want to uncomment this if running index.html directly
document.addEventListener('DOMContentLoaded', () => {
    window.typingTutor.initLesson();
    // Global event listeners for physical key presses (these don't need to be re-attached per test)
    document.addEventListener('keydown', (e) => {
        // Only if the user-input element is focused, otherwise physical keypresses might interfere with other elements in the test runner
        if (document.activeElement === window.typingTutor.userInputElement) {
            // Clear any previous correct/incorrect key highlights on virtual keyboard
            document.querySelectorAll('.key.correct').forEach(key => key.classList.remove('correct'));
            document.querySelectorAll('.key.incorrect').forEach(key => key.classList.remove('incorrect'));

            const pressedKey = window.typingTutor.normalizeKey(e.key);
            

            const keyElement = window.typingTutor.virtualKeyboardElement.querySelector(`[data-key="${pressedKey}"]`);
            if (keyElement) {
                keyElement.classList.add('active'); // Temporarily highlight
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        if (document.activeElement === window.typingTutor.userInputElement) {
            const releasedKey = window.typingTutor.normalizeKey(e.key);

            const keyElement = window.typingTutor.virtualKeyboardElement.querySelector(`[data-key="${releasedKey}"]`);
            if (keyElement) {
                keyElement.classList.remove('active');
                const lessonText = window.typingTutor.currentLesson.join(' ');
                const expectedChar = lessonText.length > 0 && window.typingTutor.userInputElement.value.length > 0 ? lessonText[window.typingTutor.userInputElement.value.length - 1] : '';
                const currentTypedChar = window.typingTutor.userInputElement.value[window.typingTutor.userInputElement.value.length - 1];

                if (currentTypedChar !== undefined) { // Check if a character was actually typed
                    if (currentTypedChar === expectedChar) {
                        keyElement.classList.add('correct');
                    } else {
                        keyElement.classList.add('incorrect');
                    }
                }
            }
        }
    });
});