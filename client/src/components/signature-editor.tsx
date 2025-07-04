// Signature Editor - Rebuild in progress
// This file will be rebuilt to provide a freeform, canvas-style email signature editor inspired by signature-canvas-craft, using only existing project components and dependencies.

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text, Image as ImageIcon, Minus, Square, User, Briefcase, Mail, Phone, Plus } from 'lucide-react';
import { DndContext, useDraggable, DragEndEvent } from '@dnd-kit/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

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
  imageUrl?: string;
  padding?: string;
  margin?: string;
  cornerRadius?: number;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: 'bold' | 'normal';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  variable?: string;
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
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [resizeState, setResizeState] = useState<{
    blockId: string | null;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    corner: string | null;
  }>({ blockId: null, startX: 0, startY: 0, startWidth: 0, startHeight: 0, corner: null });
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imagePanelOpen, setImagePanelOpen] = useState(false);
  const [imagePanelBlockId, setImagePanelBlockId] = useState<string | null>(null);
  const [textPanelOpen, setTextPanelOpen] = useState(false);
  const [textPanelBlockId, setTextPanelBlockId] = useState<string | null>(null);
  const [variablePopoverOpen, setVariablePopoverOpen] = useState(false);

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

  // Mouse events for resizing
  const handleResizeMouseDown = (e: React.MouseEvent, block: Block, corner: string) => {
    e.stopPropagation();
    setResizeState({
      blockId: block.id,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: block.width,
      startHeight: block.height,
      corner,
    });
    document.body.style.cursor = 'nwse-resize';
  };

  React.useEffect(() => {
    if (!resizeState.blockId) return;
    const handleMouseMove = (e: MouseEvent) => {
      setBlocks((prev) =>
        prev.map((block) => {
          if (block.id !== resizeState.blockId) return block;
          let newWidth = resizeState.startWidth;
          let newHeight = resizeState.startHeight;
          if (resizeState.corner === 'se') {
            newWidth = Math.max(20, resizeState.startWidth + (e.clientX - resizeState.startX));
            newHeight = Math.max(20, resizeState.startHeight + (e.clientY - resizeState.startY));
          } else if (resizeState.corner === 'sw') {
            newWidth = Math.max(20, resizeState.startWidth - (e.clientX - resizeState.startX));
            newHeight = Math.max(20, resizeState.startHeight + (e.clientY - resizeState.startY));
          } else if (resizeState.corner === 'ne') {
            newWidth = Math.max(20, resizeState.startWidth + (e.clientX - resizeState.startX));
            newHeight = Math.max(20, resizeState.startHeight - (e.clientY - resizeState.startY));
          } else if (resizeState.corner === 'nw') {
            newWidth = Math.max(20, resizeState.startWidth - (e.clientX - resizeState.startX));
            newHeight = Math.max(20, resizeState.startHeight - (e.clientY - resizeState.startY));
          }
          return { ...block, width: newWidth, height: newHeight };
        })
      );
    };
    const handleMouseUp = () => {
      setResizeState({ blockId: null, startX: 0, startY: 0, startWidth: 0, startHeight: 0, corner: null });
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizeState]);

  // Inline text editing
  const handleTextDoubleClick = (block: Block) => {
    setEditingBlockId(block.id);
    setEditingValue(block.content);
  };
  const handleTextEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingValue(e.target.value);
  };
  const handleTextEditBlur = () => {
    if (editingBlockId) {
      setBlocks((prev) =>
        prev.map((block) =>
          block.id === editingBlockId ? { ...block, content: editingValue } : block
        )
      );
    }
    setEditingBlockId(null);
    setEditingValue('');
  };
  const handleTextEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTextEditBlur();
    }
  };

  // Open image panel when image block is clicked
  const handleImageClick = (block: Block) => {
    setSelectedBlockId(block.id);
    setImagePanelBlockId(block.id);
    setImagePanelOpen(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Update image block properties
  const updateImageBlock = (id: string, updates: Partial<Block>) => {
    setBlocks((prev) => prev.map((block) => block.id === id ? { ...block, ...updates } : block));
  };

  // Delete image block from panel
  const handleDeleteImageBlock = () => {
    if (imagePanelBlockId) {
      setBlocks((prev) => prev.filter((block) => block.id !== imagePanelBlockId));
      setImagePanelBlockId(null);
      setImagePanelOpen(false);
      setSelectedBlockId(null);
    }
  };

  // Block deletion
  const handleDeleteSelectedBlock = () => {
    if (selectedBlockId) {
      setBlocks((prev) => prev.filter((block) => block.id !== selectedBlockId));
      setSelectedBlockId(null);
      setEditingBlockId(null);
    }
  };

  // Keyboard shortcut for delete
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBlockId) {
        e.preventDefault();
        handleDeleteSelectedBlock();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBlockId]);

  // Insert variable into text block
  const handleInsertVariable = (variableLabel: string) => {
    // Only allow if editing a text block or a text block is selected
    const targetBlockId = editingBlockId || (selectedBlockId && blocks.find(b => b.id === selectedBlockId && b.type === 'text')?.id);
    if (!targetBlockId) return;
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== targetBlockId) return block;
        // Insert variable at cursor if editing, else at end
        if (editingBlockId === targetBlockId) {
          // If editing, insert at cursor position in editingValue
          const variable = `{{${variableLabel}}}`;
          let newValue = editingValue;
          const input = document.activeElement as HTMLInputElement;
          if (input && input.selectionStart !== null) {
            const start = input.selectionStart;
            const end = input.selectionEnd ?? start;
            newValue = editingValue.slice(0, start) + variable + editingValue.slice(end);
            setEditingValue(newValue);
          } else {
            newValue = editingValue + variable;
            setEditingValue(newValue);
          }
          return { ...block, content: newValue };
        } else {
          // Not editing, just append to content
          return { ...block, content: block.content + `{{${variableLabel}}}` };
        }
      })
    );
  };

  // Open text panel when text block is clicked
  const handleTextClick = (block: Block) => {
    setSelectedBlockId(block.id);
    setTextPanelBlockId(block.id);
    setTextPanelOpen(true);
  };

  // Update text block properties
  const updateTextBlock = (id: string, updates: Partial<Block>) => {
    setBlocks((prev) => prev.map((block) => block.id === id ? { ...block, ...updates } : block));
  };

  // Delete text block from panel
  const handleDeleteTextBlock = () => {
    if (textPanelBlockId) {
      setBlocks((prev) => prev.filter((block) => block.id !== textPanelBlockId));
      setTextPanelBlockId(null);
      setTextPanelOpen(false);
      setSelectedBlockId(null);
    }
  };

  // Simple HTML generator for preview/export
  const generateHtml = () => {
    return `
      <div style="font-family: Arial, sans-serif;">
        ${blocks.map(block => {
          if (block.type === 'text') {
            return `<div style=\"position:absolute;left:${block.x}px;top:${block.y}px;width:${block.width}px;height:${block.height}px;\">${block.content}</div>`;
          }
          if (block.type === 'image' && block.imageUrl) {
            return `<img src=\"${block.imageUrl}\" style=\"position:absolute;left:${block.x}px;top:${block.y}px;width:${block.width}px;height:${block.height}px;object-fit:contain;\" />`;
          }
          if (block.type === 'line') {
            return `<div style=\"position:absolute;left:${block.x}px;top:${block.y}px;width:${block.width}px;height:2px;background:#222;\"></div>`;
          }
          if (block.type === 'rectangle') {
            return `<div style=\"position:absolute;left:${block.x}px;top:${block.y}px;width:${block.width}px;height:${block.height}px;background:#facc15;\"></div>`;
          }
          return '';
        }).join('')}
      </div>
    `;
  };

  // Export HTML
  const handleExportHtml = () => {
    const html = generateHtml();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'signature.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Save (placeholder)
  const handleSave = () => {
    const html = generateHtml();
    alert('Signature saved! (implement real save logic)');
    // Example: onSave({ blocks, html })
  };

  // Add variable text block
  const handleAddVariableBlock = (variableLabel: string) => {
    const { x, y } = getRandomPosition();
    const newBlock = {
      id: generateId(),
      type: 'text',
      x,
      y,
      width: 180,
      height: 40,
      content: `{{${variableLabel}}}`,
      variable: variableLabel,
      fontFamily: 'Arial',
      fontSize: 16,
      color: '#000000',
    };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
    setTextPanelBlockId(newBlock.id);
    setTextPanelOpen(true);
    setVariablePopoverOpen(false);
  };

  // Image upload handler (fix ReferenceError)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBlocks((prev) =>
        prev.map((block) =>
          block.id === selectedBlockId ? { ...block, imageUrl: ev.target?.result as string } : block
        )
      );
    };
    reader.readAsDataURL(file);
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
        <Popover open={variablePopoverOpen} onOpenChange={setVariablePopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex gap-2 items-center">
              <Plus className="w-4 h-4" /> Add Variables
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2">
            <div className="flex flex-col gap-1">
              {VARIABLE_OPTIONS.map((v) => (
                <Button
                  key={v.label}
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => handleAddVariableBlock(v.label)}
                >
                  {v.icon} {v.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </Card>

      {/* Canvas Area */}
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex-1 w-full min-h-[600px] bg-gray-50 border border-dashed border-gray-300 rounded-lg relative overflow-auto">
          {/* Delete button for selected block */}
          {selectedBlockId && (
            <div style={{ position: 'absolute', top: 16, right: 24, zIndex: 100 }}>
              <Button variant="destructive" size="sm" onClick={handleDeleteSelectedBlock}>
                Delete Block
              </Button>
            </div>
          )}
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
            <DraggableBlock
              key={block.id}
              block={block}
              selected={block.id === selectedBlockId}
              onSelect={() => setSelectedBlockId(block.id)}
              onResizeHandle={handleResizeMouseDown}
              onTextDoubleClick={handleTextDoubleClick}
              editing={editingBlockId === block.id}
              editingValue={editingValue}
              onTextEditChange={handleTextEditChange}
              onTextEditBlur={handleTextEditBlur}
              onTextEditKeyDown={handleTextEditKeyDown}
              onImageClick={handleImageClick}
              onTextClick={handleTextClick}
            />
          ))}
          {/* Hidden file input for image upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageChange}
          />
        </div>
      </DndContext>

      <div className="flex gap-2 mt-2">
        <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>Preview</Button>
        <Button variant="outline" size="sm" onClick={handleExportHtml}>Export HTML</Button>
        <Button variant="default" size="sm" onClick={handleSave}>Save</Button>
      </div>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent style={{ minWidth: 400, minHeight: 300 }}>
          <DialogHeader>
            <DialogTitle>Signature Preview</DialogTitle>
          </DialogHeader>
          <div style={{ position: 'relative', width: 500, height: 300, background: '#fff', border: '1px solid #eee' }}
            dangerouslySetInnerHTML={{ __html: generateHtml() }}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={imagePanelOpen && !!imagePanelBlockId} onOpenChange={(open) => {
        setImagePanelOpen(open);
        if (!open) setImagePanelBlockId(null);
      }}>
        <DialogContent style={{ minWidth: 340, maxWidth: 400 }}>
          {(() => {
            const block = blocks.find(b => b.id === imagePanelBlockId && b.type === 'image');
            if (!block) return null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle>image Element</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={block.x}
                      min={0}
                      onChange={e => updateImageBlock(block.id, { x: Number(e.target.value) })}
                      style={{ width: 80 }}
                    />
                    <Input
                      type="number"
                      value={block.y}
                      min={0}
                      onChange={e => updateImageBlock(block.id, { y: Number(e.target.value) })}
                      style={{ width: 80 }}
                    />
                  </div>
                  <div className="font-semibold text-sm mt-2">Image Source</div>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Upload Image
                  </Button>
                  <div className="text-xs text-gray-500">Or choose from assets:</div>
                  <div className="w-full h-16 bg-gray-100 border rounded flex items-center justify-center text-gray-400">
                    (Asset picker placeholder)
                  </div>
                  <div className="font-semibold text-sm mt-2">Size</div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={block.width}
                      min={10}
                      onChange={e => updateImageBlock(block.id, { width: Number(e.target.value) })}
                      style={{ width: 80 }}
                    />
                    <Input
                      type="number"
                      value={block.height}
                      min={10}
                      onChange={e => updateImageBlock(block.id, { height: Number(e.target.value) })}
                      style={{ width: 80 }}
                    />
                  </div>
                  <div className="font-semibold text-sm mt-2">Styling</div>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={block.padding ?? ''}
                      placeholder="Padding"
                      onChange={e => updateImageBlock(block.id, { padding: e.target.value })}
                      style={{ width: 80 }}
                    />
                    <Input
                      type="text"
                      value={block.margin ?? ''}
                      placeholder="Margin"
                      onChange={e => updateImageBlock(block.id, { margin: e.target.value })}
                      style={{ width: 80 }}
                    />
                  </div>
                  <Input
                    type="number"
                    value={block.cornerRadius ?? 0}
                    min={0}
                    max={100}
                    placeholder="Corner Radius"
                    onChange={e => updateImageBlock(block.id, { cornerRadius: Number(e.target.value) })}
                  />
                  <Button variant="destructive" className="mt-4" onClick={handleDeleteImageBlock}>
                    Delete Element
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
      <Dialog open={textPanelOpen && !!textPanelBlockId} onOpenChange={(open) => {
        setTextPanelOpen(open);
        if (!open) setTextPanelBlockId(null);
      }}>
        <DialogContent style={{ minWidth: 340, maxWidth: 400 }}>
          {(() => {
            const block = blocks.find(b => b.id === textPanelBlockId && b.type === 'text');
            if (!block) return null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle>Text Element</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                  <div className="font-semibold text-sm mt-2">Text</div>
                  <Input
                    type="text"
                    value={block.content}
                    onChange={e => updateTextBlock(block.id, { content: e.target.value })}
                  />
                  <div className="font-semibold text-sm mt-2">Typography</div>
                  <div className="flex gap-2">
                    <select
                      value={block.fontFamily || 'Arial'}
                      onChange={e => updateTextBlock(block.id, { fontFamily: e.target.value })}
                      className="border rounded px-2 py-1"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Courier New">Courier New</option>
                    </select>
                    <Input
                      type="number"
                      value={block.fontSize || 14}
                      min={8}
                      max={72}
                      onChange={e => updateTextBlock(block.id, { fontSize: Number(e.target.value) })}
                      style={{ width: 80 }}
                    />
                  </div>
                  <div className="flex gap-2 items-center mt-2">
                    <label className="text-xs">Color</label>
                    <input
                      type="color"
                      value={block.color || '#000000'}
                      onChange={e => updateTextBlock(block.id, { color: e.target.value })}
                      style={{ width: 32, height: 32, border: 'none', background: 'none' }}
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant={block.fontWeight === 'bold' ? 'default' : 'outline'}
                      onClick={() => updateTextBlock(block.id, { fontWeight: block.fontWeight === 'bold' ? undefined : 'bold' })}
                    >
                      B
                    </Button>
                    <Button
                      size="sm"
                      variant={block.fontStyle === 'italic' ? 'default' : 'outline'}
                      onClick={() => updateTextBlock(block.id, { fontStyle: block.fontStyle === 'italic' ? undefined : 'italic' })}
                    >
                      I
                    </Button>
                    <Button
                      size="sm"
                      variant={block.textDecoration === 'underline' ? 'default' : 'outline'}
                      onClick={() => updateTextBlock(block.id, { textDecoration: block.textDecoration === 'underline' ? undefined : 'underline' })}
                    >
                      U
                    </Button>
                  </div>
                  <div className="font-semibold text-sm mt-2">Styling</div>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={block.padding ?? ''}
                      placeholder="Padding"
                      onChange={e => updateTextBlock(block.id, { padding: e.target.value })}
                      style={{ width: 80 }}
                    />
                    <Input
                      type="text"
                      value={block.margin ?? ''}
                      placeholder="Margin"
                      onChange={e => updateTextBlock(block.id, { margin: e.target.value })}
                      style={{ width: 80 }}
                    />
                  </div>
                  <Input
                    type="number"
                    value={block.cornerRadius ?? 0}
                    min={0}
                    max={100}
                    placeholder="Corner Radius"
                    onChange={e => updateTextBlock(block.id, { cornerRadius: Number(e.target.value) })}
                  />
                  {block.variable ? (
                    <div className="flex flex-col gap-2 mt-2">
                      <label className="text-xs font-semibold">Variable</label>
                      <select
                        value={block.variable}
                        onChange={e => updateTextBlock(block.id, { variable: e.target.value, content: `{{${e.target.value}}}` })}
                        className="border rounded px-2 py-1"
                      >
                        {VARIABLE_OPTIONS.map(v => (
                          <option key={v.label} value={v.label}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                  <Button variant="destructive" className="mt-4" onClick={handleDeleteTextBlock}>
                    Delete Element
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DraggableBlock({
  block,
  selected,
  onSelect,
  onResizeHandle,
  onTextDoubleClick,
  editing,
  editingValue,
  onTextEditChange,
  onTextEditBlur,
  onTextEditKeyDown,
  onImageClick,
  onTextClick,
}: {
  block: Block;
  selected: boolean;
  onSelect: () => void;
  onResizeHandle: (e: React.MouseEvent, block: Block, corner: string) => void;
  onTextDoubleClick: (block: Block) => void;
  editing: boolean;
  editingValue: string;
  onTextEditChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTextEditBlur: () => void;
  onTextEditKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onImageClick: (block: Block) => void;
  onTextClick: (block: Block) => void;
}) {
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
    border: selected ? '2px solid #2563eb' : '1px solid #d1d5db',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: isDragging ? '0 2px 8px rgba(0,0,0,0.12)' : undefined,
    userSelect: 'none',
    transition: 'border 0.1s',
    overflow: 'hidden',
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onMouseDown={onSelect}
      onDoubleClick={block.type === 'text' ? () => onTextDoubleClick(block) : undefined}
      onClick={block.type === 'image' ? () => onImageClick(block) : undefined}
    >
      {block.type === 'text' && editing ? (
        <input
          type="text"
          value={editingValue}
          onChange={onTextEditChange}
          onBlur={onTextEditBlur}
          onKeyDown={onTextEditKeyDown}
          autoFocus
          style={{ fontSize: 16, width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center' }}
        />
      ) : block.type === 'text' ? (
        <span style={{ fontSize: 16 }}>{block.content}</span>
      ) : null}
      {block.type === 'image' && block.imageUrl ? (
        <img src={block.imageUrl} alt="Uploaded" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      ) : block.type === 'image' ? (
        <ImageIcon className="w-8 h-8 text-gray-400" />
      ) : null}
      {block.type === 'line' && <div style={{ width: '100%', height: 2, background: '#222' }} />}
      {block.type === 'rectangle' && <span style={{ color: '#222', fontWeight: 500 }}>Rect</span>}
      {/* Resize handles (corners) */}
      {selected && (
        <>
          <ResizeHandle corner="nw" onMouseDown={(e) => onResizeHandle(e, block, 'nw')} />
          <ResizeHandle corner="ne" onMouseDown={(e) => onResizeHandle(e, block, 'ne')} />
          <ResizeHandle corner="sw" onMouseDown={(e) => onResizeHandle(e, block, 'sw')} />
          <ResizeHandle corner="se" onMouseDown={(e) => onResizeHandle(e, block, 'se')} />
        </>
      )}
    </div>
  );
}

function ResizeHandle({ corner, onMouseDown }: { corner: string; onMouseDown: (e: React.MouseEvent) => void }) {
  const positions: Record<string, React.CSSProperties> = {
    nw: { left: -6, top: -6, cursor: 'nwse-resize' },
    ne: { right: -6, top: -6, cursor: 'nesw-resize' },
    sw: { left: -6, bottom: -6, cursor: 'nesw-resize' },
    se: { right: -6, bottom: -6, cursor: 'nwse-resize' },
  };
  return (
    <div
      style={{
        position: 'absolute',
        width: 12,
        height: 12,
        background: '#fff',
        border: '2px solid #2563eb',
        borderRadius: 4,
        zIndex: 20,
        ...positions[corner],
      }}
      onMouseDown={onMouseDown}
    />
  );
}

export { SignatureEditor };
