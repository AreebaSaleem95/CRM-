import { useEffect, useState } from "react";
import { Check, Copy, Mail, Sparkles } from "lucide-react";
import Modal from "../ui/Modal";
import { inputClass } from "../ui/Field";
import { useDraftFollowUp } from "../../hooks/useAi";
import { getErrorMessage } from "../../lib/apiClient";

const tones = [
  { value: "friendly", label: "Friendly" },
  { value: "formal", label: "Formal" },
  { value: "short", label: "Short" },
];

export default function FollowUpModal({ open, lead, onClose }) {
  const [tone, setTone] = useState("friendly");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const draft = useDraftFollowUp();

  // Har naya lead kholne par popup saaf shuru ho
  useEffect(() => {
    if (open) {
      setTone("friendly");
      setSubject("");
      setBody("");
      setError("");
      setCopied(false);
    }
  }, [open, lead?.id]);

  const hasDraft = Boolean(subject || body);

  const generate = async () => {
    setError("");
    setCopied(false);
    try {
      const result = await draft.mutateAsync({ leadId: lead.id, tone });
      setSubject(result.subject);
      setBody(result.body);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy. Please select the text and copy it manually.");
    }
  };

  const mailtoHref = `mailto:${lead?.email ?? ""}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;

  return (
    <Modal open={open} title={`Follow-up email for ${lead?.name ?? ""}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className={inputClass}
            >
              {tones.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={generate}
            disabled={draft.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            <Sparkles size={16} />
            {draft.isPending ? "Writing..." : hasDraft ? "Regenerate" : "Generate"}
          </button>
        </div>

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}

        {hasDraft && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Subject</label>
              <input
                className={inputClass}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <textarea
                rows={10}
                className={inputClass}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <p className="text-xs text-slate-500">
              AI draft. Please review and edit it before sending, and fill in anything shown in
              [square brackets].
            </p>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <a
                href={mailtoHref}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
              >
                <Mail size={16} />
                Open in email app
              </a>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}