import { useState } from "react";
import { ClipboardCopy, X, Check } from "lucide-react";

interface QuickLogPromptProps {
  text: string;
  onDismiss: () => void;
}

export function QuickLogPrompt({ text, onDismiss }: QuickLogPromptProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available — show text for manual copy
    }
  };

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-purple-700 mb-1">Quick Log</p>
        <p className="text-xs text-gray-600 font-mono break-words leading-relaxed">
          {text}
        </p>
      </div>
      <div className="flex flex-col gap-1 flex-shrink-0">
        <button
          onClick={handleCopy}
          className="p-1.5 bg-purple-100 hover:bg-purple-200 rounded text-purple-700 transition"
          title="Copy to clipboard"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={onDismiss}
          className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-500 transition"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
