const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fetch = require('node-fetch');
const isDev = process.env.NODE_ENV === 'development';

// Add error handling to log unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

let mainWindow;
let ollamaProcess;
let activeChats = {}; // For tracking active chat processes

// Start Ollama server
function startOllamaServer() {
  return new Promise((resolve) => {
    // Try to start Ollama
    console.log('Starting Ollama server...');
    ollamaProcess = spawn('ollama', ['serve']);
    
    let started = false;
    
    ollamaProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`Ollama stdout: ${output}`);
      if (mainWindow) {
        mainWindow.webContents.send('ollama-log', output);
      }
      
      // If we see the message that Ollama is listening, mark as started
      if (output.includes('listening')) {
        started = true;
      }
    });
    
    ollamaProcess.stderr.on('data', (data) => {
      const errorMsg = data.toString();
      console.error(`Ollama stderr: ${errorMsg}`);
      
      // Check if the error indicates Ollama is already running
      if (errorMsg.includes('bind: Only one usage') || 
          errorMsg.includes('address already in use')) {
        console.log('Ollama server is already running');
        
        // If we tried to start Ollama but it's already running, clean up our process
        if (ollamaProcess) {
          ollamaProcess.kill();
          ollamaProcess = null;
        }
        
        // Consider Ollama as started
        started = true;
      }
      
      if (mainWindow) {
        mainWindow.webContents.send('ollama-error', errorMsg);
      }
    });
    
    ollamaProcess.on('close', (code) => {
      console.log(`Ollama process exited with code ${code}`);
      
      // If the process died but we never saw it start, and it's not because
      // it was already running (which we would have detected in stderr),
      // then we need to report a startup error
      if (!started && ollamaProcess) {
        console.error('Failed to start Ollama server');
        if (mainWindow) {
          mainWindow.webContents.send('ollama-error', 'Failed to start Ollama server. Please make sure Ollama is installed correctly.');
        }
      }
      
      ollamaProcess = null;
    });
    
    // Give Ollama a few seconds to start or report an error
    setTimeout(() => {
      if (!started) {
        console.log('Checking if Ollama is already running...');
        // Last resort: try to query Ollama API directly
        fetch('http://localhost:11434/api/version')
          .then(response => {
            if (response.ok) {
              console.log('Ollama server is already running');
              started = true;
            }
          })
          .catch(() => {
            console.error('Ollama server is not running and could not be started');
          })
          .finally(() => resolve());
      } else {
        resolve();
      }
    }, 2000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      worldSafeExecuteJavaScript: true
    },
    backgroundColor: '#1a1a1a' // Dark theme background
  });

  // Always open DevTools in both modes for debugging
  mainWindow.webContents.openDevTools();

  // Load the app
  if (isDev) {
    console.log("Loading in development mode");
    const publicPath = path.join(__dirname, 'public/index.html');
    console.log("Loading file:", publicPath);
    mainWindow.loadFile(publicPath);
  } else {
    console.log("Loading in production mode");
    const distPath = path.join(__dirname, 'dist/index.html');
    console.log("Loading file:", distPath);
    mainWindow.loadFile(distPath);
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Finished loading');
  });
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await startOllamaServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Kill Ollama process when app is closing, but only if we started it
  if (ollamaProcess) {
    console.log('Stopping Ollama server...');
    ollamaProcess.kill();
  }
});

// API handlers
ipcMain.handle('get-models', async () => {
  return new Promise((resolve, reject) => {
    const ls = spawn('ollama', ['list']);
    let output = '';
    
    ls.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    ls.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ollama list failed with code ${code}`));
        return;
      }
      
      const lines = output.trim().split('\n').slice(1); // Skip header
      const models = lines.map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          name: parts[0],
          id: parts[1]
        };
      });
      
      resolve(models);
    });
  });
});

ipcMain.handle('chat-completion', async (event, { model, prompt, systemPrompt, stream, thinking }) => {
  console.log(`Chat completion request for model: ${model}, thinking: ${thinking}`);
  
  try {
    // In Ollama, for streaming we need to use a different approach
    if (stream) {
      // Prepare arguments based on thinking mode
      // For Ollama the correct order is: 'ollama run [model] [flags]'
      const args = thinking ? 
        ['run', model, '--verbose'] : 
        ['run', model];
      
      console.log(`Running ollama with args:`, args);
      
      // Create the chat process
      const chat = spawn('ollama', args, { stdio: ['pipe', 'pipe', 'pipe'] });
      
      // Update system prompt to control thinking behavior for DeepSeek models
      let effectiveSystemPrompt = systemPrompt || '';
      
      // If it's a DeepSeek model and thinking is disabled, add a system prompt to not show thinking
      if (model.toLowerCase().includes('deepseek') && !thinking) {
        effectiveSystemPrompt += effectiveSystemPrompt ? '\n\n' : '';
        effectiveSystemPrompt += 'Respond directly with your answer. Do not use <think> tags or show any thinking process or reasoning steps.';
      } else if (model.toLowerCase().includes('deepseek') && thinking) {
        effectiveSystemPrompt += effectiveSystemPrompt ? '\n\n' : '';
        effectiveSystemPrompt += 'Show your thinking process using <think> tags before providing your final answer.';
      }
      
      // Prepare our input for the model
      const inputOptions = {
        prompt: prompt,
        system: effectiveSystemPrompt,
        stream: true
      };
      
      console.log(`Sending input to ollama:`, JSON.stringify(inputOptions));
      
      // Send the input to the model
      chat.stdin.write(JSON.stringify(inputOptions));
      chat.stdin.end();
      
      // Add a way to track the chat process for cancellation
      const chatId = Date.now().toString();
      activeChats[chatId] = chat;
      
      // Clean up after completion or error
      const cleanup = () => {
        delete activeChats[chatId];
      };
      
      // Handle errors from the child process
      chat.on('error', (error) => {
        console.error(`Error spawning ollama:`, error);
        cleanup();
        reject(error);
      });
      
      // Track current response
      let currentResponse = "";
      
      chat.stderr.on('data', (data) => {
        const errorMsg = data.toString();
        console.error(`ollama stderr: ${errorMsg}`);
        // We'll log errors but not reject here - some models output warnings to stderr
      });
      
      // Process the streamed output
      chat.stdout.on('data', (data) => {
        try {
          const output = data.toString();
          console.log(`ollama stdout (chunk): ${output.length} bytes`);
          
          // Filter out thinking blocks if it's a DeepSeek model and thinking is disabled
          let processedOutput = output;
          if (model.toLowerCase().includes('deepseek') && !thinking) {
            // Skip chunks that are only thinking blocks
            if (output.trim().startsWith('<think>') && output.trim().endsWith('</think>')) {
              console.log('Filtering out thinking block');
              return; // Skip this chunk entirely
            }
            
            // Remove thinking blocks from mixed content
            processedOutput = output.replace(/<think>[\s\S]*?<\/think>/g, '');
            
            // Skip empty chunks after filtering
            if (!processedOutput.trim()) {
              return;
            }
          }
          
          // Try to extract text incrementally
          currentResponse += processedOutput;
          
          // Send the incremental output to the renderer
          if (mainWindow) {
            mainWindow.webContents.send('chat-response', {
              response: processedOutput,
              model: model,
              chatId: chatId
            });
          }
        } catch (error) {
          console.error('Error processing streamed response:', error);
        }
      });
      
      // Handle completion
      return new Promise((resolve, reject) => {
        chat.on('close', (code) => {
          console.log(`ollama process exited with code ${code}`);
          cleanup();
          if (code === 0) {
            // Send a final done message
            if (mainWindow) {
              mainWindow.webContents.send('chat-response', { done: true, chatId: chatId });
            }
            resolve({ done: true, chatId: chatId });
          } else {
            const error = new Error(`ollama run failed with code ${code}`);
            console.error(error);
            reject(error);
          }
        });
        
        // Return the chatId so it can be used for cancellation
        resolve({ chatId: chatId });
      });
    } else {
      // Non-streaming mode follows the same pattern
      const args = thinking ? 
        ['run', model, '--verbose'] : 
        ['run', model];
        
      const chat = spawn('ollama', args, { stdio: ['pipe', 'pipe', 'pipe'] });
      
      // Update system prompt to control thinking behavior for DeepSeek models
      let effectiveSystemPrompt = systemPrompt || '';
      
      // If it's a DeepSeek model and thinking is disabled, add a system prompt to not show thinking
      if (model.toLowerCase().includes('deepseek') && !thinking) {
        effectiveSystemPrompt += effectiveSystemPrompt ? '\n\n' : '';
        effectiveSystemPrompt += 'Respond directly with your answer. Do not use <think> tags or show any thinking process or reasoning steps.';
      } else if (model.toLowerCase().includes('deepseek') && thinking) {
        effectiveSystemPrompt += effectiveSystemPrompt ? '\n\n' : '';
        effectiveSystemPrompt += 'Show your thinking process using <think> tags before providing your final answer.';
      }
      
      // Handle errors from the child process
      chat.on('error', (error) => {
        console.error(`Error spawning ollama:`, error);
        reject(error);
      });
      
      const inputOptions = {
        prompt: prompt,
        system: effectiveSystemPrompt,
        stream: false
      };
      
      chat.stdin.write(JSON.stringify(inputOptions));
      chat.stdin.end();
      
      return new Promise((resolve, reject) => {
        let output = '';
        
        chat.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        chat.stderr.on('data', (data) => {
          console.error(`ollama stderr: ${data.toString()}`);
        });
        
        chat.on('close', (code) => {
          if (code === 0) {
            try {
              // Older Ollama versions might not return JSON
              resolve({ response: output });
            } catch (error) {
              reject(new Error(`Failed to parse response: ${error.message}`));
            }
          } else {
            reject(new Error(`ollama run failed with code ${code}`));
          }
        });
      });
    }
  } catch (error) {
    console.error("Error in chat-completion:", error);
    throw error;
  }
});

// Add this after the other ipcMain handlers
ipcMain.handle('check-ollama', async () => {
  return new Promise((resolve, reject) => {
    const check = spawn('ollama', ['list']);
    let output = '';
    let error = '';
    
    check.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    check.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    check.on('close', (code) => {
      if (code === 0) {
        resolve({ 
          status: 'running',
          output: output
        });
      } else {
        reject(new Error(`Ollama check failed with code ${code}: ${error}`));
      }
    });
  });
});

// Add this new IPC handler after the other IPC handlers
ipcMain.handle('stop-generation', async (event, { chatId }) => {
  console.log(`Stopping generation for chat: ${chatId}`);
  
  if (activeChats[chatId]) {
    // Kill the process and clean up
    activeChats[chatId].kill();
    delete activeChats[chatId];
    return { success: true };
  } else {
    console.log(`Chat ${chatId} not found or already completed`);
    return { success: false, error: 'Chat not found' };
  }
}); 