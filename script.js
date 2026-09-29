const cards = [...document.querySelectorAll('.project-card')];
const dots = [...document.querySelectorAll('.pagination button')];
const track = document.querySelector('.project-track');
let activeProject = 2;
let projectAutoPlayTimer;
let projectToastTimer;

function showProjectToast(message) {
  let toast = document.querySelector('.project-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'project-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  window.clearTimeout(projectToastTimer);
  toast.classList.remove('visible');
  requestAnimationFrame(() => toast.classList.add('visible'));
  projectToastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2800);
}

function resetProjectAutoPlay() {
  window.clearTimeout(projectAutoPlayTimer);
  projectAutoPlayTimer = window.setTimeout(() => {
    selectProject((activeProject + 1) % cards.length, true, false);
    resetProjectAutoPlay();
  }, 16000);
}

cards.forEach((card, index) => {
  card.dataset.index = index;
  const duration = card.querySelector('.project-copy span');
  const url = card.dataset.url;
  const toastMessage = card.dataset.toast;
  const arrowControl = document.createElement(url ? 'a' : 'button');
  const arrow = document.createElement('img');
  const hoverArrow = document.createElement('img');
  arrowControl.className = 'project-arrow-control';
  arrowControl.setAttribute('aria-label', url ? `打开${card.querySelector('h3').childNodes[0].textContent.trim()}` : (toastMessage ? '查看项目状态' : '项目链接待补充'));
  if (url) {
    arrowControl.href = url;
    arrowControl.target = '_blank';
    arrowControl.rel = 'noopener noreferrer';
  } else if (!toastMessage) {
    arrowControl.type = 'button';
    arrowControl.disabled = true;
  } else {
    arrowControl.type = 'button';
  }
  arrow.className = 'project-arrow';
  arrow.src = 'assets/project-arrow.svg';
  arrow.alt = '';
  hoverArrow.className = 'project-arrow project-arrow-hover';
  hoverArrow.src = 'assets/project-arrow-hover.svg';
  hoverArrow.alt = '';
  arrowControl.appendChild(arrow);
  arrowControl.appendChild(hoverArrow);
  duration.appendChild(arrowControl);
  arrowControl.addEventListener('click', (event) => {
    event.stopPropagation();
    if (toastMessage) showProjectToast(toastMessage);
    resetProjectAutoPlay();
  });
  card.addEventListener('click', () => selectProject(index));
});

dots.forEach((dot, index) => dot.addEventListener('click', () => selectProject(index)));

function selectProject(index, animate = true, userInitiated = true) {
  activeProject = index;
  cards.forEach((card, cardIndex) => card.classList.toggle('active', cardIndex === index));
  dots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === index));
  if (!animate) track.style.transition = 'none';
  const cardWidth = cards[0].offsetWidth;
  const gap = parseFloat(getComputedStyle(track).columnGap) || 62;
  const offset = index * (cardWidth + gap) + cardWidth / 2;
  track.style.transform = `translateX(${-offset}px)`;
  if (!animate) requestAnimationFrame(() => { track.style.transition = ''; });
  if (userInitiated) resetProjectAutoPlay();
}

selectProject(activeProject, false, false);
resetProjectAutoPlay();
document.addEventListener('click', resetProjectAutoPlay, { passive: true });
window.addEventListener('resize', () => selectProject(activeProject, false, false));

const eyeVideo = document.querySelector('.hero-eye-video');

if (eyeVideo) {
  const hero = eyeVideo.closest('.hero');
  // The generated clip mirrors its horizontal gaze, so left/right timestamps are swapped.
  const directionTimes = [4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5];
  let requestedDirection = -1;
  let seekFrame = 0;
  let targetTime = 0;
  let isSmoothing = false;
  let waitingForSeek = false;

  const continueAfterSeek = () => {
    if (waitingForSeek) return;
    waitingForSeek = true;
    eyeVideo.addEventListener('seeked', () => {
      waitingForSeek = false;
      window.setTimeout(smoothSeek, 24);
    }, { once: true });
  };

  const smoothSeek = () => {
    if (!isSmoothing || eyeVideo.readyState < 1) return;
    if (eyeVideo.seeking) {
      continueAfterSeek();
      return;
    }
    const delta = targetTime - eyeVideo.currentTime;

    if (Math.abs(delta) < 0.035) {
      eyeVideo.currentTime = targetTime;
      isSmoothing = false;
      return;
    }

    const step = Math.sign(delta) * Math.min(0.2, Math.max(0.06, Math.abs(delta) * 0.24));
    eyeVideo.currentTime += step;
    continueAfterSeek();
  };

  const seekToDirection = (direction) => {
    if (direction === requestedDirection || eyeVideo.readyState < 1) return;
    requestedDirection = direction;
    const referenceTime = direction < 0 ? 0 : directionTimes[direction];
    const timelineScale = Math.min(1, eyeVideo.duration / 5);
    targetTime = Math.min(referenceTime * timelineScale, eyeVideo.duration - 0.04);
    if (!isSmoothing) {
      isSmoothing = true;
      smoothSeek();
    }
  };

  const updateEyes = (event) => {
    if (event.target.closest('.topbar')) return;
    cancelAnimationFrame(seekFrame);
    seekFrame = requestAnimationFrame(() => {
      const heroRect = hero.getBoundingClientRect();
      const characterX = heroRect.left + heroRect.width / 2;
      const characterY = heroRect.top + heroRect.height * 0.65;
      const dx = event.clientX - characterX;
      const dy = event.clientY - characterY;
      const distance = Math.hypot(dx, dy);

      if (distance < Math.min(heroRect.width, heroRect.height) * 0.09) {
        seekToDirection(-1);
        return;
      }

      const angle = Math.atan2(dy, dx);
      const direction = Math.round(angle / (Math.PI / 4) + 8) % 8;
      seekToDirection(direction);
    });
  };

  eyeVideo.addEventListener('loadedmetadata', () => {
    eyeVideo.pause();
    eyeVideo.currentTime = 0;
  });
  hero.addEventListener('pointermove', updateEyes, { passive: true });
  hero.addEventListener('pointerleave', () => cancelAnimationFrame(seekFrame));
}
