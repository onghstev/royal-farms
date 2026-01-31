import * as React from "react"
import { Input } from "@/components/ui/input"
import { formatNumberInput, parseFormattedNumber } from "@/lib/utils"

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number | string
  onChange?: (value: number) => void
  allowDecimals?: boolean
  maxDecimals?: number
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, allowDecimals = true, maxDecimals = 2, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('')

    // Update display value when prop value changes
    React.useEffect(() => {
      if (value !== undefined && value !== null) {
        const numValue = typeof value === 'string' ? parseFloat(value) : value
        if (!isNaN(numValue)) {
          setDisplayValue(formatNumberInput(numValue.toString()))
        } else {
          setDisplayValue('')
        }
      } else {
        setDisplayValue('')
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value

      // Remove all non-digit and non-decimal characters
      let cleaned = inputValue.replace(/[^\d.]/g, '')

      // If decimals not allowed, remove decimal point
      if (!allowDecimals) {
        cleaned = cleaned.replace(/\./g, '')
      } else {
        // Ensure only one decimal point
        const parts = cleaned.split('.')
        if (parts.length > 2) {
          cleaned = parts[0] + '.' + parts.slice(1).join('')
        }
        // Limit decimal places
        if (parts.length === 2 && parts[1].length > maxDecimals) {
          cleaned = parts[0] + '.' + parts[1].substring(0, maxDecimals)
        }
      }

      // Format for display
      const formatted = formatNumberInput(cleaned)
      setDisplayValue(formatted)

      // Call onChange with numeric value
      if (onChange) {
        const numericValue = parseFormattedNumber(formatted)
        onChange(numericValue)
      }
    }

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
      />
    )
  }
)

NumberInput.displayName = "NumberInput"

export { NumberInput }
