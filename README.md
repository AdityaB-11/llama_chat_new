# Llama Chat

A desktop chat application powered by Ollama that lets you interact with local LLMs (Large Language Models) running on your computer.

![Llama Chat](docs/screenshot.png)

## Features

- 💬 Chat with local LLMs using Ollama
- 🔄 Stream responses in real-time
- 🧠 Toggle "thinking" mode to see the model's reasoning process 
- 🛑 Stop generation at any time
- 🔍 Multiple model support - use any model installed in Ollama
- 🌙 Dark mode interface
- 📱 Responsive design
- 💾 Chat history saves automatically per model

## Prerequisites

Before using Llama Chat, you need to install Ollama:

1. Download and install Ollama from [ollama.ai](https://ollama.ai)
2. Pull at least one model using Ollama CLI:
   ```bash
   # Example: Install llama3 model
   ollama pull llama3
   ```

## Installation

Clone the repository and install dependencies:

```bash
# Clone the repository
git clone https://github.com/yourusername/llama-chat.git
cd llama-chat

# Install dependencies
npm install

# Build the app
npm run build

# Start the app
npm start
```

## Development

For development with hot-reloading:

```bash
# Run the development server
npm run dev
```

## Usage

1. **Start the app**: Launch the application using `npm start`
2. **Select a model**: Choose a model from the dropdown list at the top
3. **Send a message**: Type your message in the input box and click "Send"
4. **Thinking mode**: Toggle the "Think" switch to see the model's reasoning process (works best with DeepSeek models)
5. **Stop generation**: Click the "Stop" button to interrupt a response while it's being generated
6. **Clear conversation**: Click "Clear Conversation" to start a new chat

## Troubleshooting

- **No models appear**: Make sure Ollama is installed and running
- **Connection error**: Check if the Ollama service is running (the app will try to start it automatically)
- **Model loading issues**: Make sure you've downloaded at least one model via Ollama CLI

## Documentation

Additional documentation is available in the `docs` directory:

- User guides
- Development documentation
- Screenshots and visual guides

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Building From Source

```bash
# Build for production
npm run build

# For Windows
npm run package-win

# For macOS
npm run package-mac

# For Linux
npm run package-linux
```

## Dependencies

- Electron: Desktop application framework
- React: UI library
- Ollama: Local LLM runner

## License

MIT

## Acknowledgments

- [Ollama](https://ollama.ai) for their amazing work on making LLMs accessible locally 