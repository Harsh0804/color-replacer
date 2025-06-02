import { useState, useRef } from 'react';

const colorNameMap = {
  '255,0,0': 'Red', '0,255,0': 'Lime', '0,0,255': 'Blue',
  '255,255,0': 'Yellow', '0,255,255': 'Cyan', '255,0,255': 'Magenta',
  '0,0,0': 'Black', '255,255,255': 'White'
};

const getColorName = rgb => colorNameMap[rgb] || 'Unknown';

const parseColor = input => {
  for (const [rgb, name] of Object.entries(colorNameMap))
    if (name.toLowerCase() === input.trim().toLowerCase()) return rgb;
  const parts = input.trim().split(',').map(Number);
  if (parts.length === 3 && parts.every(n => !isNaN(n) && n >= 0 && n <= 255))
    return parts.join(',');
  return null;
};

function App() {
  const [src, setSrc] = useState(null), [colors, setColors] = useState([]),
        [selColor, setSelColor] = useState(''), [selColorName, setSelColorName] = useState(''),
        [newColor, setNewColor] = useState(''), [resultUrl, setResultUrl] = useState(null);
  const imgRef = useRef(null), canvasRef = useRef(null);

  const handleUpload = e => {
    const file = e.target.files[0];
    if (file) {
      const r = new FileReader();
      r.onload = () => { setSrc(r.result); setColors([]); setResultUrl(null); };
      r.readAsDataURL(file);
    }
  };

  const extractColors = () => {
    const img = imgRef.current, c = canvasRef.current;
    if (!img || !c) return;
    const ctx = c.getContext('2d');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    const count = {};
    for (let i=0;i<data.length;i+=4){
      const k = `${data[i]},${data[i+1]},${data[i+2]}`;
      count[k] = (count[k]||0)+1;
    }
    setColors(Object.entries(count).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k])=>k));
  };

  const selectColor = c => {
    setSelColor(c);
    setSelColorName(getColorName(c));
  };

  const handleReplace = () => {
    if (!selColor || !newColor) return;
    const parsed = parseColor(newColor);
    if (!parsed) { alert('Invalid color'); return; }
    const [r2,g2,b2] = parsed.split(',').map(Number);
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.drawImage(imgRef.current,0,0);
    const imageData = ctx.getImageData(0,0,canvasRef.current.width,canvasRef.current.height);
    const data = imageData.data;
    const [r1,g1,b1] = selColor.split(',').map(Number);
    const thr=30;
    for(let i=0;i<data.length;i+=4){
      const dr=data[i]-r1, dg=data[i+1]-g1, db=data[i+2]-b1;
      if(Math.sqrt(dr*dr+dg*dg+db*db)<thr){
        data[i]=r2; data[i+1]=g2; data[i+2]=b2;
      }
    }
    ctx.putImageData(new ImageData(data, ctx.canvas.width, ctx.canvas.height),0,0);
    setResultUrl(canvasRef.current.toDataURL());
  };

  return (
    <div style={{padding:20}}>
      <h1>Image Color Tool</h1>
      <input type="file" accept="image/*" onChange={handleUpload}/>
      {src && (
        <img ref={imgRef} src={src} crossOrigin="anonymous" onLoad={extractColors}
             style={{maxWidth:'100%',marginTop:10}}/>
      )}
      <canvas ref={canvasRef} style={{display:'none'}}/>
      {colors.length>0 && (
        <div style={{marginTop:20}}>
          <h2>Colors (click)</h2>
          <div style={{display:'flex',gap:10}}>
            {colors.map((c,i)=>(<div key={i}
              style={{
                width:50,height:50,backgroundColor:`rgb(${c})`,
                border: selColor===c?'3px solid black':'1px solid #ccc',
                cursor:'pointer'
              }}
              title={`rgb(${c})`} onClick={()=>selectColor(c)}
            />))}
          </div>
        </div>
      )}
      {selColor && (
        <div style={{marginTop:20}}>
          <div><strong>Selected: </strong>rgb({selColor}) - {selColorName}</div>
          <div style={{display:'flex',alignItems:'center',marginTop:10,gap:10}}>
            <div style={{width:30,height:30,backgroundColor:`rgb(${selColor})`,border:'1px solid #000'}}/>
            <input placeholder="Color name or r,g,b" value={newColor} onChange={e=>setNewColor(e.target.value)}/>
            <button onClick={handleReplace}>Replace</button>
          </div>
        </div>
      )}
      {resultUrl && (
        <div style={{marginTop:20}}>
          <h2>Modified Image</h2>
          <img src={resultUrl} alt="Modified" style={{maxWidth:'100%'}}/>
        </div>
      )}
    </div>
  );
}

export default App;