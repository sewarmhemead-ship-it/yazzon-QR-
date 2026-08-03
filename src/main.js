import * as THREE from "three";
import "./style.css";

const photos = [
  { src:"/images/brunch-1.avif", title:"A table begins" },
  { src:"/images/brunch-2.avif", title:"Morning, shared" },
  { src:"/images/brunch-2b.avif", title:"Made to gather" },
  { src:"/images/brunch-2c.jpg", title:"Between moments" },
  { src:"/images/brunch-3.avif", title:"The taste remains" },
];

const canvas = document.querySelector("#scene");
const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:!matchMedia("(max-width:640px)").matches, powerPreference:"high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia("(max-width:640px)").matches ? 1.25 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
camera.position.set(0,.1,8.8);
const group = new THREE.Group();
scene.add(group);

const loader = new THREE.TextureLoader();
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
  const texture = loader.load(photo.src, tex => { tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4); });
  const geometry=cardGeometry(3.65,2.42,cardProfiles[index]);
  const frameGeometry=cardGeometry(3.65,2.42,cardProfiles[index],.075);
  const material = new THREE.MeshBasicMaterial({ map:texture, transparent:true, opacity:1, side:THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry,material);
  mesh.userData.index=index;
  const frame = new THREE.Mesh(frameGeometry,new THREE.MeshBasicMaterial({ color:0x080705, transparent:true, opacity:.96, side:THREE.DoubleSide }));
  frame.position.z=-.035;
  const reflection = new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({ map:texture, transparent:true, opacity:.12, side:THREE.DoubleSide, depthWrite:false }));
  reflection.scale.y=-.62;
  const unit = new THREE.Group();
  unit.add(frame,mesh,reflection);
  group.add(unit);
  return { unit, mesh, frame, reflection };
});

const floor = new THREE.Mesh(new THREE.PlaneGeometry(30,18),new THREE.MeshBasicMaterial({ color:0x7d542b, transparent:true, opacity:.11, side:THREE.DoubleSide }));
floor.rotation.x=-Math.PI/2; floor.position.y=-2.2; floor.position.z=-2; scene.add(floor);

let position=0, target=0, velocity=0, active=0, dragging=false, moved=false, startX=0, lastX=0;
const dots=document.querySelector(".dots");
photos.forEach((photo,index)=>{ const b=document.createElement("button"); b.type="button"; b.ariaLabel=`View photograph ${index+1}`; b.onclick=()=>{target=index;velocity=0}; dots.append(b); });

function wrap(value){ return ((value%photos.length)+photos.length)%photos.length; }
function updateCopy(index){
  active=index;
  document.querySelector("#ambientImage").src=photos[index].src;
  document.querySelector("#reflectionImage").src=photos[index].src;
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
    const angle=d*.73;
    const galleryOffset=innerWidth<640?0:1.05;
    const x=galleryOffset+Math.sin(angle)*(innerWidth<640?3.25:4.9);
    const z=(Math.cos(angle)-1)*4.8;
    unit.position.set(x,-.38+Math.abs(d)*.16,z);
    unit.rotation.y=-d*.57;
    const scale=Math.max(.58,1-Math.abs(d)*.18); unit.scale.setScalar(scale);
    mesh.material.opacity=Math.max(.16,1-Math.abs(d)*.3);
    frame.material.opacity=Math.max(.34,.96-Math.abs(d)*.22);
    reflection.position.set(0,-3.02,.06);
    reflection.material.opacity=Math.max(.025,.14-Math.abs(d)*.045);
    reflection.material.map=mesh.material.map;
    unit.renderOrder=10-Math.round(Math.abs(d));
  });
  group.rotation.y+=((innerWidth<640?0:.035)-group.rotation.y)*.04;
  renderer.render(scene,camera);
}
frame();
