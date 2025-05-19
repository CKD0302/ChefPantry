import React, { useState, useRef, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ChefTagsProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function ChefTags({ value = [], onChange, placeholder = "Add tag...", className = "" }: ChefTagsProps) {
  const [inputValue, setInputValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when clicking on container
  const focusInput = () => {
    inputRef.current?.focus();
  };

  // Handle tag removal
  const removeTag = (index: number) => {
    const newTags = [...value];
    newTags.splice(index, 1);
    onChange(newTags);
  };

  // Handle tag addition
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    
    // Validation: Don't add empty tags or duplicates
    if (trimmedTag === '' || value.includes(trimmedTag)) {
      return;
    }
    
    onChange([...value, trimmedTag]);
    setInputValue('');
  };

  // Handle keyboard events (Enter, Backspace, comma)
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      e.preventDefault();
      const newTags = [...value];
      newTags.pop();
      onChange(newTags);
    }
  };

  // Handle pasting multiple values
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    // Split by commas and add each non-empty tag
    const tagsToAdd = pastedText
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '' && !value.includes(tag));
    
    if (tagsToAdd.length > 0) {
      onChange([...value, ...tagsToAdd]);
    }
  };

  return (
    <div 
      className={`flex flex-wrap items-center gap-2 p-2 border rounded-md min-h-10 ${className}`}
      onClick={focusInput}
    >
      {value.map((tag, index) => (
        <Badge 
          key={`${tag}-${index}`} 
          variant="secondary" 
          className="px-2 py-1 gap-1 bg-neutral-100 hover:bg-neutral-200 transition-colors"
        >
          {tag}
          <Button
            size="sm"
            variant="ghost"
            className="h-4 w-4 p-0 hover:bg-neutral-300 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(index);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={() => {
          if (inputValue.trim()) {
            addTag(inputValue);
          }
        }}
        className="flex-grow min-w-[120px] border-0 p-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        placeholder={value.length === 0 ? placeholder : ''}
      />
    </div>
  );
}