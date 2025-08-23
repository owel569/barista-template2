import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "flex w-full rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none",
  {
    variants: {
      variant: {
        default: "min-h-[80px] px-3 py-2",
        sm: "min-h-[60px] px-2 py-1 text-xs",
        lg: "min-h-[120px] px-4 py-3",
      },
      resize: {
        none: "resize-none",
        both: "resize",
        horizontal: "resize-x",
        vertical: "resize-y",
      },
      state: {
        default: "",
        error: "border-destructive focus-visible:ring-destructive",
        success: "border-green-500 focus-visible:ring-green-500",
        warning: "border-yellow-500 focus-visible:ring-yellow-500",
      },
    },
    defaultVariants: {
      variant: "default",
      resize: "vertical",
      state: "default",
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  error?: string;
  helperText?: string;
  maxLength?: number;
  showCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant,
    resize,
    state,
    error,
    helperText,
    maxLength,
    showCount,
    value,
    ...props 
  }, ref) => {
    const [charCount, setCharCount] = React.useState(0);
    const hasError = error || state === "error";

    React.useEffect(() => {
      if (typeof value === 'string') {
        setCharCount(value.length);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      props.onChange?.(e);
    };

    return (
      <div className="space-y-1">
        <textarea
          className={cn(
            textareaVariants({ 
              variant, 
              resize, 
              state: hasError ? "error" : state 
            }),
            className
          )}
          ref={ref}
          value={value}
          maxLength={maxLength}
          onChange={handleChange}
          {...props}
        />
        
        <div className="flex justify-between items-center">
          <div>
            {(error || helperText) && (
              <p className={cn(
                "text-xs",
                hasError ? "text-destructive" : "text-muted-foreground"
              )}>
                {error || helperText}
              </p>
            )}
          </div>
          
          {(showCount || maxLength) && (
            <p className={cn(
              "text-xs text-muted-foreground",
              maxLength && charCount > maxLength * 0.9 && "text-yellow-600",
              maxLength && charCount >= maxLength && "text-destructive"
            )}>
              {charCount}{maxLength && `/${maxLength}`}
            </p>
          )}
        </div>
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }