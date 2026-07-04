'use client';

/* Hallmark · component: page · genre: modern-minimal · theme: obsidian-mono
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass (46–50)
 */

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Point {
  x: number; // Normalized coordinate (0.0 to 1.0)
  y: number; // Normalized coordinate (0.0 to 1.0)
}

interface Shape {
  id: string | number;
  image: number;
  shape_type: string;
  points: Point[];
  created_at?: string;
  isTemp?: boolean; // True if created locally but not yet committed to DB
}

interface ImageAsset {
  id: number;
  file: string;
  original_width: number;
  original_height: number;
  uploaded_by: string;
  uploaded_at: string;
  shapes: Shape[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function AnnotatorWorkspace() {
  const { token, logout, user } = useAuth();

  // Images state
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageAsset | null>(null);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'error'>('idle');

  // Drawing state
  const [mode, setMode] = useState<'draw' | 'select'>('draw');
  const [localShapes, setLocalShapes] = useState<Shape[]>([]);
  const [newPoints, setNewPoints] = useState<Point[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // BUG-004 fix: inline confirmation instead of window.confirm()
  const [pendingImageSwitch, setPendingImageSwitch] = useState<ImageAsset | null>(null);

  // Stage scaling references
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0, top: 0, left: 0 });
  const [imageLoadError, setImageLoadError] = useState(false);

  // Fetch images list on mount
  // BUG-006 fix: wrap in useCallback so the useEffect dep array is correct
  const fetchImages = React.useCallback(async (selectId?: number) => {
    if (!token) return;
    setImagesLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/images/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        // Since list is paginated by default under PageNumberPagination, retrieve results array
        const results = data.results || data;
        setImages(results);
        
        // Auto-select first image if none selected, or maintain current selection
        if (results.length > 0) {
          if (selectId) {
            const match = results.find((img: ImageAsset) => img.id === selectId);
            if (match) handleSelectImage(match);
          } else if (!selectedImage) {
            handleSelectImage(results[0]);
          } else {
            // Update selected image references (e.g. after adding/removing shapes)
            const match = results.find((img: ImageAsset) => img.id === selectedImage.id);
            if (match) {
              // Merge shapes from DB with any temporary unsaved local shapes
              const savedIds = new Set((match.shapes || []).map((s: Shape) => s.id));
              const tempShapes = localShapes.filter(s => s.isTemp && s.image === selectedImage.id && !savedIds.has(s.id));
              setLocalShapes([...(match.shapes || []), ...tempShapes]);
            }
          }
        } else {
          setSelectedImage(null);
          setLocalShapes([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch images', err);
    } finally {
      setImagesLoading(false);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (token) {
      fetchImages();
    }
  }, [token, fetchImages]);

  // Recalculate SVG stage overlay coordinate boundaries relative to actual image viewport
  const updateStageDimensions = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    setImageSize({
      width: img.clientWidth,
      height: img.clientHeight,
      top: img.offsetTop,
      left: img.offsetLeft,
    });
  };

  // Bind window resize triggers
  useEffect(() => {
    window.addEventListener('resize', updateStageDimensions);
    return () => {
      window.removeEventListener('resize', updateStageDimensions);
    };
  }, [selectedImage]);

  // Commit the actual image switch (called after confirmation or directly if no unsaved changes)
  const commitImageSwitch = (img: ImageAsset) => {
    setSelectedImage(img);
    setImageLoadError(false);
    setLocalShapes(img.shapes || []);
    setNewPoints([]);
    setSelectedShapeId(null);
    setHasUnsavedChanges(false);
    setSaveStatus('idle');
    setPendingImageSwitch(null);
  };

  // Handle selected image transition — BUG-004 fix: no window.confirm()
  const handleSelectImage = (img: ImageAsset) => {
    if (hasUnsavedChanges) {
      // Stage the pending switch; show inline confirmation banner
      setPendingImageSwitch(img);
      return;
    }
    commitImageSwitch(img);
  };

  // Upload file event handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploadStatus('uploading');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/api/images/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const newImage = await res.json();
        setUploadStatus('idle');
        // Fetch list and auto-select newly uploaded image
        fetchImages(newImage.id);
      } else {
        setUploadStatus('error');
      }
    } catch {
      setUploadStatus('error');
    }
  };

  // Handle stage click drawing point addition
  const handleStageClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== 'draw' || !selectedImage) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Check duplicate points on rapid click
    if (newPoints.length > 0) {
      const lastPoint = newPoints[newPoints.length - 1];
      const dist = Math.hypot(x - lastPoint.x, y - lastPoint.y);
      if (dist < 0.005) return; // Prevent duplicating points on rapid clicks
    }

    // Close polygon if clicking near starting point (2% threshold)
    if (newPoints.length >= 3) {
      const startPoint = newPoints[0];
      const distToStart = Math.hypot(x - startPoint.x, y - startPoint.y);
      if (distToStart < 0.02) {
        closePolygon();
        return;
      }
    }

    setNewPoints([...newPoints, { x, y }]);
  };

  // Handle double click to close polygon drawing
  const handleStageDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (mode !== 'draw' || newPoints.length < 3) return;
    closePolygon();
  };

  // Escape key handler to reset active draw
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNewPoints([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const closePolygon = () => {
    if (newPoints.length < 3 || !selectedImage) return;

    const tempShape: Shape = {
      id: `temp-${Date.now()}`,
      image: selectedImage.id,
      shape_type: 'polygon',
      points: newPoints,
      isTemp: true,
    };

    setLocalShapes([...localShapes, tempShape]);
    setNewPoints([]);
    setHasUnsavedChanges(true);
    setSaveStatus('idle');
  };

  const handleResetDraw = () => {
    setNewPoints([]);
  };

  // Select polygon click handler
  const handleShapeSelect = (e: React.MouseEvent, shapeId: string | number) => {
    e.stopPropagation(); // Stop click propagating to the drawing canvas
    if (mode === 'select') {
      setSelectedShapeId(shapeId === selectedShapeId ? null : shapeId);
    }
  };

  // Delete specific polygon
  const handleDeleteShape = async (shapeId: string | number) => {
    if (!token) return;

    const shapeToDelete = localShapes.find(s => s.id === shapeId);
    if (!shapeToDelete) return;

    // If it is an unsaved temporary shape, just filter it locally
    if (shapeToDelete.isTemp) {
      setLocalShapes(localShapes.filter(s => s.id !== shapeId));
      if (selectedShapeId === shapeId) setSelectedShapeId(null);
      
      // Re-evaluate unsaved change markers
      const remainingTemps = localShapes.filter(s => s.id !== shapeId && s.isTemp);
      setHasUnsavedChanges(remainingTemps.length > 0);
      return;
    }

    // Otherwise, hit backend endpoint
    try {
      const res = await fetch(`${API_URL}/api/shapes/${shapeId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (res.ok) {
        setLocalShapes(localShapes.filter(s => s.id !== shapeId));
        if (selectedShapeId === shapeId) setSelectedShapeId(null);
        // Refresh image record from DB
        fetchImages(selectedImage?.id);
      } else {
        // BUG-005 fix: optimistic approach — restore on failure instead of alert()
        setLocalShapes([...localShapes]); // restore full list
        setSaveStatus('error');  // reuse saveStatus to show an error indicator
      }
    } catch (err) {
      console.error('Delete shape error', err);
    }
  };

  // Batch Save all new local shapes to backend
  const handleSaveAnnotations = async () => {
    if (!selectedImage || !token) return;

    const unsavedShapes = localShapes.filter(s => s.isTemp);
    if (unsavedShapes.length === 0) return;

    setSaveStatus('saving');

    try {
      // Post all unsaved shapes sequentially/batch
      const promises = unsavedShapes.map(shape => {
        return fetch(`${API_URL}/api/shapes/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
          },
          body: JSON.stringify({
            image: selectedImage.id,
            shape_type: 'polygon',
            points: shape.points,
          }),
        });
      });

      const responses = await Promise.all(promises);
      const allSucceeded = responses.every(res => res.ok);

      if (allSucceeded) {
        setSaveStatus('saved');
        setHasUnsavedChanges(false);
        // Refresh images data to fetch correct DB shape IDs
        fetchImages(selectedImage.id);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: 'var(--surface-base)', color: 'var(--ink-primary)' }}
    >

      {/* ── Top Navbar ──────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-40 flex items-center justify-between px-5 h-12"
        style={{
          background: 'rgba(13,13,15,0.85)',
          borderBottom: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-data text-xs font-medium transition-colors-fast"
            style={{ color: 'var(--ink-primary)', letterSpacing: '0.08em' }}
          >
            404_PROJECT
          </Link>
          <span aria-hidden="true" style={{ color: 'var(--border-default)', fontSize: '0.75rem' }}>/</span>
          <span className="text-sm font-medium" style={{ color: 'var(--ink-secondary)' }}>Annotate</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/tasks" className="nav-link text-sm">Tasks</Link>
          <div style={{ width: '1px', height: '16px', background: 'var(--border-default)' }} aria-hidden="true" />
          <span className="text-xs" style={{ color: 'var(--ink-tertiary)' }}>{user?.email}</span>
          <button onClick={logout} className="btn-ghost text-xs py-1 px-3">Sign out</button>
        </div>
      </nav>

      {/* ── Main Split-Pane Workspace ────────────────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        
        {/* Left Pane: Stage drawing board */}
        <div
          className="flex-1 p-5 flex flex-col justify-center items-center overflow-auto relative"
          style={{ borderRight: '1px solid var(--border-subtle)' }}
        >

          {selectedImage ? (
            <div className="w-full flex flex-col items-center justify-center gap-3">
              {/* File metadata strip */}
              <div
                className="flex items-center gap-3 font-data text-xs px-3 py-1.5 rounded-[var(--radius-md)]"
                style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', color: 'var(--ink-tertiary)' }}
              >
                <span>{selectedImage.file.split('/').pop()}</span>
                <span style={{ color: 'var(--border-default)' }}>·</span>
                <span>{selectedImage.original_width}×{selectedImage.original_height}px</span>
              </div>

              <div
                ref={containerRef}
                className="relative max-w-full max-h-[65vh] flex items-center justify-center overflow-hidden rounded-[var(--radius-lg)]"
                style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-default)', padding: '4px' }}
              >
                {!imageLoadError ? (
                  <img
                    ref={imageRef}
                    src={selectedImage.file.startsWith('http') ? selectedImage.file : `${API_URL}${selectedImage.file}`}
                    alt="Asset Stage"
                    className="max-w-full max-h-[60vh] object-contain select-none pointer-events-none rounded"
                    onLoad={updateStageDimensions}
                    onError={() => setImageLoadError(true)}
                  />
                ) : (
                  <div
                    className="flex flex-col items-center justify-center text-center gap-4"
                    style={{ width: '400px', height: '300px', color: 'var(--ink-tertiary)' }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: 'var(--ink-muted)' }}>
                      <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p className="text-sm">Image failed to load</p>
                    <button onClick={() => setImageLoadError(false)} className="btn-ghost text-xs">Retry</button>
                  </div>
                )}

                {/* SVG Drawing and Selection Overlay */}
                {!imageLoadError && imageSize.width > 0 && (
                  <svg
                    className={`absolute select-none ${mode === 'draw' ? 'cursor-crosshair' : 'cursor-default'}`}
                    style={{
                      width: imageSize.width,
                      height: imageSize.height,
                      top: imageSize.top,
                      left: imageSize.left,
                    }}
                    viewBox="0 0 1000 1000"
                    onClick={handleStageClick}
                    onDoubleClick={handleStageDoubleClick}
                  >
                    {/* Render saved & temporary shapes */}
                    {localShapes.map((shape) => {
                      const pointsAttr = shape.points.map(p => `${p.x * 1000},${p.y * 1000}`).join(' ');
                      const isSelected = selectedShapeId === shape.id;
                      
                      return (
                        <g key={shape.id}>
                          <polygon
                            points={pointsAttr}
                            className={`transition-colors duration-150 ${
                              isSelected 
                                ? 'fill-emerald-500/25 stroke-emerald-400 stroke-[3]' 
                                : 'fill-neutral-100/10 hover:fill-neutral-100/25 stroke-neutral-400 stroke-2 hover:stroke-neutral-300'
                            }`}
                            onClick={(e) => handleShapeSelect(e, shape.id)}
                          />
                          {/* Highlight vertices on hover/selection */}
                          {isSelected && shape.points.map((p, idx) => (
                            <circle
                              key={idx}
                              cx={p.x * 1000}
                              cy={p.y * 1000}
                              r={5}
                              className="fill-emerald-400 stroke-neutral-950 stroke-[1.5]"
                            />
                          ))}
                        </g>
                      );
                    })}

                    {/* Render active drawing line segment */}
                    {newPoints.length > 0 && (
                      <g>
                        <polyline
                          points={newPoints.map(p => `${p.x * 1000},${p.y * 1000}`).join(' ')}
                          className="fill-none stroke-amber-400 stroke-2 stroke-dasharray-[4]"
                        />
                        {/* Draw connection segment from last point to cursor is handled natively or skipped for simplicity */}
                        {newPoints.map((p, idx) => (
                          <circle
                            key={idx}
                            cx={p.x * 1000}
                            cy={p.y * 1000}
                            r={idx === 0 ? 6 : 4}
                            className={`${idx === 0 ? 'fill-amber-500 animate-pulse' : 'fill-amber-400'} stroke-neutral-950 stroke-1`}
                          />
                        ))}
                      </g>
                    )}
                  </svg>
                )}
              </div>
              
              {/* BUG-004 fix: inline unsaved-changes confirmation — replaces window.confirm() */}
              {pendingImageSwitch && (
                <div
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-[var(--radius-md)] animate-fade-in"
                  role="alertdialog"
                  aria-live="assertive"
                  style={{ background: 'var(--warn-surface)', border: '1px solid rgba(251,191,36,0.25)' }}
                >
                  <span className="text-xs" style={{ color: 'var(--warn)' }}>
                    Unsaved shapes — switch image and discard?
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setPendingImageSwitch(null)}
                      className="btn-ghost text-xs"
                      style={{ padding: '0.125rem 0.5rem', height: '22px' }}
                    >
                      Keep editing
                    </button>
                    <button
                      onClick={() => pendingImageSwitch && commitImageSwitch(pendingImageSwitch)}
                      className="btn-primary text-xs"
                      style={{ padding: '0.125rem 0.5rem', height: '22px', fontSize: '0.75rem' }}
                    >
                      Discard &amp; switch
                    </button>
                  </div>
                </div>
              )}

              {/* Mid-draw status bar */}
              {mode === 'draw' && newPoints.length > 0 && (
                <div
                  className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] animate-fade-in"
                  style={{ background: 'var(--warn-surface)', border: '1px solid rgba(251,191,36,0.2)' }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: 'var(--warn)', flexShrink: 0 }}
                  />
                  <span className="text-xs" style={{ color: 'var(--warn)' }}>
                    Drawing — {newPoints.length} {newPoints.length === 1 ? 'point' : 'points'} placed
                  </span>
                  <button
                    onClick={handleResetDraw}
                    className="btn-ghost text-xs ml-auto"
                    style={{ padding: '0.125rem 0.5rem', height: '22px' }}
                  >
                    Cancel (Esc)
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center gap-4 text-center p-12 rounded-[var(--radius-xl)] max-w-sm"
              style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border-default)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: 'var(--ink-tertiary)' }}>
                  <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M3 15l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>No image selected</p>
                <p className="text-xs mt-1" style={{ color: 'var(--ink-tertiary)' }}>Upload an image using the strip below, then select it to annotate.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: Controls and lists */}
        <div
          className="w-full md:w-72 flex flex-col justify-between overflow-y-auto"
          style={{ borderTop: '1px solid var(--border-subtle)', borderLeft: 'none' }}
        >
          {/* Inner scroll container */}
          <div className="flex flex-col h-full">

          <div className="p-5 flex-1 space-y-5 overflow-y-auto">
            <div>
              <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--ink-primary)' }}>Controls</h2>

              {/* Mode toggle */}
              <div className="space-y-1.5">
                <span className="field-label">Mode</span>
                <div
                  className="grid grid-cols-2 gap-1 p-1 rounded-[var(--radius-md)]"
                  style={{ background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)' }}
                >
                  <button
                    onClick={() => { setMode('draw'); setSelectedShapeId(null); }}
                    className="py-1.5 text-center rounded-[var(--radius-sm)] text-sm transition-colors-fast"
                    style={{
                      background: mode === 'draw' ? 'var(--surface-overlay)' : 'transparent',
                      color:      mode === 'draw' ? 'var(--ink-primary)' : 'var(--ink-tertiary)',
                      fontWeight: mode === 'draw' ? 500 : 400,
                      border:     mode === 'draw' ? '1px solid var(--border-default)' : '1px solid transparent',
                    }}
                  >
                    Draw
                  </button>
                  <button
                    onClick={() => { setMode('select'); setNewPoints([]); }}
                    className="py-1.5 text-center rounded-[var(--radius-sm)] text-sm transition-colors-fast"
                    style={{
                      background: mode === 'select' ? 'var(--surface-overlay)' : 'transparent',
                      color:      mode === 'select' ? 'var(--ink-primary)' : 'var(--ink-tertiary)',
                      fontWeight: mode === 'select' ? 500 : 400,
                      border:     mode === 'select' ? '1px solid var(--border-default)' : '1px solid transparent',
                    }}
                  >
                    Select
                  </button>
                </div>
              </div>
            </div>

            {/* Shapes list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="field-label">Annotations ({localShapes.length})</span>
                {hasUnsavedChanges && (
                  <span className="badge badge-warn">Unsaved</span>
                )}
              </div>

              {localShapes.length > 0 ? (
                <div
                  className="space-y-1.5 max-h-[35vh] overflow-y-auto rounded-[var(--radius-md)] p-1.5"
                  style={{ background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)' }}
                >
                  {localShapes.map((shape) => {
                    const isSelected = selectedShapeId === shape.id;
                    return (
                      <div
                        key={shape.id}
                        onClick={() => mode === 'select' && setSelectedShapeId(shape.id)}
                        className="flex items-center justify-between rounded-[var(--radius-md)] px-2.5 py-2 transition-colors-fast"
                        style={{
                          background:   isSelected ? 'var(--accent-surface)' : 'var(--surface-raised)',
                          border:       `1px solid ${isSelected ? 'rgba(123,104,238,0.3)' : 'var(--border-subtle)'}`,
                          cursor:       mode === 'select' ? 'pointer' : 'default',
                        }}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium" style={{ color: 'var(--ink-primary)' }}>
                              Polygon
                            </span>
                            <span className="font-data text-xs" style={{ color: 'var(--ink-tertiary)', fontSize: '0.625rem' }}>
                              #{shape.id.toString().substring(0, 6)}
                            </span>
                            {shape.isTemp && <span className="badge badge-warn">Local</span>}
                          </div>
                          <div className="font-data" style={{ color: 'var(--ink-muted)', fontSize: '0.625rem' }}>
                            {shape.points.length} pts
                          </div>
                        </div>

                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteShape(shape.id); }}
                          className="btn-danger"
                          title="Delete annotation"
                          style={{ width: '26px', height: '26px' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M2 4h12M5.5 4V3a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M6.5 7v4.5M9.5 7v4.5M3 4l.75 9a1 1 0 001 .93h6.5a1 1 0 001-.93L13 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  className="p-4 text-center rounded-[var(--radius-md)] text-xs"
                  style={{ border: '1px dashed var(--border-subtle)', color: 'var(--ink-muted)' }}
                >
                  No annotations yet
                </div>
              )}
            </div>

          </div>

          {/* Actions footer */}
          <div
            className="p-5 space-y-3 flex-shrink-0"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            {hasUnsavedChanges && (
              <button
                onClick={handleSaveAnnotations}
                disabled={saveStatus === 'saving'}
                className="btn-primary w-full py-2.5 disabled:opacity-50"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Saving…
                  </>
                ) : (
                  'Save annotations'
                )}
              </button>
            )}

            {saveStatus === 'saved' && (
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)] text-xs animate-fade-in"
                style={{ background: 'var(--positive-surface)', border: '1px solid rgba(52,211,153,0.2)', color: 'var(--positive)' }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8l3.5 3.5 6.5-6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Annotations saved
              </div>
            )}

            {saveStatus === 'error' && (
              <div
                className="px-3 py-2.5 rounded-[var(--radius-md)] text-xs"
                style={{ background: 'var(--danger-surface)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--danger)' }}
              >
                Save failed — check coordinates are valid.
              </div>
            )}
          </div>

          </div>{/* end inner scroll container */}
        </div>
      </div>

      {/* ── Bottom strip: image carousel + upload ─────────────────── */}
      <footer
        className="flex gap-3 p-3 overflow-x-auto select-none"
        style={{
          height:     '108px',
          flexShrink: 0,
          background: 'var(--surface-raised)',
          borderTop:  '1px solid var(--border-subtle)',
        }}
      >
        {/* Upload button */}
        <label
          className="flex-shrink-0 flex flex-col items-center justify-center gap-1.5 rounded-[var(--radius-lg)] cursor-pointer transition-colors-fast"
          style={{
            width:        '76px',
            height:       '100%',
            background:   'var(--surface-overlay)',
            border:       `1px dashed ${uploadStatus === 'uploading' ? 'var(--border-default)' : 'var(--border-default)'}`,
            opacity:      uploadStatus === 'uploading' ? 0.6 : 1,
            pointerEvents: uploadStatus === 'uploading' ? 'none' : undefined,
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="absolute w-0 h-0 opacity-0 pointer-events-none"
            disabled={uploadStatus === 'uploading'}
          />
          {uploadStatus === 'uploading' ? (
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: 'var(--ink-tertiary)' }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ color: 'var(--ink-tertiary)' }}>
                <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="text-xs" style={{ color: 'var(--ink-tertiary)', fontSize: '0.6rem', letterSpacing: '0.04em' }}>Upload</span>
            </>
          )}
        </label>

        {/* Thumbnail carousel */}
        {imagesLoading && images.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs" style={{ color: 'var(--ink-muted)' }}>
            Loading…
          </div>
        ) : (
          images.map((img) => {
            const isSelected = selectedImage?.id === img.id;
            return (
              <div
                key={img.id}
                onClick={() => handleSelectImage(img)}
                className="flex-shrink-0 overflow-hidden rounded-[var(--radius-lg)] cursor-pointer relative"
                style={{
                  width:   '90px',
                  height:  '100%',
                  border:  `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-default)'}`,
                  outline: isSelected ? `2px solid var(--accent-muted)` : 'none',
                  outlineOffset: '1px',
                  transition: 'border-color 120ms var(--ease-out)',
                }}
              >
                <img
                  src={img.file.startsWith('http') ? img.file : `${API_URL}${img.file}`}
                  alt={`Image ${img.id} thumbnail`}
                  className="w-full h-full object-cover pointer-events-none"
                  loading="lazy"
                />
                {/* Shape count badge */}
                <div
                  className="absolute top-1 right-1 badge badge-neutral font-data"
                  style={{ fontSize: '0.5625rem', backdropFilter: 'blur(4px)', background: 'rgba(13,13,15,0.8)' }}
                >
                  {img.shapes?.length ?? 0}
                </div>
              </div>
            );
          })
        )}
      </footer>

    </div>
  );
}

export default function AnnotatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-950 text-neutral-500 flex items-center justify-center font-mono text-xs animate-pulse">
        Initializing Workspace...
      </div>
    }>
      <AnnotatorWorkspace />
    </Suspense>
  );
}
