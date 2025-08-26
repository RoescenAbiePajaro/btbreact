// CanvasApp.jsx
import React, { useRef, useState, useEffect } from "react";
import Toolbar from "./Toolbar";

export default function CanvasApp({ userData }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ff66b2");
  const [brushSize, setBrushSize] = useState(8);
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoom, setZoom] = useState(1);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [toolMode, setToolMode] = useState("draw");
  const [selectedArea, setSelectedArea] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // New state for handling text
  const [isTyping, setIsTyping] = useState(false);
  const [textData, setTextData] = useState({ x: 0, y: 0, content: "", fontSize: 24, font: "Arial" });
  const textInputRef = useRef(null);
  
  // New state for text boxes
  const [textBoxes, setTextBoxes] = useState([]);
  const [editingTextBoxId, setEditingTextBoxId] = useState(null);
  const [placeholderText, setPlaceholderText] = useState("Type something...");
  
  // New state for translate
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [transformStart, setTransformStart] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  
  useEffect(() => {
    const cvs = canvasRef.current;
    const wrap = wrapperRef.current;

    const resize = () => {
      if (!cvs || !wrap) return;
      const currentContent = cvs.toDataURL("image/png");
      const r = wrap.getBoundingClientRect();
      const newWidth = Math.floor(r.width * window.devicePixelRatio);
      const newHeight = Math.floor(r.height * window.devicePixelRatio);

      cvs.width = newWidth;
      cvs.height = newHeight;
      cvs.style.width = `${r.width}px`;
      cvs.style.height = `${r.height}px`;
     

      const ctx = cvs.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      
      // Set white background for drawing area
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, r.width, r.height);

      if (currentContent) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, r.width, r.height);
          // Redraw all text boxes
          redrawTextBoxes();
        };
        img.src = currentContent;
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Redraw all text boxes on the canvas
  const redrawTextBoxes = () => {
    const cvs = canvasRef.current;
    const ctx = cvs.getContext("2d");
    
    textBoxes.forEach(box => {
      if (box.content) {
        ctx.save();
        ctx.font = `${box.fontSize}px ${box.font}`;
        ctx.fillStyle = box.color || color;
        ctx.fillText(box.content, box.x, box.y);
        ctx.restore();
      }
    });
  };

  function getPointerPos(e) {
    const cvs = canvasRef.current;
    const rect = cvs.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);
    const x =
      ((clientX - rect.left) / rect.width) *
      (cvs.width / window.devicePixelRatio);
    const y =
      ((clientY - rect.top) / rect.height) *
      (cvs.height / window.devicePixelRatio);
    return { x, y };
  }

  function beginDraw(e) {
    if (toolMode === "text") {
      const pos = getPointerPos(e);
      // Create a new text box
      const newTextBox = {
        id: Date.now(),
        x: pos.x,
        y: pos.y,
        content: "",
        fontSize: textData.fontSize,
        font: textData.font,
        color: color
      };
      setTextBoxes([...textBoxes, newTextBox]);
      setEditingTextBoxId(newTextBox.id);
      setIsTyping(true);
      setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
        }
      }, 0);
      return;
    }

    if (toolMode === "translate") {
      const pos = getPointerPos(e);
      setTransformStart({ x: pos.x, y: pos.y, translate: { ...translate } });
      setIsTranslating(true);
      return;
    }

    if (toolMode === "select") {
      const pos = getPointerPos(e);
      setSelectedArea({ x: pos.x, y: pos.y, width: 0, height: 0, type: "area" });
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
    ctx.lineWidth = brushSize;
    
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
        setSelectedArea({ ...selectedArea, x: newX, y: newY });
        drawSelectionRectangle({ ...selectedArea, x: newX, y: newY });
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
      // Redraw text boxes after restoring
      setTimeout(redrawTextBoxes, 50);
    } else {
      const cvs = canvasRef.current;
      const ctx = cvs.getContext("2d");
      ctx.clearRect(0, 0, cvs.width, cvs.height);
    }
  }

  // Function to handle text box double click for editing
  function handleTextBoxDoubleClick(id) {
    setEditingTextBoxId(id);
    setIsTyping(true);
    
    // Find the text box to edit
    const textBox = textBoxes.find(box => box.id === id);
    if (textBox) {
      setTextData({
        x: textBox.x,
        y: textBox.y,
        content: textBox.content,
        fontSize: textBox.fontSize,
        font: textBox.font
      });
    }
    
    setTimeout(() => {
      if (textInputRef.current) {
        textInputRef.current.focus();
        textInputRef.current.select();
      }
    }, 0);
  }

  // Function to update text box content
  function updateTextBoxContent(id, content) {
    const updatedBoxes = textBoxes.map(box => 
      box.id === id ? { ...box, content } : box
    );
    setTextBoxes(updatedBoxes);
    
    // Update history with the new state
    pushHistory();
  }

  // Function to draw text on the canvas
  function drawTextOnCanvas() {
    if (editingTextBoxId) {
      // Only update the text box if we're editing an existing one
      const updatedBoxes = textBoxes.map(box => 
        box.id === editingTextBoxId 
          ? { ...box, content: textData.content, color: color }
          : box
      );
      setTextBoxes(updatedBoxes);
    } else if (textData.content) {
      // Only add a new text box if there's content
      const newTextBox = {
        id: Date.now(),
        x: textData.x,
        y: textData.y,
        content: textData.content,
        fontSize: textData.fontSize,
        font: textData.font,
        color: color
      };
      setTextBoxes([...textBoxes, newTextBox]);
    }
    
    setIsTyping(false);
    setEditingTextBoxId(null);
    setTextData({ ...textData, content: "" });
    
    // Update history after text changes
    pushHistory();
  }
  
  function pushHistory() {
    const cvs = canvasRef.current;
    const url = cvs.toDataURL("image/png");
    const newHist = history.slice(0, historyIndex + 1);
    
    // Include text boxes in the history state
    const state = {
      imageUrl: url,
      textBoxes: [...textBoxes]
    };
    
    newHist.push(JSON.stringify(state));
    if (newHist.length > 50) newHist.shift();
    setHistory(newHist);
    setHistoryIndex(newHist.length - 1);
  }

  function undo() {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    restoreFromHistory(history[newIndex]);
    setHistoryIndex(newIndex);
    setSelectedArea(null);
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    restoreFromHistory(history[newIndex]);
    setHistoryIndex(newIndex);
    setSelectedArea(null);
  }

  function restoreFromHistory(stateString) {
    try {
      const state = JSON.parse(stateString);
      const img = new Image();
      img.onload = () => {
        const cvs = canvasRef.current;
        const ctx = cvs.getContext("2d");
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
      };
      img.src = state.imageUrl;
      
      // Restore text boxes state
      if (state.textBoxes) {
        setTextBoxes(state.textBoxes);
      }
    } catch (e) {
      console.error("Error restoring from history:", e);
    }
  }

  function restoreFromDataURL(dataURL) {
    const img = new Image();
    img.onload = () => {
      const cvs = canvasRef.current;
      const ctx = cvs.getContext("2d");
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      const rect = cvs.getBoundingClientRect();
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
    };
    img.src = dataURL;
  }

  // Clear all and reset defaults
  function clearCanvas() {
    const cvs = canvasRef.current;
    const ctx = cvs.getContext("2d");
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    // Reset states
    setIsEraser(false);
    setToolMode("draw");
    setBrushSize(8);
    setColor("#ff66b2");
    setZoom(1); // reset zoom back to 100%

    // Reset history
    setHistory([]);
    setHistoryIndex(-1);
    
    // Reset text state
    setIsTyping(false);
    setTextData({ x: 0, y: 0, content: "", fontSize: 24, font: "Arial" });
    setTextBoxes([]);
    setEditingTextBoxId(null);
    
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
    const rect = cvs.getBoundingClientRect();
    const tmp = document.createElement("canvas");
    tmp.width = rect.width;
    tmp.height = rect.height;
    const tctx = tmp.getContext("2d");
    tctx.drawImage(cvs, 0, 0, rect.width, rect.height);
    const link = document.createElement("a");
    link.download = "beyond-the-brush-lite.png";
    link.href = tmp.toDataURL("image/png");
    link.click();
  }

  function zoomIn() {
    setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)));
  }

  function zoomOut() {
    setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)));
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-black p-4 flex flex-col">
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between mb-4">
        <h1 className="text-2xl">Beyond The Brush — Lite</h1>
      </header>

      <main className="max-w-6xl mx-auto w-full flex gap-4 flex-1 flex-col sm:flex-row">
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
          toolMode={toolMode}
          setToolMode={setToolMode}
          // Pass text state and setters to Toolbar
          textData={textData}
          setTextData={setTextData}
          drawTextOnCanvas={drawTextOnCanvas}
          // Pass transform state and functions to Toolbar
          translate={translate}
          setTranslate={setTranslate}
          resetTransform={resetTransform}
          // Pass placeholder text state
          placeholderText={placeholderText}
          setPlaceholderText={setPlaceholderText}
        />

        <section className="flex-1 bg-black rounded-2xl shadow p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
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
                <label className="text-xs text-white">Mode</label>
                <div className="px-2 py-1 rounded bg-gray-50 text-sm">
                  {toolMode === "select"
                    ? "Select"
                    : toolMode === "translate"
                    ? "Translate"
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

          <div
            ref={wrapperRef}
            className="relative flex-1 border border-dashed rounded-lg overflow-hidden w-full h-[50vh] sm:h-[70vh]"
          >
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
                width: "100%",
                height: "100%",
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
                  width: "100%", 
                  height: "100%",
                  // Apply transform with 3D acceleration
                  transform: `translate3d(${translate.x}px, ${translate.y}px, 0)`,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  WebkitTransform: 'translateZ(0)',
                }}
              />

            {/* Render the text input when isTyping is true */}
            {isTyping && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: `${(textData.x / (canvasRef.current?.width / window.devicePixelRatio || 1)) * 100}%`,
                    top: `${(textData.y / (canvasRef.current?.height / window.devicePixelRatio || 1)) * 100}%`,
                    transform: `scale(${1 / zoom})`,
                    transformOrigin: "top left",
                    pointerEvents: "auto",
                  }}
                >
                  <input
                    ref={textInputRef}
                    type="text"
                    autoFocus
                    value={textData.content}
                    placeholder={placeholderText}
                    onChange={(e) => setTextData({ ...textData, content: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        drawTextOnCanvas();
                      }
                    }}
                    onBlur={drawTextOnCanvas}
                    style={{
                      color: color,
                      fontSize: `${textData.fontSize}px`,
                      fontFamily: textData.font,
                      background: "rgba(0, 0, 0, 0.2)",
                      border: "1px dashed rgba(255, 255, 255, 0.7)",
                      outline: "none",
                      padding: "2px 5px",
                      lineHeight: 1,
                      minWidth: "100px",
                      borderRadius: "2px",
                      boxShadow: "0 0 5px rgba(0, 0, 0, 0.3)",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Render text boxes on canvas */}
            {textBoxes.map(box => (
              <div
                key={box.id}
                onDoubleClick={() => handleTextBoxDoubleClick(box.id)}
                style={{
                  position: "absolute",
                  left: `${(box.x / (canvasRef.current.width / window.devicePixelRatio)) * 100}%`,
                  top: `${(box.y / (canvasRef.current.height / window.devicePixelRatio)) * 100}%`,
                  transform: `scale(${1 / zoom})`,
                  transformOrigin: "top left",
                  color: box.color || color,
                  fontSize: `${box.fontSize * (1 / zoom)}px`,
                  fontFamily: box.font,
                  cursor: "text",
                  userSelect: "none",
                  whiteSpace: "pre",
                  zIndex: 5,
                }}
              >
                {box.content || (editingTextBoxId !== box.id && placeholderText)}
              </div>
            ))}
            </div>
          </div>

          <footer className="mt-3 text-right text-xs text-gray-500">
            Tip: Use brush size slider or type size directly. Zoom resets to 100% when you Clear All.
          </footer>
        </section>
      </main>
    </div>
  );
}