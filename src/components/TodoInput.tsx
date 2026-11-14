import { useState } from 'react';
import type { KeyboardEvent } from 'react';

interface TodoInputProps {
  onAdd: (text: string) => void;
}

export function TodoInput({ onAdd }: TodoInputProps) {
  const [text, setText] = useState('');
  const [flashBorder, setFlashBorder] = useState(false);

  const handleSubmit = () => {
    if (text.trim() === '') {
      setFlashBorder(true);
      setTimeout(() => setFlashBorder(false), 1500);
      return;
    }
    onAdd(text.trim());
    setText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="relative flex-1">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg"
        >
          ✍️
        </span>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What needs to be done?"
          aria-label="What needs to be done?"
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border-2 bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-500 focus:bg-zinc-900 focus:outline-none focus:border-indigo-500 focus:ring-4 transition-all duration-200 ${
            flashBorder
              ? 'border-red-500 ring-4 ring-red-500/20'
              : 'border-zinc-800 focus:ring-indigo-500/20'
          }`}
        />
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white rounded-xl hover:from-indigo-400 hover:to-fuchsia-400 shadow-md shadow-indigo-950/60 hover:shadow-lg hover:shadow-indigo-900/50 active:scale-95 transition-all duration-150 font-semibold whitespace-nowrap"
      >
        Add <span aria-hidden="true">✨</span>
      </button>
    </div>
  );
}
