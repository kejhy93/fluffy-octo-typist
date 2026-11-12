# Touch Typing Tutor

## Project Overview

This project is a web-based application designed to help users learn and practice touch typing. It is built with vanilla HTML, CSS, and JavaScript, making it a lightweight and straightforward single-page application.

The core functionality includes:
- Displaying interactive typing lessons.
- Providing real-time feedback on typing speed (Words Per Minute - WPM) and accuracy.
- A virtual keyboard that highlights the next key to be pressed.

The project is configured to use Node.js for its development dependencies, which are used for running automated tests in a headless browser environment.

**Key Technologies:**
- **Frontend:** HTML, CSS, JavaScript (ES6)
- **Testing:**
  - **Framework:** QUnit
  - **Test Runner:** A custom Node.js script (`run-tests.js`) using Puppeteer to run tests in a headless Chromium browser.
  - **Server:** Express.js is used to serve the files during testing.
- **CI/CD:** GitHub Actions is set up to automatically run tests on every push and pull request to the `main` branch.

## Building and Running

### 1. Installation

To install the development dependencies required for testing, run:

```bash
npm install
```
This will download `puppeteer`, `express`, and `http-server`, and will also trigger the `postinstall` script to download the correct version of Chromium for Puppeteer.

### 2. Running the Application Locally

To use the application, you can serve the project root directory with any simple HTTP server.

**Using Python:**
```bash
python3 -m http.server
```

**Using the installed `http-server`:**
```bash
npx http-server
```
Once the server is running, open your browser and navigate to `http://localhost:8000` (or the port specified by the server).

### 3. Running Tests

The project is configured with a headless browser testing environment. To run the tests from the command line, use:

```bash
npm test
```
This command will:
1. Start an Express server.
2. Launch a headless Chromium browser using Puppeteer.
3. Navigate to the test runner page (`/tests/index.html`).
4. Execute the QUnit tests.
5. Output the test results to the console and exit with an appropriate status code.

## Development Conventions

- **Testing:** All new features or bug fixes should be accompanied by unit tests in the `/tests` directory. Tests are written using the QUnit framework.
- **Code Style:** The project follows a standard vanilla JavaScript style. Code is organized with a clear separation of concerns:
  - `index.html`: Structure
  - `style.css`: Presentation
  - `typing-session.js`: Typing Session rules (no DOM)
  - `script.js`: Page logic
- **CI/CD:** A GitHub Actions workflow is defined in `.github/workflows/ci.yml`. This workflow is expected to pass before merging any changes to the `main` branch.
- **Dependencies:** Project dependencies are managed via `npm`. The `node_modules` directory is ignored by Git (as specified in `.gitignore`), and dependencies should always be installed by running `npm install`.
