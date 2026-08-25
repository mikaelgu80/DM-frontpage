(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const iconSvg = (name) => {
    const paths = {
      library: '<path d="M9 5v18M15 7v16M21 4v19M7 5h4M13 7h4M19 4h4M7 23h4M13 23h4M19 23h4"/>',
      package: '<rect x="5" y="5" width="8" height="8" rx="1"/><rect x="19" y="5" width="8" height="8" rx="1"/><rect x="19" y="19" width="8" height="8" rx="1"/><path d="M13 9h6M23 13v6M13 9v14h6"/>',
      maintenance: '<path d="M6 7h16M6 14h10M6 21h8"/><path d="m19 18 4-4 3 3-4 4-4 1z"/>'
    };
    return `<svg viewBox="0 0 32 32" aria-hidden="true">${paths[name] || paths.library}</svg>`;
  };

  async function loadContent() {
    try {
      const res = await fetch('content.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Could not load content.json. Serve this directory over HTTP.', err);
      return null;
    }
  }

  function populate(data) {
    if (!data) return;
    const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value || ''; };

    set('hero-eyebrow', data.hero.eyebrow); set('hero-title', data.hero.title); set('hero-lead', data.hero.lead);
    set('hero-primary', data.hero.primaryCta); set('hero-secondary', data.hero.secondaryCta);
    set('signal-eyebrow', data.signal.eyebrow); set('signal-title', data.signal.title); set('signal-body', data.signal.body);
    set('executive-eyebrow', data.executive.eyebrow); set('executive-title', data.executive.title); set('executive-body', data.executive.body); set('executive-statement', data.executive.statement);
    set('principles-eyebrow', data.principles.eyebrow); set('principles-title', data.principles.title);
    set('architecture-eyebrow', data.architecture.eyebrow); set('architecture-title', data.architecture.title); set('architecture-body', data.architecture.body);
    set('metrics-eyebrow', data.metrics?.eyebrow); set('metrics-title', data.metrics?.title); set('metrics-body', data.metrics?.body); set('metrics-note', data.metrics?.note);
    set('release-eyebrow', data.release.eyebrow); set('release-current-label', data.release.currentLabel); set('release-version', data.release.currentVersion);
    set('release-status', data.release.status); set('release-note', data.release.note);
    set('app-eyebrow', data.app.eyebrow); set('app-title', data.app.title); set('app-body', data.app.body);
    set('video-eyebrow', data.video.eyebrow); set('video-title', data.video.title); set('video-body', data.video.body);
    set('footer-line', data.footer.line); set('footer-note', data.footer.note);

    $('#signal-labels').innerHTML = data.signal.labels.map(label => `<span>${label}</span>`).join('');

    $('#executive-points').innerHTML = data.executive.points.map((item, index) => `
      <article class="value-item" data-reveal data-parallax="${index === 1 ? 0.012 : index === 2 ? -0.008 : 0.005}">
        <span class="num">${item.number}</span><h3>${item.title}</h3><p>${item.body}</p>
      </article>`).join('');

    $('#principle-list').innerHTML = data.principles.items.map(item => `
      <article class="principle-row" data-reveal>
        <span class="num">${item.number}</span><h3>${item.title}</h3><p>${item.body}</p>
      </article>`).join('');

    $('#layer-stack').innerHTML = data.architecture.layers.map((item, index) => `
      <article class="layer" data-reveal data-parallax="${0.005 + index * 0.004}">
        <span class="layer-label">${item.label}</span><h3>${item.title}</h3><p>${item.body}</p>
      </article>`).join('');

    const metricFormat = new Intl.NumberFormat(document.documentElement.lang || undefined);
    const metricValue = value => typeof value === 'number' ? metricFormat.format(value) : value;
    const metricCounter = (value, className = '') => typeof value === 'number'
      ? `<strong class="${className}" data-count-to="${value}">0</strong>`
      : `<strong class="${className}">${metricValue(value)}</strong>`;

    $('#metric-stream').innerHTML = (data.metrics?.items || []).map((item, index) => `
      <article class="metric-item ${item.secondary ? 'has-secondary' : ''}" data-reveal>
        <div class="metric-primary" data-parallax="${[0.006, -0.005, 0.004][index % 3]}">
          ${metricCounter(item.primary.value, 'metric-number')}
          <span class="metric-label">${item.primary.label}</span>
        </div>
        ${item.secondary ? `<div class="metric-secondary">${metricCounter(item.secondary.value)}<span>${item.secondary.label}</span></div>` : ''}
      </article>`).join('');

    setupMetricCounters(metricFormat);

    $('#primary-tools').innerHTML = data.app.primaryTools.map((item, index) => `
      <a class="tool-card" href="${item.href}" data-reveal>
        <span class="tool-index">0${index + 1}</span>
        <div class="tool-icon">${iconSvg(item.icon)}</div>
        <h3>${item.title}</h3><p>${item.caption}</p>
        <span class="tool-link"><span>Open tool</span><span>↗</span></span>
      </a>`).join('');

    $('#secondary-tools').innerHTML = data.app.secondaryTools.map(item => `
      <a class="secondary-link" href="${item.href}"><strong>${item.title}</strong><small>${item.caption}</small></a>`).join('');

    const allTools = [...data.app.primaryTools, ...data.app.secondaryTools];
    $('#drawer-tools').innerHTML = allTools.map((item, index) => `
      <a class="drawer-tool" href="${item.href}">
        <span class="tool-index">${String(index + 1).padStart(2, '0')}</span>
        <span><strong>${item.title}</strong><small>${item.caption}</small></span><span class="arrow">↗</span>
      </a>`).join('');

    setupVideo(data.video);
    setupReveal();
    setupParallax();
    document.dispatchEvent(new CustomEvent('wco-content-ready'));
  }

  function setupDrawer() {
    const drawer = $('#app-drawer'); const button = $('#menu-button');
    if (!drawer || !button) return;
    const close = () => { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); button.setAttribute('aria-expanded','false'); document.body.classList.remove('drawer-open'); };
    const open = () => { drawer.classList.add('open'); drawer.setAttribute('aria-hidden','false'); button.setAttribute('aria-expanded','true'); document.body.classList.add('drawer-open'); };
    button.addEventListener('click', () => drawer.classList.contains('open') ? close() : open());
    $$('[data-close-drawer]').forEach(el => el.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  function setupHeader() {
    const header = $('#site-header'); const light = $('[data-light-section]');
    if (!header) return;
    const update = () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
      if (!light) return;
      const r = light.getBoundingClientRect();
      header.classList.toggle('over-light', r.top < header.offsetHeight * .58 && r.bottom > header.offsetHeight * .58);
    };
    update(); window.addEventListener('scroll', update, { passive:true }); window.addEventListener('resize', update);
  }

  function setupMetricCounters(formatter) {
    const items = $$('.metric-item');
    if (!items.length) return;

    const setFinalValues = item => {
      $$('[data-count-to]', item).forEach(el => {
        el.textContent = formatter.format(Number(el.dataset.countTo));
      });
    };

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(setFinalValues);
      return;
    }

    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
    const animateItem = item => {
      if (item.dataset.counted === 'true') return;
      item.dataset.counted = 'true';

      $$('[data-count-to]', item).forEach((el, index) => {
        const target = Number(el.dataset.countTo);
        if (!Number.isFinite(target)) return;

        const duration = target >= 1000 ? 1550 : 1250;
        const delay = index * 110;
        const started = performance.now() + delay;

        const tick = now => {
          if (now < started) { requestAnimationFrame(tick); return; }
          const progress = Math.min(1, (now - started) / duration);
          const value = Math.round(target * easeOutCubic(progress));
          el.textContent = formatter.format(value);
          if (progress < 1) requestAnimationFrame(tick);
          else el.textContent = formatter.format(target);
        };

        requestAnimationFrame(tick);
      });
    };

    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateItem(entry.target);
      io.unobserve(entry.target);
    }), { threshold: .34, rootMargin: '0px 0px -8% 0px' });

    items.forEach(item => io.observe(item));
  }

  function setupReveal() {
    const els = $$('[data-reveal]:not(.visible)');
    if (reduceMotion || !('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('visible')); return; }
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); io.unobserve(entry.target); }
    }), { threshold:.14, rootMargin:'0px 0px -5% 0px' });
    els.forEach(el => io.observe(el));
  }

  function setupParallax() {
    if (reduceMotion) return;
    let ticking = false;
    const update = () => {
      const center = window.innerHeight / 2;
      $$('[data-parallax]').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -250 || rect.top > innerHeight + 250) return;
        const strength = Number(el.dataset.parallax || 0);
        const offset = (rect.top + rect.height / 2 - center) * strength * -1;
        el.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`);
        el.style.translate = `0 ${offset.toFixed(2)}px`;
      });
      ticking = false;
    };
    const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener('scroll', request, { passive:true }); addEventListener('resize', request); request();
  }

  function setupVideo(video) {
    const shell = $('#video-shell'); const button = $('#manual-play');
    if (!shell || !button || !video.youtubeId) return;
    const key = video.autoplayStorageKey || 'wcoDmIntroAutoplaySeen-v2'; let loaded = false;
    const loadPlayer = ({ autoplay=false, muted=false } = {}) => {
      if (loaded) return; loaded = true;
      const iframe = document.createElement('iframe');
      const params = new URLSearchParams({ rel:'0', modestbranding:'1', playsinline:'1', enablejsapi:'1', autoplay:autoplay?'1':'0', mute:muted?'1':'0' });
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtubeId)}?${params}`;
      iframe.title = 'WCO Data Model video';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'; iframe.allowFullscreen = true;
      $('#video-placeholder')?.remove(); shell.appendChild(iframe);
    };
    button.addEventListener('click', () => loadPlayer({ autoplay:true, muted:false }));
    let seen = false; try { seen = localStorage.getItem(key) === '1'; } catch (_) {}
    if (seen || reduceMotion || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      if (entry.isIntersecting && entry.intersectionRatio >= .985) {
        loadPlayer({ autoplay:true, muted:true }); try { localStorage.setItem(key,'1'); } catch (_) {} observer.disconnect();
      }
    }, { threshold:[0,.5,.9,.985,1] });
    observer.observe(shell);
  }

  function setupWorld() {
    const canvas = $('#world-canvas'); if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha:true });
    let w=0,h=0,dpr=1,routes=[],stars=[],worldOpacity=1,worldStopScroll=1;
    const rand=(a,b)=>Math.random()*(b-a)+a;
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

    // PASS 1 — WORLD / TRAIL TUNING
    // These are intentionally collected in one place so the visual can be tuned
    // without touching the route-generation maths below.
    const WORLD_TUNING = {
      routes: {
        mobileCount: 8,
        desktopCount: 13,

        // Route mix. "Steep" routes create more diagonal / vertical-looking travel;
        // "local" routes connect nearby areas instead of crossing most of the planet.
        steepRouteChance: .22,
        localRouteChance: .44,

        // A minority of routes are allowed to cross the apparent horizon. This is a
        // deliberately 2D illusion: hidden route segments simply stop rendering while
        // they are 'behind' the planet, then can reappear on the visible surface.
        horizonRouteChance: .18,
        horizonWrapChance: .35,
        horizonOvershootMin: .03,
        horizonOvershootMax: .14,
        horizonFadeDistance: .03,

        // PASS 1.2 — single-use route lifecycle. Each generated pathway carries
        // one impulse, fades away, rests briefly, then that slot is regenerated
        // with completely new geometry.
        restMinMs: 500,
        restMaxMs: 4500,
        routeFadeInMs: 800,
        routeFadeOutMs: 1400,
        initialProgressMax: .92,

        // The route is only revealed slightly ahead of its travelling impulse.
        // This makes the pathway feel activated rather than permanently wired in.
        pathLeadMin: .055,
        pathLeadMax: .105,

        // Horizontal reach across the visible planet surface.
        outerEndpoint: .975,
        innerEndpoint: .08,
        localSpanMin: .34,
        localSpanMax: .92,
        steepSpanMin: .20,
        steepSpanMax: .52,

        // How far paths are allowed to descend from the upper ellipse edge.
        // Mid-depth is the strongest control for overall surface coverage.
        depthStartMin: .03,
        depthStartMax: .25,
        depthMidMin: .18,
        depthMidMax: .48,
        depthEndMin: .03,
        depthEndMax: .27,

        // Steep routes deliberately connect a shallow point to a much deeper point.
        steepShallowMin: .025,
        steepShallowMax: .16,
        steepDeepMin: .34,
        steepDeepMax: .55,
        steepMidMin: .22,
        steepMidMax: .48,

        // Horizontal curvature. Bow gives the broad arc; meander adds a restrained S-curve.
        bowMin: -.115,
        bowMax: .115,
        meanderMin: -.045,
        meanderMax: .045,

        surfaceClamp: .982,
        pathSteps: 64,
        trailSegments: 18,

        speedMin: .000012,
        speedMax: .000028,
        alphaMin: .055,
        alphaMax: .14,
        widthMin: .45,
        widthMax: 1.15,
        trailMin: .065,
        trailMax: .13
      }
    };

    const palette={
      blue:'107,196,235',
      gold:'213,181,118',
      green:'145,194,161',
      red:'194,129,124'
    };

    function pickHue() {
      const n=Math.random();
      if(n<.54) return 'blue';
      if(n<.74) return 'gold';
      if(n<.90) return 'green';
      return 'red';
    }

    function updateWorldStop() {
      const principles=$('#principles');
      // The planet should have completed its ascent just before the "Invisible when it works..." chapter settles into view.
      worldStopScroll=principles ? Math.max(h, principles.offsetTop - h*.12) : h*3.2;
    }

    function build() {
      dpr=Math.min(devicePixelRatio||1,2); w=innerWidth; h=innerHeight;
      canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr); canvas.style.width=w+'px'; canvas.style.height=h+'px'; ctx.setTransform(dpr,0,0,dpr,0,0);
      stars=Array.from({length:w<720?24:52},()=>({x:rand(0,w),y:rand(0,h*.66),r:rand(.3,1.1),a:rand(.04,.18)}));
      routes=[];
      const cfg=WORLD_TUNING.routes;
      const count=w<720?cfg.mobileCount:cfg.desktopCount;
      const now=performance.now();
      for(let i=0;i<count;i++) routes.push(makeRoute(now,true));
      updateWorldStop();
    }

    function makeRoute(now=performance.now(),initial=false) {
      const cfg=WORLD_TUNING.routes;
      const leftToRight=Math.random()>=.5;
      const roll=Math.random();
      const kind=roll<cfg.steepRouteChance ? 'steep' : roll<cfg.steepRouteChance+cfg.localRouteChance ? 'local' : 'cross';
      let a,b;

      if(kind==='cross') {
        a=leftToRight?rand(-cfg.outerEndpoint,-cfg.innerEndpoint):rand(cfg.innerEndpoint,cfg.outerEndpoint);
        b=leftToRight?rand(cfg.innerEndpoint,cfg.outerEndpoint):rand(-cfg.outerEndpoint,-cfg.innerEndpoint);
      } else {
        const span=kind==='steep' ? rand(cfg.steepSpanMin,cfg.steepSpanMax) : rand(cfg.localSpanMin,cfg.localSpanMax);
        const center=rand(-.62,.62);
        a=clamp(center-span/2,-cfg.outerEndpoint,cfg.outerEndpoint);
        b=clamp(center+span/2,-cfg.outerEndpoint,cfg.outerEndpoint);
        if(!leftToRight) [a,b]=[b,a];
      }

      let depth0,depth1,depth2;
      if(kind==='steep') {
        const shallow=rand(cfg.steepShallowMin,cfg.steepShallowMax);
        const deep=rand(cfg.steepDeepMin,cfg.steepDeepMax);
        const descends=Math.random()>=.5;
        depth0=descends?shallow:deep;
        depth2=descends?deep:shallow;
        depth1=rand(cfg.steepMidMin,cfg.steepMidMax);
      } else {
        depth0=rand(cfg.depthStartMin,cfg.depthStartMax);
        depth1=rand(cfg.depthMidMin,cfg.depthMidMax);
        depth2=rand(cfg.depthEndMin,cfg.depthEndMax);
      }

      // Horizon routes are still ordinary 2D curves. An "edge" route has one
      // endpoint just behind the horizon. A "wrap" route dips behind the planet
      // around its middle and later reappears. No sphere / WebGL maths required.
      let horizonMode='none';
      let horizonOvershoot=0;
      let horizonLift=0;
      if(Math.random()<cfg.horizonRouteChance) {
        horizonMode=Math.random()<cfg.horizonWrapChance?'wrap':'edge';
        horizonOvershoot=rand(cfg.horizonOvershootMin,cfg.horizonOvershootMax);

        if(horizonMode==='edge') {
          if(Math.random()<.5) depth0=-horizonOvershoot;
          else depth2=-horizonOvershoot;
        } else {
          // At t=.5 a quadratic Bezier weighs the middle depth by .5 and each
          // endpoint by .25. Choosing this lift makes the route sit exactly
          // `horizonOvershoot` behind the horizon at its midpoint.
          const midDepth=.25*depth0+.5*depth1+.25*depth2;
          horizonLift=midDepth+horizonOvershoot;
        }
      }

      const speed=rand(cfg.speedMin,cfg.speedMax);
      const startAt=initial
        // Seed the first frame at varied points in a one-time traversal so the
        // page opens with a calm, already-living population rather than 13 simultaneous starts.
        ? now-rand(0,cfg.initialProgressMax/speed)
        // Replacements wait quietly before their single impulse begins.
        : now+rand(cfg.restMinMs,cfg.restMaxMs);

      return {
        a,b,depth0,depth1,depth2,horizonMode,horizonLift,
        bow:rand(cfg.bowMin,cfg.bowMax),
        meander:rand(cfg.meanderMin,cfg.meanderMax),
        speed,startAt,pathLead:rand(cfg.pathLeadMin,cfg.pathLeadMax),
        alpha:rand(cfg.alphaMin,cfg.alphaMax), width:rand(cfg.widthMin,cfg.widthMax), hue:pickHue(), trail:rand(cfg.trailMin,cfg.trailMax)
      };
    }

    function sectionWorldOpacity() {
      const light=$('[data-light-section]');
      if (!light) return 1;
      const r=light.getBoundingClientRect();
      const pad=h*.14;
      if (r.top>h || r.bottom<0) return 1;
      const enter=Math.max(0,Math.min(1,(h-r.top)/pad));
      const exit=Math.max(0,Math.min(1,r.bottom/pad));
      return 1-Math.min(1,enter,exit)*.96;
    }

    function rotateLocal(x,y,planet){
      const c=Math.cos(planet.tilt),s=Math.sin(planet.tilt);
      return {x:planet.cx+x*c-y*s,y:planet.cy+x*s+y*c};
    }

    function pointOnCurve(route,t,planet) {
      const cfg=WORLD_TUNING.routes;
      const u=1-t;
      // Broad arc + a subtle second harmonic gives routes more directional variety
      // while keeping both endpoints anchored exactly where they were generated.
      let nx=route.a+(route.b-route.a)*t;
      nx+=Math.sin(Math.PI*t)*route.bow;
      nx+=Math.sin(Math.PI*2*t)*route.meander;
      nx=clamp(nx,-cfg.surfaceClamp,cfg.surfaceClamp);

      // Quadratic depth interpolation moves the path across the actual visible surface.
      // Wrap routes temporarily subtract enough depth to pass behind the horizon.
      let depth=u*u*route.depth0+2*u*t*route.depth1+t*t*route.depth2;
      if(route.horizonMode==='wrap') depth-=Math.sin(Math.PI*t)*route.horizonLift;
      const xLocal=nx*planet.rx;
      const rimY=-Math.sqrt(Math.max(0,1-nx*nx))*planet.ry;
      const yLocal=rimY+depth*planet.ry;
      return {...rotateLocal(xLocal,yLocal,planet),depth};
    }

    function drawPlanet(scroll) {
      const clampedScroll=Math.min(scroll,worldStopScroll);
      const raw=clamp(clampedScroll/worldStopScroll,0,1);
      // Starts moving immediately, then eases into a complete stop at the principles chapter.
      const travel=1-Math.pow(1-raw,1.72);
      const startCy=h*(w<720?1.27:1.31);
      const endCy=h*(w<720?1.18:1.175);
      const cx=w*(w<720?.58:.60)+Math.sin(clampedScroll*.00025)*w*.012;
      const cy=startCy+(endCy-startCy)*travel;
      const rx=Math.max(w,h)*(w<720?.82:.91);
      const ry=rx*.52;
      // A tiny clockwise-looking lift on the right / drop on the left. ~3° is just enough to feel less geometrically perfect.
      const tilt=w<720?-.032:-.050;
      const planet={cx,cy,rx,ry,tilt};

      for(const s of stars){ctx.fillStyle=`rgba(194,220,233,${s.a*worldOpacity})`;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();}

      ctx.save();
      const glow=ctx.createRadialGradient(cx,cy-ry*.56,ry*.08,cx,cy,rx*1.08);
      glow.addColorStop(0,'rgba(20,60,81,0)'); glow.addColorStop(.62,`rgba(12,38,53,${.10*worldOpacity})`); glow.addColorStop(.8,`rgba(15,48,65,${.18*worldOpacity})`); glow.addColorStop(1,'rgba(2,7,11,0)');
      ctx.fillStyle=glow;ctx.beginPath();ctx.ellipse(cx,cy,rx*1.05,ry*1.04,tilt,0,Math.PI*2);ctx.fill();

      const body=ctx.createRadialGradient(cx-rx*.25,cy-ry*.8,ry*.1,cx,cy,rx*.95);
      body.addColorStop(0,'rgba(8,24,33,.94)'); body.addColorStop(.43,'rgba(3,11,17,.98)'); body.addColorStop(1,'rgba(1,5,8,1)');
      ctx.fillStyle=body;ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,tilt,0,Math.PI*2);ctx.fill();

      for(let i=0;i<4;i++){
        ctx.beginPath();ctx.ellipse(cx,cy,rx+i*1.5,ry+i*.8,tilt,Math.PI*1.03,Math.PI*1.97);
        ctx.strokeStyle=`rgba(${i===3?'198,225,239':'98,190,230'},${(.18-i*.025)*worldOpacity})`;
        ctx.lineWidth=i===0?.8:2+i*1.5;ctx.shadowBlur=10+i*8;ctx.shadowColor='rgba(75,174,219,.24)';ctx.stroke();
      }
      ctx.restore();
      return planet;
    }

    function drawRoutes(now,planet) {
      const cfg=WORLD_TUNING.routes;
      for(let routeIndex=0;routeIndex<routes.length;routeIndex++){
        const r=routes[routeIndex];
        const elapsed=now-r.startAt;

        // This slot is between routes: the previous pathway is gone and the
        // freshly generated one is waiting for its random start delay.
        if(elapsed<0) continue;

        const progress=elapsed*r.speed;
        const trailExitAt=(1+r.trail)/r.speed;
        const retireAt=trailExitAt+cfg.routeFadeOutMs;

        // A route is never replayed. Once its pulse, tail and residual pathway
        // have disappeared, replace the slot with brand-new geometry.
        if(elapsed>=retireAt){
          routes[routeIndex]=makeRoute(now,false);
          continue;
        }

        let lifecycleAlpha=clamp(elapsed/cfg.routeFadeInMs,0,1);
        if(elapsed>trailExitAt){
          lifecycleAlpha*=1-clamp((elapsed-trailExitAt)/cfg.routeFadeOutMs,0,1);
        }

        const color=palette[r.hue] || palette.blue;
        const pathEnd=clamp(progress+r.pathLead,0,1);
        ctx.save();

        // Reveal only the part of the pathway already activated by the impulse,
        // plus a small lead ahead of it. The trace remains faintly visible behind.
        if(pathEnd>0){
          ctx.beginPath();
          const sampleCount=Math.max(1,Math.ceil(cfg.pathSteps*pathEnd));
          let drawing=false;
          for(let i=0;i<=sampleCount;i++){
            const tt=pathEnd*(i/sampleCount);
            const p=pointOnCurve(r,tt,planet);
            // depth <= 0 is behind the apparent horizon. Starting a new sub-path
            // when it becomes positive again creates the wraparound illusion.
            if(p.depth<=0){drawing=false;continue;}
            if(!drawing){ctx.moveTo(p.x,p.y);drawing=true;}
            else ctx.lineTo(p.x,p.y);
          }
          ctx.strokeStyle=`rgba(${color},${r.alpha*lifecycleAlpha*worldOpacity})`;
          ctx.lineWidth=r.width;
          ctx.shadowBlur=7;
          ctx.shadowColor=`rgba(${color},${.16*lifecycleAlpha*worldOpacity})`;
          ctx.stroke();
        }

        // No modulo: the impulse traverses this route exactly once. After the
        // head leaves the far end, the remaining trail continues to drain away.
        const segments=cfg.trailSegments;
        for(let s=0;s<segments;s++){
          const tt=progress-s*(r.trail/segments);
          if(tt<0 || tt>1) continue;
          const p=pointOnCurve(r,tt,planet);
          const horizonFade=clamp(p.depth/cfg.horizonFadeDistance,0,1);
          if(horizonFade<=0) continue;
          const fade=(1-s/segments);
          ctx.fillStyle=`rgba(${color},${(.07+.52*fade)*horizonFade*lifecycleAlpha*worldOpacity})`;
          ctx.shadowBlur=11+16*fade;
          ctx.shadowColor=`rgba(${color},${.44*horizonFade*lifecycleAlpha*worldOpacity})`;
          ctx.beginPath();
          ctx.ellipse(p.x,p.y,1.15+2.35*fade,.68+1.18*fade,0,0,Math.PI*2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    function frame(now=0){
      const scroll=scrollY||0; worldOpacity=sectionWorldOpacity();
      ctx.clearRect(0,0,w,h);
      const planet=drawPlanet(scroll);
      if(!reduceMotion) drawRoutes(now,planet); else drawRoutes(0,planet);
      requestAnimationFrame(frame);
    }

    build();
    addEventListener('resize',build);
    document.addEventListener('wco-content-ready',()=>requestAnimationFrame(updateWorldStop));
    requestAnimationFrame(frame);
  }

  setupDrawer(); setupHeader(); setupWorld(); loadContent().then(populate);
})();
