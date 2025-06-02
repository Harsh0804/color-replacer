import { useState, useRef } from 'react';

function App() {
  const [imageSrc, setImageSrc] = useState(null);
  const [colors, setColors] = useState([]); // Extracted colors
  const [originalColor, setOriginalColor] = useState('');
  const [newColor, setNewColor] = useState('');
  const [modifiedImageUrl, setModifiedImageUrl] = useState(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result);
        setColors([]);
        setModifiedImageUrl(null); // reset modified image
      };
      reader.readAsDataURL(file);
    }
  };

  // Extract dominant colors from image
  const extractColors = () => {
    if (!imageRef.current || !canvasRef.current) return;

    const img = imageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size to image size
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Draw image onto canvas
    ctx.drawImage(img, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const colorMap = {};

    // Loop through pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const key = `${r},${g},${b}`;
      colorMap[key] = (colorMap[key] || 0) + 1;
    }

    // Sort colors by frequency
    const sortedColors = Object.entries(colorMap).sort((a, b) => b[1] - a[1]);
    const topColors = sortedColors.slice(0, 10).map(([key]) => key);
    setColors(topColors);
  };

  // Handle color replacement
  const handleReplaceColor = () => {
    if (!imageRef.current || !canvasRef.current || !originalColor || !newColor) return;

    const [r1, g1, b1] = originalColor.split(',').map(Number);
    const [r2, g2, b2] = newColor.split(',').map(Number);

    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.drawImage(imageRef.current, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (r === r1 && g === g1 && b === b1) {
        data[i] = r2;
        data[i + 1] = g2;
        data[i + 2] = b2;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Save the modified image as a data URL
    const dataUrl = canvasRef.current.toDataURL();
    setModifiedImageUrl(dataUrl);
  };

  return (
    <div className="container">
      <h1>Image Color Extractor & Replacer</h1>
      
      <div className="upload-section">
        <input type="file" accept="image/*" onChange={handleImageUpload} />
      </div>

      {imageSrc && (
        <div className="image-preview">
          {/* Original image for extraction */}
          <img
            src={imageSrc}
            alt="Uploaded"
            ref={imageRef}
            crossOrigin="anonymous"
            style={{ maxWidth: '100%', height: 'auto' }}
            onLoad={extractColors}
          />
        </div>
      )}

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {colors.length > 0 && (
        <div className="colors-section">
          <h2>Extracted Colors</h2>
          <div className="colors-list">
            {colors.map((color, index) => (
              <div
                key={index}
                className="color-swatch"
                style={{ backgroundColor: `rgb(${color})` }}
                onClick={() => setOriginalColor(color)}
              >
                {`rgb(${color})`}
              </div>
            ))}
          </div>
        </div>
      )}

      {originalColor && (
        <div className="replacement-section">
          <h3>Replace Color</h3>
          <p>
            Selected Color: <strong>rgb({originalColor})</strong>
          </p>
          <input
            type="text"
            placeholder="New color e.g., 255,0,0"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
          />
          <button onClick={handleReplaceColor}>Replace Color</button>
        </div>
      )}

      {/* Show the modified image if available */}
      {modifiedImageUrl && (
        <div className="modified-image">
          <h3>Modified Image Preview</h3>
          <img src={modifiedImageUrl} alt="Modified" style={{ maxWidth: '100%', height: 'auto' }} />
        </div>
      )}
    </div>
  );
}

export default App;