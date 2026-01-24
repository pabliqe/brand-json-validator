import { Badge, Button } from './ui';

export function ValidationResults({ result, originalJson, onDownload, onReset }) {
  if (!result) return null;

  const { valid, errors, warnings } = result;
  const allIssues = [...errors, ...warnings];

  return (
    <div className="h-full flex flex-col bg-slate-800 overflow-hidden">
      {/* Summary Bar */}
      <div className="p-4 border-b border-slate-700 bg-slate-850">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge type={valid ? 'success' : 'error'}>
              {valid ? '✓ Valid' : '✗ Invalid'}
            </Badge>
            <span className="text-sm text-slate-300">
              <span className="text-red-400 font-semibold">{errors.length}</span> errors
              {' • '}
              <span className="text-yellow-400 font-semibold">{warnings.length}</span> warnings
            </span>
          </div>
          {!valid && (
            <span className="text-xs text-red-300 font-mono">
              Fix {errors.length} error{errors.length !== 1 ? 's' : ''} to validate
            </span>
          )}
        </div>
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-auto">
        {errors.length === 0 && warnings.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-green-400 font-semibold mb-2">✓ Perfect!</p>
            <p className="text-slate-400 text-sm">Your JSON is valid according to DTCG standard</p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {/* Errors Section */}
            {errors.length > 0 && (
              <div>
                <p className="text-red-400 font-semibold text-sm mb-2 sticky top-0 bg-slate-800 py-2">
                  🔴 ERRORS ({errors.length})
                </p>
                <div className="space-y-2">
                  {errors.map((error, idx) => (
                    <ErrorItem key={idx} error={error} />
                  ))}
                </div>
              </div>
            )}

            {/* Warnings Section */}
            {warnings.length > 0 && (
              <div>
                <p className="text-yellow-400 font-semibold text-sm mb-2 sticky top-0 bg-slate-800 py-2 mt-4">
                  🟡 WARNINGS ({warnings.length})
                </p>
                <div className="space-y-2">
                  {warnings.map((warning, idx) => (
                    <WarningItem key={idx} warning={warning} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {allIssues.length > 0 && (
        <div className="p-4 border-t border-slate-700 bg-slate-850 space-y-2">
          <Button
            onClick={onDownload}
            disabled={!valid && errors.length > 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            {valid ? '📥 Download Validated JSON' : '⚠️ Fix errors first'}
          </Button>
          <Button
            onClick={onReset}
            variant="secondary"
            className="w-full bg-slate-700 hover:bg-slate-600 text-white"
          >
            ↻ Clear & Start Over
          </Button>
        </div>
      )}
    </div>
  );
}

function ErrorItem({ error }) {
  return (
    <div className="bg-red-950 border border-red-700 rounded p-3 hover:bg-red-900 transition-colors">
      <div className="flex gap-2">
        <div className="flex-shrink-0 pt-0.5">
          <span className="text-red-400 font-bold">×</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs text-red-300 break-all mb-1">{error.path}</p>
          <p className="text-sm text-red-100 font-medium mb-1">{error.message}</p>
          {error.hint && (
            <p className="text-xs text-red-200">💡 {error.hint}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function WarningItem({ warning }) {
  return (
    <div className="bg-yellow-950 border border-yellow-700 rounded p-3 hover:bg-yellow-900 transition-colors">
      <div className="flex gap-2">
        <div className="flex-shrink-0 pt-0.5">
          <span className="text-yellow-400 font-bold">!</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs text-yellow-300 break-all mb-1">{warning.path}</p>
          <p className="text-sm text-yellow-100 font-medium mb-1">{warning.message}</p>
          {warning.hint && (
            <p className="text-xs text-yellow-200 mb-2">💡 {warning.hint}</p>
          )}
          {warning.suggestedFix && (
            <div className="bg-black bg-opacity-50 rounded p-2 text-xs font-mono text-green-300 break-all">
              ✓ Fix: {JSON.stringify(warning.suggestedFix)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
