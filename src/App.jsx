import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
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
| Fuerza | $F = ma$ |`

function App() {
  const [markdown, setMarkdown] = useState(defaultContent)

  return (
    <div className="flex h-screen">
      {/* Editor */}
      <textarea
        className="w-1/2 h-screen p-4 resize-none overflow-y-auto border-r border-gray-300 bg-gray-50 text-gray-900 font-mono text-sm focus:outline-none"
        value={markdown}
        onChange={(e) => setMarkdown(e.target.value)}
        spellCheck={false}
      />

      {/* Preview */}
      <div className="w-1/2 h-screen p-4 overflow-y-auto bg-white">
        <div className="prose max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex]}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}

export default App
