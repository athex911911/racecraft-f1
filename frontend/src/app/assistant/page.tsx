"use client";

import { ArrowUpRight, Lightbulb, Send, Sparkles, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { SectionHeading } from "@/components/ui/section-heading";
import { useAskAssistant } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";
import type { AssistantAnswer, AssistantEntity, FavoriteKind } from "@/types/f1";

const STARTERS = [
  "How many titles does Hamilton have?",
  "Compare Verstappen and Leclerc",
  "Who leads the championship?",
  "Verstappen at Monaco",
  "Tell me about Monza",
  "When is the next race?",
];

const KIND_PATH: Record<FavoriteKind, string> = {
  driver: "/drivers",
  constructor: "/constructors",
  circuit: "/circuits",
};

type Msg = { id: number; role: "user" | "assistant"; text?: string; answer?: AssistantAnswer };

export default function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const ask = useAskAssistant();
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, ask.isPending]);

  const send = (q: string) => {
    const question = q.trim();
    if (!question || ask.isPending) return;
    setInput("");
    setMessages((m) => [...m, { id: idRef.current++, role: "user", text: question }]);
    ask.mutate(question, {
      onSuccess: (answer) =>
        setMessages((m) => [...m, { id: idRef.current++, role: "assistant", answer }]),
      onError: (e) =>
        setMessages((m) => [
          ...m,
          {
            id: idRef.current++,
            role: "assistant",
            answer: {
              answer: (e as Error).message || "Something went wrong.",
              intent: "error",
              provider: "template",
              stats: [],
              entities: [],
              suggestions: [],
            },
          },
        ]),
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <SectionHeading
        title="AI Assistant"
        subtitle="Ask about drivers, teams, circuits, standings and the next race — answered from the database"
      />

      <div className="flex h-[62vh] min-h-[440px] flex-col overflow-hidden rounded-card rounded-tr-none border border-white/8 bg-carbon-700">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {messages.length === 0 ? (
            <EmptyState onPick={send} />
          ) : (
            messages.map((m) => <MessageBubble key={m.id} msg={m} onPick={send} />)
          )}
          {ask.isPending ? <Thinking /> : null}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-white/8 p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about F1…"
            className="flex-1 rounded-lg rounded-tr-none border border-white/10 bg-carbon-800 px-4 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted/60 focus:border-f1-red/50"
          />
          <button
            type="submit"
            disabled={!input.trim() || ask.isPending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg rounded-tr-none bg-f1-red text-white transition hover:bg-f1-red/90 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      <p className="text-center text-[11px] text-muted">
        Answers are generated deterministically from the ingested F1 database — no external AI model.
      </p>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-6 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-f1-red/15 ring-1 ring-f1-red/30">
        <Sparkles className="h-7 w-7 text-f1-red" />
      </span>
      <h3 className="font-display text-xl font-bold uppercase italic tracking-wide">
        Ask the paddock
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted">
        Stats, comparisons, records and standings — try one of these:
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {STARTERS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-full border border-white/12 bg-carbon-800 px-3.5 py-1.5 text-sm text-silver transition hover:border-f1-red/40 hover:text-white"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function Thinking() {
  return (
    <div className="flex items-center gap-3">
      <Avatar assistant />
      <div className="flex gap-1 rounded-card rounded-tl-none border border-white/8 bg-carbon-800 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-bounce rounded-full bg-muted"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function Avatar({ assistant }: { assistant?: boolean }) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        assistant ? "bg-f1-red text-white" : "bg-carbon-800 text-silver ring-1 ring-white/10",
      )}
    >
      {assistant ? <Sparkles className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
    </span>
  );
}

function MessageBubble({ msg, onPick }: { msg: Msg; onPick: (q: string) => void }) {
  if (msg.role === "user") {
    return (
      <div className="flex items-start justify-end gap-3">
        <div className="max-w-[80%] rounded-card rounded-tr-none bg-f1-red/90 px-4 py-2.5 text-sm text-white">
          {msg.text}
        </div>
        <Avatar />
      </div>
    );
  }

  const a = msg.answer!;
  return (
    <div className="flex items-start gap-3">
      <Avatar assistant />
      <div className="max-w-[85%] space-y-3">
        <div className="rounded-card rounded-tl-none border border-white/8 bg-carbon-800 px-4 py-3">
          <p className="text-sm leading-relaxed text-foreground">{a.answer}</p>

          {a.stats.length ? (
            <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {a.stats.map((s) => (
                <div key={s.label} className="rounded-lg bg-black/25 px-2.5 py-1.5">
                  <p className="truncate text-[10px] uppercase tracking-widest text-muted">
                    {s.label}
                  </p>
                  <p className="font-display text-base font-bold tabular-nums">{s.value}</p>
                </div>
              ))}
            </div>
          ) : null}

          {a.entities.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {a.entities.map((e) => (
                <EntityLink key={`${e.kind}-${e.ref}`} entity={e} />
              ))}
            </div>
          ) : null}
        </div>

        {a.suggestions.length ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-muted" />
            {a.suggestions.map((s) => (
              <button
                key={s}
                onClick={() => onPick(s)}
                className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-silver transition hover:border-f1-red/40 hover:text-white"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EntityLink({ entity }: { entity: AssistantEntity }) {
  return (
    <Link
      href={`${KIND_PATH[entity.kind]}/${entity.ref}`}
      className="inline-flex items-center gap-1 rounded-full border border-f1-red/30 bg-f1-red/10 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-f1-red/20"
    >
      {entity.name}
      <ArrowUpRight className="h-3 w-3" />
    </Link>
  );
}
