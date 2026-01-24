import { useState, useRef } from 'react';
import { Card, Button, Alert, Badge } from './ui';

export function JsonInput({ onJsonParsed, onError }) {
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const textAreaRef = useRef(null);

  const handleJson = (jsonText) => {
    setIsLoading(true);
    try {
      const parsed = JSON.parse(jsonText);
      onJsonParsed(parsed);
      if (textAreaRef.current) {
        textAreaRef.current.value = '';
      }
    } catch (error) {
      onError(`Invalid JSON: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          handleJson(event.target.result);
        };
        reader.onerror = () => {
          onError('Failed to read file');
        };
        reader.readAsText(file);
      } else {
        onError('Please drop a JSON file');
      }
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        handleJson(event.target.result);
      };
      reader.onerror = () => {
        onError('Failed to read file');
      };
      reader.readAsText(file);
    }
  };

  const handlePaste = async (e) => {
    const text = e.clipboardData?.getData('text');
    if (text) {
      handleJson(text);
    }
  };

  const handleValidateText = () => {
    const text = textAreaRef.current?.value;
    if (text) {
      handleJson(text);
    } else {
      onError('Please enter or paste JSON content');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-lg font-semibold mb-4">Load your brand.json</h2>

        {/* Drag and Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 bg-slate-50 hover:border-slate-400'
          }`}
        >
          <p className="text-slate-600 mb-4">
            Drag and drop your brand.json file here
          </p>
          <p className="text-sm text-slate-500">or</p>
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 mx-auto"
          >
            Choose File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* Paste Area */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Or paste your JSON here
          </label>
          <textarea
            ref={textAreaRef}
            onPaste={handlePaste}
            placeholder='Paste your brand.json content here (e.g., {"brand":{"name":"My Brand"},"colors":{...}})'
            className="w-full h-40 p-4 border border-slate-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            onClick={handleValidateText}
            disabled={isLoading}
            className="mt-3 w-full"
          >
            {isLoading ? 'Validating...' : 'Validate JSON'}
          </Button>
        </div>
      </Card>

      <Alert type="info" title="What is brand.json?">
        <p className="text-sm">
          A brand.json file contains design tokens following the{' '}
          <strong>DTCG (Design Tokens Community Group) standard</strong>. It
          includes colors, typography, spacing, and other design values that
          define your brand.
        </p>
      </Alert>
    </div>
  );
}
