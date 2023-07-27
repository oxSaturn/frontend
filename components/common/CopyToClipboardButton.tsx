import { ContentCopy, Check } from "@mui/icons-material";
import { useEffect, useRef, useState } from "react";

interface CopyToClipboardButtonProps {
  text: string;
  title?: string;
  className?: string;
}

const timeout = 2000; // 2s
export function CopyToClipboardButton(props: CopyToClipboardButtonProps) {
  const { text, title = "Copy address to clipboard", className = "" } = props;
  const [copied, setCopied] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  return (
    <button
      onClick={() => {
        if (copied) return;
        // This feature is available only in secure contexts (HTTPS)
        if (typeof navigator.clipboard === "undefined") {
          alert("Your browser does not support clipboard access");
          return;
        }
        navigator.clipboard.writeText(text);
        setCopied(true);
        timer.current = setTimeout(() => setCopied(false), timeout);
      }}
      title={title}
      className={`inline-flex ${className} ${
        copied ? "cursor-text" : "cursor-pointer"
      }`}
    >
      {copied === false ? (
        <ContentCopy className="w-full h-auto" />
      ) : (
        <Check className="w-full h-auto" />
      )}
    </button>
  );
}
