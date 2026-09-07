const burger=document.querySelector('.burger');
const nav=document.querySelector('.nav nav');
if(burger){burger.addEventListener('click',()=>{nav.classList.toggle('open');document.body.classList.toggle('menu-open')})}
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  const el=document.querySelector(a.getAttribute('href'));
  if(el){e.preventDefault();el.scrollIntoView({behavior:'smooth'});nav?.classList.remove('open');document.body.classList.remove('menu-open')}
}));

/* Жизнь Фрегата — аккуратная конечная карусель: 3 кадра, центр всегда точно по оси */
const lifeViewport=document.querySelector('.life-viewport');
const track=document.querySelector('.life-track');
const prev=document.querySelector('.life-prev');
const next=document.querySelector('.life-next');

if(track && lifeViewport){
  const cards=[...track.children];
  const count=cards.length;
  let index=0;
  let baseX=0;
  let animation=null;
  let dragging=false;
  let pointerId=null;
  let startPointerX=0;
  let startX=0;
  let autoTimer=null;
  let resumeTimer=null;

  const gap=()=>parseFloat(getComputedStyle(track).gap)||18;
  const step=()=>{
    const c=cards[0];
    return c ? c.getBoundingClientRect().width + gap() : 0;
  };
  const centerOffset=()=>{
    const c=cards[0];
    if(!c) return 0;
    return (lifeViewport.clientWidth-c.getBoundingClientRect().width)/2;
  };
  const positionFor=i=>centerOffset()-i*step();

  const setTransform=x=>{
    baseX=x;
    track.style.transform=`translate3d(${x}px,0,0)`;
    updateVisuals();
  };

  const updateVisuals=()=>{
    const viewportRect=lifeViewport.getBoundingClientRect();
    const vc=viewportRect.left + viewportRect.width/2;
    cards.forEach((card,i)=>{
      const r=card.getBoundingClientRect();
      const cc=r.left+r.width/2;
      const distance=Math.abs(cc-vc);
      const normalized=Math.min(1,distance/(step()*1.05));
      const focus=1-normalized;
      const scale=0.84 + focus*0.16;
      card.style.setProperty('--card-scale',scale.toFixed(3));
      card.style.zIndex=String(Math.round(20+focus*30));
    });
  };

  const ease=t=>t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;

  const animateTo=x=>{
    if(animation) cancelAnimationFrame(animation);
    const from=baseX;
    const delta=x-from;
    const start=performance.now();
    const duration=720;
    const frame=now=>{
      const p=Math.min(1,(now-start)/duration);
      setTransform(from+delta*ease(p));
      if(p<1) animation=requestAnimationFrame(frame);
      else animation=null;
    };
    animation=requestAnimationFrame(frame);
  };

  const updateButtons=()=>{
    if(prev) prev.disabled=index<=0;
    if(next) next.disabled=index>=count-1;
  };

  const go=direction=>{
    if(dragging || animation) return;
    const nextIndex=Math.max(0,Math.min(count-1,index+direction));
    if(nextIndex===index){updateButtons();scheduleAuto();return;}
    index=nextIndex;
    animateTo(positionFor(index));
    updateButtons();
    scheduleAuto();
  };

  const scheduleAuto=()=>{
    clearTimeout(autoTimer);
    if(index>=count-1 || document.hidden) return;
    autoTimer=setTimeout(()=>{
      if(!dragging && !animation && !document.hidden) go(1);
      else scheduleAuto();
    },2800);
  };

  prev?.addEventListener('click',()=>{clearTimeout(autoTimer);go(-1)});
  next?.addEventListener('click',()=>{clearTimeout(autoTimer);go(1)});

  track.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse' && e.button!==0)return;
    if(animation){cancelAnimationFrame(animation);animation=null;}
    clearTimeout(autoTimer);clearTimeout(resumeTimer);
    dragging=true;pointerId=e.pointerId;startPointerX=e.clientX;startX=baseX;
    track.classList.add('dragging');
    track.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  });

  track.addEventListener('pointermove',e=>{
    if(!dragging || e.pointerId!==pointerId)return;
    const raw=startX+(e.clientX-startPointerX);
    const minX=positionFor(count-1), maxX=positionFor(0);
    const bounded=Math.max(minX,Math.min(maxX,raw));
    setTransform(bounded);
  });

  const release=()=>{
    if(!dragging)return;
    dragging=false;track.classList.remove('dragging');
    const s=step();
    const raw=(centerOffset()-baseX)/s;
    index=Math.max(0,Math.min(count-1,Math.round(raw)));
    animateTo(positionFor(index));
    updateButtons();
    clearTimeout(resumeTimer);
    resumeTimer=setTimeout(scheduleAuto,900);
  };
  track.addEventListener('pointerup',release);
  track.addEventListener('pointercancel',release);
  track.addEventListener('lostpointercapture',release);

  document.addEventListener('visibilitychange',()=>{
    clearTimeout(autoTimer);
    if(!document.hidden) scheduleAuto();
  });

  let resizeRaf;
  window.addEventListener('resize',()=>{
    cancelAnimationFrame(resizeRaf);
    resizeRaf=requestAnimationFrame(()=>{
      if(animation){cancelAnimationFrame(animation);animation=null;}
      setTransform(positionFor(index));
      updateButtons();
    });
  });

  const init=()=>{
    setTransform(positionFor(index));
    updateButtons();
    scheduleAuto();
  };
  if(document.readyState==='complete') init();
  else window.addEventListener('load',init,{once:true});
}
