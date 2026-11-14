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
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border-2 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 placeholder:text-gray-400 ${
            flashBorder ? 'border-red-500 ring-4 ring-red-100' : 'border-gray-200'
          }`}
        />
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 active:scale-95 transition-all duration-150 font-semibold whitespace-nowrap"
      >
        Add <span aria-hidden="true">✨</span>
      </button>
    </div>
  );
}
