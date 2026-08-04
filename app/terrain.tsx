"use client";

import { useEffect, useRef, useState } from "react";

type V3 = [number, number, number];

function perspective(fov: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fov / 2), nf = 1 / (near - far);
  return new Float32Array([f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0]);
}
function lookAt(eye: V3, target: V3, up: V3) {
  let zx=eye[0]-target[0], zy=eye[1]-target[1], zz=eye[2]-target[2];
  let l=Math.hypot(zx,zy,zz); zx/=l; zy/=l; zz/=l;
  let xx=up[1]*zz-up[2]*zy, xy=up[2]*zx-up[0]*zz, xz=up[0]*zy-up[1]*zx;
  l=Math.hypot(xx,xy,xz); xx/=l; xy/=l; xz/=l;
  const yx=zy*xz-zz*xy, yy=zz*xx-zx*xz, yz=zx*xy-zy*xx;
  return new Float32Array([xx,yx,zx,0, xy,yy,zy,0, xz,yz,zz,0,
    -(xx*eye[0]+xy*eye[1]+xz*eye[2]), -(yx*eye[0]+yy*eye[1]+yz*eye[2]), -(zx*eye[0]+zy*eye[1]+zz*eye[2]), 1]);
}
function multiply(a: Float32Array, b: Float32Array) {
  const o=new Float32Array(16);
  for(let c=0;c<4;c++) for(let r=0;r<4;r++) o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
  return o;
}
function shader(gl: WebGL2RenderingContext, type: number, source: string) {
  const s=gl.createShader(type)!; gl.shaderSource(s,source); gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)||"Shader error"); return s;
}
function loadImage(src: string) { return new Promise<HTMLImageElement>((resolve,reject)=>{const i=new Image();i.crossOrigin="anonymous";i.onload=()=>resolve(i);i.onerror=()=>reject(new Error(`Raster yuklanmadi: ${src}`));i.src=src;}); }

export function ChorvoqTerrain() {
  const fallbackDates=Array.from({length:79},(_,index)=>{const absolute=2020*12+index;return {year:Math.floor(absolute/12),month:absolute%12+1,s2:1,lulc:1};});
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const textureLoader=useRef<(url:string)=>void>(()=>{});
  const [layer,setLayer]=useState("truecolor");
  const [year,setYear]=useState(2025);
  const [month,setMonth]=useState(8);
  const [available,setAvailable]=useState<Array<{year:number;month:number;s2:number;lulc:number}>>(fallbackDates);
  const [ready,setReady]=useState(false);
  const months=["","January","February","March","April","May","June","July","August","September","October","November","December"];
  const valid=available.filter(item=>(layer==="lulc"?item.lulc:item.s2)>0&&!(layer==="lulc"&&item.year===2024));
  const years=[...new Set(valid.map(item=>item.year))];
  const validMonths=valid.filter(item=>item.year===year);
  const timeIndex=Math.max(0,validMonths.findIndex(item=>item.month===month));

  useEffect(()=>{fetch("http://127.0.0.1:3457/availability").then(r=>r.json()).then(setAvailable).catch(()=>{});},[]);
  useEffect(()=>{if(ready)textureLoader.current(`http://127.0.0.1:3457/tile.png?layer=${layer}&year=${year}&month=${month}`);},[ready,layer,year,month]);
  useEffect(()=>{if(layer!=="lulc"&&!validMonths.some(item=>item.month===month)&&validMonths.length)setMonth(validMonths[validMonths.length-1].month);},[layer,year,available]);

  useEffect(()=>{
    const canvas=canvasRef.current!; const gl=canvas.getContext("webgl2",{antialias:true,alpha:false})!;
    if(!gl) return;
    let stopped=false, frame=0, yaw=-0.62, pitch=0.72, radius=2.25, dragging=false, px=0,py=0;
    const vs=`#version 300 es
      precision highp float; layout(location=0) in vec2 aUv; uniform sampler2D uHeight;
      uniform mat4 uMvp; uniform float uScale; out vec2 vUv; out float vH;
      void main(){ float h=texture(uHeight,aUv).r; vUv=aUv; vH=h;
        vec3 p=vec3((aUv.x-.5)*1.35,(h-.18)*uScale*.22,(aUv.y-.5)*-1.0); gl_Position=uMvp*vec4(p,1.0); }`;
    const fs=`#version 300 es
      precision highp float; in vec2 vUv; in float vH; uniform sampler2D uColor; out vec4 outColor;
      void main(){ vec4 c=texture(uColor,vUv); if(c.a<.08) discard;
        float light=.78+vH*.30; outColor=vec4(c.rgb*light,1.0); }`;
    const program=gl.createProgram()!; gl.attachShader(program,shader(gl,gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl,gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);
    const n=257, uv=new Float32Array(n*n*2); let k=0;
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){uv[k++]=x/(n-1);uv[k++]=y/(n-1);}
    const indices=new Uint32Array((n-1)*(n-1)*6);k=0;
    for(let y=0;y<n-1;y++)for(let x=0;x<n-1;x++){const a=y*n+x,b=a+1,c=a+n,d=c+1;indices[k++]=a;indices[k++]=c;indices[k++]=b;indices[k++]=b;indices[k++]=c;indices[k++]=d;}
    const vao=gl.createVertexArray();gl.bindVertexArray(vao);const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,uv,gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
    const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
    const skirtVs=`#version 300 es
      precision highp float; layout(location=0) in vec2 aUv; layout(location=1) in float aBottom;
      uniform sampler2D uHeight; uniform mat4 uMvp; uniform float uScale; out float vDepth; out vec2 vUv;
      void main(){float top=(texture(uHeight,aUv).r-.18)*uScale*.22;float y=mix(top,-.085,aBottom);vDepth=aBottom;vUv=aUv;gl_Position=uMvp*vec4((aUv.x-.5)*1.35,y,(aUv.y-.5)*-1.0,1.0);}`;
    const skirtFs=`#version 300 es
      precision highp float; in float vDepth; in vec2 vUv; out vec4 outColor;
      void main(){float bands=.035*sin((vUv.x+vUv.y)*150.0)+.025*sin(vUv.x*310.0);vec3 soil=mix(vec3(.29,.17,.09),vec3(.48,.30,.16),.35+bands+vDepth*.25);outColor=vec4(soil,1.0);}`;
    const skirtProgram=gl.createProgram()!;gl.attachShader(skirtProgram,shader(gl,gl.VERTEX_SHADER,skirtVs));gl.attachShader(skirtProgram,shader(gl,gl.FRAGMENT_SHADER,skirtFs));gl.linkProgram(skirtProgram);
    const edge:Array<[number,number]>=[];for(let x=0;x<n;x++)edge.push([x/(n-1),0]);for(let y=1;y<n;y++)edge.push([1,y/(n-1)]);for(let x=n-2;x>=0;x--)edge.push([x/(n-1),1]);for(let y=n-2;y>0;y--)edge.push([0,y/(n-1)]);
    const skirtData:number[]=[];for(const [u,v] of edge)skirtData.push(u,v,0,u,v,1);const bottomStart=skirtData.length/3;skirtData.push(0,0,1,1,0,1,1,1,1,0,1,1);
    const skirtIndices:number[]=[];for(let i=0;i<edge.length;i++){const j=(i+1)%edge.length,a=i*2,b=a+1,c=j*2,d=c+1;skirtIndices.push(a,b,c,c,b,d)}skirtIndices.push(bottomStart,bottomStart+1,bottomStart+2,bottomStart,bottomStart+2,bottomStart+3);
    const skirtVao=gl.createVertexArray();gl.bindVertexArray(skirtVao);const skirtBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,skirtBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(skirtData),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,12,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,1,gl.FLOAT,false,12,8);const skirtIb=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,skirtIb);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint32Array(skirtIndices),gl.STATIC_DRAW);
    const makeTexture=(image:HTMLImageElement,unit:number)=>{const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);return t;};
    Promise.all([loadImage("/chorvoq/height.png"),loadImage("/chorvoq/sentinel-2025-08.png")]).then(([h,c])=>{
      if(stopped)return;makeTexture(h,0);const colorTexture=makeTexture(c,1);
      textureLoader.current=(url)=>{loadImage(url).then(image=>{if(stopped)return;gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,colorTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.generateMipmap(gl.TEXTURE_2D);}).catch(error=>console.warn(error.message));};
      setReady(true);
      gl.useProgram(program);gl.uniform1i(gl.getUniformLocation(program,"uHeight"),0);gl.uniform1i(gl.getUniformLocation(program,"uColor"),1);
      const render=()=>{if(stopped)return;const dpr=Math.min(devicePixelRatio,2),w=Math.round(canvas.clientWidth*dpr),hh=Math.round(canvas.clientHeight*dpr);if(canvas.width!==w||canvas.height!==hh){canvas.width=w;canvas.height=hh;gl.viewport(0,0,w,hh);}
        gl.clearColor(.008,.014,.015,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);
        const eye:[number,number,number]=[Math.cos(yaw)*Math.cos(pitch)*radius,Math.sin(pitch)*radius,Math.sin(yaw)*Math.cos(pitch)*radius];
        const mvp=multiply(perspective(.72,w/hh,.02,20),lookAt(eye,[0,.12,0],[0,1,0]));gl.useProgram(program);gl.uniformMatrix4fv(gl.getUniformLocation(program,"uMvp"),false,mvp);gl.uniform1f(gl.getUniformLocation(program,"uScale"),0.8);gl.bindVertexArray(vao);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_INT,0);
        gl.useProgram(skirtProgram);gl.uniform1i(gl.getUniformLocation(skirtProgram,"uHeight"),0);gl.uniformMatrix4fv(gl.getUniformLocation(skirtProgram,"uMvp"),false,mvp);gl.uniform1f(gl.getUniformLocation(skirtProgram,"uScale"),0.8);gl.bindVertexArray(skirtVao);gl.drawElements(gl.TRIANGLES,skirtIndices.length,gl.UNSIGNED_INT,0);frame=requestAnimationFrame(render);};render();
    });
    const down=(e:PointerEvent)=>{dragging=true;px=e.clientX;py=e.clientY;canvas.setPointerCapture(e.pointerId)};
    const move=(e:PointerEvent)=>{if(!dragging)return;yaw-=(e.clientX-px)*.006;pitch=Math.max(.18,Math.min(1.35,pitch+(e.clientY-py)*.005));px=e.clientX;py=e.clientY};
    const up=()=>{dragging=false}; const wheel=(e:WheelEvent)=>{e.preventDefault();radius=Math.max(1.15,Math.min(4,radius*Math.exp(e.deltaY*.001)))};
    canvas.addEventListener("pointerdown",down);canvas.addEventListener("pointermove",move);canvas.addEventListener("pointerup",up);canvas.addEventListener("wheel",wheel,{passive:false});
    return()=>{stopped=true;cancelAnimationFrame(frame);canvas.removeEventListener("pointerdown",down);canvas.removeEventListener("pointermove",move);canvas.removeEventListener("pointerup",up);canvas.removeEventListener("wheel",wheel)};
  },[]);

  return <main className="terrain-shell">
    <canvas ref={canvasRef} aria-label="Interactive three-dimensional map of the Chorvoq Reservoir" />
    <header className="topbar"><div><span className="eyebrow">INTERACTIVE 3D TERRAIN</span><h1>CHORVOQ</h1></div><div className="live"><i /> LIVE 3D</div></header>
    <aside className="about"><span>Created by</span><strong>Abdullajon Davlatov</strong><p>Satellite-based environmental monitoring and interactive terrain visualizations.</p><div className="contact-links"><a href="mailto:abdulladavlatov777@gmail.com">Email · abdulladavlatov777@gmail.com</a><a href="https://www.linkedin.com/in/abdullajon-davlatov-10399a267/" target="_blank" rel="noreferrer">LinkedIn · Abdullajon Davlatov ↗</a><a href="https://t.me/RemoteSensing_Innovators" target="_blank" rel="noreferrer">Telegram · Remote Sensing Innovators ↗</a></div></aside>
    {layer==="lulc"&&<aside className="legend"><span>LAND COVER / LAND USE</span>{[["#419BDF","Water"],["#397D49","Trees"],["#88B053","Grass"],["#7A87C6","Flooded vegetation"],["#E49635","Crops"],["#DFC35A","Shrub and scrub"],["#C4281B","Built area"],["#A59B8F","Bare ground"],["#B39FE1","Snow and ice"]].map(([color,label])=><div key={label}><i style={{background:color}}/><b>{label}</b></div>)}</aside>}
    <section className="info"><div><span>41.63° N · 70.03° E</span><strong>Chorvoq Reservoir</strong><p>Copernicus GLO-30 · Google Earth Engine</p></div><label>Layer<select value={layer} onChange={e=>setLayer(e.target.value)}><option value="truecolor">Sentinel-2 True Color — monthly</option><option value="lulc">Land Cover — annual</option></select></label><label>Year<select value={year} onChange={e=>{const nextYear=Number(e.target.value);const nextMonths=valid.filter(item=>item.year===nextYear);setYear(nextYear);if(layer!=="lulc"&&!nextMonths.some(item=>item.month===month)&&nextMonths.length)setMonth(nextMonths[nextMonths.length-1].month)}}>{years.map(y=><option key={y} value={y}>{y}</option>)}</select></label>{layer!=="lulc"&&<label className="timeline">Month <b>{months[month]} {year}</b><input aria-label="Month timeline" type="range" min="0" max={Math.max(0,validMonths.length-1)} step="1" value={timeIndex} onChange={e=>{const item=validMonths[Number(e.target.value)];if(item)setMonth(item.month)}}/><span className="time-ends"><i>{validMonths.length?months[validMonths[0].month]:""}</i><i>{validMonths.length?months[validMonths[validMonths.length-1].month]:""}</i></span></label>}</section>
    <div className="hint">Drag to orbit · Scroll to zoom</div>
    {!ready&&<div className="loading"><span /> Preparing Chorvoq terrain</div>}
  </main>;
}
