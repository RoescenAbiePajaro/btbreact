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

  useEffect(() => {
    const cvs = canvasRef.current;
    const wrap = wrapperRef.current;

    const resize = () => {
      if (!cvs || !wrap) return;
      
      const currentContent = cvs.toDataURL("image/png");
      const r = wrap.getBoundingClientRect();
      const newWidth = Math.floor(r.width * window.devicePixelRatio);
      const newHeight = Math.floor(r.height * window.devicePixelRatio);
      const originalWidth = cvs.width;
      const originalHeight = cvs.height;
      
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
          const scale = Math.min(
            newWidth / originalWidth,
            newHeight / originalHeight
          );
          
          const scaledWidth = originalWidth * scale;
          const scaledHeight = originalHeight * scale;
          const xOffset = (newWidth - scaledWidth) / 2;
          const yOffset = (newHeight - scaledHeight) / 2;
          
          ctx.drawImage(
            img, 
            xOffset / window.devicePixelRatio, 
            yOffset / window.devicePixelRatio, 
            scaledWidth / window.devicePixelRatio, 
            scaledHeight / window.devicePixelRatio
          );
        };
        img.src = currentContent;
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

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
    if (!isDrawing) return;
    const cvs = canvasRef.current;
    const ctx = cvs.getContext("2d");
    const pos = getPointerPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setLastPos(pos);
  }

  function endDraw() {
    if (!isDrawing) return;
    const cvs = canvasRef.current;
    const ctx = cvs.getContext("2d");
    ctx.closePath();
    ctx.restore();
    setIsDrawing(false);
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
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    restoreFromDataURL(history[newIndex]);
    setHistoryIndex(newIndex);
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

  function clearCanvas() {
    const cvs = canvasRef.current;
    const ctx = cvs.getContext("2d");
    ctx.clearRect(0, 0, cvs.width, cvs.height);
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
      ctx.drawImage(img, 0, 0, w, h);
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
        <h1 className="text-2xl ">Beyond The Brush — Lite</h1>
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
        />

        <section className="flex-1 bg-black rounded-2xl shadow p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs text-white">Colors</label>
                <div className="flex gap-2">
                  {["#ff66b2", "#4da6ff", "#66ff99", "#ffec66"].map((c) => (
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
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-white">Size</label>
                <input
                  type="range"
                  min={1}
                  max={60}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-white">Mode</label>
                <div className="px-2 py-1 rounded bg-gray-50 text-sm">
                  {isEraser ? "Eraser" : "Marker"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs text-white">Insert Image</label>
              <input type="file" accept="image/*" onChange={handleFileInsert} />
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
            </div>
          </div>

          <footer className="mt-3 text-right text-xs text-gray-500">
            Tip: Use brush size slider and colors. Zoom doesn't affect brush or
            eraser size.
          </footer>
        </section>
      </main>
    </div>
  );
}