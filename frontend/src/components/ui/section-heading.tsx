import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeading({ title, subtitle, action, className }: SectionHeadingProps) {
  return (
    <div className={cn("mb-5 flex items-end justify-between gap-4", className)}>
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
