
import * as React from "react"
import { cn } from "@/lib/utils"
import { Spinner } from "./spinner"

export interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
  overlay?: boolean;
  className?: string;
}

export function LoadingOverlay({ 
  isLoading, 
  children, 
  text = "Chargement...", 
  overlay = true,
  className 
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <div className={cn(
          "flex items-center justify-center",
          overlay ? "absolute inset-0 bg-background/80 backdrop-blur-sm z-50" : "py-8"
        )}>
          <div className="flex flex-col items-center gap-2">
            <Spinner size="lg" />
            {text && (
              <p className="text-sm text-muted-foreground">{text}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
