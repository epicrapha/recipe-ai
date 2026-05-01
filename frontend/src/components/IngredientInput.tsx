import { useState, useRef, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface IngredientInputProps {
  value: string[];
  onChange: (ingredients: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function IngredientInput({
  value,
  onChange,
  placeholder = "Type an ingredient and press Enter…",
  className = "",
}: IngredientInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addIngredient = (text: string) => {
    const trimmed = text.trim().toLowerCase();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue("");
  };

  const removeIngredient = (ingredient: string) => {
    onChange(value.filter((v) => v !== ingredient));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addIngredient(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeIngredient(value[value.length - 1]);
    }
  };

  return (
    <div
      className={`glass-strong rounded-xl p-3 cursor-text transition-all focus-within:ring-2 focus-within:ring-primary/30 focus-within:glow-saffron ${className}`}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex flex-wrap gap-2 items-center">
        {value.map((ingredient) => (
          <Badge
            key={ingredient}
            variant="secondary"
            className="bg-primary/15 text-primary border-primary/20 pl-3 pr-1.5 py-1.5 text-sm font-medium gap-1.5 hover:bg-primary/25 transition-colors"
          >
            {ingredient}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeIngredient(ingredient);
              }}
              className="rounded-full hover:bg-primary/30 p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : "Add more…"}
          className="flex-1 min-w-[160px] border-0 bg-transparent shadow-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground px-1 h-9"
        />
      </div>
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground mt-2 pl-1">
          {value.length} ingredient{value.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
