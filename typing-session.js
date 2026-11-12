// The typing of one Lesson: decides which characters are correct, what comes next,
// when the Lesson is complete, and the WPM and accuracy. No DOM, no timers;
// callers pass the current time in milliseconds.
class TypingSession {
    constructor(lessonText) {
        this.lessonText = lessonText;
        this.typedText = '';
        this.startTime = null;
        this.lastSnapshot = this.evaluate(null);
    }

    // Record what is in the input now; the first call starts the clock.
    type(typedText, now) {
        if (this.startTime === null) {
            this.startTime = now;
        }
        this.typedText = typedText;
        this.lastSnapshot = this.evaluate(now);
        return this.lastSnapshot;
    }

    // WPM and accuracy at a later time, or null before the first keystroke.
    stats(now) {
        if (this.startTime === null) {
            return null;
        }
        const { wpm, accuracy } = this.evaluate(now);
        return { wpm, accuracy };
    }

    snapshot() {
        return this.lastSnapshot;
    }

    evaluate(now) {
        const lesson = this.lessonText;
        // Characters typed past the end of the lesson are ignored
        const typed = this.typedText.slice(0, lesson.length);

        const chars = [];
        let correctChars = 0;
        for (let i = 0; i < lesson.length; i++) {
            if (i >= typed.length) {
                chars.push('pending');
            } else if (typed[i] === lesson[i]) {
                chars.push('correct');
                correctChars++;
            } else {
                chars.push('incorrect');
            }
        }

        const totalChars = typed.length;
        const nextIndex = typed.length;
        const minutes = now === null ? 0 : (now - this.startTime) / 60000;
        const wordsTyped = correctChars / 5; // Average word length is 5 characters

        return {
            chars,
            nextIndex,
            nextChar: lesson.charAt(nextIndex),
            correctChars,
            totalChars,
            complete: this.typedText === lesson,
            wpm: minutes > 0 ? Math.round(wordsTyped / minutes) : 0,
            accuracy: totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100,
        };
    }
}

window.TypingSession = TypingSession;
