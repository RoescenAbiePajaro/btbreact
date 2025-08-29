// CanvasApp.jsx
import React, { useRef, useState, useEffect } from "react";
import Toolbar from "./Toolbar";

export default function CanvasApp({ userData }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ff66b2");
  const [brushSize, setBrushSize] = useState(8);
  const [eraserSize, setEraserSize] = useState(20); // New state for eraser size
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoom, setZoom] = useState(1);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [toolMode, setToolMode] = useState("draw");
  const [selectedArea, setSelectedArea] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [insertedImages, setInsertedImages] = useState([]);

  // New state for handling text
  const [isTyping, setIsTyping] = useState(false);
  const [textData, setTextData] = useState({ x: 0, y: 0, content: "", fontSize: 24, font: "Arial" });
  
  // New state for translate
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [transformStart, setTransformStart] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Fixed canvas dimensions
  const [canvasSize] = useState({ width: 800, height: 600 });
  
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;

    // Set fixed canvas dimensions
    cvs.width = canvasSize.width;
    cvs.height = canvasSize.height;
    cvs.style.width = `${canvasSize.width}px`;
    cvs.style.height = `${canvasSize.height}px`;
    cvs.style.backgroundColor = 'black';

    const ctx = cvs.getContext("2d");
    
    // Set white background for drawing area
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    redrawInsertedImages();
    pushHistory();
  }, []);

  useEffect(() => {
    if (toolMode !== 'text' && isTyping) {
      // If tool is switched while typing, finalize the text
      drawTextOnCanvas(true);
    }
  }, [toolMode]);

  // Effect to handle keyboard input for the text tool
  useEffect(() => {
    if (!isTyping) return;

    const handleKeyDown = (e) => {
      e.preventDefault();
      if (e.key === 'Enter' || e.key === 'Escape') {
        drawTextOnCanvas(e.key === 'Enter');
        return;
      }

      if (e.key === 'Backspace') {
        handleTextChange((prev) => prev.slice(0, -1));
        return;
      }

      // Allow alphanumeric, space, and symbol characters
      if (e.key.length === 1) {
        handleTextChange((prev) => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTyping, textData, color, historyIndex]);

  const redrawInsertedImages = () => {
    const cvs = canvasRef.current;
    const ctx = cvs.getContext("2d");
    insertedImages.forEach((imgData) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, imgData.x, imgData.y, imgData.width, imgData.height);
      };
      img.src = imgData.dataURL;
    });
  };

  function getPointerPos(e) {
    const cvs = canvasRef.current;
    const rect = cvs.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);

    // Inverse transform the pointer coordinates
    const x = (clientX - rect.left) / zoom;
    const y = (clientY - rect.top) / zoom;

    return { x, y };
  }

  function beginDraw(e) {
    if (toolMode === "text") {
      const pos = getPointerPos(e);

      // If already typing, finalize the current text first
      if (isTyping) {
        drawTextOnCanvas(true);
      }

      setTextData({ 
        ...textData, 
        x: pos.x, 
        y: pos.y, 
        content: "" 
      });
      setIsTyping(true);
      return;
    }

    // Handle translate mode
    if (toolMode === "translate") {
      const pos = getPointerPos(e);
      setTransformStart({ x: pos.x, y: pos.y, translate: { ...translate } });
      setIsTranslating(true);
      return;
    }

    if (toolMode === "select") {
      const pos = getPointerPos(e);
      const clickedImage = insertedImages.find(
        (img) =>
          pos.x >= img.x &&
          pos.x <= img.x + img.width &&
          pos.y >= img.y &&
          pos.y <= img.y + img.height
      );

      if (clickedImage) {
        setSelectedArea({
          x: clickedImage.x,
          y: clickedImage.y,
          width: clickedImage.width,
          height: clickedImage.height,
          type: "image",
          imageData: clickedImage,
        });
        setIsDragging(true);
        setDragOffset({
          x: pos.x - clickedImage.x,
          y: pos.y - clickedImage.y,
        });
        drawSelectionRectangle(clickedImage);
        return;
      }

      if (selectedArea && isPointInSelection(pos)) {
        setIsDragging(true);
        setDragOffset({
          x: pos.x - selectedArea.x,
          y: pos.y - selectedArea.y,
        });
      } else {
        setSelectedArea({ x: pos.x, y: pos.y, width: 0, height: 0, type: "area" });
      }
      return;
    }

    e.preventDefault();
    const cvs = canvasRef.current;
    const ctx = cvs.getContext("2d");
    const pos = getPointerPos(e);
    setIsDrawing(true);
    setLastPos(pos);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = isEraser ? eraserSize : brushSize; // Use appropriate size based on tool
    
    if (isEraser) {
      // Use source-over with white color to erase to background
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = 'white';
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
    }
  }

  function draw(e) {
    // Handle translate mode with improved performance
    if (toolMode === "translate" && transformStart && isTranslating) {
      const pos = getPointerPos(e);
      const dx = pos.x - transformStart.x;
      const dy = pos.y - transformStart.y;
      
      // Use requestAnimationFrame for smoother animation
      requestAnimationFrame(() => {
        setTranslate({
          x: transformStart.translate.x + dx,
          y: transformStart.translate.y + dy,
        });
      });
      return;
    }

    if (toolMode === "select") {
      if (selectedArea && selectedArea.type === "area" && !isDragging) {
        const pos = getPointerPos(e);
        const newArea = {
          ...selectedArea,
          width: pos.x - selectedArea.x,
          height: pos.y - selectedArea.y,
        };
        setSelectedArea(newArea);
        drawSelectionRectangle(newArea);
      } else if (isDragging && selectedArea) {
        const pos = getPointerPos(e);
        const newX = pos.x - dragOffset.x;
        const newY = pos.y - dragOffset.y;
        if (selectedArea.type === "image") {
          setInsertedImages((prev) =>
            prev.map((img) =>
              img.dataURL === selectedArea.imageData.dataURL
                ? { ...img, x: newX, y: newY }
                : img
            )
          );
          redrawCanvas();
          setSelectedArea({ ...selectedArea, x: newX, y: newY });
          drawSelectionRectangle({ ...selectedArea, x: newX, y: newY });
        }
      }
      return;
    }
    if(toolMode === 'text') return; // Prevents drawing while in text mode

    if (!isDrawing) return;
    const cvs = canvasRef.current;
    const ctx = cvs.getContext("2d");
    const pos = getPointerPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setLastPos(pos);
  }

  function drawSelectionRectangle(area) {
    const cvs = canvasRef.current;
    const ctx = cvs.getContext("2d");
    redrawCanvas();
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#00ff00";
    ctx.strokeRect(area.x, area.y, area.width, area.height);
    ctx.restore();
  }

  function isPointInSelection(point) {
    if (!selectedArea) return false;
    return (
      point.x >= selectedArea.x &&
      point.x <= selectedArea.x + selectedArea.width &&
      point.y >= selectedArea.y &&
      point.y <= selectedArea.y + selectedArea.height
    );
  }

  function endDraw() {
    // Reset transform states
    setTransformStart(null);
    setIsTranslating(false);
    
    if (toolMode === "select") {
      setIsDragging(false);
      return;
    }
    if (toolMode === "text" || !isDrawing) return;

    const ctx = canvasRef.current.getContext("2d");
    ctx.closePath();
    ctx.restore();
    setIsDrawing(false);
    pushHistory();
  }

  function redrawCanvas() {
    if (historyIndex >= 0) {
      restoreFromDataURL(history[historyIndex]);
    } else {
      const cvs = canvasRef.current;
      const ctx = cvs.getContext("2d");
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      redrawInsertedImages();
    }
  }

  // New function to handle text changes and redraw the canvas
  function handleTextChange(newContent) {
    const newText = typeof newContent === 'function' ? newContent(textData.content) : newContent;

    // Restore the canvas to its state before typing started
    if (historyIndex >= 0) {
      restoreFromDataURL(history[historyIndex], () => {
        // After restoring, draw the updated text
        const cvs = canvasRef.current;
        const ctx = cvs.getContext("2d");
        ctx.save();
        ctx.font = `${textData.fontSize}px ${textData.font}`;
        ctx.fillStyle = color;
        ctx.textBaseline = 'top';
        ctx.fillText(newText, textData.x, textData.y);
        ctx.restore();
      });
    }

    setTextData({ ...textData, content: newText });
  }

  // Function to draw text on the canvas
  function drawTextOnCanvas(finalize) {
    if (!isTyping) return;

    setIsTyping(false);

    if (finalize && textData.content.trim()) {
      // Restore canvas and draw final text
      restoreFromDataURL(history[historyIndex], () => {
        const cvs = canvasRef.current;
        const ctx = cvs.getContext('2d');
        ctx.save();
        ctx.font = `${textData.fontSize}px ${textData.font}`;
        ctx.fillStyle = color;
        ctx.textBaseline = 'top';
        ctx.fillText(textData.content, textData.x, textData.y);
        ctx.restore();
        pushHistory(); // Save the final state
        setTextData({ ...textData, content: '' });
      });
    } else {
      // If not finalizing (e.g., Escape key), just restore the original state
      if (historyIndex >= 0) {
        restoreFromDataURL(history[historyIndex]);
      }
      setTextData({ ...textData, content: '' });
    }
  }
  
  // Function to cancel text input without drawing
  function cancelTextInput() {
    drawTextOnCanvas(false);
  }
  
  function pushHistory() {
    const cvs = canvasRef.current;
    const url = cvs.toDataURL("image/png");
    const newHist = history.slice(0, historyIndex + 1);
    newHist.push(url);
    if (newHist.length > 50) newHist.shift();
    setHistory(newHist);
    setHistoryIndex(newHist.length - 1);
  }

  function undo() {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    restoreFromDataURL(history[newIndex]);
    setHistoryIndex(newIndex);
    setSelectedArea(null);
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    restoreFromDataURL(history[newIndex]);
    setHistoryIndex(newIndex);
    setSelectedArea(null);
  }

  function restoreFromDataURL(dataURL, callback) {
    const img = new Image();
    img.onload = () => {
      const cvs = canvasRef.current;
      const ctx = cvs.getContext("2d");
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      ctx.drawImage(img, 0, 0);
      redrawInsertedImages();
      if (callback) callback();
    };
    img.src = dataURL;
  }

  // Clear all and reset defaults
  function clearCanvas() {
    const cvs = canvasRef.current;
    const ctx = cvs.getContext("2d");
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    // Reset states
    setInsertedImages([]);
    setSelectedArea(null);
    setIsEraser(false);
    setToolMode("draw");
    setBrushSize(8);
    setEraserSize(20); // Reset eraser size
    setColor("#ff66b2");
    setZoom(1); // reset zoom back to 100%

    // Reset history
    setHistory([]);
    setHistoryIndex(-1);
    
    // Reset text state
    setIsTyping(false);
    setTextData({ x: 0, y: 0, content: "", fontSize: 24, font: "Arial" });
    
    // Reset transform state
    setTranslate({ x: 0, y: 0 });

    pushHistory();
  }

  // Reset transform function
  function resetTransform() {
    setTranslate({ x: 0, y: 0 });
    redrawCanvas();
  }

  function downloadImage() {
    const cvs = canvasRef.current;
    const tmp = document.createElement("canvas");
    tmp.width = cvs.width;
    tmp.height = cvs.height;
    const tctx = tmp.getContext("2d");
    tctx.drawImage(cvs, 0, 0);
    const link = document.createElement("a");
    link.download = "beyond-the-brush-lite.png";
    link.href = tmp.toDataURL("image/png");
    link.click();
  }

  function handleFileInsert(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const cvs = canvasRef.current;
      const ctx = cvs.getContext("2d");
      const iw = img.width;
      const ih = img.height;
      const cw = cvs.width;
      const ch = cvs.height;
      const ratio = Math.min(cw / iw, ch / ih) * 0.8; // 80% of available space
      const w = iw * ratio;
      const h = ih * ratio;
      const x = (cw - w) / 2;
      const y = (ch - h) / 2;
      ctx.drawImage(img, x, y, w, h);
      setInsertedImages((prev) => [...prev, { dataURL: cvs.toDataURL("image/png"), x, y, width: w, height: h }]);
      pushHistory();
      URL.revokeObjectURL(url);
    };
    img.src = url;
    e.target.value = null;
  }

  function zoomIn() {
    setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)));
    setToolMode("translate");
  }

  function zoomOut() {
    setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)));
    setToolMode("translate");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-black p-4 flex flex-col">
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between mb-4">
        <h1 className="text-2xl">Beyond The Brush — Lite</h1>
      </header>

      <main className="max-w-6xl mx-auto w-full flex gap-4 flex-1 flex-col">
        <section className="flex-1 bg-black rounded-2xl shadow p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="md:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-700 text-gray-300 hover:bg-gray-600"
              >
                <i className="fas fa-bars"></i>
              </button>
            </div>

            <div className="hidden md:flex items-center gap-3 flex-wrap">
              <div className="flex gap-2">
                {["#ff00ff", "#0066ff", "#00ff00", "#fff500"].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setColor(c);
                      setIsEraser(false);
                    }}
                    className="w-8 h-8 rounded"
                    style={{ background: c }}
                  />
                ))}
              </div>

              {/* Brush/Eraser size control */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-white">Size</label>
                <input
                  type="range"
                  min={1}
                  max={200}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                />
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={brushSize}
                  onChange={(e) => {
                    let val = Number(e.target.value);
                    if (val < 1) val = 1;
                    if (val > 200) val = 200;
                    setBrushSize(val);
                  }}
                  className="w-16 px-1 py-0.5 rounded text-black text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-white">Eraser Size</label>
                <input
                  type="range"
                  min={1}
                  max={200}
                  value={eraserSize}
                  onChange={(e) => setEraserSize(Number(e.target.value))}
                />
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={eraserSize}
                  onChange={(e) => {
                    let val = Number(e.target.value);
                    if (val < 1) val = 1;
                    if (val > 200) val = 200;
                    setEraserSize(val);
                  }}
                  className="w-16 px-1 py-0.5 rounded text-black text-sm"
                />
              </div>

              {/* Font Size and Family Controls */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-white">Font Size</label>
                <input
                  type="range"
                  min="8"
                  max="72"
                  value={textData.fontSize}
                  onChange={(e) => setTextData({ ...textData, fontSize: Number(e.target.value) })}
                  className="w-24"
                />
                <input
                  type="number"
                  min="8"
                  max="72"
                  value={textData.fontSize}
                  onChange={(e) => setTextData({ ...textData, fontSize: Number(e.target.value) })}
                  className="w-12 px-1 py-0.5 rounded text-black text-sm"
                />
              </div>

              <div className="flex items-center gap-1">
                <label className="text-xs text-white">Font</label>
                <select
                  value={textData.font}
                  onChange={(e) => setTextData({ ...textData, font: e.target.value })}
                  className="w-28 px-1 py-0.5 rounded text-black text-sm"
                >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Georgia">Georgia</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-white">Mode</label>
                <div className="px-2 py-1 rounded bg-gray-50 text-sm">
                  {toolMode === "select"
                    ? "Select"
                    : toolMode === "translate"
                    ? "Translate"
                    : toolMode === 'text' 
                    ? "Text"
                    : isEraser
                    ? "Eraser"
                    : "Brush"}
                </div>
              </div>
              
              {/* Display current transform values */}
              {toolMode === "translate" && (
                <div className="text-white text-xs">
                  X: {Math.round(translate.x)} Y: {Math.round(translate.y)}
                </div>
              )}

            
            </div>

            
          </div>

          {isMenuOpen && (
            <div className="absolute top-16 left-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg z-20 flex flex-col gap-4 md:hidden">
              <button onClick={() => setIsMenuOpen(false)} className="absolute top-2 right-2 text-white">
                  <i className="fas fa-times"></i>
              </button>
              <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-2">
                {["#ff00ff", "#0066ff", "#00ff00", "#fff500"].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setColor(c);
                      setIsEraser(false);
                    }}
                    className="w-8 h-8 rounded"
                    style={{ background: c }}
                  />
                ))}
              </div>

              {/* Brush/Eraser size control */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-white">Size</label>
                <input
                  type="range"
                  min={1}
                  max={200}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                />
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={brushSize}
                  onChange={(e) => {
                    let val = Number(e.target.value);
                    if (val < 1) val = 1;
                    if (val > 200) val = 200;
                    setBrushSize(val);
                  }}
                  className="w-16 px-1 py-0.5 rounded text-black text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-white">Eraser Size</label>
                <input
                  type="range"
                  min={1}
                  max={200}
                  value={eraserSize}
                  onChange={(e) => setEraserSize(Number(e.target.value))}
                />
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={eraserSize}
                  onChange={(e) => {
                    let val = Number(e.target.value);
                    if (val < 1) val = 1;
                    if (val > 200) val = 200;
                    setEraserSize(val);
                  }}
                  className="w-16 px-1 py-0.5 rounded text-black text-sm"
                />
              </div>

              {/* Font Size and Family Controls */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-white">Font Size</label>
                <input
                  type="range"
                  min="8"
                  max="72"
                  value={textData.fontSize}
                  onChange={(e) => setTextData({ ...textData, fontSize: Number(e.target.value) })}
                  className="w-24"
                />
                <input
                  type="number"
                  min="8"
                  max="72"
                  value={textData.fontSize}
                  onChange={(e) => setTextData({ ...textData, fontSize: Number(e.target.value) })}
                  className="w-12 px-1 py-0.5 rounded text-black text-sm"
                />
              </div>

              <div className="flex items-center gap-1">
                <label className="text-xs text-white">Font</label>
                <select
                  value={textData.font}
                  onChange={(e) => setTextData({ ...textData, font: e.target.value })}
                  className="w-28 px-1 py-0.5 rounded text-black text-sm"
                >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Georgia">Georgia</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-white">Mode</label>
                <div className="px-2 py-1 rounded bg-gray-50 text-sm">
                  {toolMode === "select"
                    ? "Select"
                    : toolMode === "translate"
                    ? "Translate"
                    : toolMode === 'text' 
                    ? "Text"
                    : isEraser
                    ? "Eraser"
                    : "Brush"}
                </div>
              </div>
              
              {/* Display current transform values */}
              {toolMode === "translate" && (
                <div className="text-white text-xs">
                  X: {Math.round(translate.x)} Y: {Math.round(translate.y)}
                </div>
              )}

            
            </div>
            </div>
          )}

          <div
            ref={wrapperRef}
            className="relative flex-1 border border-dashed rounded-lg overflow-hidden flex items-center justify-center"
          >
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
                width: canvasSize.width,
                height: canvasSize.height,
              }}
            >
              <canvas
                ref={canvasRef}
                className="touch-none transition-transform duration-75 ease-out will-change-transform"
                onPointerDown={beginDraw}
                onPointerMove={draw}
                onPointerUp={endDraw}
                onPointerCancel={endDraw}
                onPointerLeave={endDraw}
                style={{ 
                  display: "block", 
                  width: canvasSize.width,
                  height: canvasSize.height,
                  // Apply transform with 3D acceleration
                  transform: `translate3d(${translate.x}px, ${translate.y}px, 0)`,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  WebkitTransform: 'translateZ(0)',
                  cursor: toolMode === 'text' ? 'text' : 'default',
                }}
              />
            </div>
          </div>

          <footer className="mt-3 text-right text-xs text-gray-500">
            Tip: Use brush size slider or type size directly. Zoom resets to 100% when you Clear All.
          </footer>
        </section>
        
        {/* Bottom Navigation Toolbar */}
        <Toolbar
          isEraser={isEraser}
          setIsEraser={setIsEraser}
          clearCanvas={clearCanvas}
          undo={undo}
          redo={redo}
          downloadImage={downloadImage}
          zoom={zoom}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          color={color}
          setColor={setColor}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          eraserSize={eraserSize}
          setEraserSize={setEraserSize}
          handleFileInsert={handleFileInsert}
          toolMode={toolMode}
          setToolMode={setToolMode}
          // Pass text state and setters to Toolbar
          textData={textData}
          setTextData={setTextData}
          drawTextOnCanvas={drawTextOnCanvas}
          cancelTextInput={cancelTextInput}
          isTyping={isTyping}
          // Pass transform state and functions to Toolbar
          translate={translate}
          setTranslate={setTranslate}
          resetTransform={resetTransform}
        />
      </main>
    </div>
  );
}