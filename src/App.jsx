import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import { Upload, Trash2, FileDown } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import mammoth from 'mammoth'
import TurndownService from 'turndown'
import 'katex/dist/katex.min.css'

const defaultContent = `# Prueba de Renderizado

Ecuación en línea: $E = mc^2$

Ecuación en bloque:
$$
f(x) = \\int_{-\\infty}^\\infty \\hat f(\\xi)\\,e^{2 \\pi i \\xi x} \\,d\\xi
$$

Tabla de prueba:
| Concepto | Fórmula |
| :--- | :--- |
| Fuerza | $F = ma$ |
| Energía | $E = mc^2$ |
| Velocidad | $v = d/t$ |`

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
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * pdfWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight

      while (heightLeft > 0) {
        position -= pdfHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      pdf.save('documento.pdf')
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
    <div className="flex flex-col h-screen bg-gray-100">

      {/* ── Sticky Toolbar ── */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-6 py-3 bg-slate-900 shadow-lg shrink-0">
        <h1 className="text-white font-bold text-base mr-auto tracking-tight select-none">
          Markdown Editor
        </h1>

        {/* Hidden file input */}
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

      {/* ── Two-column layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Editor column ── */}
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
            placeholder="Escribe tu Markdown aquí..."
          />
        </div>

        {/* ── Preview column ── */}
        <div className="flex flex-col w-1/2">
          <div className="px-5 py-2 bg-gray-200 border-b border-gray-300 shrink-0">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Vista Previa
            </span>
          </div>
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="prose prose-slate max-w-none p-8" ref={previewRef}>
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
