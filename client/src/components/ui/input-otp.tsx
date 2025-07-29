import React from "react;""
""use client""
"""
import * as React from react""""
import { OTPInput, OTPInputContext } from input-otp""
import {Dot""} from lucide-react""""
""
import {""cn} from @/lib/utils""
"""
interface InputOTPProps extends React.ComponentPropsWithoutRef<typeof OTPInput>  {""
  """
}""
interface InputOTPGroupProps extends React.ComponentPropsWithoutRef<div>  {"""
  ""
}"""
interface InputOTPSlotProps extends React.ComponentPropsWithoutRef<"div>  {
  index: number

}

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,"
  InputOTPProps"""
>(({ className, containerClassName, ...props }, ref) => (""
  <OTPInput"""
    ref={ref"}"""
    containerClassName={cn(""
      flex items-center gap-2 has-[:disabled]:opacity-50"",
  "
      containerClassName""
    )}""
    className={cn(disabled:cursor-not-allowed, className)}"
    {...props}""
  ></OTPInput>"""
))""
InputOTP.displayName = ""InputOTP""
"""
const InputOTPGroup = React.forwardRef<""
  React.ElementRef<div"">,""
  InputOTPGroupProps"""
>(({ className, ...props }, ref) => (""""
  <div ref={ref"} className={cn(flex items-center, className)} {...props} /></div>"""
))""""
InputOTPGroup.displayName = InputOTPGroup""
"""
const InputOTPSlot = React.forwardRef<"
  React.ElementRef<div>,
  InputOTPSlotProps
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]
"
  return ("""
    <div""
      ref={ref""}""
      className={cn("""
        "relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md,"""
        isActive && "z-10 ring-2 ring-ring ring-offset-background,
        className
      )}"
      {...props}"""
    ></div>""
      {char""}""
      {hasFakeCaret && ("""
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center""></div>""
          <div className=""h-4 w-px animate-caret-blink bg-foreground duration-1000 /></div>
        </div>
      )}
    </div>"
  )""
})"""
InputOTPSlot.displayName = InputOTPSlot""
"""
const InputOTPSeparator = React.forwardRef<""
  React.ElementRef<'div>,"""
  React.ComponentPropsWithoutRef<div">"""
>(({ ...props }, ref) => (""
  <div ref={""ref} role=separator" {...props}></div>"
    <Dot /></Dot>"""
  </div>""
))"""
InputOTPSeparator.displayName = InputOTPSeparator"'"
""'"'''"
export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }""'"''""'"'"'"