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

const DEFAULT_CONTENT = `# Markdown + LaTeX: Guía Experta

Bienvenido a **MarkdownToPDF**. Este editor renderiza Markdown con soporte matemático completo vía **KaTeX**. Todo lo que ves aquí se exporta a PDF con fidelidad tipográfica.

---

## 1. Formato de texto

El texto puede ser **negrita**, *cursiva*, ~~tachado~~ o \`código inline\`. También puedes combinar ***negrita y cursiva***.

> "La matemática es el lenguaje con el que Dios ha escrito el universo."
> — *Galileo Galilei*

---

## 2. Matemáticas en línea

Las expresiones inline se delimitan con \`$...$\`:

La identidad de Euler, $e^{i\\pi} + 1 = 0$, es considerada la más bella de las matemáticas.

La fórmula cuadrática para $ax^2 + bx + c = 0$ es $x = \\dfrac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.

La derivada de la función gaussiana es $\\frac{d}{dx}e^{-x^2} = -2x\\,e^{-x^2}$.

---

## 3. Bloques matemáticos

Para ecuaciones centradas usa \`$$...$$\`:

$$\\int_{-\\infty}^{\\infty} e^{-x^2}\\, dx = \\sqrt{\\pi}$$

Las ecuaciones de Maxwell en forma diferencial:

$$\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}, \\qquad \\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J} + \\mu_0\\varepsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t}$$

La transformada de Fourier:

$$\\hat{f}(\\xi) = \\int_{-\\infty}^{\\infty} f(x)\\, e^{-2\\pi i x\\xi}\\, dx$$

---

## 4. Listas

### Conceptos clave

- **Álgebra lineal:** vectores, matrices, autovalores $\\lambda$
- **Cálculo:** límites, derivadas $\\frac{df}{dx}$, integrales $\\int_a^b f\\,dx$
  - Regla de la cadena: $\\frac{d}{dx}[f(g(x))] = f'(g(x))\\cdot g'(x)$
  - Teorema fundamental: $\\int_a^b f'(x)\\,dx = f(b) - f(a)$
- **Estadística:** distribuciones, esperanza $\\mathbb{E}[X]$, varianza $\\text{Var}(X)$

### Pasos para resolver $\\nabla^2 \\phi = 0$

1. Separar variables: $\\phi(r, \\theta) = R(r)\\,\\Theta(\\theta)$
2. Aplicar condiciones de contorno
3. Expandir en serie de Fourier: $\\phi = \\sum_{n=0}^{\\infty} a_n r^n \\cos(n\\theta)$
4. Determinar los coeficientes $a_n$ por ortogonalidad

### Progreso

- [x] Configurar KaTeX para renderizado matemático
- [x] Soporte para bloques de código con resaltado
- [ ] Numeración automática de ecuaciones

---

## 5. Código

\`\`\`python
import numpy as np

def gaussiana(x, mu=0, sigma=1):
    """Función de densidad normal N(mu, sigma^2)."""
    return np.exp(-0.5 * ((x - mu) / sigma)**2) / (sigma * np.sqrt(2 * np.pi))

x = np.linspace(-4, 4, 1000)
y = gaussiana(x)
\`\`\`

\`\`\`latex
% Ecuación de Schrödinger independiente del tiempo
\\hat{H}\\psi = E\\psi \\quad \\Rightarrow \\quad
-\\frac{\\hbar^2}{2m}\\nabla^2\\psi + V\\psi = E\\psi
\`\`\`

---

## 6. Referencia de símbolos LaTeX

| Símbolo | Nombre | Código LaTeX |
| :--- | :--- | :--- |
| $\\alpha,\\, \\beta,\\, \\gamma$ | Letras griegas | \`\\alpha\`, \`\\beta\`, \`\\gamma\` |
| $\\nabla$ | Nabla / operador del | \`\\nabla\` |
| $\\partial$ | Derivada parcial | \`\\partial\` |
| $\\infty$ | Infinito | \`\\infty\` |
| $\\mathbb{R},\\,\\mathbb{C}$ | Conjuntos numéricos | \`\\mathbb{R}\`, \`\\mathbb{C}\` |
| $\\sum_{i=1}^{n} i$ | Sumatoria | \`\\sum_{i=1}^{n}\` |
| $\\prod_{k=1}^{n} k$ | Productoria | \`\\prod_{k=1}^{n}\` |
| $\\lim_{x \\to 0}$ | Límite | \`\\lim_{x \\to 0}\` |

---

## 7. Distribución normal y estadística

La distribución $X \\sim \\mathcal{N}(\\mu, \\sigma^2)$ tiene función de densidad:

$$f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} \\exp\\!\\left(-\\frac{(x-\\mu)^2}{2\\sigma^2}\\right)$$

Su función característica es $\\varphi(t) = \\exp\\!\\left(i\\mu t - \\frac{\\sigma^2 t^2}{2}\\right)$.

El estimador de máxima verosimilitud de $\\mu$ es simplemente $\\hat{\\mu} = \\bar{x} = \\frac{1}{n}\\sum_{i=1}^n x_i$.

---

*Edita este documento o importa tu propio archivo `.md` / `.docx` — y exporta a PDF con el botón de descarga.*`

const STORAGE_KEY = 'markdown-editor-content'
const ZOOM_KEY = 'markdown-editor-zoom'
const EDITOR_ZOOM_KEY = 'markdown-editor-editor-zoom'
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
  const [editorZoom, setEditorZoom] = useState(() => {
    const saved = localStorage.getItem(EDITOR_ZOOM_KEY)
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
    localStorage.setItem(EDITOR_ZOOM_KEY, String(editorZoom))
  }, [editorZoom])

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

  const handleEditorZoomIn = useCallback(() => {
    setEditorZoom((prev) => Math.min(prev + ZOOM_STEP, ZOOM_MAX))
  }, [])

  const handleEditorZoomOut = useCallback(() => {
    setEditorZoom((prev) => Math.max(prev - ZOOM_STEP, ZOOM_MIN))
  }, [])

  const zoomStyle = { fontSize: `${zoom}%` }
  const editorZoomStyle = { fontSize: `${editorZoom}%` }

  const markdownPreview = (
    <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
      {markdown}
    </ReactMarkdown>
  )

  return (
    <div className="aurora-root">
      {/* Editor Panel */}
      <section className="editor-section">
        <div className="editor-toolbar">
          <button
            className="tool-btn"
            onClick={handleEditorZoomOut}
            disabled={editorZoom <= ZOOM_MIN}
            aria-label="Reducir zoom editor"
            title="Reducir texto"
          >
            <Minus size={16} strokeWidth={1.5} />
          </button>
          <span className="zoom-label">{editorZoom}%</span>
          <button
            className="tool-btn"
            onClick={handleEditorZoomIn}
            disabled={editorZoom >= ZOOM_MAX}
            aria-label="Aumentar zoom editor"
            title="Aumentar texto"
          >
            <Plus size={16} strokeWidth={1.5} />
          </button>
        </div>
        <div className="editor-content-wrapper">
          <textarea
            className="editor-textarea"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            spellCheck={false}
            placeholder="Escribe tu Markdown aquí..."
            style={editorZoomStyle}
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
              <div className="a4-page" ref={fullscreenPreviewRef}>
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
