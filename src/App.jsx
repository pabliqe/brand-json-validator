import { useState, useEffect, useRef } from 'react';
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
import { applyBrandTheme } from './lib/theme';
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
  const [lineErrors, setLineErrors] = useState({});
  const [fixSuccess, setFixSuccess] = useState(false);
  const [theme, setTheme] = useState('dark');
  const fileInputRef = useRef(null);

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
  }, [theme]);

  // Sync Theme with JSON content
  useEffect(() => {
    if (jsonData) {
      applyBrandTheme(jsonData);
    }
  }, [jsonData]);

  const mapErrorsToLines = (text, errors) => {
    if (!text || !errors || errors.length === 0) return {};
    const lines = text.split('\n');
    const errorMap = {};
    
    errors.forEach(err => {
      const pathParts = err.path.split('.').filter(p => p !== '$');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lastPart = pathParts[pathParts.length - 1];
        if (line.includes(`"${lastPart}"`)) {
          if (!errorMap[i]) errorMap[i] = [];
          errorMap[i].push(err);
          break;
        }
      }
    });
    return errorMap;
  };

  const validateJson = (text) => {
    if (!text.trim()) {
      setJsonData(null);
      setValidationResult(null);
      setLineErrors({});
      return;
    }

    try {
      const parsed = JSON.parse(text);
      setJsonData(parsed);
      setError(null);

      const validator = new DTCGValidator();
      const result = validator.validate(parsed);
      setValidationResult(result);
      
      const allErrors = [...result.errors, ...result.warnings];
      setLineErrors(mapErrorsToLines(text, allErrors));
    } catch (e) {
      setError(e.message);
      setJsonData(null);
      setValidationResult(null);
      setLineErrors({});
    }
  };

  const handleJsonChange = (text) => {
    setJsonText(text);
    localStorage.setItem('brand-json-validator-content', text);
    // Debounced validation
    const timer = setTimeout(() => validateJson(text), 500);
    return () => clearTimeout(timer);
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
        <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-7xl h-16 border rounded-2xl bg-background/80 backdrop-blur-xl z-50 flex items-center justify-between px-6 shadow-2xl">
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

            <Button size="sm" onClick={() => {/* download */}} disabled={!jsonText} className="h-9 px-4 rounded-xl font-bold">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-1 mt-24 flex gap-4 p-4 overflow-hidden max-w-[1600px] mx-auto w-full">
          {/* Editor Surface */}
          <section className={cn(
            "flex-1 relative flex flex-col bg-card border rounded-3xl overflow-hidden shadow-sm transition-all duration-500",
            dragActive && "ring-2 ring-primary bg-primary/5"
          )}>
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

            <div className="flex-1 flex overflow-hidden">
              {/* Line Indicator */}
              <div className="w-12 bg-muted/10 border-r flex flex-col py-4 font-mono text-[10px] text-muted-foreground/50 select-none items-center">
                {jsonText.split('\n').map((_, i) => (
                  <div key={i} className={cn(
                    "h-6 flex items-center justify-center w-full transition-colors",
                    lineErrors[i] && "text-destructive font-bold bg-destructive/5"
                  )}>
                    {i + 1}
                  </div>
                ))}
              </div>

              <textarea
                value={jsonText}
                onChange={(e) => handleJsonChange(e.target.value)}
                spellCheck={false}
                className="flex-1 p-4 bg-transparent font-mono text-sm leading-6 resize-none outline-none text-card-foreground placeholder:text-muted-foreground"
                placeholder="// Drop your brand configuration here..."
              />
            </div>
          </section>

          {/* Inspection Panel */}
          <aside className="w-96 flex flex-col bg-card border rounded-3xl overflow-hidden shadow-sm">
            <Tabs defaultValue="issues" className="flex-1 flex flex-col">
              <div className="p-4">
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

              <TabsContent value="issues" className="flex-1 min-h-0 mt-0 data-[state=active]:flex flex-col">
                <ScrollArea className="flex-1 px-4">
                  <div className="space-y-4 pb-4">
                    {!validationResult ? (
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                          <Info className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Awaiting Input</p>
                      </div>
                    ) : validationResult.valid ? (
                      <div className="flex flex-col items-center py-12 text-center">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20">
                          <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <h3 className="text-lg font-bold">Perfect Structure</h3>
                        <p className="text-sm text-muted-foreground">Tokens are ready for production.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {validationResult.errors.map((err, i) => (
                          <div key={i} className="group p-4 rounded-2xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-destructive uppercase tracking-widest px-2 py-0.5 bg-destructive/10 rounded-md">Error</span>
                              <code className="text-[10px] text-muted-foreground font-mono">{err.path}</code>
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

              <TabsContent value="preview" className="flex-1 min-h-0 mt-0 data-[state=active]:flex flex-col">
                <ScrollArea className="flex-1 px-4">
                  <div className="space-y-2 pb-4">
                    {jsonData ? (
                      Object.keys(jsonData).filter(k => !k.startsWith('$')).map(key => (
                        <div key={key} className="space-y-2">
                          <div className="flex items-center gap-2 px-2 py-1">
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{key}</span>
                          </div>
                          <TokenPreview name={key} node={jsonData[key]} />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-24 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Visualizer Empty</div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <div className="p-6 border-t bg-muted/20 flex items-center justify-between">
              <div className="flex gap-3">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                  <Github className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Build {pkg.version}</span>
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
