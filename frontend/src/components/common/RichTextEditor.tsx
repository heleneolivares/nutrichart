import { useEffect, useRef } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';

// Custom FontSize extension built on TextStyle (no Pro required)
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (el: HTMLElement) => el.style.fontSize || null,
          renderHTML: (attrs: Record<string, any>) =>
            attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }: any) =>
        chain().setMark('textStyle', { fontSize: size }).run(),
    } as any;
  },
});

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px'];

export default function RichTextEditor({ content, onChange, placeholder = 'Escribe la anamnesis aquí...' }: Props) {
  const initialized = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      FontSize,
    ],
    content: '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[200px] px-4 py-3 text-sm text-gray-800 leading-relaxed',
      },
    },
  });

  // Load initial content once (when opening an existing consultation)
  useEffect(() => {
    if (editor && !initialized.current) {
      if (content) {
        editor.commands.setContent(content, { emitUpdate: false });
      }
      initialized.current = true;
    }
  }, [editor, content]);

  if (!editor) return <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />;

  const isActive = (name: string, attrs?: object) => editor.isActive(name, attrs);

  const Btn = ({
    onClick, active, title, children,
  }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`px-2 py-1.5 rounded text-sm font-medium transition-colors select-none ${
        active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-5 bg-gray-200 mx-0.5 self-center" />;

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-transparent transition-shadow">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-gray-50">
        {/* Formato de texto */}
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={isActive('bold')} title="Negrita (Ctrl+B)">
          <strong>B</strong>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={isActive('italic')} title="Cursiva (Ctrl+I)">
          <em>I</em>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={isActive('underline')} title="Subrayado (Ctrl+U)">
          <span style={{ textDecoration: 'underline' }}>U</span>
        </Btn>

        <Divider />

        {/* Tamaño de fuente */}
        <select
          title="Tamaño de fuente"
          className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white text-gray-700 cursor-pointer hover:border-gray-300"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) {
              editor.chain().focus().setFontSize(e.target.value).run();
            }
          }}
        >
          <option value="" disabled>Tamaño</option>
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>{s.replace('px', ' pt')}</option>
          ))}
        </select>

        {/* Color de texto */}
        <div className="flex items-center gap-1 px-1" title="Color de letra">
          <span className="text-xs font-bold text-gray-600">A</span>
          <input
            type="color"
            defaultValue="#000000"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className="w-6 h-5 rounded cursor-pointer border border-gray-200 p-0 overflow-hidden"
            title="Color de letra"
          />
        </div>

        <Divider />

        {/* Listas */}
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={isActive('bulletList')} title="Lista con viñetas">
          <span className="text-base leading-none">•≡</span>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={isActive('orderedList')} title="Lista numerada">
          <span className="text-xs">1≡</span>
        </Btn>

        <Divider />

        {/* Alineación */}
        <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive('paragraph', { textAlign: 'left' })} title="Alinear a la izquierda">
          ≡
        </Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive('paragraph', { textAlign: 'center' })} title="Centrar">
          ≡
        </Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive('paragraph', { textAlign: 'right' })} title="Alinear a la derecha">
          ≡
        </Btn>

        <Divider />

        {/* Limpiar formato */}
        <Btn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Limpiar formato" active={false}>
          <span className="text-xs text-gray-400">✕</span>
        </Btn>
      </div>

      {/* Área de escritura */}
      <div
        className="bg-white cursor-text"
        onClick={() => editor.commands.focus()}
      >
        {editor.isEmpty && (
          <p className="absolute pointer-events-none px-4 py-3 text-sm text-gray-400 select-none">{placeholder}</p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
