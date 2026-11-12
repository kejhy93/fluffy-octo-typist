# Touch Typing Tutor

A simple web-based application to help you learn and practice touch typing.

## Features

- Interactive typing lessons in short, medium, or long lengths.
- Real-time Words Per Minute (WPM) and Accuracy tracking.
- Visual feedback for correct and incorrect keystrokes.
- Virtual keyboard highlighting the next key to press.
- Light and dark mode: starts from your system preference and remembers your choice.

## How to Use

1.  **Open `index.html`:** Simply open the `index.html` file in your web browser.
2.  **Choose a Length:** Pick short, medium, or long from the "Text length" menu.
3.  **Start Typing:** The lesson text will appear, and you can start typing in the input box below.
4.  **Monitor Your Progress:** WPM and Accuracy will update as you type.
5.  **Virtual Keyboard:** Observe the virtual keyboard for guidance on which key to press next.
6.  **Restart Lesson:** Click the "Restart Lesson" button to try the current lesson again.

## Project Structure

- `index.html`: The main HTML file that structures the web page.
- `style.css`: Contains the CSS rules to style the application.
- `typing-session.js`: The Typing Session: decides which characters are correct, what comes next, when the lesson is complete, and the WPM and accuracy. It has no DOM code.
- `script.js`: Connects the page to the Typing Session: lesson selection, input handling, the virtual keyboard and the theme.
- `README.md`: This file, providing information about the project.

## Publishing to GitHub Pages

You can easily publish this typing tutor on GitHub Pages.

Now you have a live touch typing tutor that you can share and use!