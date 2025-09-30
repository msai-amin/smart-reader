import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download,
  Eye,
  FileText,
  ChevronsLeft,
  ChevronsRight,
  Maximize2,
  Search,
  Highlighter,
  Trash2,
  Rows,
  Square,
  Play,
  Pause,
  Volume2
} from 'lucide-react'
import { useAppStore, Document as DocumentType } from '../store/appStore'
import { ttsService } from '../services/ttsService'
import { TTSControls } from './TTSControls'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`

interface Highlight {
  id: string
  pageNumber: number
  text: string
  color: string
  position: { x: number; y: number; width: number; height: number }
}

interface PDFViewerProps {
  document: DocumentType
}

const PDFViewer: React.FC<PDFViewerProps> = ({ document }) => {
  const { pdfViewer, updatePDFViewer, tts, updateTTS } = useAppStore()
  const [numPages, setNumPages] = useState<number>(document.totalPages || 0)
  const [pageNumber, setPageNumber] = useState<number>(pdfViewer.currentPage)
  const [scale, setScale] = useState<number>(pdfViewer.scale)
  const [rotation, setRotation] = useState<number>(pdfViewer.rotation)
  const [scrollMode, setScrollMode] = useState<'single' | 'continuous'>(pdfViewer.scrollMode)
  const [error, setError] = useState<string | null>(null)
  const [pageInputValue, setPageInputValue] = useState<string>(String(pdfViewer.currentPage))
  const [searchText, setSearchText] = useState<string>('')
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [selectedColor, setSelectedColor] = useState<string>('#FFFF00')
  const [showHighlightMenu, setShowHighlightMenu] = useState<boolean>(false)
  const [showTTSSettings, setShowTTSSettings] = useState<boolean>(false)
  const pageContainerRef = useRef<HTMLDivElement>(null)

  const highlightColors = [
    { name: 'Yellow', value: '#FFFF00' },
    { name: 'Green', value: '#90EE90' },
    { name: 'Blue', value: '#87CEEB' },
    { name: 'Pink', value: '#FFB6C1' },
    { name: 'Orange', value: '#FFA500' },
  ]

  useEffect(() => {
    setPageInputValue(String(pageNumber))
  }, [pageNumber])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      
      switch(e.key) {
        case 'ArrowLeft':
          if (scrollMode === 'single' && pageNumber > 1) goToPrevPage()
          break
        case 'ArrowRight':
          if (scrollMode === 'single' && pageNumber < numPages) goToNextPage()
          break
        case '+':
        case '=':
          zoomIn()
          break
        case '-':
          zoomOut()
          break
        case 'r':
          rotate()
          break
        case 'f':
          toggleFullscreen()
          break
        case 'h':
          setShowHighlightMenu(!showHighlightMenu)
          break
        case 's':
          toggleScrollMode()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [pageNumber, numPages, scale, rotation, showHighlightMenu, scrollMode])

  // Handle text selection for highlighting
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection()
      if (selection && selection.toString().trim() && showHighlightMenu) {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        
        if (pageContainerRef.current) {
          const containerRect = pageContainerRef.current.getBoundingClientRect()
          const relativeRect = {
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top,
            width: rect.width,
            height: rect.height
          }

          const newHighlight: Highlight = {
            id: Date.now().toString(),
            pageNumber,
            text: selection.toString(),
            color: selectedColor,
            position: relativeRect
          }

          setHighlights([...highlights, newHighlight])
        }
      }
    }

    window.document.addEventListener('mouseup', handleSelection)
    return () => window.document.removeEventListener('mouseup', handleSelection)
  }, [showHighlightMenu, selectedColor, pageNumber, highlights])

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log('✅ PDF loaded successfully:', numPages, 'pages')
    setNumPages(numPages)
    setError(null)
  }, [])

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('❌ PDF load error:', error)
    setError('Failed to load PDF. Using text-only view.')
  }, [])

  const goToPrevPage = () => {
    if (pageNumber > 1) {
      const newPage = pageNumber - 1
      setPageNumber(newPage)
      updatePDFViewer({ currentPage: newPage })
    }
  }

  const goToNextPage = () => {
    if (pageNumber < numPages) {
      const newPage = pageNumber + 1
      setPageNumber(newPage)
      updatePDFViewer({ currentPage: newPage })
    }
  }

  const goToFirstPage = () => {
    setPageNumber(1)
    updatePDFViewer({ currentPage: 1 })
  }

  const goToLastPage = () => {
    setPageNumber(numPages)
    updatePDFViewer({ currentPage: numPages })
  }

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInputValue(e.target.value)
  }

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const pageNum = parseInt(pageInputValue)
    if (pageNum >= 1 && pageNum <= numPages) {
      setPageNumber(pageNum)
      updatePDFViewer({ currentPage: pageNum })
    } else {
      setPageInputValue(String(pageNumber))
    }
  }

  const zoomIn = () => {
    const newScale = Math.min(scale + 0.2, 3)
    setScale(newScale)
    updatePDFViewer({ scale: newScale })
  }

  const zoomOut = () => {
    const newScale = Math.max(scale - 0.2, 0.5)
    setScale(newScale)
    updatePDFViewer({ scale: newScale })
  }

  const resetZoom = () => {
    setScale(1.0)
    updatePDFViewer({ scale: 1.0 })
  }

  const fitToWidth = () => {
    setScale(1.5)
    updatePDFViewer({ scale: 1.5 })
  }

  const rotate = () => {
    const newRotation = (rotation + 90) % 360
    setRotation(newRotation)
    updatePDFViewer({ rotation: newRotation })
  }

  const toggleViewMode = () => {
    const newMode = pdfViewer.viewMode === 'pdf' ? 'text' : 'pdf'
    updatePDFViewer({ viewMode: newMode })
  }

  const toggleScrollMode = () => {
    const newMode = scrollMode === 'single' ? 'continuous' : 'single'
    setScrollMode(newMode)
    updatePDFViewer({ scrollMode: newMode })
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const toggleHighlightMode = () => {
    setShowHighlightMenu(!showHighlightMenu)
  }

  const clearHighlights = () => {
    setHighlights(highlights.filter(h => h.pageNumber !== pageNumber))
  }

  const clearAllHighlights = () => {
    setHighlights([])
  }

  const downloadPDF = () => {
    if (document.pdfData) {
      const blob = new Blob([document.pdfData], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = document.name
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleSearch = () => {
    if (searchText.trim()) {
      const foundPageIndex = document.pageTexts?.findIndex(text => 
        text.toLowerCase().includes(searchText.toLowerCase())
      )
      
      if (foundPageIndex !== undefined && foundPageIndex >= 0) {
        const newPage = foundPageIndex + 1
        setPageNumber(newPage)
        updatePDFViewer({ currentPage: newPage })
      }
    }
  }

  // TTS Functions
  const handleTTSPlay = () => {
    if (!tts.isEnabled || !document.pageTexts) return

    const currentPageText = document.pageTexts[pageNumber - 1]
    if (!currentPageText) return

    const cleanedText = ttsService.cleanText(currentPageText)
    
    if (tts.isPlaying && !ttsService.isPausedState()) {
      ttsService.pause()
      updateTTS({ isPlaying: false })
    } else if (ttsService.isPausedState()) {
      ttsService.resume()
      updateTTS({ isPlaying: true })
    } else {
      ttsService.speak(
        cleanedText,
        () => {
          // On end, move to next page if available
          updateTTS({ isPlaying: false })
          if (pageNumber < numPages) {
            goToNextPage()
            // Auto-continue reading next page
            setTimeout(() => handleTTSPlay(), 500)
          }
        }
      )
      updateTTS({ isPlaying: true })
    }
  }

  const handleTTSStop = () => {
    ttsService.stop()
    updateTTS({ isPlaying: false })
  }

  const readCurrentPage = () => {
    if (!document.pageTexts) return
    const currentPageText = document.pageTexts[pageNumber - 1]
    if (!currentPageText) return

    const cleanedText = ttsService.cleanText(currentPageText)
    ttsService.speak(cleanedText, () => {
      updateTTS({ isPlaying: false })
    })
    updateTTS({ isPlaying: true })
  }

  const readFromCurrentPage = () => {
    if (!document.pageTexts) return
    
    let currentPage = pageNumber
    const readNextPage = () => {
      if (currentPage > numPages) {
        updateTTS({ isPlaying: false })
        return
      }

      const pageText = document.pageTexts![currentPage - 1]
      if (!pageText) {
        currentPage++
        readNextPage()
        return
      }

      const cleanedText = ttsService.cleanText(pageText)
      ttsService.speak(cleanedText, () => {
        currentPage++
        if (currentPage <= numPages) {
          setPageNumber(currentPage)
          updatePDFViewer({ currentPage })
          setTimeout(readNextPage, 500)
        } else {
          updateTTS({ isPlaying: false })
        }
      })
    }

    updateTTS({ isPlaying: true })
    readNextPage()
  }

  // Stop TTS when page changes or component unmounts
  useEffect(() => {
    return () => {
      if (tts.isPlaying) {
        ttsService.stop()
      }
    }
  }, [pageNumber])

  const currentPageHighlights = highlights.filter(h => h.pageNumber === pageNumber)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-yellow-50 rounded-lg">
        <FileText className="w-16 h-16 text-yellow-600 mb-4" />
        <p className="text-lg text-gray-700 mb-2">{error}</p>
        <p className="text-sm text-gray-600">Showing text content instead</p>
        <div className="mt-4 p-6 bg-white rounded-lg max-w-4xl w-full">
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {document.content}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`pdf-viewer w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* PDF Controls */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            {/* Page Navigation (only show in single page mode) */}
            {scrollMode === 'single' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={goToFirstPage}
                  disabled={pageNumber <= 1}
                  className="btn-ghost p-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                  className="btn-ghost p-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Previous Page (←)"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1 mx-1">
                  <input
                    type="text"
                    value={pageInputValue}
                    onChange={handlePageInputChange}
                    className="w-12 text-center text-sm border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-500">/ {numPages}</span>
                </form>
                
                <button
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages}
                  className="btn-ghost p-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Next Page (→)"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={goToLastPage}
                  disabled={pageNumber >= numPages}
                  className="btn-ghost p-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {scrollMode === 'continuous' && (
              <div className="text-sm text-gray-600">
                {numPages} pages
              </div>
            )}

            {/* Scroll Mode Toggle */}
            <div className="flex items-center gap-1 border-l border-gray-300 pl-3">
              <button
                onClick={toggleScrollMode}
                className={`btn-ghost p-1.5 ${scrollMode === 'single' ? 'bg-indigo-100 text-indigo-600' : ''}`}
                title="Single Page Mode (S)"
              >
                <Square className="w-4 h-4" />
              </button>
              <button
                onClick={toggleScrollMode}
                className={`btn-ghost p-1.5 ${scrollMode === 'continuous' ? 'bg-indigo-100 text-indigo-600' : ''}`}
                title="Continuous Scroll Mode (S)"
              >
                <Rows className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border-l border-gray-300 pl-3">
              <button
                onClick={zoomOut}
                className="btn-ghost p-1.5"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={resetZoom}
                className="text-sm text-gray-700 min-w-[50px] text-center hover:bg-gray-100 rounded px-2 py-1"
                title="Reset Zoom"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                onClick={zoomIn}
                className="btn-ghost p-1.5"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={fitToWidth}
                className="btn-ghost p-1.5 text-xs"
                title="Fit to Width"
              >
                Fit
              </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-1 border-l border-gray-300 pl-3">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search..."
                className="w-32 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Highlight Tools */}
            <div className="relative border-l border-gray-300 pl-2">
              <button
                onClick={toggleHighlightMode}
                className={`btn-ghost p-1.5 ${showHighlightMenu ? 'bg-indigo-100 text-indigo-600' : ''}`}
                title="Highlight Mode (H)"
              >
                <Highlighter className="w-4 h-4" />
              </button>
              
              {showHighlightMenu && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Highlight Color</div>
                  <div className="flex gap-2 mb-2">
                    {highlightColors.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setSelectedColor(color.value)}
                        className={`w-8 h-8 rounded border-2 ${selectedColor === color.value ? 'border-gray-800' : 'border-gray-300'}`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={clearHighlights}
                      className="text-xs text-gray-600 hover:text-red-600 flex items-center gap-1"
                      title="Clear highlights on this page"
                    >
                      <Trash2 className="w-3 h-3" />
                      Page
                    </button>
                    <button
                      onClick={clearAllHighlights}
                      className="text-xs text-gray-600 hover:text-red-600 flex items-center gap-1"
                      title="Clear all highlights"
                    >
                      <Trash2 className="w-3 h-3" />
                      All
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={rotate}
              className="btn-ghost p-1.5"
              title="Rotate (R)"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            
            <button
              onClick={toggleViewMode}
              className="btn-ghost p-1.5"
              title="Toggle View Mode"
            >
              <Eye className="w-4 h-4" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="btn-ghost p-1.5"
              title="Fullscreen (F)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            
            <button
              onClick={downloadPDF}
              className="btn-ghost p-1.5"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* TTS Controls */}
            {tts.isEnabled && (
              <div className="flex items-center gap-1 border-l border-gray-300 pl-2">
                <button
                  onClick={handleTTSPlay}
                  className={`btn-ghost p-1.5 ${tts.isPlaying ? 'bg-green-100 text-green-600' : ''}`}
                  title={tts.isPlaying ? 'Pause Reading' : 'Play/Resume Reading'}
                >
                  {tts.isPlaying && !ttsService.isPausedState() ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={handleTTSStop}
                  className="btn-ghost p-1.5"
                  title="Stop Reading"
                  disabled={!tts.isPlaying}
                >
                  <Square className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowTTSSettings(!showTTSSettings)}
                  className={`btn-ghost p-1.5 ${showTTSSettings ? 'bg-blue-100 text-blue-600' : ''}`}
                  title="TTS Settings"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* TTS Settings Panel */}
        {showTTSSettings && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200">
            <TTSControls />
            <div className="mt-3 flex gap-2">
              <button
                onClick={readCurrentPage}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Read Current Page
              </button>
              <button
                onClick={readFromCurrentPage}
                className="px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600"
              >
                Read from Here to End
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PDF Content */}
      <div className={`flex justify-center bg-gray-100 ${isFullscreen ? 'h-[calc(100vh-60px)] overflow-auto' : 'min-h-screen p-4'}`}>
        <div className="relative" ref={pageContainerRef}>
          {pdfViewer.viewMode === 'text' ? (
            <div className="p-8 max-w-4xl bg-white shadow-lg border border-gray-200 rounded-lg">
              <div className="prose prose-lg max-w-none">
                <h3 className="text-lg font-semibold mb-4">
                  {scrollMode === 'single' ? `Page ${pageNumber} Text Content:` : 'Full Document Text:'}
                </h3>
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {scrollMode === 'single' 
                    ? (document.pageTexts?.[pageNumber - 1] || 'No text content available for this page.')
                    : document.content
                  }
                </div>
              </div>
            </div>
          ) : (
            <>
              {scrollMode === 'single' ? (
                <div className="shadow-lg border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <Document
                    file={document.pdfData}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <div className="flex items-center justify-center p-12">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                          <p className="text-gray-600">Loading PDF...</p>
                        </div>
                      </div>
                    }
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      rotate={rotation}
                      loading={
                        <div className="flex items-center justify-center p-12">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                            <p className="text-sm text-gray-600">Loading page...</p>
                          </div>
                        </div>
                      }
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  </Document>
                  
                  {/* Highlight Overlays for Single Page */}
                  {currentPageHighlights.map(highlight => (
                    <div
                      key={highlight.id}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${highlight.position.x}px`,
                        top: `${highlight.position.y}px`,
                        width: `${highlight.position.width}px`,
                        height: `${highlight.position.height}px`,
                        backgroundColor: highlight.color,
                        opacity: 0.4,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <Document
                    file={document.pdfData}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <div className="flex items-center justify-center p-12">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                          <p className="text-gray-600">Loading PDF...</p>
                        </div>
                      </div>
                    }
                  >
                    {Array.from(new Array(numPages), (_, index) => (
                      <div key={`page_${index + 1}`} className="mb-4 shadow-lg border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <div className="bg-gray-50 px-3 py-1 text-xs text-gray-600 border-b border-gray-200">
                          Page {index + 1}
                        </div>
                        <Page
                          pageNumber={index + 1}
                          scale={scale}
                          rotate={rotation}
                          loading={
                            <div className="flex items-center justify-center p-8">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-1"></div>
                                <p className="text-xs text-gray-600">Loading...</p>
                              </div>
                            </div>
                          }
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                        />
                      </div>
                    ))}
                  </Document>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      {isFullscreen && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-3 rounded-lg">
          <div className="font-semibold mb-1">Keyboard Shortcuts:</div>
          <div>← → : Navigate pages (single mode)</div>
          <div>+ - : Zoom in/out</div>
          <div>R : Rotate</div>
          <div>F : Fullscreen</div>
          <div>H : Toggle highlight mode</div>
          <div>S : Toggle scroll mode</div>
        </div>
      )}

      {/* Highlight Mode Indicator */}
      {showHighlightMenu && !isFullscreen && (
        <div className="fixed bottom-4 right-4 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <Highlighter className="w-4 h-4" />
            <span>Highlight Mode Active - Select text to highlight</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default PDFViewer