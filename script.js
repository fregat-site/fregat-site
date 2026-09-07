const burger=document.querySelector('.burger');
const nav=document.querySelector('.nav nav');
if(burger){burger.addEventListener('click',()=>{nav.classList.toggle('open');document.body.classList.toggle('menu-open')})}
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  const el=document.querySelector(a.getAttribute('href'));
  if(el){e.preventDefault();el.scrollIntoView({behavior:'smooth'});nav?.classList.remove('open');document.body.classList.remove('menu-open')}
}));

/* Жизнь Фрегата — 3 кадра, центральный большой, бесконечная лента */
const lifeViewport=document.querySelector('.life-viewport');
const track=document.querySelector('.life-track');
const prev=document.querySelector('.life-prev');
const next=document.querySelector('.life-next');
if(track && lifeViewport){
  const originals=[...track.children];
  const count=originals.length;
  const clone=arr=>arr.map(el=>el.cloneNode(true));
  track.innerHTML='';
  track.append(...clone(originals),...clone(originals),...clone(originals),...clone(originals),...clone(originals));

  let index=count*2;
  let baseX=0;
  let targetX=0;
  let animation=null;
  let dragging=false;
  let pointerId=null;
  let startPointerX=0;
  let startX=0;
  let autoTimer=null;
  let resumeTimer=null;
  let lastWidth=0;

  const cards=()=>[...track.children];
  const gap=()=>parseFloat(getComputedStyle(track).gap)||12;
  const step=()=>{
    const c=cards()[0];
    return c ? c.offsetWidth + gap() : 0;
  };
  const centerOffset=()=> (lifeViewport.clientWidth - (cards()[0]?.offsetWidth||0))/2;
  const positionFor=i=>centerOffset()-i*step();

  const setTransform=x=>{
    baseX=x;
    track.style.transform=`translate3d(${x}px,0,0)`;
    updateVisuals();
  };

  const updateVisuals=()=>{
    const vc=lifeViewport.getBoundingClientRect().left + lifeViewport.clientWidth/2;
    cards().forEach(card=>{
      const r=card.getBoundingClientRect();
      const cc=r.left+r.width/2;
      const d=Math.min(1,Math.abs(cc-vc)/(lifeViewport.clientWidth*.34));
      const focus=Math.max(0,1-d);
      const scale=.78 + focus*.22;
      const opacity=.38 + focus*.62;
      const saturation=.35 + focus*.65;
      card.style.setProperty('--card-scale',scale.toFixed(3));
      card.style.setProperty('--card-opacity',opacity.toFixed(3));
      card.style.setProperty('--card-sat',saturation.toFixed(3));
      card.style.zIndex=String(Math.round(10+focus*20));
    });
  };

  const animateTo=(x,duration=650,done)=>{
    if(animation) cancelAnimationFrame(animation);
    const from=baseX;
    const delta=x-from;
    const start=performance.now();
    const ease=t=>1-Math.pow(1-t,3);
    const frame=now=>{
      const p=Math.min(1,(now-start)/duration);
      setTransform(from+delta*ease(p));
      if(p<1) animation=requestAnimationFrame(frame);
      else { animation=null; if(done) done(); }
    };
    animation=requestAnimationFrame(frame);
  };

  const normalize=()=>{
    /* Keep the user inside the middle copy without a visible jump. */
    if(index < count){ index += count*2; setTransform(positionFor(index)); }
    else if(index >= count*4){ index -= count*2; setTransform(positionFor(index)); }
  };

  const go=direction=>{
    if(dragging || animation) return;
    index += direction;
    const x=positionFor(index);
    animateTo(x,650,()=>{normalize(); scheduleAuto();});
  };

  const scheduleAuto=()=>{
    clearTimeout(autoTimer);
    autoTimer=setTimeout(()=>{
      if(!document.hidden && !dragging && !animation) go(1);
      else scheduleAuto();
    },3200);
  };

  prev?.addEventListener('click',()=>{clearTimeout(autoTimer);go(-1)});
  next?.addEventListener('click',()=>{clearTimeout(autoTimer);go(1)});

  track.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse' && e.button!==0)return;
    if(animation){cancelAnimationFrame(animation);animation=null;}
    clearTimeout(autoTimer); clearTimeout(resumeTimer);
    dragging=true; pointerId=e.pointerId; startPointerX=e.clientX; startX=baseX;
    track.classList.add('dragging');
    track.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  });

  track.addEventListener('pointermove',e=>{
    if(!dragging || e.pointerId!==pointerId)return;
    setTransform(startX + (e.clientX-startPointerX));
  });

  const release=()=>{
    if(!dragging)return;
    dragging=false; track.classList.remove('dragging');
    const s=step();
    const raw=(centerOffset()-baseX)/s;
    let nearest=Math.round(raw);
    nearest=Math.max(count,Math.min(count*4-1,nearest));
    index=nearest;
    animateTo(positionFor(index),500,()=>{normalize();scheduleAuto();});
  };
  track.addEventListener('pointerup',release);
  track.addEventListener('pointercancel',release);
  track.addEventListener('lostpointercapture',release);

  window.addEventListener('resize',()=>{
    const w=lifeViewport.clientWidth;
    if(Math.abs(w-lastWidth)>1){
      lastWidth=w;
      if(animation)cancelAnimationFrame(animation);
      animation=null;
      setTransform(positionFor(index));
    }
  });

  const init=()=>{
    lastWidth=lifeViewport.clientWidth;
    setTransform(positionFor(index));
    scheduleAuto();
  };
  if(document.readyState==='complete') init();
  else window.addEventListener('load',init,{once:true});
}
