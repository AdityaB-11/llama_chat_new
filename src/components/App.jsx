import React, { useState, useEffect, useRef } from 'react';
import ChatInput from './ChatInput';
import MessageList from './MessageList';
import StatusBar from './StatusBar';
import ModelSelector from './ModelSelector';
import '../styles/app.css';

const App = () => {
  const [messages, setMessages] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [serverStatus, setServerStatus] = useState('starting');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamedMessage, setCurrentStreamedMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [error, setError] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [displayModel, setDisplayModel] = useState('');
  
  const removeListenerRef = useRef(null);
  
  // Set display model whenever selectedModel changes
  useEffect(() => {
    if (selectedModel) {
      setDisplayModel(selectedModel);
    }
  }, [selectedModel]);
  
  // Don't update displayModel during streaming
  useEffect(() => {
    // Only update display model if we're not currently streaming
    if (!isStreaming && selectedModel) {
      setDisplayModel(selectedModel);
    }
  }, [isStreaming, selectedModel]);
  
  useEffect(() => {
    console.log('App component mounted');
    
    // Load chat history from localStorage
    try {
      const savedHistory = localStorage.getItem('chatHistory');
      if (savedHistory) {
        console.log('Found saved chat history');
        const parsed = JSON.parse(savedHistory);
        setChatHistory(parsed);
      }
    } catch (error) {
      console.error('Failed to parse chat history:', error);
    }
    
    // Check Ollama status first
    checkOllamaStatus().then(isRunning => {
      if (isRunning) {
        console.log('Ollama is running, loading models');
        loadModels();
      }
    });
    
    // Listen for Ollama server status
    console.log('Setting up Ollama log listeners');
    const logUnsubscribe = window.api.onOllamaLog(data => {
      console.log('Ollama log received in App:', data);
      if (data.includes('listening')) {
        console.log('Ollama server is online');
        setServerStatus('online');
        loadModels();
      }
    });
    
    const errorUnsubscribe = window.api.onOllamaError(data => {
      console.error('Ollama error in App:', data);
      if (data.includes('already in use') || data.includes('Only one usage')) {
        console.log('Ollama is already running');
        setServerStatus('online');
        loadModels();
      } else {
        setServerStatus('error');
        setError(`Ollama error: ${data}`);
      }
    });
    
    // Listen for streamed responses
    console.log('Setting up chat response listener');
    removeListenerRef.current = window.api.onChatResponse(response => {
      console.log('Chat response received:', response);
      
      // Store chatId from response if available
      if (response.chatId) {
        setCurrentChatId(response.chatId);
      }
      
      if (response.done) {
        setIsStreaming(false);
        setCurrentChatId(null);
        
        // Add complete message to messages list
        setMessages(prev => {
          const newMessages = [...prev];
          // Replace the streaming message with a complete one
          if (newMessages.length > 0 && newMessages[newMessages.length - 1].isStreaming) {
            newMessages.pop();
          }
          newMessages.push({
            role: 'assistant',
            content: currentStreamedMessage,
            timestamp: new Date().toISOString()
          });
          return newMessages;
        });
        
        // Reset current streamed message
        setCurrentStreamedMessage('');
        
        // Save to chat history
        saveToHistory();
      } else if (response.response) {
        // Ignore empty responses (might come from filtering thinking blocks)
        if (!response.response.trim()) {
          return;
        }
        
        setCurrentStreamedMessage(prev => prev + response.response);
        
        // Update the streaming message
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages.length > 0 && newMessages[newMessages.length - 1].isStreaming) {
            newMessages[newMessages.length - 1] = {
              ...newMessages[newMessages.length - 1],
              content: currentStreamedMessage + response.response
            };
          } else {
            newMessages.push({
              role: 'assistant',
              content: currentStreamedMessage + response.response,
              isStreaming: true,
              timestamp: new Date().toISOString()
            });
          }
          return newMessages;
        });
      }
    });
    
    // If the server is already running, load models
    if (serverStatus === 'online') {
      loadModels();
    }
    
    // After a delay, check if Ollama seems to be starting properly
    const timeoutId = setTimeout(() => {
      if (serverStatus === 'starting') {
        console.log('Ollama might be running but not detected, attempting to load models anyway');
        setServerStatus('online');
        loadModels();
      }
    }, 5000);
    
    return () => {
      console.log('App component unmounting, cleaning up listeners');
      logUnsubscribe();
      errorUnsubscribe();
      if (removeListenerRef.current) {
        removeListenerRef.current();
      }
      clearTimeout(timeoutId);
    };
  }, [currentStreamedMessage]);
  
  useEffect(() => {
    if (serverStatus === 'online') {
      loadModels();
    }
  }, [serverStatus]);
  
  const checkOllamaStatus = async () => {
    try {
      console.log('Checking Ollama status...');
      await window.api.checkOllama();
      console.log('Ollama is running correctly');
      setServerStatus('online');
      loadModels();
      return true;
    } catch (error) {
      console.error('Ollama check failed:', error);
      setServerStatus('error');
      setError('Failed to connect to Ollama. Please make sure Ollama is installed and running.');
      return false;
    }
  };
  
  const loadModels = async () => {
    console.log('Loading models...');
    setLoadingModels(true);
    setError(null);
    
    try {
      console.log('Calling api.getModels()');
      const modelList = await window.api.getModels();
      console.log('Received models:', modelList);
      
      setModels(modelList);
      
      if (modelList.length > 0 && !selectedModel) {
        console.log(`Selecting first model: ${modelList[0].name}`);
        setSelectedModel(modelList[0].name);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      setError(`Failed to load models: ${error.message}`);
    } finally {
      setLoadingModels(false);
    }
  };
  
  const handleSendMessage = async (message, thinking = false) => {
    if (!message.trim() || !selectedModel || isStreaming) return;
    
    console.log(`Sending message to ${selectedModel}, thinking mode: ${thinking}`);
    
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      setIsStreaming(true);
      
      console.log(`Making chatCompletion request to ${selectedModel}`);
      const completion = await window.api.chatCompletion({
        model: selectedModel,
        prompt: message,
        stream: true,
        thinking: thinking
      });
      
      console.log('chatCompletion request completed:', completion);
      
    } catch (error) {
      console.error('Chat completion error:', error);
      setIsStreaming(false);
      
      // Create a more user-friendly error message
      let errorMessage = `Error: ${error.message}`;
      
      if (error.message.includes('ollama run failed')) {
        errorMessage = 'Failed to run the model. Please check if Ollama is running and the model is available.';
      }
      
      setMessages(prev => [
        ...prev, 
        {
          role: 'system',
          content: errorMessage,
          error: true,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };
  
  const saveToHistory = () => {
    const newHistory = [...chatHistory];
    
    // Find if there's an existing conversation for this model
    const existingConversationIndex = newHistory.findIndex(
      convo => convo.model === selectedModel
    );
    
    if (existingConversationIndex >= 0) {
      // Update existing conversation
      newHistory[existingConversationIndex].messages = messages;
    } else {
      // Create new conversation
      newHistory.push({
        model: selectedModel,
        messages: messages,
        lastUpdated: new Date().toISOString()
      });
    }
    
    // Save to state and localStorage
    setChatHistory(newHistory);
    localStorage.setItem('chatHistory', JSON.stringify(newHistory));
  };
  
  const handleModelChange = model => {
    console.log(`Changing model to ${model}`);
    setSelectedModel(model);
    
    // Load conversation for this model if it exists
    const existingConversation = chatHistory.find(convo => convo.model === model);
    
    if (existingConversation) {
      console.log(`Loading existing conversation for ${model}`);
      setMessages(existingConversation.messages);
    } else {
      console.log(`Starting new conversation for ${model}`);
      setMessages([]);
    }
  };
  
  const handleClearConversation = () => {
    setMessages([]);
    
    // Remove from history
    const newHistory = chatHistory.filter(convo => convo.model !== selectedModel);
    setChatHistory(newHistory);
    localStorage.setItem('chatHistory', JSON.stringify(newHistory));
  };
  
  const handleRetryModelLoad = () => {
    console.log('Retrying model load...');
    setError(null);
    checkOllamaStatus();
  };
  
  const handleStopGeneration = async () => {
    if (currentChatId) {
      try {
        console.log(`Stopping generation for chat ID: ${currentChatId}`);
        await window.api.stopGeneration(currentChatId);
        
        // Manually mark streaming as complete
        setIsStreaming(false);
        
        // Add the current partial response as a completed message
        setMessages(prev => {
          const newMessages = [...prev];
          // Replace the streaming message with the current partial one
          if (newMessages.length > 0 && newMessages[newMessages.length - 1].isStreaming) {
            newMessages.pop();
            newMessages.push({
              role: 'assistant',
              content: currentStreamedMessage + ' (stopped)',
              timestamp: new Date().toISOString()
            });
          }
          return newMessages;
        });
        
        // Reset state
        setCurrentStreamedMessage('');
        setCurrentChatId(null);
        
        // Save to history
        saveToHistory();
      } catch (error) {
        console.error('Failed to stop generation:', error);
      }
    } else {
      console.warn('No active chat to stop');
    }
  };
  
  return (
    <div className="app-container">
      <div className="header">
        <h1>Llama Chat</h1>
        <ModelSelector 
          models={models} 
          selectedModel={selectedModel} 
          onModelChange={handleModelChange}
          disabled={isStreaming || loadingModels}
          loading={loadingModels}
        />
        <button 
          className="clear-button"
          onClick={handleClearConversation}
          disabled={messages.length === 0 || isStreaming}
        >
          Clear Conversation
        </button>
      </div>
      
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={handleRetryModelLoad}>Retry</button>
        </div>
      )}
      
      <MessageList messages={messages} />
      
      <ChatInput 
        onSendMessage={handleSendMessage} 
        onStopGeneration={handleStopGeneration}
        disabled={!selectedModel || serverStatus !== 'online' || isStreaming || loadingModels}
        isStreaming={isStreaming}
      />
      
      <StatusBar 
        serverStatus={serverStatus} 
        selectedModel={displayModel} 
        loading={loadingModels} 
      />
    </div>
  );
};

export default App; 