import React from 'react';
import { Leaf, Trash2 } from 'lucide-react';

export default function FloatingIcons() {
  return (
    <div className="floating-icons">
      <div className="icon-trash icon-1">
        <Trash2 size={40} />
      </div>
      <div className="icon-leaf icon-2">
        <Leaf size={35} />
      </div>
      <div className="icon-trash icon-3">
        <Trash2 size={28} />
      </div>
      <div className="icon-leaf icon-4">
        <Leaf size={32} />
      </div>
    </div>
  );
}
