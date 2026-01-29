import { useState } from 'react';
import { ChevronDown, ChevronRight, Type, Palette, Layout, Hash, Copy, Check } from 'lucide-react';
import { cn } from '../lib/utils';

export function TokenPreview({ node, name, path = [], onFocusPath }) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  // Is Token (leaf node)?
  if (node && node.hasOwnProperty('$value')) {
    const val = node.$value;
    const type = node.$type || 'unknown';
    
    let preview = null;
    let valueDisplay = typeof val === 'object' ? JSON.stringify(val) : String(val);

    // Handle color type
    if (type === 'color' || (typeof val === 'string' && (val.startsWith('#') || val.startsWith('hsl') || val.startsWith('rgb')))) {
      let colorValue = '#ffffff';
      
      if (typeof val === 'string') {
        colorValue = val;
      } else if (val?.colorSpace === 'srgb' && val?.channels) {
        // Convert sRGB object back to hex for display
        const { r, g, b } = val.channels;
        const toHex = (n) => Math.round(n * 255).toString(16).padStart(2, '0');
        colorValue = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        valueDisplay = colorValue;
      } else if (val?.hex) {
        colorValue = val.hex;
      }
      
      preview = (
        <div 
          className="w-4 h-4 rounded-full shadow-sm border ring-2 ring-background ring-offset-1" 
          style={{ backgroundColor: colorValue }}
        />
      );
      
      if (typeof val === 'string') {
        valueDisplay = val;
      }
    } else if (type === 'fontFamily') {
      preview = <Type className="w-3.5 h-3.5 text-primary" />;
    } else if (type === 'dimension' || type === 'spacing') {
      preview = <Layout className="w-3.5 h-3.5 text-muted-foreground" />;
      valueDisplay = typeof val === 'object' ? `${val.value}${val.unit}` : val;
    } else {
      preview = <Hash className="w-3.5 h-3.5 text-muted-foreground" />;
    }

    const handleCopy = async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val));
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      } catch (err) {
        console.error('Copy failed', err);
      }
    };

    return (
      <div
        className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 group/token rounded-xl transition-all duration-200 border border-transparent hover:border-border/50 cursor-pointer"
        onClick={() => onFocusPath?.(path)}
      >
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-foreground/80 group-hover/token:text-foreground">{name}</span>
          <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
            {valueDisplay}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="h-8 w-8 flex items-center justify-center rounded-lg border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            aria-label="Copy token value"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <div className="flex-shrink-0 bg-background rounded-lg p-1.5 shadow-sm border">
            {preview}
          </div>
        </div>
      </div>
    );
  }

  // Is Group?
  if (node && typeof node === 'object') {
    const keys = Object.keys(node).filter(k => !k.startsWith('$'));
    if (keys.length === 0) return null;

    return (
      <div className="space-y-1">
        <button 
          onClick={() => setOpen(!open)}
          className={cn(
            "flex items-center gap-2 w-full text-left py-2 px-2 hover:bg-muted/30 rounded-lg transition-colors group/header",
            !open && "opacity-60"
          )}
        >
          <div className="flex-shrink-0">
            {open ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover/header:text-foreground">{name}</span>
          <div className="h-px flex-1 bg-border/50 ml-2" />
          <span className="text-[9px] font-bold text-muted-foreground/30 px-1.5">{keys.length}</span>
        </button>
        
        {open && (
          <div className="ml-4 pl-2 border-l border-border/50 space-y-1 mt-1 animate-in slide-in-from-left-1 duration-200">
            {keys.map(k => <TokenPreview key={k} name={k} node={node[k]} path={[...path, k]} onFocusPath={onFocusPath} />)}
          </div>
        )}
      </div>
    );
  }
  
  return null;
}
