import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, Loader2 } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { ChatMessage } from './ChatMessage'
import { sendMessageToAI } from '../services/aiService'

interface ChatModalProps {
  onClose: () => void
}

export const ChatModal: React.FC<ChatModalProps> = ({ onClose }) => {
  const { 
    chatMessages, 
    addChatMessage, 
    isTyping, 
    setTyping, 
    currentDocument 
  } = useAppStore()
  
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isTyping])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return

    const userMessage = inputValue.trim()
    setInputValue('')
    addChatMessage({ role: 'user', content: userMessage })

    try {
      setTyping(true)
      const response = await sendMessageToAI(userMessage, currentDocument?.content || '')
      addChatMessage({ role: 'assistant', content: response })
    } catch (error) {
      addChatMessage({ 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      })
    } finally {
      setTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-4xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI Assistant</h2>
              <p className="text-sm text-gray-600">
                {currentDocument ? `Ask about "${currentDocument.name}"` : 'Ask me anything'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-96">
            {chatMessages.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {currentDocument 
                    ? `Ask me anything about "${currentDocument.name}"`
                    : 'Start a conversation with the AI assistant'
                  }
                </p>
              </div>
            ) : (
              chatMessages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}
            
            {isTyping && (
              <div className="flex items-center space-x-2 text-gray-500">
                <Bot className="w-5 h-5" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex space-x-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={currentDocument ? `Ask about "${currentDocument.name}"...` : 'Ask me anything...'}
                className="flex-1 input-field"
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTyping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


