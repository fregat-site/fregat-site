const burger=document.querySelector('.burger');
const nav=document.querySelector('.nav nav');
if(burger){burger.addEventListener('click',()=>{nav.classList.toggle('open');document.body.classList.toggle('menu-open')})}
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  const el=document.querySelector(a.getAttribute('href'));
  if(el){e.preventDefault();el.scrollIntoView({behavior:'smooth'});nav?.classList.remove('open');document.body.classList.remove('menu-open')}
}));

/* Бесконечная фотокарусель «Жизнь Фрегата» */
const track=document.querySelector('.life-track');
const prev=document.querySelector('.life-prev');
const next=document.querySelector('.life-next');
if(track){
  const originals=[...track.children];
  const count=originals.length;
  const copy=(arr)=>arr.map(el=>el.cloneNode(true));

  // Делаем пять одинаковых кругов. Центральный круг — рабочая зона.
  track.innerHTML='';
  track.append(...copy(originals),...copy(originals),...copy(originals),...copy(originals),...copy(originals));

  let currentIndex=count*2 + Math.floor(count/2);
  let dragging=false;
  let pointerId=null;
  let startX=0;
  let startScroll=0;
  let autoTimer=null;
  let raf=0;
  let snapTimer=null;
  let autoMoving=false;

  const cards=()=>[...track.children];
  const getStep=()=>{
    const cs=cards();
    return cs.length>1 ? cs[1].offsetLeft-cs[0].offsetLeft : 0;
  };
  const centerTarget=(index)=>{
    const card=cards()[index];
    if(!card)return track.scrollLeft;
    return card.offsetLeft + card.offsetWidth/2 - track.clientWidth/2;
  };

  const updateScale=()=>{
    raf=0;
    const viewportCenter=track.scrollLeft + track.clientWidth/2;
    const maxDistance=track.clientWidth*.72;
    cards().forEach(card=>{
      const center=card.offsetLeft + card.offsetWidth/2;
      const distance=Math.abs(center-viewportCenter);
      const t=Math.max(0,1-Math.min(distance/maxDistance,1));
      const scale=.82 + t*.18;
      const opacity=.58 + t*.42;
      card.style.setProperty('--card-scale',scale.toFixed(3));
      card.style.setProperty('--card-opacity',opacity.toFixed(3));
    });
  };

  const requestScale=()=>{
    if(!raf)raf=requestAnimationFrame(updateScale);
  };

  // Возвращаемся в центральную копию незаметно для пользователя.
  const recenter=()=>{
    if(currentIndex < count){
      currentIndex += count*2;
      track.style.scrollBehavior='auto';
      track.scrollLeft=centerTarget(currentIndex);
      track.style.scrollBehavior='smooth';
    }else if(currentIndex >= count*4){
      currentIndex -= count*2;
      track.style.scrollBehavior='auto';
      track.scrollLeft=centerTarget(currentIndex);
      track.style.scrollBehavior='smooth';
    }
    requestScale();
  };

  const findNearestIndex=()=>{
    const cs=cards();
    const viewportCenter=track.scrollLeft+track.clientWidth/2;
    let nearest=currentIndex;
    let best=Infinity;
    cs.forEach((card,i)=>{
      const d=Math.abs(card.offsetLeft+card.offsetWidth/2-viewportCenter);
      if(d<best){best=d;nearest=i;}
    });
    return nearest;
  };

  const goToIndex=(index,smooth=true)=>{
    currentIndex=index;
    clearTimeout(snapTimer);
    track.style.scrollBehavior=smooth?'smooth':'auto';
    if(smooth){
      autoMoving=true;
      track.scrollTo({left:centerTarget(index),behavior:'smooth'});
      // Один шаг = одна фотография. После окончания анимации только проверяем границы.
      snapTimer=setTimeout(()=>{
        autoMoving=false;
        recenter();
        requestScale();
      },760);
    }else{
      track.scrollLeft=centerTarget(index);
      autoMoving=false;
      requestScale();
    }
  };

  const move=(direction)=>{
    if(dragging)return;
    // Всегда ровно на одну карточку, никаких повторных циклов.
    goToIndex(currentIndex+direction,true);
  };

  prev?.addEventListener('click',()=>move(-1));
  next?.addEventListener('click',()=>move(1));

  const startAuto=()=>{
    clearInterval(autoTimer);
    autoTimer=setInterval(()=>{
      if(!document.hidden && !dragging && !autoMoving) move(1);
    },3000);
  };

  track.addEventListener('scroll',requestScale,{passive:true});

  track.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse' && e.button!==0)return;
    dragging=true;
    autoMoving=false;
    clearTimeout(snapTimer);
    clearInterval(autoTimer);
    pointerId=e.pointerId;
    startX=e.clientX;
    startScroll=track.scrollLeft;
    track.style.scrollBehavior='auto';
    track.classList.add('dragging');
    track.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  });

  track.addEventListener('pointermove',e=>{
    if(!dragging || e.pointerId!==pointerId)return;
    track.scrollLeft=startScroll-(e.clientX-startX);
    requestScale();
  });

  const release=()=>{
    if(!dragging)return;
    dragging=false;
    track.classList.remove('dragging');

    // На отпускании мыши выбираем ближайшую фотографию и плавно ставим её в центр.
    let nearest=findNearestIndex();
    while(nearest < count*2) nearest += count;
    while(nearest >= count*3) nearest -= count;
    goToIndex(nearest,true);
    startAuto();
  };

  track.addEventListener('pointerup',release);
  track.addEventListener('pointercancel',release);
  track.addEventListener('lostpointercapture',release);

  window.addEventListener('resize',()=>{
    track.style.scrollBehavior='auto';
    track.scrollLeft=centerTarget(currentIndex);
    track.style.scrollBehavior='smooth';
    requestScale();
  });

  const init=()=>{
    track.style.scrollBehavior='auto';
    track.scrollLeft=centerTarget(currentIndex);
    track.style.scrollBehavior='smooth';
    requestScale();
    startAuto();
  };

  if(document.readyState==='complete') init();
  else window.addEventListener('load',init,{once:true});
}
