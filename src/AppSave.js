// https://css-tricks.com/manipulating-pixels-using-canvas/

import Tesseract, { createWorker } from 'tesseract.js';
import { useRef, useEffect, useState } from 'react';

import './App.css';

function App() {
  const canvasEl = useRef(null);
  const videoEl = useRef(null);
  const imgEl = useRef(null);

  const worker = createWorker({
    logger: (m) => {
      setOcr(`Status: ${m.status}, Progress: ${Math.floor(m.progress * 100)}%`);
      console.log(m);
    },
  });
  Tesseract.setLogging(true);
  const [ocr, setOcr] = useState('Push go to start recognition');

  const constraints = {
    video: {
      facingMode: { exact: 'environment' },
      audio: false,
      frameRate: { max: 60 },
      width: { min: 720 },
      height: { min: 1280 },
    },
  };

  useEffect(() => {
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      if (videoEl.current === null) return;
      videoEl.current.srcObject = stream;
      draw();
    });
  }, [videoEl]);

  function draw() {
    drawCanvas();
    requestAnimationFrame(draw);
  }

  useEffect(() => {
    window.addEventListener('resize', () => {
      /* Resize the canvas to fit the window */
      setCanvasToFit();
    });
    setCanvasToFit();
  }, [canvasEl]);

  /**
   * Set the canvas size
   * @param width - The logical canvas size in pixel
   * @param height - The logical canvas size in pixel
   * @param dpr - The device pixel ratio
   */
  function setCanvasSize(width, height, dpr) {
    if (canvasEl.current === null) return;
    canvasEl.current.width = Math.floor(width * dpr);
    canvasEl.current.height = Math.floor(height * dpr);
    canvasEl.current.style.width = `${width}px`;
    canvasEl.current.style.height = `${height}px`;
  }

  /**
   * Maximize the canvas size to the whole window
   */
  function setCanvasToFit() {
    setCanvasSize(
      Math.floor((window.innerWidth * 80) / 100),
      Math.floor((window.innerHeight * 70) / 100),
      window.devicePixelRatio || 1
    );
  }

  function drawCanvas() {
    if (canvasEl.current === null) return;
    const ctx = canvasEl.current.getContext('2d');

    ctx.drawImage(videoEl.current, 0, 0);
    const imageData = ctx.getImageData(
      0,
      0,
      canvasEl.current.width,
      canvasEl.current.height
    );
    // DRAW A RECTANGLE INTO THE CANVAS
    ctx.beginPath();
    ctx.lineWidth = '8';
    ctx.strokeStyle = 'green';
    const rectHeight = Math.floor((70 / 100) * canvasEl.current.height);
    const rectY = Math.floor((canvasEl.current.height - rectHeight) / 2);
    const rectWidth = Math.floor((71 / 100) * rectHeight);
    const rectX = Math.floor((canvasEl.current.width - rectWidth) / 2);
    ctx.rect(rectX, rectY, rectWidth, rectHeight);
    ctx.stroke();
  }

  async function startOCR() {
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const image = canvasEl.current.toDataURL('image/png');
    const data = await worker.recognize(image);
    console.log(data);

    setOcr(data.text);
    await worker.terminate();
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <p>{ocr}</p>
      <video id="video" ref={videoEl} className="hidden" autoPlay></video>
      {/* <img ref={imgEl} className="hidden" /> */}
      <canvas id="canvas" className="" ref={canvasEl}></canvas>
      <button
        onClick={startOCR}
        className="bg-blue-600 mt-2 text-white rounded py-2 px-4"
      >
        Go
      </button>
    </div>
  );
}

export default App;
