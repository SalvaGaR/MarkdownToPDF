import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import { Upload, Trash2, Download, Maximize2, Minimize2, Plus, Minus } from 'lucide-react'
import html2pdf from 'html2pdf.js'
import mammoth from 'mammoth'
import TurndownService from 'turndown'
import 'katex/dist/katex.min.css'

const DEFAULT_CONTENT = `# Project Proposal: Aurora

This document outlines the development of the new 'Aurora' minimalist markdown editor variant.

## Key Features

- Ultra-minimalist design
- Real-time preview
- Floating action buttons

### Mathematical Model

The core rendering engine uses a simplified formula: $R = E + P + S$ where:

- $R$ is the rendered output
- $E$ is the editor content
- $P$ is the processing logic
- $S$ is the style definitions

### Performance Metrics

| Metric       | Target  | Current |
| :----------- | :-----: | ------: |
| Load Time    | < 1s    | 0.8s    |
| Render Speed | < 50ms  | 35ms    |
| Memory Usage | < 100MB | 75MB    |

## Next Steps

1. Refine typography
2. Implement dark/light mode toggle
3. Add export options`

const STORAGE_KEY = 'markdown-editor-content'
const ZOOM_KEY = 'markdown-editor-zoom'
const ZOOM_MIN = 60
const ZOOM_MAX = 160
const ZOOM_STEP = 10
const ZOOM_DEFAULT = 100

const remarkPlugins = [remarkMath, remarkGfm]
const rehypePlugins = [rehypeKatex]

function App() {
  const [markdown, setMarkdown] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_CONTENT
  })
  const [pdfLoading, setPdfLoading] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [zoom, setZoom] = useState(() => {
    const saved = localStorage.getItem(ZOOM_KEY)
    return saved ? Number(saved) : ZOOM_DEFAULT
  })

  const previewRef = useRef(null)
  const fullscreenPreviewRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, markdown)
  }, [markdown])

  useEffect(() => {
    localStorage.setItem(ZOOM_KEY, String(zoom))
  }, [zoom])

  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [fullscreen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && fullscreen) {
        setFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fullscreen])

  const handleDownloadPdf = useCallback(async () => {
    const element = fullscreen ? fullscreenPreviewRef.current : previewRef.current
    if (!element) return
    setPdfLoading(true)
    try {
      const opt = {
        margin: [10, 10, 10, 10],
        filename: 'documento.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#fdfdfd' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      }
      await html2pdf().set(opt).from(element).save()
    } catch (err) {
      console.error('Error generating PDF:', err)
    } finally {
      setPdfLoading(false)
    }
  }, [fullscreen])

  const handleUpload = useCallback(async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.name.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.convertToHtml({ arrayBuffer })
      const turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' })
      setMarkdown(turndown.turndown(result.value))
    } else {
      const reader = new FileReader()
      reader.onload = (event) => setMarkdown(event.target.result)
      reader.readAsText(file)
    }
    e.target.value = ''
  }, [])

  const handleClear = useCallback(() => {
    if (window.confirm('¿Estás seguro de que quieres borrar todo el contenido?')) {
      setMarkdown('')
    }
  }, [])

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + ZOOM_STEP, ZOOM_MAX))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - ZOOM_STEP, ZOOM_MIN))
  }, [])

  const zoomStyle = { fontSize: `${zoom}%` }

  const markdownPreview = (
    <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
      {markdown}
    </ReactMarkdown>
  )

  return (
    <div className="aurora-root">
      {/* Editor Panel */}
      <section className="editor-section">
        <div className="editor-content-wrapper">
          <textarea
            className="editor-textarea"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            spellCheck={false}
            placeholder="Escribe tu Markdown aquí..."
            style={zoomStyle}
          />
        </div>
      </section>

      {/* Preview Panel */}
      <section className="preview-section">
        <div className="toolbar">
          <input
            type="file"
            accept=".md,.markdown,.txt,.docx"
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
          />

          <button
            className="tool-btn"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Subir archivo"
            title="Subir archivo (.md, .txt, .docx)"
          >
            <Upload size={16} strokeWidth={1.5} />
          </button>

          <button
            className="tool-btn"
            onClick={handleClear}
            aria-label="Borrar contenido"
            title="Borrar todo"
          >
            <Trash2 size={16} strokeWidth={1.5} />
          </button>

          <button
            className="tool-btn"
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            aria-label="Descargar PDF"
            title="Exportar PDF"
          >
            <Download size={16} strokeWidth={1.5} />
          </button>

          <div className="toolbar-separator" />

          <button
            className="tool-btn"
            onClick={handleZoomOut}
            disabled={zoom <= ZOOM_MIN}
            aria-label="Reducir zoom"
            title="Reducir texto"
          >
            <Minus size={16} strokeWidth={1.5} />
          </button>

          <span className="zoom-label">{zoom}%</span>

          <button
            className="tool-btn"
            onClick={handleZoomIn}
            disabled={zoom >= ZOOM_MAX}
            aria-label="Aumentar zoom"
            title="Aumentar texto"
          >
            <Plus size={16} strokeWidth={1.5} />
          </button>

          <div className="toolbar-separator" />

          <button
            className="tool-btn"
            onClick={() => setFullscreen(true)}
            aria-label="Vista completa A4"
            title="Vista completa A4"
          >
            <Maximize2 size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="preview-scroll">
          <div className="preview-body" ref={previewRef} style={zoomStyle}>
            {markdownPreview}
          </div>
        </div>
      </section>

      {/* Fullscreen A4 Preview Overlay */}
      {fullscreen && (
        <div className="fullscreen-overlay" onClick={() => setFullscreen(false)}>
          <div className="fullscreen-container" onClick={(e) => e.stopPropagation()}>
            <div className="fullscreen-toolbar">
              <button
                className="tool-btn"
                onClick={handleZoomOut}
                disabled={zoom <= ZOOM_MIN}
                title="Reducir texto"
              >
                <Minus size={16} strokeWidth={1.5} />
              </button>
              <span className="zoom-label">{zoom}%</span>
              <button
                className="tool-btn"
                onClick={handleZoomIn}
                disabled={zoom >= ZOOM_MAX}
                title="Aumentar texto"
              >
                <Plus size={16} strokeWidth={1.5} />
              </button>

              <div className="toolbar-separator" />

              <button
                className="tool-btn"
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                title="Exportar PDF"
              >
                <Download size={16} strokeWidth={1.5} />
              </button>

              <button
                className="tool-btn"
                onClick={() => setFullscreen(false)}
                title="Cerrar vista completa"
              >
                <Minimize2 size={16} strokeWidth={1.5} />
              </button>
            </div>

            <div className="fullscreen-scroll">
              <div className="a4-page" ref={fullscreenPreviewRef} style={zoomStyle}>
                <div className="preview-body">
                  {markdownPreview}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
