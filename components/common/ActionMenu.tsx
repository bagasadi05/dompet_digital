
import React, { useState, useEffect, useRef } from 'react';
import EllipsisVerticalIcon from '../icons/EllipsisVerticalIcon';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';

interface ActionMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-secondary-light"
        aria-label="Opsi lainnya"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <EllipsisVerticalIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-light-card dark:bg-dark-card ring-1 ring-black dark:ring-gray-700 ring-opacity-5 z-20">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <button
              onClick={() => { onEdit(); setIsOpen(false); }}
              className="w-full text-left flex items-center px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-gray-100 dark:hover:bg-gray-800"
              role="menuitem"
            >
              <PencilIcon className="w-4 h-4 mr-3" />
              Ubah
            </button>
            <button
              onClick={() => { onDelete(); setIsOpen(false); }}
              className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              role="menuitem"
            >
              <TrashIcon className="w-4 h-4 mr-3" />
              Hapus
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionMenu;