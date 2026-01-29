import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // primary is the main/primary button style. Keep `default` as an alias for compatibility.
        brand: "bg-[var(--primary)] text-white hover:opacity-90 focus:ring-2 focus:ring-[var(--primary)] transition-colors",
        primary: "bg-blue-600 text-white shadow hover:bg-blue-700 focus-visible:ring-blue-700",
        default: "bg-blue-600 text-white shadow hover:bg-blue-700 focus-visible:ring-blue-700",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        // secondary: always black/white with outline, no color background
        secondary: "bg-white text-black border border-black shadow-sm hover:bg-black hover:text-white focus-visible:ring-black dark:bg-black dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black focus-visible:dark:ring-white",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
