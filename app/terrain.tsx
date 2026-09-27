"use client";

import { useEffect, useRef, useState } from "react";
import { reservoirs } from "./reservoirs";

type V3 = [number,number,number];
type Availability = {year:number;month:number;s2:number};
type ClimatePoint = {year:number;month:number;modisNdvi?:number;modisEvi?:number;modisNdwi?:number;modisEtMm?:number;modisLstC?:number;era5AirC?:number;era5RainMm?:number;era5SoilWater?:number;era5SolarMj?:number};

function perspective(fov:number,aspect:number,near:number,far:number){const f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0])}
function lookAt(eye:V3,target:V3,up:V3){let zx=eye[0]-target[0],zy=eye[1]-target[1],zz=eye[2]-target[2];let l=Math.hypot(zx,zy,zz);zx/=l;zy/=l;zz/=l;let xx=up[1]*zz-up[2]*zy,xy=up[2]*zx-up[0]*zz,xz=up[0]*zy-up[1]*zx;l=Math.hypot(xx,xy,xz);xx/=l;xy/=l;xz/=l;const yx=zy*xz-zz*xy,yy=zz*xx-zx*xz,yz=zx*xy-zy*xx;return new Float32Array([xx,yx,zx,0,xy,yy,zy,0,xz,yz,zz,0,-(xx*eye[0]+xy*eye[1]+xz*eye[2]),-(yx*eye[0]+yy*eye[1]+yz*eye[2]),-(zx*eye[0]+zy*eye[1]+zz*eye[2]),1])}
function multiply(a:Float32Array,b:Float32Array){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o}
function shader(gl:WebGL2RenderingContext,type:number,source:string){const s=gl.createShader(type)!;gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)||"Shader error");return s}
function loadImage(src:string){return new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.crossOrigin="anonymous";image.decoding="async";image.onload=()=>resolve(image);image.onerror=()=>reject(new Error(`Raster could not be loaded: ${src}`));image.src=src})}

function MetricChart({title,source,unit,color,values,activeMonth}:{title:string;source:string;unit:string;color:string;values:Array<number|null>;activeMonth:number}){
  const valid=values.filter((value):value is number=>Number.isFinite(value));
  const min=valid.length?Math.min(...valid):0,max=valid.length?Math.max(...valid):1,span=Math.max(max-min,.001);
  const coordinates=values.map((value,index)=>value===null?null:{x:12+index*(256/11),y:74-(value-min)/span*52});
  const path=coordinates.reduce((result,point)=>point?`${result}${result?" L":"M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`:result,"");
  const active=coordinates[activeMonth-1];
  const decimals=["NDVI","EVI","NDWI","m³/m³"].includes(unit)?2:1;
  return <article className="metric-card"><header><div><span>{source}</span><strong>{title}</strong></div><b>{values[activeMonth-1]===null?"—":`${values[activeMonth-1]?.toFixed(decimals)} ${unit}`}</b></header><svg viewBox="0 0 280 92" role="img" aria-label={`${title} monthly chart`}><defs><linearGradient id={`fill-${title.replace(/\W/g,"")}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".32"/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient></defs><line x1="12" x2="268" y1="74" y2="74" className="chart-axis"/><path d={`${path} L268 74 L12 74 Z`} fill={`url(#fill-${title.replace(/\W/g,"")})`}/><path d={path} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round"/>{coordinates.map((point,index)=>point&&<circle key={index} cx={point.x} cy={point.y} r={index===activeMonth-1?4:2} fill={index===activeMonth-1?"#fff":color}><title>{`${index+1}: ${values[index]?.toFixed(2)} ${unit}`}</title></circle>)}{active&&<line x1={active.x} x2={active.x} y1="14" y2="78" className="active-guide"/>}<text x="12" y="89">JAN</text><text x="246" y="89">DEC</text></svg></article>
}

export function ChorvoqTerrain(){
  const fallbackDates=Array.from({length:6},(_,yearOffset)=>Array.from({length:6},(_,monthOffset)=>({year:2020+yearOffset,month:5+monthOffset,s2:1}))).flat();
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const terrainLoader=useRef<(heightUrl:string,colorUrl:string)=>void>(()=>{});
  const reservoirId="chorvoq";
  const [year,setYear]=useState(2025);
  const [month,setMonth]=useState(8);
  const [available,setAvailable]=useState<Availability[]>(fallbackDates);
  const [ready,setReady]=useState(false);
  const [playing,setPlaying]=useState(false);
  const [rasterLoading,setRasterLoading]=useState(false);
  const [rasterError,setRasterError]=useState("");
  const [climate,setClimate]=useState<ClimatePoint[]>([]);
  const [climateLoading,setClimateLoading]=useState(true);
  const [climateError,setClimateError]=useState("");
  const [climateRequest,setClimateRequest]=useState(0);
  const [photoUrls,setPhotoUrls]=useState<string[]>([]);
  const [photoIndex,setPhotoIndex]=useState(0);
  const [photoLoading,setPhotoLoading]=useState(false);
  const [photoOpen,setPhotoOpen]=useState(false);
  const selected=reservoirs[0];
  const photoUrl=photoUrls[photoIndex]||"";
  const months=["","January","February","March","April","May","June","July","August","September","October","November","December"];
  const valid=available.filter(item=>item.s2>0);
  const years=[...new Set(valid.map(item=>item.year))];
  const validMonths=valid.filter(item=>item.year===year);
  const timeIndex=Math.max(0,validMonths.findIndex(item=>item.month===month));
  const isLocal=typeof window==="undefined"||window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1";
  const terrainBase=isLocal?"http://localhost:3460":"";
  const climateUrl=isLocal?`${terrainBase}/climate?reservoir=chorvoq&year=${year}&v=2`:`/data/climate-${year}.json`;
  const availabilityUrl=isLocal?`${terrainBase}/availability?reservoir=${reservoirId}`:"/data/availability.json";
  const imageryUrl=isLocal?`${terrainBase}/tile.png?reservoir=${reservoirId}&year=${year}&month=${month}`:`/chorvoq/truecolor-${year}-${String(month).padStart(2,"0")}.png`;
  const heightUrl=isLocal?`${terrainBase}/height.png?reservoir=${reservoirId}`:"/chorvoq/height.png";

  useEffect(()=>{
    const controller=new AbortController();setClimateLoading(true);setClimateError("");
    fetch(climateUrl,{signal:controller.signal,cache:"no-store"}).then(response=>{if(!response.ok)throw new Error("Climate data unavailable");return response.json()}).then((data:ClimatePoint[])=>setClimate(data)).catch(error=>{if(error.name!=="AbortError")setClimateError("MODIS and ERA5 data could not be loaded.")}).finally(()=>setClimateLoading(false));
    return()=>controller.abort();
  },[year,climateRequest]);

  useEffect(()=>{
    const controller=new AbortController();setPlaying(false);setRasterError("");setAvailable(fallbackDates);
    fetch(availabilityUrl,{signal:controller.signal}).then(response=>response.json()).then((data:Availability[])=>{const supported=data.filter(item=>item.year<=2025);setAvailable(supported.some(item=>item.s2>0)?supported:fallbackDates)}).catch(error=>{if(error.name!=="AbortError")setAvailable(fallbackDates)});
    return()=>controller.abort();
  },[reservoirId]);

  useEffect(()=>{
    if(ready)terrainLoader.current(heightUrl,imageryUrl);
  },[ready,reservoirId,year,month,heightUrl,imageryUrl]);

  useEffect(()=>{if(!validMonths.some(item=>item.month===month)&&validMonths.length)setMonth(validMonths[validMonths.length-1].month)},[year,available]);
  useEffect(()=>{if(!playing||validMonths.length<2||rasterLoading)return;const timer=window.setTimeout(()=>setMonth(current=>{const index=validMonths.findIndex(item=>item.month===current);return validMonths[(index+1+validMonths.length)%validMonths.length].month}),3000);return()=>window.clearTimeout(timer)},[playing,year,available,validMonths.length,rasterLoading]);

  useEffect(()=>{
    let active=true;setPhotoLoading(true);setPhotoUrls([]);setPhotoIndex(0);
    const commons=()=>fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(selected.commonsQuery)}&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url&iiurlwidth=1200&origin=*&format=json`).then(r=>r.json()).then(data=>(Object.values(data.query?.pages||{}) as Array<{imageinfo?:Array<{thumburl?:string;url?:string}>}>).map(page=>page.imageinfo?.[0]?.thumburl||page.imageinfo?.[0]?.url||"").filter(Boolean));
    const wiki=selected.wikiTitle&&selected.wikiLang?fetch(`https://${selected.wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(selected.wikiTitle)}`).then(r=>r.ok?r.json():Promise.reject()).then(data=>data.originalimage?.source||data.thumbnail?.source||"").catch(()=>""):Promise.resolve("");
    Promise.all([wiki,commons().catch(()=>[])]).then(([lead,gallery])=>{if(active)setPhotoUrls([...new Set([lead,...gallery].filter(Boolean))])}).catch(()=>{}).finally(()=>{if(active)setPhotoLoading(false)});
    return()=>{active=false};
  },[reservoirId]);

  useEffect(()=>{
    const canvas=canvasRef.current!,gl=canvas.getContext("webgl2",{antialias:true,alpha:false})!;if(!gl)return;
    let stopped=false,frame=0,yaw=-.62,pitch=.72,radius=2.25,dragging=false,px=0,py=0,requestToken=0;
    const vs=`#version 300 es
      precision highp float;layout(location=0)in vec2 aUv;uniform sampler2D uHeight;uniform mat4 uMvp;uniform float uScale;out vec2 vUv;out float vH;
      void main(){float h=texture(uHeight,aUv).r;vUv=aUv;vH=h;vec3 p=vec3((aUv.x-.5)*1.35,(h-.18)*uScale*.22,(aUv.y-.5)*-1.0);gl_Position=uMvp*vec4(p,1.0);}`;
    const fs=`#version 300 es
      precision highp float;in vec2 vUv;in float vH;uniform sampler2D uColor;out vec4 outColor;
      void main(){vec4 c=texture(uColor,vUv);if(c.a<.08)discard;float light=.78+vH*.30;outColor=vec4(c.rgb*light,1.0);}`;
    const program=gl.createProgram()!;gl.attachShader(program,shader(gl,gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl,gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);
    const n=161,uv=new Float32Array(n*n*2);let k=0;for(let y=0;y<n;y++)for(let x=0;x<n;x++){uv[k++]=x/(n-1);uv[k++]=y/(n-1)}
    const indices=new Uint32Array((n-1)*(n-1)*6);k=0;for(let y=0;y<n-1;y++)for(let x=0;x<n-1;x++){const a=y*n+x,b=a+1,c=a+n,d=c+1;indices[k++]=a;indices[k++]=c;indices[k++]=b;indices[k++]=b;indices[k++]=c;indices[k++]=d}
    const vao=gl.createVertexArray();gl.bindVertexArray(vao);const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,uv,gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
    const skirtVs=`#version 300 es
      precision highp float;layout(location=0)in vec2 aUv;layout(location=1)in float aBottom;uniform sampler2D uHeight;uniform mat4 uMvp;uniform float uScale;out float vDepth;out vec2 vUv;
      void main(){float top=(texture(uHeight,aUv).r-.18)*uScale*.22;float y=mix(top,-.085,aBottom);vDepth=aBottom;vUv=aUv;gl_Position=uMvp*vec4((aUv.x-.5)*1.35,y,(aUv.y-.5)*-1.0,1.0);}`;
    const skirtFs=`#version 300 es
      precision highp float;in float vDepth;in vec2 vUv;out vec4 outColor;
      void main(){float bands=.035*sin((vUv.x+vUv.y)*150.0)+.025*sin(vUv.x*310.0);vec3 soil=mix(vec3(.21,.12,.07),vec3(.48,.29,.14),.35+bands+vDepth*.25);outColor=vec4(soil,1.0);}`;
    const skirtProgram=gl.createProgram()!;gl.attachShader(skirtProgram,shader(gl,gl.VERTEX_SHADER,skirtVs));gl.attachShader(skirtProgram,shader(gl,gl.FRAGMENT_SHADER,skirtFs));gl.linkProgram(skirtProgram);
    const edge:Array<[number,number]>=[];for(let x=0;x<n;x++)edge.push([x/(n-1),0]);for(let y=1;y<n;y++)edge.push([1,y/(n-1)]);for(let x=n-2;x>=0;x--)edge.push([x/(n-1),1]);for(let y=n-2;y>0;y--)edge.push([0,y/(n-1)]);
    const skirtData:number[]=[];for(const[u,v]of edge)skirtData.push(u,v,0,u,v,1);const bottomStart=skirtData.length/3;skirtData.push(0,0,1,1,0,1,1,1,1,0,1,1);const skirtIndices:number[]=[];for(let i=0;i<edge.length;i++){const j=(i+1)%edge.length,a=i*2,b=a+1,c=j*2,d=c+1;skirtIndices.push(a,b,c,c,b,d)}skirtIndices.push(bottomStart,bottomStart+1,bottomStart+2,bottomStart,bottomStart+2,bottomStart+3);
    const skirtVao=gl.createVertexArray();gl.bindVertexArray(skirtVao);const skirtBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,skirtBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(skirtData),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,12,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,1,gl.FLOAT,false,12,8);const skirtIb=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,skirtIb);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint32Array(skirtIndices),gl.STATIC_DRAW);
    const makeTexture=(image:HTMLImageElement,unit:number)=>{const texture=gl.createTexture()!;gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);return texture};
    const updateTexture=(texture:WebGLTexture,image:HTMLImageElement,unit:number)=>{gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.generateMipmap(gl.TEXTURE_2D)};
    Promise.all([loadImage("/chorvoq/height.png"),loadImage(imageryUrl)]).then(([height,color])=>{
      if(stopped)return;const heightTexture=makeTexture(height,0),colorTexture=makeTexture(color,1);
      let activeHeightUrl="",activeColorUrl=imageryUrl;
      terrainLoader.current=(heightUrl,colorUrl)=>{const token=++requestToken;setRasterLoading(true);setRasterError("");const requestImages=(attempt=0):Promise<[HTMLImageElement|null,HTMLImageElement|null]>=>{const heightRequest=heightUrl===activeHeightUrl?Promise.resolve<HTMLImageElement|null>(null):loadImage(heightUrl);const colorRequest=colorUrl===activeColorUrl?Promise.resolve<HTMLImageElement|null>(null):loadImage(colorUrl);return Promise.all([heightRequest,colorRequest]).catch(error=>attempt<3&&token===requestToken?new Promise(resolve=>window.setTimeout(resolve,1500*2**attempt)).then(()=>requestImages(attempt+1)):Promise.reject(error))};requestImages().then(([nextHeight,nextColor])=>{if(stopped||token!==requestToken)return;if(nextHeight){updateTexture(heightTexture,nextHeight,0);activeHeightUrl=heightUrl}if(nextColor){updateTexture(colorTexture,nextColor,1);activeColorUrl=colorUrl}scheduleRender()}).catch(()=>{if(token===requestToken)setRasterError("Google Earth Engine is temporarily busy. Please wait a moment and retry.")}).finally(()=>{if(token===requestToken)setRasterLoading(false)})};
      setReady(true);gl.useProgram(program);gl.uniform1i(gl.getUniformLocation(program,"uHeight"),0);gl.uniform1i(gl.getUniformLocation(program,"uColor"),1);
      scheduleRender();
    });
    const render=()=>{if(stopped)return;const dpr=Math.min(devicePixelRatio,1.5),w=Math.round(canvas.clientWidth*dpr),h=Math.round(canvas.clientHeight*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}gl.clearColor(.006,.012,.014,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);const eye:V3=[Math.cos(yaw)*Math.cos(pitch)*radius,Math.sin(pitch)*radius,Math.sin(yaw)*Math.cos(pitch)*radius];const mvp=multiply(perspective(.72,w/h,.02,20),lookAt(eye,[0,.12,0],[0,1,0]));gl.useProgram(program);gl.uniformMatrix4fv(gl.getUniformLocation(program,"uMvp"),false,mvp);gl.uniform1f(gl.getUniformLocation(program,"uScale"),.8);gl.bindVertexArray(vao);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_INT,0);gl.useProgram(skirtProgram);gl.uniform1i(gl.getUniformLocation(skirtProgram,"uHeight"),0);gl.uniformMatrix4fv(gl.getUniformLocation(skirtProgram,"uMvp"),false,mvp);gl.uniform1f(gl.getUniformLocation(skirtProgram,"uScale"),.8);gl.bindVertexArray(skirtVao);gl.drawElements(gl.TRIANGLES,skirtIndices.length,gl.UNSIGNED_INT,0)};
    const scheduleRender=()=>{if(stopped||frame)return;frame=requestAnimationFrame(()=>{frame=0;render()})};
    const down=(event:PointerEvent)=>{dragging=true;px=event.clientX;py=event.clientY;canvas.setPointerCapture(event.pointerId)},move=(event:PointerEvent)=>{if(!dragging)return;yaw-=(event.clientX-px)*.006;pitch=Math.max(.18,Math.min(1.35,pitch+(event.clientY-py)*.005));px=event.clientX;py=event.clientY;scheduleRender()},up=()=>{dragging=false},wheel=(event:WheelEvent)=>{event.preventDefault();radius=Math.max(1.15,Math.min(4,radius*Math.exp(event.deltaY*.001)));scheduleRender()},resize=()=>scheduleRender();
    canvas.addEventListener("pointerdown",down);canvas.addEventListener("pointermove",move);canvas.addEventListener("pointerup",up);canvas.addEventListener("wheel",wheel,{passive:false});window.addEventListener("resize",resize);return()=>{stopped=true;cancelAnimationFrame(frame);canvas.removeEventListener("pointerdown",down);canvas.removeEventListener("pointermove",move);canvas.removeEventListener("pointerup",up);canvas.removeEventListener("wheel",wheel);window.removeEventListener("resize",resize)};
  },[]);

  const climateValues=(key:keyof ClimatePoint)=>Array.from({length:12},(_,index)=>{const value=climate.find(item=>item.month===index+1)?.[key];return typeof value==="number"?value:null});

  return <main className="terrain-shell single-reservoir">
    <canvas ref={canvasRef} aria-label={`Interactive three-dimensional terrain of ${selected.name}`}/>
    <div className="atmosphere"/>
    <header className="topbar"><div><span className="eyebrow">UZBEKISTAN · EARTH OBSERVATION ATLAS</span><h1>{selected.shortName.toUpperCase()}</h1><p>{selected.region}</p></div><div className="live"><i/> LIVE 3D</div></header>

    <aside className="climate-panel">
      <div className="climate-heading"><div><span>MONTHLY EARTH SYSTEM SIGNALS</span><h2>MODIS + ERA5</h2></div><b>{year}</b></div>
      {climateLoading?<div className="climate-state"><i/><strong>LOADING CLIMATE SERIES</strong><span>Google Earth Engine is aggregating Chorvoq monthly values.</span></div>:climateError?<div className="climate-state climate-failed"><strong>DATA TEMPORARILY UNAVAILABLE</strong><span>{climateError}</span><button onClick={()=>setClimateRequest(value=>value+1)}>RETRY</button></div>:<div className="metric-grid">
        <MetricChart title="Vegetation index" source="MODIS MOD13Q1" unit="NDVI" color="#7ee787" values={climateValues("modisNdvi")} activeMonth={month}/>
        <MetricChart title="Enhanced vegetation index" source="MODIS MOD13Q1" unit="EVI" color="#b7f36b" values={climateValues("modisEvi")} activeMonth={month}/>
        <MetricChart title="Water index" source="MODIS MOD09A1" unit="NDWI" color="#38bdf8" values={climateValues("modisNdwi")} activeMonth={month}/>
        <MetricChart title="Evapotranspiration" source="MODIS MOD16A2GF" unit="mm" color="#2dd4bf" values={climateValues("modisEtMm")} activeMonth={month}/>
        <MetricChart title="Land surface temperature" source="MODIS MOD11A2" unit="°C" color="#fb923c" values={climateValues("modisLstC")} activeMonth={month}/>
        <MetricChart title="2 m air temperature" source="ERA5-Land" unit="°C" color="#61b7ff" values={climateValues("era5AirC")} activeMonth={month}/>
        <MetricChart title="Total precipitation" source="ERA5-Land" unit="mm" color="#67e8f9" values={climateValues("era5RainMm")} activeMonth={month}/>
        <MetricChart title="Surface soil moisture" source="ERA5-Land" unit="m³/m³" color="#c8a77a" values={climateValues("era5SoilWater")} activeMonth={month}/>
        <MetricChart title="Solar radiation" source="ERA5-Land" unit="MJ/m²" color="#ffd166" values={climateValues("era5SolarMj")} activeMonth={month}/>
      </div>}
      <footer><span>Monthly spatial means over the Chorvoq area</span><strong>Abdullajon Davlatov</strong><a href="https://t.me/RemoteSensing_Innovators" target="_blank" rel="noreferrer">Remote Sensing Innovators ↗</a></footer>
    </aside>

    <aside className="detail-panel">
      <div className="photo-card">{photoLoading?<div className="photo-skeleton"><i/></div>:photoUrl?<><button onClick={()=>setPhotoOpen(true)} aria-label={`Open photograph of ${selected.name}`}><img src={photoUrl} alt={`${selected.name} reservoir photograph`}/><span>VIEW PHOTO</span></button>{photoUrls.length>1&&<div className="photo-pagination"><button aria-label="Previous photograph" onClick={()=>setPhotoIndex(value=>(value-1+photoUrls.length)%photoUrls.length)}>‹</button><b>{photoIndex+1} / {photoUrls.length}</b><button aria-label="Next photograph" onClick={()=>setPhotoIndex(value=>(value+1)%photoUrls.length)}>›</button></div>}</>:<div className="photo-empty">PHOTO PREVIEW<br/>NOT AVAILABLE</div>}</div>
      <span className="detail-kicker">SELECTED RESERVOIR</span><h2>{selected.name}</h2><p className="coordinates">{selected.coordinates}</p><p className="description">{selected.description}</p>
      <div className="photo-source-label">EXPLORE PHOTO SOURCES</div>
      <div className="detail-actions photo-sources"><a href={selected.wikiUrl} target="_blank" rel="noreferrer">Wikipedia <b>↗</b></a><a href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(selected.commonsQuery)}`} target="_blank" rel="noreferrer">Google Images <b>↗</b></a><a href={`https://yandex.com/images/search?text=${encodeURIComponent(selected.commonsQuery)}`} target="_blank" rel="noreferrer">Yandex Images <b>↗</b></a></div>
      <div className="source-note"><i/><span>Terrain: Copernicus GLO-30<br/>Imagery: cloud-filled Sentinel-2 L2A True Color</span></div>
    </aside>

    <section className="timeline-panel">
      <div className="timeline-title"><span>OBSERVATION DATE</span><strong>{months[month]} {year}</strong></div>
      <label>Year<select value={year} onChange={event=>setYear(Number(event.target.value))}>{years.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
      <label className="timeline">Month<input aria-label="Month timeline" type="range" min="0" max={Math.max(0,validMonths.length-1)} step="1" value={timeIndex} onChange={event=>{const item=validMonths[Number(event.target.value)];if(item)setMonth(item.month)}}/><span><i>{validMonths.length?months[validMonths[0].month]:""}</i><i>{validMonths.length?months[validMonths[validMonths.length-1].month]:""}</i></span></label>
      <button type="button" className="autoplay" aria-pressed={playing} disabled={validMonths.length<2} onClick={()=>setPlaying(value=>!value)}>{playing?"Ⅱ PAUSE":"▶ AUTO · 3S"}</button>
    </section>
    <div className="hint">DRAG TO ORBIT · SCROLL TO ZOOM</div>
    {!ready&&<div className="loading"><span/><b>BUILDING 3D TERRAIN</b><small>Preparing elevation and satellite textures</small></div>}
    {rasterLoading&&<div className="raster-status loading-raster"><span/><div><b>UPDATING CLOUD-FILLED TRUE COLOR</b><small>{selected.shortName} · {months[month]} {year}</small></div></div>}
    {rasterError&&<div className="raster-status raster-error"><b>RASTER UPDATE PAUSED</b><small>{rasterError}</small><button onClick={()=>terrainLoader.current(heightUrl,imageryUrl)}>RETRY</button></div>}
    {photoOpen&&photoUrl&&<div className="photo-modal" role="dialog" aria-modal="true" aria-label={`${selected.name} photograph`} onClick={()=>setPhotoOpen(false)}><button className="modal-close" onClick={()=>setPhotoOpen(false)}>CLOSE ×</button><figure onClick={event=>event.stopPropagation()}><img src={photoUrl} alt={`${selected.name} reservoir photograph`}/><figcaption><strong>{selected.name}</strong><span>Open-source preview · Google and Yandex searches are available in the information panel</span></figcaption></figure></div>}
  </main>;
}
