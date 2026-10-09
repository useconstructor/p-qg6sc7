'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  Trash2,
  FileText,
  Check,
  Loader2,
  StickyNote,
  Menu,
  X,
  ArrowLeft,
} from 'lucide-react';

interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function NotesApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch('/api/notes');
      const data = await res.json();
      setNotes(data);
      if (data.length > 0 && !selectedNote) {
        setSelectedNote(data[0]);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedNote]);

  useEffect(() => {
    fetchNotes();
  }, []);

  const createNote = async () => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Nueva nota', content: '' }),
      });
      const newNote = await res.json();
      setNotes((prev) => [newNote, ...prev]);
      setSelectedNote(newNote);
      setMobileEditorOpen(true);
      setTimeout(() => titleInputRef.current?.focus(), 100);
    } catch (err) {
      console.error('Error creating note:', err);
    }
  };

  const updateNote = async (id: number, updates: Partial<Note>) => {
    setSaveStatus('saving');
    setIsSaving(true);
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updatedNote = await res.json();
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? updatedNote : n))
      );
      if (selectedNote?.id === id) {
        setSelectedNote(updatedNote);
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Error updating note:', err);
      setSaveStatus('idle');
    } finally {
      setIsSaving(false);
    }
  };

  const debouncedUpdate = (id: number, updates: Partial<Note>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      updateNote(id, updates);
    }, 500);
  };

  const deleteNote = async (id: number) => {
    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNote?.id === id) {
        const remaining = notes.filter((n) => n.id !== id);
        setSelectedNote(remaining[0] ?? null);
        setMobileEditorOpen(false);
      }
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'Z');
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPreview = (content: string) => {
    const lines = content.split('\n').filter(Boolean);
    return lines[0]?.slice(0, 80) || 'Sin contenido';
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        createNote();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (selectedNote && saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          updateNote(selectedNote.id, {
            title: selectedNote.title,
            content: selectedNote.content,
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNote]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-background)]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-muted-foreground)]" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--color-background)]">
      <header className="sticky top-0 z-50 bg-white border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 -ml-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <StickyNote className="w-6 h-6 text-[var(--color-primary)]" />
              <h1 className="text-lg font-semibold text-[var(--color-foreground)]">
                Notas Personales
              </h1>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
              <Input
                id="search-input"
                type="text"
                placeholder="Buscar notas... (⌘K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-[var(--color-secondary)] border-[var(--color-border)] focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
              />
            </div>
          </div>
          <Button
            onClick={createNote}
            className="bg-[var(--color-primary)] hover:bg-[#1D4ED8] text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva nota</span>
          </Button>
        </div>

        <div
          className={`md:hidden mt-3 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            mobileMenuOpen
              ? 'max-h-16 opacity-100'
              : 'max-h-0 opacity-0'
          }`}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
            <Input
              type="text"
              placeholder="Buscar notas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[var(--color-secondary)] border-[var(--color-border)]"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside
          className={`
            w-full md:w-80 lg:w-96 border-r border-[var(--color-border)] bg-white flex flex-col
            ${mobileEditorOpen ? 'hidden md:flex' : 'flex'}
          `}
        >
          <div className="p-3 border-b border-[var(--color-border)] flex items-center justify-between">
            <span className="text-sm text-[var(--color-muted-foreground)]">
              {filteredNotes.length} {filteredNotes.length === 1 ? 'nota' : 'notas'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filteredNotes.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-muted-foreground)]">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">
                  {searchQuery
                    ? 'No se encontraron notas'
                    : 'Crea tu primera nota'}
                </p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => {
                    setSelectedNote(note);
                    setMobileEditorOpen(true);
                  }}
                  className={`
                    w-full text-left p-4 border-b border-[var(--color-border)] transition-colors
                    ${
                      selectedNote?.id === note.id
                        ? 'bg-[#EFF6FF] border-l-2 border-l-[var(--color-primary)]'
                        : 'hover:bg-[var(--color-secondary)]'
                    }
                  `}
                >
                  <h3 className="font-medium text-[var(--color-foreground)] truncate mb-1">
                    {note.title || 'Sin título'}
                  </h3>
                  <p className="text-sm text-[var(--color-muted-foreground)] truncate mb-2">
                    {getPreview(note.content)}
                  </p>
                  <span className="text-xs text-[#9CA3AF]">
                    {formatDate(note.updated_at)}
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        <main
          className={`
            flex-1 flex flex-col bg-white
            ${!mobileEditorOpen ? 'hidden md:flex' : 'flex'}
          `}
        >
          {selectedNote ? (
            <>
              <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <button
                    className="md:hidden p-2 -ml-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                    onClick={() => setMobileEditorOpen(false)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
                    {saveStatus === 'saving' && (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    )}
                    {saveStatus === 'saved' && (
                      <>
                        <Check className="w-4 h-4 text-[var(--color-success)]" />
                        <span className="text-[var(--color-success)]">Guardado</span>
                      </>
                    )}
                    {saveStatus === 'idle' && (
                      <span className="text-xs">{formatDate(selectedNote.updated_at)}</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-[var(--color-destructive)] hover:text-[var(--color-destructive)] hover:bg-red-50 border-[var(--color-border)]"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Eliminar</span>
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <Input
                  ref={titleInputRef}
                  type="text"
                  value={selectedNote.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setSelectedNote({ ...selectedNote, title: newTitle });
                    setNotes((prev) =>
                      prev.map((n) =>
                        n.id === selectedNote.id ? { ...n, title: newTitle } : n
                      )
                    );
                    debouncedUpdate(selectedNote.id, { title: newTitle });
                  }}
                  placeholder="Título de la nota"
                  className="text-2xl font-semibold border-0 border-b border-[var(--color-border)] rounded-none px-0 focus:ring-0 focus:border-[var(--color-primary)] bg-transparent"
                />
                <Textarea
                  ref={contentRef}
                  value={selectedNote.content}
                  onChange={(e) => {
                    const newContent = e.target.value;
                    setSelectedNote({ ...selectedNote, content: newContent });
                    setNotes((prev) =>
                      prev.map((n) =>
                        n.id === selectedNote.id ? { ...n, content: newContent } : n
                      )
                    );
                    debouncedUpdate(selectedNote.id, { content: newContent });
                  }}
                  placeholder="Escribe tu nota aquí..."
                  className="flex-1 min-h-[400px] resize-none border-0 p-0 focus:ring-0 bg-transparent text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--color-muted-foreground)]">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">Selecciona una nota</p>
                <p className="text-sm">
                  o{' '}
                  <button
                    onClick={createNote}
                    className="text-[var(--color-primary)] hover:underline"
                  >
                    crea una nueva
                  </button>
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {showDeleteConfirm && selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-2">
              Eliminar nota
            </h3>
            <p className="text-[var(--color-muted-foreground)] mb-6">
              ¿Estás seguro de que deseas eliminar &quot;{selectedNote.title}&quot;? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="border-[var(--color-border)]"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => deleteNote(selectedNote.id)}
                className="bg-[var(--color-destructive)] hover:bg-red-600 text-white"
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="hidden md:block fixed bottom-4 right-4 text-xs text-[var(--color-muted-foreground)] bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-[var(--color-border)]">
        <span className="font-medium">Atajos:</span>{' '}
        <kbd className="px-1.5 py-0.5 bg-[var(--color-secondary)] rounded text-[10px]">⌘N</kbd> Nueva{' '}
        <kbd className="px-1.5 py-0.5 bg-[var(--color-secondary)] rounded text-[10px]">⌘K</kbd> Buscar{' '}
        <kbd className="px-1.5 py-0.5 bg-[var(--color-secondary)] rounded text-[10px]">⌘S</kbd> Guardar
      </div>
    </div>
  );
}
