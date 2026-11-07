(() => {
  'use strict';
  const albums = JSON.parse(document.getElementById('album-data').textContent);
  const audio = document.getElementById('audio');
  const player = document.getElementById('mini-player');
  const toggle = document.getElementById('toggle-play');
  const seek = document.getElementById('seek');
  const status = document.getElementById('player-status');
  const dialog = document.getElementById('platform-dialog');
  let currentAlbum = null, currentTrack = -1, playbackRequest = 0, previousFocus = null, lastSource = null;
  const formatTime = n => Number.isFinite(n) ? Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0') : '0:00';
  const getAlbum = key => albums.find(a => a.key === key);
  function updateButtons() {
    toggle.textContent = audio.paused ? '▶' : 'Ⅱ';
    toggle.setAttribute('aria-label', audio.paused ? 'Play preview' : 'Pause preview');
    document.querySelectorAll('[data-album][data-track]').forEach(button => {
      const selected = button.dataset.album === currentAlbum?.key && Number(button.dataset.track) === currentTrack;
      const playing = selected && !audio.paused;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(playing));
      if (button.classList.contains('track')) {
        button.setAttribute('aria-label', (playing ? 'Pause' : 'Play')+' preview of '+getAlbum(button.dataset.album).tracks[Number(button.dataset.track)].title);
        button.querySelector('.track-play').innerHTML = playing ? '<span aria-hidden="true" style="font-size:10px">Ⅱ</span>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7Z" fill="currentColor"/></svg>';
      }
    });
  }
  async function playTrack(key,index) {
    const album = getAlbum(key);
    if (!album || !album.tracks[index]) return;
    const request = ++playbackRequest;
    if (currentAlbum?.key === key && currentTrack === index && !player.hidden) {
      if (!audio.paused) { audio.pause(); return; }
      try { await audio.play(); if(request === playbackRequest) status.textContent=''; }
      catch(error) { if(error.name !== 'AbortError' && request === playbackRequest) status.textContent='This preview is unavailable right now. Use “Full album” to keep listening.'; }
      return;
    }
    currentAlbum=album; currentTrack=index;
    audio.pause(); audio.src=album.tracks[index].preview;
    document.getElementById('player-title').textContent=album.tracks[index].title;
    document.getElementById('player-art').src='assets/'+album.art+'.jpg';
    document.getElementById('player-full').href='https://open.spotify.com/album/'+album.id;
    document.getElementById('player-full').setAttribute('aria-label','Listen to the full '+album.title+' album on Spotify (opens in a new tab)');
    document.getElementById('elapsed').textContent='0:00';
    document.getElementById('duration').textContent='0:00';
    seek.value=0; seek.disabled=true; seek.setAttribute('aria-valuetext','0:00');
    player.hidden=false; document.body.classList.add('has-player');
    status.textContent='Loading preview…'; updateButtons();
    try { await audio.play(); if(request === playbackRequest) status.textContent=''; }
    catch(error) { if(request === playbackRequest && error.name !== 'AbortError') status.textContent='This preview is unavailable right now. Use “Full album” to keep listening.'; }
  }
  document.querySelectorAll('[data-album][data-track]').forEach(button => button.addEventListener('click',()=>{lastSource=button;playTrack(button.dataset.album,Number(button.dataset.track));}));
  toggle.addEventListener('click',()=>{if(currentAlbum) playTrack(currentAlbum.key,currentTrack);});
  document.getElementById('previous-track').addEventListener('click',()=>{if(currentAlbum) playTrack(currentAlbum.key,(currentTrack-1+currentAlbum.tracks.length)%currentAlbum.tracks.length);});
  document.getElementById('next-track').addEventListener('click',()=>{if(currentAlbum) playTrack(currentAlbum.key,(currentTrack+1)%currentAlbum.tracks.length);});
  document.getElementById('close-player').addEventListener('click',()=>{
    ++playbackRequest;audio.pause();audio.removeAttribute('src');audio.load();player.hidden=true;document.body.classList.remove('has-player');
    currentAlbum=null;currentTrack=-1;updateButtons();lastSource?.focus({preventScroll:true});
  });
  audio.addEventListener('play',updateButtons);audio.addEventListener('pause',updateButtons);
  audio.addEventListener('loadedmetadata',()=>{document.getElementById('duration').textContent=formatTime(audio.duration);seek.disabled=!Number.isFinite(audio.duration);});
  audio.addEventListener('timeupdate',()=>{
    document.getElementById('elapsed').textContent=formatTime(audio.currentTime);
    seek.value=Number.isFinite(audio.duration)&&audio.duration>0 ? audio.currentTime/audio.duration*100 : 0;
    seek.setAttribute('aria-valuetext',formatTime(audio.currentTime)+' of '+formatTime(audio.duration));
  });
  audio.addEventListener('ended',()=>{updateButtons();status.textContent='Preview finished. Hear the full song on your listening platform.';});
  audio.addEventListener('error',()=>{if(!player.hidden){status.textContent='This preview is unavailable right now. Use “Full album” to keep listening.';updateButtons();}});
  seek.addEventListener('input',()=>{if(Number.isFinite(audio.duration)) audio.currentTime=Number(seek.value)/100*audio.duration;});
  document.querySelectorAll('[data-expand]').forEach(button=>button.addEventListener('click',()=>{
    const expanded=button.getAttribute('aria-expanded')==='true';
    document.querySelectorAll('#'+button.dataset.expand+' .extra-track').forEach(row=>{row.hidden=expanded;});
    button.setAttribute('aria-expanded',String(!expanded));
    button.innerHTML=(expanded ? 'Show all '+getAlbum(button.dataset.expand).tracks.length+' tracks' : 'Show fewer tracks')+' <span aria-hidden="true">'+(expanded ? '+' : '−')+'</span>';
  }));
  document.querySelectorAll('[data-platforms]').forEach(button=>button.addEventListener('click',()=>{
    const album=getAlbum(button.dataset.platforms);previousFocus=button;
    document.getElementById('platform-title').textContent=album.title;
    document.getElementById('platform-art').src='assets/'+album.art+'.jpg';
    const links=[
      ['Spotify','https://open.spotify.com/album/'+album.id],
      ['Apple Music','https://music.apple.com/us/album/'+album.apple],
      ['Deezer','https://www.deezer.com/album/'+album.deezer],
      ['iTunes','https://music.apple.com/us/album/'+album.apple+'?app=itunes'],
      ['All release links',album.key==='quantum'?'https://distrokid.com/hyperfollow/djd61/quantum-playground-2':'https://distrokid.com/hyperfollow/djd61/we-dont-do-background-music']
    ];
    document.getElementById('platform-options').replaceChildren(...links.map(([label,url])=>{
      const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;
      a.setAttribute('aria-label',label+': '+album.title+' (opens in a new tab)');
      const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');a.append(arrow);return a;
    }));
    dialog.showModal();
  }));
  dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>previousFocus?.focus({preventScroll:true}));
  document.getElementById('year').textContent=new Date().getFullYear();

  // Register the moving shoe to the original background at every breakpoint.
  const heroArtwork = document.querySelector('.hero-art');
  const footArtwork = document.querySelector('.hero-foot-motion');
  if (heroArtwork && footArtwork) {
    const positionFactor = value => value.endsWith('%') ? parseFloat(value) / 100 : ({left:0,top:0,center:.5,right:1,bottom:1}[value] ?? .5);
    function alignFootArtwork() {
      const style = getComputedStyle(heroArtwork);
      const width = heroArtwork.clientWidth, height = heroArtwork.clientHeight;
      const dimensions = style.backgroundSize.split(/\s+/);
      let scale;
      if (style.backgroundSize === 'cover') scale = Math.max(width / 1672, height / 941);
      else if (style.backgroundSize === 'contain') scale = Math.min(width / 1672, height / 941);
      else if (dimensions[1]?.endsWith('px')) scale = parseFloat(dimensions[1]) / 941;
      else if (dimensions[0]?.endsWith('px')) scale = parseFloat(dimensions[0]) / 1672;
      else scale = Math.max(width / 1672, height / 941);
      const imageWidth = 1672 * scale, imageHeight = 941 * scale;
      footArtwork.style.width = imageWidth + 'px';
      footArtwork.style.height = imageHeight + 'px';
      footArtwork.style.left = (width - imageWidth) * positionFactor(style.backgroundPositionX) + 'px';
      footArtwork.style.top = (height - imageHeight) * positionFactor(style.backgroundPositionY) + 'px';
      footArtwork.classList.add('is-aligned');
    }
    alignFootArtwork();
    if ('ResizeObserver' in window) new ResizeObserver(alignFootArtwork).observe(heroArtwork);
    window.addEventListener('resize', alignFootArtwork, {passive:true});
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
      footArtwork.classList.toggle('is-offscreen', !entries[0].isIntersecting);
    }).observe(heroArtwork);
  }

  if('mediaSession' in navigator && 'MediaMetadata' in window) audio.addEventListener('play',()=>{
    if(currentAlbum) navigator.mediaSession.metadata=new MediaMetadata({title:currentAlbum.tracks[currentTrack].title,artist:'DJD',album:currentAlbum.title,artwork:[{src:new URL('assets/'+currentAlbum.art+'.jpg',location.href).href,sizes:'800x800',type:'image/jpeg'}]});
  });
})();