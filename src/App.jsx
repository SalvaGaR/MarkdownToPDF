import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import { Upload, Trash2, FileDown, Maximize2, Minimize2 } from 'lucide-react'
import html2pdf from 'html2pdf.js'
import mammoth from 'mammoth'
import TurndownService from 'turndown'
import 'katex/dist/katex.min.css'
import 'github-markdown-css/github-markdown-light.css'

const defaultContent = `# Prueba de Renderizado

Ecuaci\u00f3n en l\u00ednea: $E = mc^2$

Ecuaci\u00f3n en bloque:
$$
f(x) = \\int_{-\\infty}^\\infty \\hat f(\\xi)\\,e^{2 \\pi i \\xi x} \\,d\\xi
$$

## Tabla de prueba

| Concepto | F\u00f3rmula | Unidad |
| :--- | :---: | ---: |
| Fuerza | $F = ma$ | Newton |
| Energ\u00eda | $E = mc^2$ | Joule |
| Velocidad | $v = d/t$ | m/s |

## Bloque de c\u00f3digo

\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55
\`\`\`

## Lista de tareas

- [x] Soporte para tablas GFM
- [x] Soporte para c\u00f3digo con sintaxis
- [x] Soporte para ~~texto tachado~~
- [ ] M\u00e1s caracter\u00edsticas por venir

> **Nota:** Este editor soporta Markdown completo con extensiones GFM y f\u00f3rmulas LaTeX.`

const STORAGE_KEY = 'markdown-editor-content'

function App() {
  const [markdown, setMarkdown] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || defaultContent
  })
  const [pdfLoading, setPdfLoading] = useState(false)
  const [previewExpanded, setPreviewExpanded] = useState(false)

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
          backgroundColor: '#ffffff',
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
    if (window.confirm('\u00bfEst\u00e1s seguro de que quieres borrar todo el contenido?')) {
      setMarkdown('')
    }
  }

  return (
    <div className="app-root">
      {/* Glassmorphism Header */}
      <header className="app-header">
        <h1 className="app-title">Markdown Editor</h1>

        <div className="header-actions">
          <input
            type="file"
            accept=".md,.markdown,.txt,.docx"
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
          />

          <button
            className="action-btn btn-upload"
            onClick={() => fileInputRef.current?.click()}
            title="Subir un archivo .md, .txt o .docx"
          >
            <Upload size={15} />
            <span>Subir archivo</span>
          </button>

          <button
            className="action-btn btn-clear"
            onClick={handleClear}
            title="Borrar todo el contenido del editor"
          >
            <Trash2 size={15} />
            <span>Limpiar</span>
          </button>

          <button
            className="action-btn btn-download"
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            title="Exportar la vista previa como PDF"
          >
            <FileDown size={15} />
            <span>{pdfLoading ? 'Generando...' : 'Descargar PDF'}</span>
          </button>
        </div>
      </header>

      {/* Main Editor Area */}
      <main className="editor-area">
        {/* Editor Panel */}
        <div className={`editor-panel ${previewExpanded ? 'collapsed' : ''}`}>
          <div className="pane-header editor-pane-header">
            <span className="pane-label">Editor</span>
          </div>
          <textarea
            className="editor-textarea"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            spellCheck={false}
            placeholder="Escribe tu Markdown aqu\u00ed..."
          />
        </div>

        {/* Preview Panel */}
        <div className={`preview-panel ${previewExpanded ? 'expanded' : ''}`}>
          <div className="pane-header preview-pane-header">
            <span className="pane-label">Vista Previa</span>
            <button
              className="fullscreen-toggle"
              onClick={() => setPreviewExpanded(!previewExpanded)}
              title={previewExpanded ? 'Salir de pantalla completa' : 'Ver en grande'}
            >
              {previewExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>
          <div className="preview-scroll">
            <div className="markdown-body" ref={previewRef}>
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
