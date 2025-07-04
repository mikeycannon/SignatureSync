// Signature Editor - Rebuild in progress
// This file will be rebuilt to provide a freeform, canvas-style email signature editor inspired by signature-canvas-craft, using only existing project components and dependencies.

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text, Image as ImageIcon, Minus, Square, User, Briefcase, Mail, Phone } from 'lucide-react';
import { DndContext, useDraggable, DragEndEvent } from '@dnd-kit/core';

const VARIABLE_OPTIONS = [
  { label: 'First Name', icon: <User className="w-4 h-4" /> },
  { label: 'Last Name', icon: <User className="w-4 h-4" /> },
  { label: 'Job Title', icon: <Briefcase className="w-4 h-4" /> },
  { label: 'Company', icon: <Briefcase className="w-4 h-4" /> },
  { label: 'Email', icon: <Mail className="w-4 h-4" /> },
  { label: 'Phone', icon: <Phone className="w-4 h-4" /> },
];

type BlockType = 'text' | 'image' | 'line' | 'rectangle';

interface Block {
  id: string;
  type: BlockType;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
}

const BLOCK_DEFAULTS: Record<BlockType, { width: number; height: number; content: string }> = {
  text: { width: 180, height: 40, content: 'Text' },
  image: { width: 80, height: 80, content: '' },
  line: { width: 120, height: 2, content: '' },
  rectangle: { width: 100, height: 60, content: '' },
};

function getRandomPosition() {
  // Place new blocks randomly within the canvas area
  const x = 60 + Math.floor(Math.random() * 200);
  const y = 60 + Math.floor(Math.random() * 200);
  return { x, y };
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export default function SignatureEditor() {
  const [blocks, setBlocks] = useState<Block[]>([]);

  // Add block handler
  const handleAddBlock = (type: BlockType) => {
    const { x, y } = getRandomPosition();
    setBlocks((prev) => [
      ...prev,
      {
        id: generateId(),
        type,
        x,
        y,
        ...BLOCK_DEFAULTS[type],
      },
    ]);
  };

  // Update block position
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === active.id
          ? { ...block, x: block.x + (delta?.x || 0), y: block.y + (delta?.y || 0) }
          : block
      )
    );
  };

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      {/* Toolbar */}
      <Card className="p-4 flex flex-wrap gap-2 items-center justify-start">
        <Button variant="outline" size="sm" className="flex gap-2 items-center" onClick={() => handleAddBlock('text')}>
          <Text className="w-4 h-4" /> Add Text
        </Button>
        <Button variant="outline" size="sm" className="flex gap-2 items-center" onClick={() => handleAddBlock('image')}>
          <ImageIcon className="w-4 h-4" /> Add Image
        </Button>
        <Button variant="outline" size="sm" className="flex gap-2 items-center" onClick={() => handleAddBlock('line')}>
          <Minus className="w-4 h-4" /> Add Line
        </Button>
        <Button variant="outline" size="sm" className="flex gap-2 items-center" onClick={() => handleAddBlock('rectangle')}>
          <Square className="w-4 h-4" /> Add Rectangle
        </Button>
        <span className="mx-2 text-gray-300">|</span>
        {VARIABLE_OPTIONS.map((v) => (
          <Button key={v.label} variant="ghost" size="sm" className="flex gap-1 items-center">
            {v.icon} {v.label}
          </Button>
        ))}
      </Card>

      {/* Canvas Area */}
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex-1 w-full min-h-[600px] bg-gray-50 border border-dashed border-gray-300 rounded-lg relative overflow-auto">
          <div className="absolute left-0 top-0 w-full h-full pointer-events-none select-none">
            {/* Canvas grid background (optional) */}
            <svg width="100%" height="100%" className="absolute left-0 top-0" style={{ zIndex: 0 }}>
              <defs>
                <pattern id="smallGrid" width="8" height="8" patternUnits="userSpaceOnUse">
                  <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#smallGrid)" />
            </svg>
          </div>
          {/* Render blocks */}
          {blocks.map((block) => (
            <DraggableBlock key={block.id} block={block} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function DraggableBlock({ block }: { block: Block }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id,
  });
  const style: React.CSSProperties = {
    position: 'absolute',
    left: block.x + (transform?.x || 0),
    top: block.y + (transform?.y || 0),
    width: block.width,
    height: block.height,
    zIndex: isDragging ? 10 : 1,
    cursor: 'move',
    background: block.type === 'rectangle' ? '#facc15' : 'white',
    border: '1px solid #d1d5db',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: isDragging ? '0 2px 8px rgba(0,0,0,0.12)' : undefined,
    userSelect: 'none',
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {block.type === 'text' && <span style={{ fontSize: 16 }}>{block.content}</span>}
      {block.type === 'image' && <ImageIcon className="w-8 h-8 text-gray-400" />}
      {block.type === 'line' && <div style={{ width: '100%', height: 2, background: '#222' }} />}
      {block.type === 'rectangle' && <span style={{ color: '#222', fontWeight: 500 }}>Rect</span>}
    </div>
  );
}
