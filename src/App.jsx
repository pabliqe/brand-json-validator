import { useState, useEffect, useRef, useCallback } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { 
  FileJson, 
  Upload, 
  Trash2, 
  Sparkles, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  LayoutPanelLeft, 
  Code2, 
  Github,
  ExternalLink,
  ChevronRight,
  Info,
  Sun,
  Moon
} from 'lucide-react';

// Core Logic & Utils
import { DTCGValidator } from './lib/dtcgValidator';
import { cn } from './lib/utils';

// UI Components (Shadcn)
import { Button } from './components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { ScrollArea } from './components/ui/scroll-area';
import { Separator } from './components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip';

// Existing Components
import { TokenPreview } from './components/TokenPreview';
import pkg from '../package.json';

export default function App() {
  const [jsonText, setJsonText] = useState('');
  const [jsonData, setJsonData] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [fixSuccess, setFixSuccess] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [tabValue, setTabValue] = useState('issues');
  const fileInputRef = useRef(null);
  const editorRef = useRef(null);
  const timerRef = useRef(null);
  const highlightDecorations = useRef([]);
  const highlightTimerRef = useRef(null);
  const monaco = useMonaco();
  const monacoThemesDefined = useRef(false);

  const handleRevealPath = useCallback((pathOrParts) => {
    console.log('🔍 handleRevealPath called with:', pathOrParts);
    console.log('Monaco:', !!monaco, 'Editor:', !!editorRef.current);
    
    if (!monaco || !editorRef.current) {
      console.log('❌ Missing monaco or editor');
      return;
    }
    const model = editorRef.current.getModel();
    if (!model) {
      console.log('❌ No model');
      return;
    }

    // Parse path if it's a string like "$.typography.letterSpacing.$value"
    const pathParts = typeof pathOrParts === 'string' 
      ? pathOrParts.split('.').filter(p => p !== '$')
      : pathOrParts;

    console.log('📍 Path parts:', pathParts);
    
    if (!pathParts || pathParts.length === 0) {
      console.log('❌ No path parts');
      return;
    }

    const lines = model.getValue().split('\n');
    let foundLine = -1;
    let column = 1;

    console.log('📄 Total lines:', lines.length);
    console.log('🔎 Searching for path parts:', pathParts);

    // Strategy: Search for the deepest unique key in context
    // For nested paths, search backwards through parent keys for better accuracy
    for (let depth = pathParts.length - 1; depth >= 0; depth--) {
      const targetKey = pathParts[depth];
      const pattern = `"${targetKey}"`;
      
      // If we have parent context, try to find the key after the parent
      if (depth > 0) {
        const parentKey = pathParts[depth - 1];
        let parentLine = -1;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(`"${parentKey}"`)) {
            parentLine = i;
            break;
          }
        }
        
        // Search for target key after parent line
        if (parentLine !== -1) {
          for (let i = parentLine + 1; i < lines.length; i++) {
            const idx = lines[i].indexOf(pattern);
            if (idx !== -1) {
              foundLine = i + 1;
              column = idx + 2;
              break;
            }
            // Stop if we hit another top-level key (dedented)
            if (lines[i].match(/^\s{0,2}"/) && !lines[i].includes(pattern)) {
              break;
            }
          }
          if (foundLine !== -1) break;
        }
      } else {
        // Top-level key, search from start
        for (let i = 0; i < lines.length; i++) {
          const idx = lines[i].indexOf(pattern);
          if (idx !== -1) {
            foundLine = i + 1;
            column = idx + 2;
            break;
          }
        }
        if (foundLine !== -1) break;
      }
    }

    console.log('✅ Found line:', foundLine, 'column:', column);
    
    if (foundLine === -1) {
      console.log('❌ Could not find target in JSON');
      return;
    }

    const position = { lineNumber: foundLine, column };
    editorRef.current.revealPositionInCenter(position);
    editorRef.current.setPosition(position);
    editorRef.current.focus();
    
    console.log('✨ Navigated to position:', position);

    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightDecorations.current = editorRef.current.deltaDecorations(
      highlightDecorations.current,
      [
        {
          range: new monaco.Range(foundLine, 1, foundLine, 1),
          options: {
            isWholeLine: true,
            className: 'monaco-line-highlight-glow',
            marginClassName: 'monaco-line-highlight-glow-margin'
          }
        }
      ]
    );

    highlightTimerRef.current = setTimeout(() => {
      if (editorRef.current) {
        highlightDecorations.current = editorRef.current.deltaDecorations(highlightDecorations.current, []);
      }
    }, 1200);
  }, [monaco]);

  const registerMonacoThemes = useCallback((monacoInstance) => {
    if (!monacoInstance || monacoThemesDefined.current) return;
    monacoInstance.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'string.key.json', foreground: 'a5d6ff' },
        { token: 'string.value.json', foreground: '7dd3fc' },
        { token: 'number', foreground: 'c084fc' },
        { token: 'keyword.json', foreground: 'cbd5e1' },
      ],
      colors: {
        'editor.background': '#0a0e27',
        'editor.foreground': '#e0e7ff',
        'editor.lineHighlightBackground': '#1e293b',
        'editor.selectionBackground': '#334155',
        'editorCursor.foreground': '#e0e7ff',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#94a3b8',
        'editorGutter.background': '#0a0e27',
        'editorIndentGuide.background': '#1e293b',
        'editorIndentGuide.activeBackground': '#334155',
        'editorBracketMatch.background': '#334155',
        'editorBracketMatch.border': '#64748b',
        'editorWidget.background': '#1e293b',
        'editorWidget.border': '#334155',
      }
    });

    monacoInstance.editor.defineTheme('custom-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'string.key.json', foreground: '1e40af' },
        { token: 'string.value.json', foreground: '0284c7' },
        { token: 'number', foreground: '9333ea' },
        { token: 'keyword.json', foreground: '475569' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#0f172a',
        'editor.lineHighlightBackground': '#f8fafc',
        'editor.selectionBackground': '#e2e8f0',
        'editorCursor.foreground': '#0f172a',
        'editorLineNumber.foreground': '#cbd5e1',
        'editorLineNumber.activeForeground': '#64748b',
        'editorGutter.background': '#ffffff',
        'editorIndentGuide.background': '#f1f5f9',
        'editorIndentGuide.activeBackground': '#e2e8f0',
        'editorBracketMatch.background': '#e2e8f0',
        'editorBracketMatch.border': '#94a3b8',
        'editorWidget.background': '#f8fafc',
        'editorWidget.border': '#e2e8f0',
      }
    });

    monacoThemesDefined.current = true;
  }, []);

  // Auto-save/restore from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('brand-json-validator-content');
    if (saved) {
      setJsonText(saved);
      validateJson(saved);
    }

    // Initialize Theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Sync Theme with DOM
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
    if (monaco) {
      registerMonacoThemes(monaco);
      monaco.editor.setTheme(theme === 'dark' ? 'custom-dark' : 'custom-light');
    }
  }, [theme, monaco, registerMonacoThemes]);

  useEffect(() => () => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
  }, []);

  // Sync Monaco Markers
  useEffect(() => {
    if (monaco && editorRef.current && validationResult) {
      const model = editorRef.current.getModel();
      const markers = [];
      const text = model.getValue();
      const lines = text.split('\n');

      const allIssues = [...validationResult.errors, ...validationResult.warnings];
      
      allIssues.forEach(err => {
        const pathParts = err.path.split('.').filter(p => p !== '$');
        const lastPart = pathParts[pathParts.length - 1];
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(`"${lastPart}"`)) {
            const colStart = lines[i].indexOf(`"${lastPart}"`) + 1;
            markers.push({
              startLineNumber: i + 1,
              startColumn: colStart,
              endLineNumber: i + 1,
              endColumn: colStart + lastPart.length + 2,
              message: `${err.message}${err.hint ? `\n\nHint: ${err.hint}` : ''}`,
              severity: validationResult.errors.includes(err) ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning
            });
            break;
          }
        }
      });

      monaco.editor.setModelMarkers(model, "dtcg-validator", markers);
    }
  }, [monaco, validationResult]); // Removed jsonText from deps to prevent infinite loop or over-triggering

  const validateJson = (text) => {
    if (!text.trim()) {
      setJsonData(null);
      setValidationResult(null);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      setJsonData(parsed);
      setError(null);

      const validator = new DTCGValidator();
      const result = validator.validate(parsed);
      setValidationResult(result);
    } catch (e) {
      setError(e.message);
      setJsonData(null);
      setValidationResult(null);
    }
  };

  const handleJsonChange = (text) => {
    if (text === undefined) return;
    setJsonText(text);
    localStorage.setItem('brand-json-validator-content', text);
    
    // Debounced validation using ref
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => validateJson(text), 500);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  useEffect(() => {
    if (monaco) {
      registerMonacoThemes(monaco);
      monaco.editor.setTheme(theme === 'dark' ? 'custom-dark' : 'custom-light');
    }
  }, [monaco, registerMonacoThemes, theme]);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileInput(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      setJsonText(text);
      validateJson(text);
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    if (!jsonText) return;
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = jsonData?.name ? `${jsonData.name.toLowerCase()}-brand.json` : 'brand.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAutoFix = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const validator = new DTCGValidator();
      const fixed = validator.autoFix(parsed);
      const fixedText = JSON.stringify(fixed, null, 2);
      
      if (fixedText === jsonText) {
        setError('No issues to fix!');
        return;
      }

      setJsonText(fixedText);
      setFixSuccess(true);
      setTimeout(() => setFixSuccess(false), 2000);
      validateJson(fixedText);
    } catch (e) {
      setError('Fix failed: ' + e.message);
    }
  };

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
        {/* Floating Topbar */}
        <header className="fixed top-4 inset-x-4 max-w-[1600px] mx-auto h-16 border rounded-2xl bg-background/80 backdrop-blur-xl z-50 flex items-center justify-between px-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <FileJson className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">BRAND DESIGN TOOL</h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">DTCG Validator</span>
                <Separator orientation="vertical" className="h-2" />
                <span className="text-[10px] text-primary font-bold uppercase tracking-widest">v{pkg.version}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
                  className="h-9 w-9 rounded-xl"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-8 mx-1" />

            <Button variant="ghost" size="sm" className="h-9 gap-2 rounded-xl" asChild>
              <a href="https://github.com/pabliqe/brand-json-validator" target="_blank" rel="noreferrer">
                <Github className="w-4 h-4" />
                GitHub
              </a>
            </Button>

            <Button variant="ghost" size="sm" className="h-9 gap-2 rounded-xl" asChild>
              <a href="https://www.designtokens.org/tr/2025.10/format/" target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4" />
                DTCG 2025.10
              </a>
            </Button>

            <Separator orientation="vertical" className="h-8 mx-1" />

            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-9 gap-2 rounded-xl">
              <Upload className="w-4 h-4" />
              Upload
            </Button>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => { setJsonText(''); setJsonData(null); }} className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear Editor</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-8 mx-1" />

            {validationResult && !validationResult.valid && (
              <Button 
                onClick={handleAutoFix}
                className={cn(
                  "h-9 px-4 rounded-xl gap-2 transition-all duration-500",
                  fixSuccess ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90"
                )}
              >
                <Sparkles className={cn("w-4 h-4", fixSuccess && "animate-spin")} />
                {fixSuccess ? "System Fixed" : "Magic Fix"}
              </Button>
            )}

            <Button size="sm" onClick={handleExport} disabled={!jsonText} className="h-9 px-4 rounded-xl font-bold">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-1 pt-24 pb-4 flex gap-4 px-4 overflow-hidden max-w-[1600px] mx-auto w-full">
          {/* Editor Surface */}
          <section 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "flex-1 relative flex flex-col bg-card border rounded-3xl overflow-hidden shadow-sm transition-all duration-500",
              dragActive && "ring-2 ring-primary bg-primary/5 scale-[0.99]"
            )}
          >
            {/* Drag Overlay */}
            {dragActive && (
              <div className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-dashed border-primary rounded-3xl pointer-events-none animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center shadow-2xl animate-bounce">
                  <Upload className="w-10 h-10 text-primary-foreground" />
                </div>
                <h2 className="mt-6 text-xl font-bold tracking-tight">Drop your JSON</h2>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mt-2">Release to validate</p>
              </div>
            )}

            <div className="h-12 border-b flex items-center justify-between px-6 bg-muted/30">
              <div className="flex items-center gap-3">
                <Code2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">brand.json</span>
              </div>
              {validationResult && (
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter",
                  validationResult.valid ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
                )}>
                  {validationResult.valid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {validationResult.valid ? "Standard Compliant" : `${validationResult.errors.length} Errors Found`}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                defaultLanguage="json"
                theme={theme === 'dark' ? 'custom-dark' : 'custom-light'}
                beforeMount={(monacoInstance) => registerMonacoThemes(monacoInstance)}
                value={jsonText}
                onChange={handleJsonChange}
                onMount={(editor) => {
                  editorRef.current = editor;
                }}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 13,
                  fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  lineHeight: 24,
                  padding: { top: 16 },
                  folding: true,
                  bracketPairColorization: { enabled: true },
                  automaticLayout: true,
                  wordWrap: 'on',
                  cursorSmoothCaretAnimation: 'on',
                  smoothScrolling: true,
                  glyphMargin: true,
                  lineNumbersMinChars: 4,
                  renderLineHighlight: 'all',
                }}
              />
            </div>
          </section>

          {/* Inspection Panel */}
          <aside className="w-96 h-full min-w-0 flex flex-col bg-card border rounded-3xl overflow-hidden shadow-sm min-h-0">
            <Tabs value={tabValue} onValueChange={setTabValue} className="flex-1 flex flex-col min-h-0 h-full">
              <div className="p-4 shrink-0">
                <TabsList className="w-full h-11 grid grid-cols-2 rounded-xl p-1 bg-muted/50">
                  <TabsTrigger value="issues" className="rounded-lg gap-2 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Inspection
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="rounded-lg gap-2 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <LayoutPanelLeft className="w-3.5 h-3.5" />
                    Preview
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="issues" className="flex-1 min-h-0 min-w-0 mt-0 data-[state=active]:flex flex-col overflow-hidden h-full">
                <ScrollArea className="flex-1 h-full min-w-0">
                  <div className="p-4 space-y-4 pb-4">
                    {!validationResult ? (
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                          <Info className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Awaiting Input</p>
                      </div>
                    ) : validationResult.valid ? (
                      <div className="flex flex-col items-center py-12 text-center gap-3">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                          <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <h3 className="text-lg font-bold">Perfect Structure</h3>
                        <p className="text-sm text-muted-foreground">Tokens are ready for production.</p>
                        <Button variant="outline" size="sm" className="mt-1 rounded-xl" onClick={() => setTabValue('preview')}>
                          Take a look →
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {validationResult.errors.map((err, i) => (
                          <div 
                            key={i} 
                            className="group p-4 rounded-2xl border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => handleRevealPath(err.path)}
                            title="Click to jump to location"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-destructive uppercase tracking-widest px-2 py-0.5 bg-destructive/10 rounded-md">Error</span>
                              <code className="text-[10px] text-muted-foreground font-mono group-hover:text-primary transition-colors">
                                {err.path}
                              </code>
                            </div>
                            <p className="text-sm font-semibold leading-relaxed mb-3">{err.message}</p>
                            {err.hint && (
                              <div className="flex gap-2 p-3 rounded-xl bg-background border text-[11px] text-muted-foreground italic">
                                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                                {err.hint}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="preview" className="flex-1 min-h-0 min-w-0 mt-0 data-[state=active]:flex flex-col overflow-hidden h-full">
                <ScrollArea className="flex-1 h-full min-w-0">
                  <div className="p-4 space-y-2 pb-4">
                    {jsonData ? (
                      Object.keys(jsonData).filter(k => !k.startsWith('$')).map(key => (
                        <TokenPreview key={key} name={key} node={jsonData[key]} path={[key]} onFocusPath={handleRevealPath} />
                      ))
                    ) : (
                      <div className="text-center py-24 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Visualizer Empty</div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <div className="p-6 border-t bg-muted/20 flex items-center justify-center">
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tight">
                  Made by <a href="https://x.com/pabliqe" target="_blank" rel="noreferrer" className="text-primary hover:underline">Pablo Armen</a>
                </span>
                <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">Build {pkg.version}</span>
              </div>
            </div>
          </aside>
        </main>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={(e) => e.target.files?.[0] && handleFileInput(e.target.files[0])} 
          className="hidden" 
          accept=".json" 
        />
      </div>
    </TooltipProvider>
  );
}
