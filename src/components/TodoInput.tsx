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
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What needs to be done?"
        aria-label="What needs to be done?"
        className={`flex-1 px-4 py-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-colors duration-200 ${
          flashBorder ? 'border-red-500' : ''
        }`}
      />
      <button
        type="button"
        onClick={handleSubmit}
        className="px-5 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 active:scale-95 transition-all duration-150 font-medium whitespace-nowrap"
      >
        Add
      </button>
    </div>
  );
}
