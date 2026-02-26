import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import { Upload, Trash2, FileDown } from 'lucide-react'
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
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">

      {/* Sticky Toolbar */}
      <header className="flex items-center gap-3 px-6 py-3 bg-slate-900 shadow-lg shrink-0">
        <h1 className="text-white font-bold text-base mr-auto tracking-tight select-none">
          Markdown Editor
        </h1>

        <input
          type="file"
          accept=".md,.markdown,.txt,.docx"
          ref={fileInputRef}
          onChange={handleUpload}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
          title="Subir un archivo .md, .txt o .docx desde tu ordenador"
        >
          <Upload size={15} />
          Subir archivo
        </button>

        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
          title="Borrar todo el contenido del editor"
        >
          <Trash2 size={15} />
          Limpiar
        </button>

        <button
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors shadow-sm"
          title="Exportar la vista previa como PDF"
        >
          <FileDown size={15} />
          {pdfLoading ? 'Generando...' : 'Descargar PDF'}
        </button>
      </header>

      {/* Two-column layout */}
      <div className="flex flex-1 min-h-0">

        {/* Editor column */}
        <div className="flex flex-col w-1/2 border-r border-gray-300">
          <div className="px-5 py-2 bg-gray-200 border-b border-gray-300 shrink-0">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Editor
            </span>
          </div>
          <textarea
            className="flex-1 p-5 resize-none overflow-y-auto bg-gray-950 text-gray-100 font-mono text-sm focus:outline-none leading-relaxed caret-blue-400 placeholder-gray-600"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            spellCheck={false}
            placeholder="Escribe tu Markdown aqu\u00ed..."
          />
        </div>

        {/* Preview column */}
        <div className="flex flex-col w-1/2">
          <div className="px-5 py-2 bg-gray-200 border-b border-gray-300 shrink-0">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Vista Previa
            </span>
          </div>
          <div className="flex-1 overflow-y-auto bg-white">
            <div
              className="markdown-body p-8"
              ref={previewRef}
            >
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default App
