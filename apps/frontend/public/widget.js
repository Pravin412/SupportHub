(function() {
  // Find our script tag to get the configuration
  const currentScript = document.currentScript || 
    document.getElementById('supporthub-script') ||
    document.querySelector('script[src*="widget.js"]') ||
    (function() {
      const scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

  // Extract the base URL from the script src (e.g. http://localhost:3001)
  let baseUrl = 'http://localhost:3000'; // fallback
  if (currentScript && currentScript.src) {
    try {
      const scriptUrl = new URL(currentScript.src);
      baseUrl = scriptUrl.origin;
    } catch {
      console.warn('SupportHub: Could not parse script URL, using fallback.');
    }
  }

  const channelId = currentScript?.getAttribute('data-channel-id') || '';
  const profileId = currentScript?.getAttribute('data-profile-id') || '';
  const name = currentScript?.getAttribute('data-name') || '';
  const email = currentScript?.getAttribute('data-email') || '';
  const number = currentScript?.getAttribute('data-number') || '';
  const apiUrl = currentScript?.getAttribute('data-api-url') || 'http://localhost:4000';

  if (!channelId) {
    console.error('SupportHub Widget: data-channel-id is required.');
    return;
  }

  // Construct the iframe URL
  const iframeBaseUrl = `${baseUrl}/widget`;
  const queryParams = new URLSearchParams({
    channelId,
    ...(profileId && { profileId }),
    ...(name && { name }),
    ...(email && { email }),
    ...(number && { number })
  });
  
  const buildIframeUrl = function() {
    const freshParams = new URLSearchParams(queryParams);
    freshParams.set('v', Date.now().toString());
    return `${iframeBaseUrl}?${freshParams.toString()}`;
  };
  const iframeUrl = buildIframeUrl();

  // Create Launcher Button
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'supporthub-widget-button';
  toggleBtn.style.position = 'fixed';
  toggleBtn.style.bottom = '20px';
  toggleBtn.style.right = '20px';
  toggleBtn.style.left = 'auto';
  toggleBtn.style.top = 'auto';
  toggleBtn.style.width = '56px';
  toggleBtn.style.height = '56px';
  toggleBtn.style.borderRadius = '28px';
  toggleBtn.style.backgroundColor = '#0f766e';
  toggleBtn.style.color = '#fff';
  toggleBtn.style.border = 'none';
  toggleBtn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  toggleBtn.style.cursor = 'pointer';
  toggleBtn.style.touchAction = 'none';
  toggleBtn.style.zIndex = '999999';
  toggleBtn.title = 'Drag to move, click to open chat';
  toggleBtn.style.display = 'flex';
  toggleBtn.style.alignItems = 'center';
  toggleBtn.style.justifyContent = 'center';
  toggleBtn.style.transition = 'transform 0.2s';
  toggleBtn.style.opacity = '0';
  toggleBtn.style.fontFamily = 'system-ui, -apple-system, sans-serif';

  // Create Iframe Container
  const iframeWrapper = document.createElement('div');
  iframeWrapper.id = 'supporthub-widget-frame-wrapper';
  const isMobile = window.innerWidth < 640;
  iframeWrapper.style.position = 'fixed';
  iframeWrapper.style.zIndex = '999998';
  iframeWrapper.style.width = isMobile ? 'calc(100vw - 32px)' : '380px';
  iframeWrapper.style.maxWidth = isMobile ? '380px' : 'none';
  iframeWrapper.style.height = isMobile ? 'min(580px, calc(100vh - 110px))' : '600px';
  iframeWrapper.style.maxHeight = 'calc(100vh - 100px)';
  iframeWrapper.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
  iframeWrapper.style.borderRadius = '12px';
  iframeWrapper.style.overflow = 'hidden';
  iframeWrapper.style.display = 'none';
  iframeWrapper.style.opacity = '0';
  iframeWrapper.style.transform = 'translateY(10px)';
  iframeWrapper.style.transition = 'opacity 0.2s ease-out, transform 0.2s ease-out';
  iframeWrapper.style.backgroundColor = '#fff';

  // Create Iframe
  const iframe = document.createElement('iframe');
  iframe.src = iframeUrl;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.title = 'Support Chat Widget';
  iframeWrapper.appendChild(iframe);

  // Drag Handle for Open Widget
  const dragHandle = document.createElement('div');
  dragHandle.style.position = 'absolute';
  dragHandle.style.left = '0';
  dragHandle.style.top = '0';
  dragHandle.style.right = '44px';
  dragHandle.style.height = '64px';
  dragHandle.style.zIndex = '2';
  dragHandle.style.cursor = 'move';
  dragHandle.style.touchAction = 'none';
  dragHandle.title = 'Drag to move chat';
  iframeWrapper.appendChild(dragHandle);

  // Icon SVG
  const chatIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  const closeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  toggleBtn.innerHTML = chatIcon;

  let isOpen = false;
  let isDragging = false;
  let didDrag = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let btnStartX = 0;
  let btnStartY = 0;
  let currentBtnLeft = null;
  let currentBtnTop = null;
  let latestLogoUrl = '';
  let latestColorTheme = '#0f766e';
  let hasCustomPosition = false;
  let dragActuallyMoved = false;

  const clamp = function(value, min, max) {
    if (max < min) return min;
    return Math.max(min, Math.min(value, max));
  };

  const updateIframePosition = function() {
    if (!isOpen) return;
    const padding = 12;
    const isSmall = window.innerWidth < 640;
    const frameW = isSmall ? Math.min(380, window.innerWidth - 32) : 380;
    // Adapt height dynamically to window height so it never exceeds screen limits
    const maxAvailableH = Math.max(320, window.innerHeight - 100);
    const frameH = Math.min(600, maxAvailableH);

    iframeWrapper.style.height = `${frameH}px`;

    const btnRect = toggleBtn.getBoundingClientRect();
    
    // Position iframe above the button aligned to its right
    let targetLeft = btnRect.right - frameW;
    let targetTop = btnRect.top - frameH - 12;

    // Boundary checks
    if (targetLeft < padding) targetLeft = padding;
    if (targetLeft + frameW > window.innerWidth - padding) targetLeft = window.innerWidth - frameW - padding;
    if (targetTop < padding) {
      targetTop = padding;
    }
    if (targetTop + frameH > window.innerHeight - padding) {
      targetTop = Math.max(padding, window.innerHeight - frameH - padding);
    }

    iframeWrapper.style.left = `${targetLeft}px`;
    iframeWrapper.style.top = `${targetTop}px`;
    iframeWrapper.style.right = 'auto';
    iframeWrapper.style.bottom = 'auto';
  };

  const setBtnPosition = function(left, top) {
    const padding = 10;
    const nextLeft = clamp(left, padding, window.innerWidth - 56 - padding);
    const nextTop = clamp(top, padding, window.innerHeight - 56 - padding);

    toggleBtn.style.left = `${nextLeft}px`;
    toggleBtn.style.top = `${nextTop}px`;
    toggleBtn.style.right = 'auto';
    toggleBtn.style.bottom = 'auto';
    currentBtnLeft = nextLeft;
    currentBtnTop = nextTop;

    if (isOpen) {
      updateIframePosition();
    }
  };

  const beginDrag = function(clientX, clientY) {
    const rect = toggleBtn.getBoundingClientRect();
    isDragging = true;
    didDrag = false;
    dragActuallyMoved = false;
    dragStartX = clientX;
    dragStartY = clientY;
    btnStartX = rect.left;
    btnStartY = rect.top;
  };

  const moveDrag = function(clientX, clientY) {
    if (!isDragging) return;
    const dx = clientX - dragStartX;
    const dy = clientY - dragStartY;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      didDrag = true;
      dragActuallyMoved = true;
    }
    if (didDrag) {
      setBtnPosition(btnStartX + dx, btnStartY + dy);
    }
  };

  const endDrag = function() {
    if (dragActuallyMoved) {
      hasCustomPosition = true;
    }
    isDragging = false;
  };

  const iframePointToPage = function(clientX, clientY) {
    const rect = iframe.getBoundingClientRect();
    return {
      clientX: rect.left + clientX,
      clientY: rect.top + clientY
    };
  };

  toggleBtn.onmouseover = function() {
    toggleBtn.style.transform = 'scale(1.05)';
  };
  toggleBtn.onmouseout = function() {
    toggleBtn.style.transform = 'scale(1)';
  };

  const applyLauncherIcon = function() {
    toggleBtn.style.backgroundColor = latestColorTheme;
    if (!isOpen) {
      toggleBtn.innerHTML = chatIcon;
    }
    toggleBtn.style.opacity = '1';
  };

  const attachDragEvents = function(element) {
    element.addEventListener('pointerdown', function(event) {
      beginDrag(event.clientX, event.clientY);
    });

    element.addEventListener('pointermove', function(event) {
      moveDrag(event.clientX, event.clientY);
    });

    element.addEventListener('pointerup', function() {
      endDrag();
    });

    element.addEventListener('pointercancel', function() {
      endDrag();
    });
  };

  attachDragEvents(toggleBtn);
  attachDragEvents(dragHandle);

  window.addEventListener('resize', function() {
    const isSmall = window.innerWidth < 640;
    iframeWrapper.style.width = isSmall ? 'calc(100vw - 32px)' : '380px';
    iframeWrapper.style.maxWidth = isSmall ? '380px' : 'none';
    const maxAvailableH = Math.max(320, window.innerHeight - 100);
    iframeWrapper.style.height = `${Math.min(600, maxAvailableH)}px`;

    if (hasCustomPosition && currentBtnLeft !== null && currentBtnTop !== null) {
      setBtnPosition(currentBtnLeft, currentBtnTop);
    }
    if (isOpen) {
      updateIframePosition();
    }
  });

  toggleBtn.onclick = function(event) {
    if (didDrag) {
      event.preventDefault();
      didDrag = false;
      return;
    }
    isOpen = !isOpen;
    if (isOpen) {
      if (!iframe.src || iframe.src === 'about:blank') {
        iframe.src = buildIframeUrl();
      }
      updateIframePosition();
      iframeWrapper.style.display = 'block';
      void iframeWrapper.offsetWidth;
      iframeWrapper.style.opacity = '1';
      iframeWrapper.style.transform = 'translateY(0)';
      toggleBtn.innerHTML = closeIcon;
    } else {
      iframeWrapper.style.opacity = '0';
      iframeWrapper.style.transform = 'translateY(10px)';
      setTimeout(() => {
        iframeWrapper.style.display = 'none';
      }, 200);
      toggleBtn.innerHTML = chatIcon;
      applyLauncherIcon();
    }
  };

  document.body.appendChild(iframeWrapper);
  document.body.appendChild(toggleBtn);

  window.addEventListener('message', function(event) {
    if (event.data === 'supporthub-close-widget' && isOpen) {
      toggleBtn.click();
    }
    if (event.data && event.data.type === 'supporthub-drag-start') {
      const point = iframePointToPage(event.data.clientX, event.data.clientY);
      beginDrag(point.clientX, point.clientY);
    }
    if (event.data && event.data.type === 'supporthub-drag-move') {
      const point = iframePointToPage(event.data.clientX, event.data.clientY);
      moveDrag(point.clientX, point.clientY);
    }
    if (event.data && event.data.type === 'supporthub-drag-end') {
      endDrag();
      if (event.data.didDrag || dragActuallyMoved) {
        didDrag = true;
        hasCustomPosition = true;
      }
    }
    if (event.data && event.data.type === 'supporthub-config') {
      if (event.data.colorTheme) {
        latestColorTheme = event.data.colorTheme;
      }
      if (event.data.logoUrl) {
        latestLogoUrl = event.data.logoUrl;
      }
      applyLauncherIcon();
    }
  });

  fetch(`${apiUrl}/widget/${encodeURIComponent(channelId)}/config?v=${Date.now()}`, { cache: 'no-store' })
    .then(function(response) {
      return response.ok ? response.json() : null;
    })
    .then(function(payload) {
      const config = payload && payload.data ? payload.data : payload;
      if (!config) return;
      if (config.colorTheme) latestColorTheme = config.colorTheme;
      if (config.logoUrl || config.botAvatar) latestLogoUrl = config.logoUrl || config.botAvatar;
      applyLauncherIcon();
    })
    .catch(function() {
      toggleBtn.style.opacity = '1';
      return undefined;
    });

  // Expose global SupportHub API
  window.SupportHub = {
    setUser: function(profileId, userData = {}) {
      if (!iframe || !iframe.contentWindow) return;
      
      const payload = {
        type: 'supporthub-set-user',
        profileId: profileId,
        name: userData.name || '',
        email: userData.email || '',
        number: userData.number || ''
      };
      
      // Send the data to the iframe securely
      iframe.contentWindow.postMessage(payload, '*');
    },
    open: function() {
      if (!isOpen) toggleBtn.click();
    },
    close: function() {
      if (isOpen) toggleBtn.click();
    },
    destroy: function() {
      iframeWrapper.remove();
      toggleBtn.remove();
      delete window.SupportHub;
    }
  };
})();
