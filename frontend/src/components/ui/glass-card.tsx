import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function GlassCard({ className, hover = false, ...props }: GlassCardProps) {
  return (
    <div
      className={cn("glass", hover && "glass-hover", className)}
      {...props}
    />
  );
}
