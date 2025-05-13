import React, { useState, useRef, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

function App() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    console.log('Messages updated:', messages);
  }, [messages]);

  const handleFileUpload = async (event) => {
    debugger; // Breakpoint 1: When function starts
    const file = event.target.files[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name);
    console.log('File object:', file);

    const formData = new FormData();
    formData.append('file', file);

    console.log('FormData entries:');
    for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
    }

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };

    console.log('Axios config:', config);

    setLoading(true);
    setError('');
    
    try {
      debugger; // Breakpoint 2: Before API call
      const response = await axios.post('/api/upload', formData, {
        timeout: 30000,
        onUploadProgress: (progressEvent) => {
          console.log('Upload progress:', progressEvent);
        }
      });
      debugger; // Breakpoint 3: After successful API call
      console.log('Upload response:', response.data);
      setFile(file);
      setMessages(prev => [...prev, {
        type: 'system',
        content: `${file.name} uploaded and processed successfully! You can now ask questions about the document.`
      }]);
    } catch (err) {
      debugger; // Breakpoint 4: If error occurs
      console.error('Upload error details:', {
        message: err.message,
        response: err.response,
        request: err.request,
        config: err.config
      });
      setError(err.response?.data?.detail || 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userQuestion = question.trim();
    setQuestion('');
    setMessages(prev => [...prev, { type: 'user', content: userQuestion }]);
    setLoading(true);
    setError('');

    try {
      console.log('Sending question:', userQuestion);
      
      const response = await axios.post('/api/query', 
        { question: userQuestion },
        { 
          responseType: 'text',
          onDownloadProgress: (progressEvent) => {
            const text = progressEvent.event.target.responseText;
            console.log('Received text:', text); // Debug log
            
            // Split the response into lines and process each chunk
            const lines = text.split('\n').filter(line => line.trim());
            let accumulatedResponse = '';
            
            lines.forEach(line => {
              if (line.startsWith('data: ')) {
                try {
                  const jsonData = JSON.parse(line.slice(5).trim());
                  if (jsonData.chunk) {
                    accumulatedResponse += jsonData.chunk;
                  }
                } catch (e) {
                  console.error('Error parsing chunk:', e);
                }
              }
            });

            // Update the messages with the accumulated response
            if (accumulatedResponse) {
              console.log('Accumulated response:', accumulatedResponse); // Debug log
              setMessages(prev => {
                const newMessages = [...prev];
                // Update the last message if it's from assistant, or add a new one
                if (newMessages.length > 0 && newMessages[newMessages.length - 1].type === 'assistant') {
                  newMessages[newMessages.length - 1].content = accumulatedResponse;
                } else {
                  newMessages.push({ type: 'assistant', content: accumulatedResponse });
                }
                return newMessages;
              });
            }
          }
        }
      );

      console.log('Request completed'); // Debug log

    } catch (err) {
      console.error('Query error:', err);
      setError(err.response?.data?.detail || 'Error processing question');
      setMessages(prev => [...prev, { 
        type: 'system', 
        content: 'Error: Failed to get response. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Document Q&A System
        </Typography>

        <Typography 
          variant="body1" 
          align="center" 
          sx={{ 
            mb: 3, 
            backgroundColor: '#f5f5f5',
            p: 2, 
            borderRadius: 1,
            maxWidth: '600px',
            margin: '0 auto 24px auto'
          }}
        >
          With this application, you can chat with your uploaded text/PDF files that are smaller than 2MB!
          <Box component="ul" sx={{ textAlign: 'left', mt: 1 }}>
            <li>Upload your document using the file input below</li>
            <li>Wait for processing to complete</li>
            <li>Ask questions about your document in the chat</li>
          </Box>
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <input
            type="file"
            accept=".txt,.pdf"
            onChange={handleFileUpload}
            style={{ marginBottom: '1rem', display: 'block' }}
          />
          {file && (
            <Typography>
              Selected file: {file.name}
            </Typography>
          )}
        </Paper>

        <Paper sx={{ p: 3, mb: 3, maxHeight: '400px', overflow: 'auto' }}>
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.type}`}>
              <strong>{message.type === 'user' ? 'You: ' : 'Assistant: '}</strong>
              <span>{message.content}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </Paper>

        <Paper sx={{ p: 3 }}>
          <form onSubmit={handleQuestionSubmit}>
            <TextField
              fullWidth
              label="Ask a question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={!file || loading}
              sx={{ mb: 2 }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={!file || loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Ask Question'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}

export default App;