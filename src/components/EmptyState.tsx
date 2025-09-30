import React from 'react'
import { Upload, FileText, Sparkles } from 'lucide-react'

export const EmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
        <FileText className="w-12 h-12 text-blue-600" />
      </div>
      
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        Welcome to AI Reader Assistant
      </h2>
      
      <p className="text-gray-600 text-center max-w-md mb-8">
        Upload a document to get started. Our AI assistant can help you understand, 
        summarize, and answer questions about your content.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl">
        <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <Upload className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <h3 className="font-medium text-gray-900 mb-2">Upload Documents</h3>
          <p className="text-sm text-gray-600">
            Support for text files and PDFs with automatic content extraction
          </p>
        </div>
        
        <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-3" />
          <h3 className="font-medium text-gray-900 mb-2">AI Chat</h3>
          <p className="text-sm text-gray-600">
            Ask questions and get intelligent insights about your documents
          </p>
        </div>
        
        <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <FileText className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <h3 className="font-medium text-gray-900 mb-2">Customizable Reading</h3>
          <p className="text-sm text-gray-600">
            Adjust typography, themes, and layout for optimal reading experience
          </p>
        </div>
      </div>
    </div>
  )
}


