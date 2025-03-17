# Contributing to Llama Chat

Thank you for considering contributing to Llama Chat! This document provides guidelines and instructions for contributing to this project.

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/llama-chat.git
   cd llama-chat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Directory Structure

```
llama-chat/
├── dist/               # Compiled files (generated)
├── docs/               # Documentation files
├── public/             # Static assets
├── src/                # Source code
│   ├── components/     # React components
│   ├── styles/         # CSS files
│   └── renderer.js     # Main renderer entry point
├── main.js             # Electron main process
├── preload.js          # Preload script for IPC
└── package.json        # Project metadata
```

## Pull Request Process

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. Ensure the test suite passes.
4. Update the documentation if needed.
5. Make sure your code follows the existing style.
6. Issue a pull request.

## Code Style

- Use 2 spaces for indentation
- Use semicolons
- Follow React best practices
- Use descriptive variable names

## Commit Messages

Please use clear and descriptive commit messages. Follow these guidelines:

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters
- Reference issues and pull requests liberally after the first line

## Reporting Bugs

When reporting bugs, please include:

1. A clear description of the issue
2. Steps to reproduce the behavior
3. Expected behavior
4. Screenshots (if applicable)
5. System information:
   - OS version
   - Node.js version
   - Electron version
   - Ollama version

## Feature Requests

Feature requests are welcome. Please provide:

1. Clear and detailed explanation of the feature
2. Benefits of the feature
3. Potential implementation approach (if you have ideas)

## License

By contributing to Llama Chat, you agree that your contributions will be licensed under the project's MIT License. 