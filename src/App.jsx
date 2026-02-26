import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import { Upload, Trash2, Download } from 'lucide-react'
import html2pdf from 'html2pdf.js'
import mammoth from 'mammoth'
import TurndownService from 'turndown'
import 'katex/dist/katex.min.css'

const defaultContent = `# Project Proposal: Aurora

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

function App() {
  const [markdown, setMarkdown] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || defaultContent
  })
  const [pdfLoading, setPdfLoading] = useState(false)

  const previewRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, markdown)
  }, [markdown])

  const handleDownloadPdf = async () => {
    const element = previewRef.current
    if (!element) return
    setPdfLoading(true)
    try {
      const opt = {
        margin: [10, 10, 10, 10],
        filename: 'documento.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#fdfdfd',
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      }
      await html2pdf().set(opt).from(element).save()
    } catch (err) {
      console.error('Error al generar PDF:', err)
      alert('Error al generar el PDF: ' + err.message)
    } finally {
      setPdfLoading(false)
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.name.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.convertToHtml({ arrayBuffer })
      const turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' })
      const md = turndown.turndown(result.value)
      setMarkdown(md)
    } else {
      const reader = new FileReader()
      reader.onload = (event) => setMarkdown(event.target.result)
      reader.readAsText(file)
    }

    e.target.value = ''
  }

  const handleClear = () => {
    if (window.confirm('¿Estás seguro de que quieres borrar todo el contenido?')) {
      setMarkdown('')
    }
  }

  return (
    <div className="aurora-root">
      {/* Left Panel — Markdown Editor */}
      <section className="editor-section">
        <div className="editor-content-wrapper">
          <textarea
            className="editor-textarea"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            spellCheck={false}
            placeholder="Escribe tu Markdown aquí..."
          />
        </div>
      </section>

      {/* Right Panel — Live Preview */}
      <section className="preview-section">
        {/* Floating Action Buttons */}
        <div className="floating-actions">
          <input
            type="file"
            accept=".md,.markdown,.txt,.docx"
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
          />

          <button
            className="fab fab-blue"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Subir archivo"
            title="Subir un archivo .md, .txt o .docx"
          >
            <Upload size={20} strokeWidth={2} />
          </button>

          <button
            className="fab fab-red"
            onClick={handleClear}
            aria-label="Borrar contenido"
            title="Borrar todo el contenido"
          >
            <Trash2 size={20} strokeWidth={2} />
          </button>

          <button
            className="fab fab-green"
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            aria-label="Descargar PDF"
            title="Exportar como PDF"
          >
            <Download size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Preview Content */}
        <div className="preview-scroll">
          <div className="preview-body" ref={previewRef}>
            <ReactMarkdown
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex]}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </div>
      </section>
    </div>
  )
}

export default App
