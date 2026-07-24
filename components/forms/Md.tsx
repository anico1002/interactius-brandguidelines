/* Inline/block Markdown for form copy (labels, captions, intro, content — PRD §8).
   Brand note: `*emphasis*` renders NON-italic (globals.css neutralises <em>); authors should use
   **bold** to emphasise. `inline` unwraps the paragraph so it can sit inside a <label>/<span>. */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function Md({ children, inline = false }: { children: string; inline?: boolean }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={inline ? { p: ({ children }) => <>{children}</> } : undefined}
    >
      {children}
    </ReactMarkdown>
  );
}
