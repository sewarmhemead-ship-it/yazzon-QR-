import * as THREE from "three";
import "./style.css";

const photos = [
  { src:"/images/brunch-1.avif", title:"A table begins" },
  { src:"/images/brunch-2.avif", title:"Morning, shared" },
  { src:"/images/brunch-2b.avif", title:"Made to gather" },
  { src:"/images/brunch-2c.jpg", title:"Between moments" },
  { src:"/images/brunch-3.avif", title:"The taste remains" },
  { src:"/images/official/official-01.webp", title:"Welcome to YAZZOON" },
  { src:"/images/official/official-02.webp", title:"Brunch in Salzburg" },
  { src:"/images/official/official-03.webp", title:"A midday ritual" },
  { src:"/images/official/official-04.webp", title:"Levantine evenings" },
  { src:"/images/official/official-05.webp", title:"After dark" },
  { src:"/images/official/official-06.webp", title:"Inside the room" },
  { src:"/images/official/official-07.webp", title:"Gathered around" },
  { src:"/images/official/official-08.webp", title:"Details of the table" },
  { src:"/images/official/official-09.webp", title:"A shared feast" },
  { src:"/images/official/official-10.webp", title:"Made in the moment" },
  { src:"/images/official/official-11.webp", title:"Faces of the night" },
  { src:"/images/official/official-12.webp", title:"Salzburg stories" },
  { src:"/images/official/official-13.webp", title:"Until we meet again" },
];

const loaderEl=document.querySelector("#loader");
const loaderFill=document.querySelector("#loaderFill");
const loaderPct=document.querySelector("#loaderPct");
const loadingStarted=performance.now();
let loaderDismissed=false;
const loadingManager=new THREE.LoadingManager();
loadingManager.onProgress=(_url,loaded,total)=>{
  const pct=Math.round(loaded/Math.max(total,1)*100);
  loaderFill.style.width=`${pct}%`; loaderPct.textContent=String(pct);
};
loadingManager.onLoad=()=>{
  if(loaderDismissed)return;
  loaderDismissed=true;
  const wait=Math.max(0,900-(performance.now()-loadingStarted));
  setTimeout(()=>{
    loaderFill.style.width="100%"; loaderPct.textContent="100";
    loaderEl.classList.add("is-hidden"); document.body.classList.add("gallery-ready");
  },wait+180);
};

const canvas = document.querySelector("#scene");
const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true, powerPreference:"high-performance", precision:"highp" });
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
camera.position.set(0,.1,8.8);
const group = new THREE.Group();
scene.add(group);

const loader = new THREE.TextureLoader(loadingManager);
const cardProfiles = [
  [0.08,0.42,0.08,0.3],
  [0.5,0.08,0.34,0.08],
  [0.08,0.08,0.48,0.48],
  [0.72,0.08,0.08,0.08],
  [0.08,0.34,0.46,0.08],
];

function cardGeometry(width,height,radii,padding=0){
  const w=width+padding*2,h=height+padding*2;
  const [tl,tr,br,bl]=radii.map(r=>r+padding*.55);
  const x=-w/2,y=-h/2;
  const shape=new THREE.Shape();
  shape.moveTo(x+bl,y);
  shape.lineTo(x+w-br,y); shape.quadraticCurveTo(x+w,y,x+w,y+br);
  shape.lineTo(x+w,y+h-tr); shape.quadraticCurveTo(x+w,y+h,x+w-tr,y+h);
  shape.lineTo(x+tl,y+h); shape.quadraticCurveTo(x,y+h,x,y+h-tl);
  shape.lineTo(x,y+bl); shape.quadraticCurveTo(x,y,x+bl,y);
  const geometry=new THREE.ShapeGeometry(shape,8);
  const uv=geometry.attributes.uv;
  for(let i=0;i<uv.count;i++) uv.setXY(i,(uv.getX(i)-x)/w,(uv.getY(i)-y)/h);
  uv.needsUpdate=true;
  return geometry;
}

const meshes = photos.map((photo,index) => {
  const profile=cardProfiles[index%cardProfiles.length];
  const geometry=cardGeometry(3.65,2.42,profile);
  const frameGeometry=cardGeometry(3.65,2.42,profile,.075);
  const material = new THREE.MeshBasicMaterial({ color:0x17130e, transparent:true, opacity:1, side:THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry,material);
  mesh.userData.index=index;
  const frame = new THREE.Mesh(frameGeometry,new THREE.MeshBasicMaterial({ color:0x080705, transparent:true, opacity:.96, side:THREE.DoubleSide }));
  frame.position.z=-.035;
  const reflection = new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({ color:0x17130e, transparent:true, opacity:.12, side:THREE.DoubleSide, depthWrite:false }));
  reflection.scale.y=-.44;
  const unit = new THREE.Group();
  unit.add(frame,mesh,reflection);
  group.add(unit);
  return { unit, mesh, frame, reflection, texture:null, loading:false };
});

function circularDistance(a,b){ const raw=Math.abs(a-b); return Math.min(raw,photos.length-raw); }
function ensureTexture(index){
  const wrapped=wrap(index),record=meshes[wrapped];
  if(record.texture||record.loading)return;
  record.loading=true;
  loader.load(photos[wrapped].src,texture=>{
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
    record.texture=texture; record.loading=false;
    record.mesh.material.map=texture; record.mesh.material.color.set(0xffffff); record.mesh.material.needsUpdate=true;
    record.reflection.material.map=texture; record.reflection.material.color.set(0xffffff); record.reflection.material.needsUpdate=true;
  },undefined,()=>{record.loading=false});
}

function manageTextures(index){
  for(let offset=-3;offset<=3;offset++)ensureTexture(index+offset);
  meshes.forEach((record,i)=>{
    if(record.texture&&circularDistance(i,index)>6){
      record.texture.dispose(); record.texture=null;
      record.mesh.material.map=null; record.mesh.material.color.set(0x17130e); record.mesh.material.needsUpdate=true;
      record.reflection.material.map=null; record.reflection.material.color.set(0x17130e); record.reflection.material.needsUpdate=true;
    }
  });
}

let position=0, target=0, velocity=0, active=0, dragging=false, moved=false, startX=0, lastX=0;
const dots=document.querySelector(".dots");
photos.forEach((photo,index)=>{ const b=document.createElement("button"); b.type="button"; b.ariaLabel=`View photograph ${index+1}`; b.onclick=()=>{target=index;velocity=0}; dots.append(b); });

function wrap(value){ return ((value%photos.length)+photos.length)%photos.length; }
function updateCopy(index){
  active=index;
  manageTextures(index);
  document.querySelector("#counter").textContent=`${String(index+1).padStart(2,"0")} / ${String(photos.length).padStart(2,"0")}`;
  document.querySelector("#chapter").textContent=`Chapter ${String(index+1).padStart(2,"0")}`;
  document.querySelector("#caption").textContent=photos[index].title;
  [...dots.children].forEach((dot,i)=>dot.setAttribute("aria-current",String(i===index)));
}

function down(e){ dragging=true;moved=false;startX=lastX=e.clientX;velocity=0;canvas.setPointerCapture(e.pointerId); }
function move(e){ if(!dragging)return; const dx=e.clientX-lastX; if(Math.abs(e.clientX-startX)>6)moved=true; position-=dx/(innerWidth<640?170:280); velocity=-dx/(innerWidth<640?170:280); lastX=e.clientX; }
function up(e){ if(!dragging)return; dragging=false;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId); target=Math.round(position+velocity*5); }
canvas.addEventListener("pointerdown",down); canvas.addEventListener("pointermove",move); canvas.addEventListener("pointerup",up); canvas.addEventListener("pointercancel",up);
canvas.addEventListener("wheel",e=>{ if(Math.abs(e.deltaY)+Math.abs(e.deltaX)<5)return; target=Math.round(position)+(e.deltaY+e.deltaX>0?1:-1); },{passive:true});
window.addEventListener("keydown",e=>{ if(e.key==="ArrowRight")target=Math.round(position)+1; if(e.key==="ArrowLeft")target=Math.round(position)-1; if(e.key==="Enter")openPhoto(); if(e.key==="Escape")closePhoto(); });

const lightbox=document.querySelector("#lightbox");
function openPhoto(){ const photo=photos[active]; document.querySelector("#lightboxImage").src=photo.src; document.querySelector("#lightboxImage").alt=photo.title; document.querySelector("#lightboxNumber").textContent=`Photograph ${String(active+1).padStart(2,"0")}`; document.querySelector("#lightboxTitle").textContent=photo.title; lightbox.hidden=false; document.querySelector("#closeLightbox").focus(); }
function closePhoto(){ if(lightbox.hidden)return;lightbox.hidden=true;document.querySelector("#openActive").focus(); }
document.querySelector("#openActive").onclick=openPhoto; document.querySelector("#closeLightbox").onclick=closePhoto; lightbox.addEventListener("click",e=>{if(e.target===lightbox)closePhoto()});

function resize(){ renderer.setSize(innerWidth,innerHeight,false); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); }
addEventListener("resize",resize); resize(); updateCopy(0);

const clock=new THREE.Clock();
function frame(){
  requestAnimationFrame(frame);
  const dt=Math.min(clock.getDelta()*60,2);
  if(!dragging){ position+=(target-position)*Math.min(.12*dt,1); }
  const nearest=wrap(Math.round(position)); if(nearest!==active)updateCopy(nearest);
  meshes.forEach(({unit,mesh,frame,reflection},index)=>{
    let d=index-position; while(d>photos.length/2)d-=photos.length; while(d<-photos.length/2)d+=photos.length;
    unit.visible=Math.abs(d)<3.15;
    if(!unit.visible)return;
    const angle=d*.73;
    const galleryOffset=innerWidth<640?0:1.05;
    const x=galleryOffset+Math.sin(angle)*(innerWidth<640?3.25:4.9);
    const z=(Math.cos(angle)-1)*4.8;
    unit.position.set(x,-.38+Math.abs(d)*.16,z);
    unit.rotation.y=-d*.57;
    const scale=Math.max(.58,1-Math.abs(d)*.18); unit.scale.setScalar(scale);
    mesh.material.opacity=Math.max(.16,1-Math.abs(d)*.3);
    frame.material.opacity=Math.max(.34,.96-Math.abs(d)*.22);
    reflection.position.set(0,-2.72,.06);
    reflection.material.opacity=Math.max(.012,.072-Math.abs(d)*.024);
    reflection.material.map=mesh.material.map;
    unit.renderOrder=10-Math.round(Math.abs(d));
  });
  group.rotation.y+=((innerWidth<640?0:.035)-group.rotation.y)*.04;
  renderer.render(scene,camera);
}
frame();
