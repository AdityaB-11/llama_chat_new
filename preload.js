const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script executing...');

// Check if contextBridge is available
if (!contextBridge) {
  console.error('contextBridge is not available!');
} else {
  console.log('contextBridge is available, exposing API...');
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Ollama model operations
  getModels: async () => {
    console.log('getModels called from renderer');
    try {
      const result = await ipcRenderer.invoke('get-models');
      console.log('getModels result:', result);
      return result;
    } catch (error) {
      console.error('Error in getModels:', error);
      throw error;
    }
  },
  
  chatCompletion: async (params) => {
    console.log('chatCompletion called with params:', params);
    return await ipcRenderer.invoke('chat-completion', params);
  },
  
  stopGeneration: async (chatId) => {
    console.log('stopGeneration called for chatId:', chatId);
    try {
      const result = await ipcRenderer.invoke('stop-generation', { chatId });
      console.log('stopGeneration result:', result);
      return result;
    } catch (error) {
      console.error('Error in stopGeneration:', error);
      throw error;
    }
  },
  
  checkOllama: async () => {
    console.log('checkOllama called');
    try {
      const result = await ipcRenderer.invoke('check-ollama');
      console.log('checkOllama result:', result);
      return result;
    } catch (error) {
      console.error('Error in checkOllama:', error);
      throw error;
    }
  },
  
  // Navigation
  navigateTo: async (route) => {
    console.log('navigateTo called with route:', route);
    return await ipcRenderer.invoke('navigate-to', { route });
  },
  
  // Event listeners
  onChatResponse: (callback) => {
    console.log('Setting up onChatResponse listener');
    const subscription = (event, data) => {
      console.log('Chat response received:', data);
      callback(data);
    };
    ipcRenderer.on('chat-response', subscription);
    return () => {
      console.log('Removing onChatResponse listener');
      ipcRenderer.removeListener('chat-response', subscription);
    };
  },
  
  onOllamaLog: (callback) => {
    console.log('Setting up onOllamaLog listener');
    const subscription = (event, data) => {
      console.log('Ollama log received:', data);
      callback(data);
    };
    ipcRenderer.on('ollama-log', subscription);
    return () => {
      console.log('Removing onOllamaLog listener');
      ipcRenderer.removeListener('ollama-log', subscription);
    };
  },
  
  onOllamaError: (callback) => {
    console.log('Setting up onOllamaError listener');
    const subscription = (event, data) => {
      console.error('Ollama error received:', data);
      callback(data);
    };
    ipcRenderer.on('ollama-error', subscription);
    return () => {
      console.log('Removing onOllamaError listener');
      ipcRenderer.removeListener('ollama-error', subscription);
    };
  },
  
  onRouteChange: (callback) => {
    console.log('Setting up onRouteChange listener');
    const subscription = (event, data) => {
      console.log('Route change received:', data);
      callback(data);
    };
    ipcRenderer.on('route-change', subscription);
    return () => {
      console.log('Removing onRouteChange listener');
      ipcRenderer.removeListener('route-change', subscription);
    };
  }
});

console.log('Preload script completed successfully'); 