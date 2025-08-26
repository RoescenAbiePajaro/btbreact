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
  const [insertedImages, setInsertedImages] = useState([]);

  // 🆕 New state for handling text
  const [isTyping, setIsTyping] = useState(false);
  const [textData, setTextData] = useState({ x: 0, y: 0, content: "", fontSize: 24, font: "Arial" });
  const textInputRef = useRef(null);
  
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

      if (currentContent) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, r.width, r.height);
          redrawInsertedImages();
        };
        img.src = currentContent;
      } else {
        redrawInsertedImages();
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

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
      setTextData({ ...textData, x: pos.x, y: pos.y, content: "" });
      setIsTyping(true);
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
    ctx.lineWidth = brushSize;
    ctx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
    ctx.strokeStyle = isEraser ? "rgba(0,0,0,1)" : color;
  }

  function draw(e) {
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
    if(toolMode === 'text') return; // 🆕 Prevents drawing while in text mode

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

  // 🆕 Function to draw text on the canvas
  function drawTextOnCanvas() {
    const cvs = canvasRef.current;
    const ctx = cvs.getContext("2d");
    if (!textData.content) return;
    
    ctx.save();
    ctx.font = `${textData.fontSize}px ${textData.font}`;
    ctx.fillStyle = color;
    ctx.fillText(textData.content, textData.x, textData.y);
    ctx.restore();
    
    setIsTyping(false);
    setTextData({ ...textData, content: "" });
    pushHistory();
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

  function restoreFromDataURL(dataURL) {
    const img = new Image();
    img.onload = () => {
      const cvs = canvasRef.current;
      const ctx = cvs.getContext("2d");
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      const rect = cvs.getBoundingClientRect();
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
      redrawInsertedImages();
    };
    img.src = dataURL;
  }

  // ✅ Clear all and reset defaults
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
    setColor("#ff66b2");
    setZoom(1); // reset zoom back to 100%

    // Reset history
    setHistory([]);
    setHistoryIndex(-1);
    
    // 🆕 Reset text state
    setIsTyping(false);
    setTextData({ x: 0, y: 0, content: "", fontSize: 24, font: "Arial" });

    pushHistory();
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

  function handleFileInsert(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const cvs = canvasRef.current;
      const ctx = cvs.getContext("2d");
      const rect = cvs.getBoundingClientRect();
      const iw = img.width;
      const ih = img.height;
      const cw = rect.width / window.devicePixelRatio;
      const ch = rect.height / window.devicePixelRatio;
      const ratio = Math.min(cw / iw, ch / ih);
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
          handleFileInsert={handleFileInsert}
          toolMode={toolMode}
          setToolMode={setToolMode}
        // 🆕 Pass text state and setters to Toolbar
        textData={textData}
        setTextData={setTextData}
        drawTextOnCanvas={drawTextOnCanvas}
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
                    : isEraser
                    ? "Eraser"
                    : "Brush"}
                </div>
              </div>
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
                className="touch-none"
                onPointerDown={beginDraw}
                onPointerMove={draw}
                onPointerUp={endDraw}
                onPointerCancel={endDraw}
                onPointerLeave={endDraw}
                style={{ display: "block", width: "100%", height: "100%" }}
              />

            {/* 🆕 Render the text input when isTyping is true */}
            {isTyping && (
              <input
                ref={textInputRef}
                type="text"
                autoFocus
                value={textData.content}
                onChange={(e) => setTextData({ ...textData, content: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    drawTextOnCanvas();
                  }
                }}
                onBlur={drawTextOnCanvas}
                style={{
                  position: "absolute",
                  left: `${(textData.x / (canvasRef.current.width / window.devicePixelRatio)) * 100}%`,
                  top: `${(textData.y / (canvasRef.current.height / window.devicePixelRatio)) * 100}%`,
                  transform: `scale(${1 / zoom})`,
                  transformOrigin: "top left",
                  color: color,
                  fontSize: textData.fontSize * (1 / zoom) ,
                  background: "transparent",
                  border: "1px dashed white",
                  outline: "none",
                  padding: "2px",
                  lineHeight: 1,
                }}
              />
            )}
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