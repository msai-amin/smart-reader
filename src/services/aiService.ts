// AI Service for handling chat interactions
import OpenAI from 'openai'

// Get API key from environment
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true // Only for client-side usage
})

export const sendMessageToAI = async (message: string, documentContent?: string): Promise<string> => {
  try {
    // Check if API key is available
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      console.warn('OpenAI API key not configured. Using mock responses.');
      return getMockResponse(message, documentContent)
    }

    console.log('Using OpenAI API to generate response...');

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant helping users understand and analyze documents. 
                   ${documentContent ? 
                     `The user has uploaded a document with the following content:\n\n${documentContent}\n\n` +
                     'Please provide helpful, accurate responses based on the document content.' :
                     'The user has not uploaded any document yet. Please ask them to upload a document first.'
                   }`
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    return completion.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.'
  } catch (error) {
    console.error('Error calling OpenAI API:', error)
    // Fallback to mock responses on error
    return getMockResponse(message, documentContent)
  }
}

// Fallback mock responses when OpenAI API is not available
const getMockResponse = (message: string, documentContent?: string): string => {
  // Simulate API delay (commented out to avoid unused variable warning)
  // const delay = 1000 + Math.random() * 2000
  
  // Mock AI responses based on the message content
  const responses = [
    "I understand you're asking about the document. Let me help you with that.",
    "Based on the content I can see, here's what I found...",
    "That's an interesting question about the text. Let me analyze it for you.",
    "I can help you understand this better. Here's my analysis...",
    "Looking at the document content, I can provide some insights...",
    "Let me break this down for you based on what I can see in the text.",
    "I'd be happy to help you with that. Here's what I think...",
    "That's a great question! Based on the document, here's my response...",
  ]

  // Simple keyword-based responses for demo purposes
  if (message.toLowerCase().includes('summary') || message.toLowerCase().includes('summarize')) {
    return `Here's a summary of the document content:\n\n${documentContent ? 
      `The document contains ${documentContent.length} characters of text. ` +
      `Key topics appear to include various subjects that would be analyzed in a real implementation. ` +
      `This is a demo response - in production, I would provide an actual AI-generated summary.` :
      'I don\'t have access to any document content to summarize. Please upload a document first.'
    }`
  }

  if (message.toLowerCase().includes('explain') || message.toLowerCase().includes('what does')) {
    return `I'd be happy to explain that for you. ${documentContent ? 
      'Based on the document content, I can provide detailed explanations. ' +
      'In a real implementation, I would analyze the specific parts of the text you\'re asking about.' :
      'However, I don\'t have access to any document content to reference. Please upload a document first.'
    }`
  }

  if (message.toLowerCase().includes('question') || message.toLowerCase().includes('?')) {
    return `That's a great question! ${documentContent ? 
      'Let me analyze the document to provide you with a comprehensive answer. ' +
      'In a real implementation, I would search through the content for relevant information.' :
      'I\'d be happy to help, but I need to see the document content first. Please upload a document.'
    }`
  }

  // Default response
  const randomResponse = responses[Math.floor(Math.random() * responses.length)]
  return `${randomResponse}\n\n${documentContent ? 
    `I can see you have a document with ${documentContent.length} characters. ` +
    `In a real implementation, I would analyze this content to provide more specific answers.` :
    'To provide more helpful responses, please upload a document first.'
  }`
}

// In a real implementation, you would replace this with actual API calls:
/*
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
})

export const sendMessageToAI = async (message: string, documentContent?: string): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant helping users understand and analyze documents. 
                   The user has uploaded a document with the following content: ${documentContent || 'No document content available.'}
                   Please provide helpful, accurate responses based on the document content.`
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    return completion.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.'
  } catch (error) {
    console.error('Error calling OpenAI API:', error)
    throw new Error('Failed to get AI response')
  }
}
*/


