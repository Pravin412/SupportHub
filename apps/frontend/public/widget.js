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
    } catch (e) {
      console.warn('SupportHub: Could not parse script URL, using fallback.');
    }
  }

  const channelId = currentScript?.getAttribute('data-channel-id') || '';
  const profileId = currentScript?.getAttribute('data-profile-id') || '';
  const name = currentScript?.getAttribute('data-name') || '';
  const number = currentScript?.getAttribute('data-number') || '';

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
    ...(number && { number })
  });
  
  const iframeUrl = `${iframeBaseUrl}?${queryParams.toString()}`;

  // Create Container
  const container = document.createElement('div');
  container.id = 'supporthub-widget-container';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.zIndex = '999999';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'flex-end';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

  // Create Iframe Container
  const iframeWrapper = document.createElement('div');
  iframeWrapper.style.width = '380px';
  iframeWrapper.style.height = '600px';
  iframeWrapper.style.maxHeight = 'calc(100vh - 100px)';
  iframeWrapper.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
  iframeWrapper.style.borderRadius = '12px';
  iframeWrapper.style.overflow = 'hidden';
  iframeWrapper.style.marginBottom = '16px';
  iframeWrapper.style.display = 'none';
  iframeWrapper.style.opacity = '0';
  iframeWrapper.style.transform = 'translateY(10px)';
  iframeWrapper.style.transition = 'all 0.2s ease-out';
  iframeWrapper.style.backgroundColor = '#fff';

  // Create Iframe
  const iframe = document.createElement('iframe');
  iframe.src = iframeUrl;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.title = 'Support Chat Widget';
  
  iframeWrapper.appendChild(iframe);

  // Create Toggle Button
  const toggleBtn = document.createElement('button');
  toggleBtn.style.width = '56px';
  toggleBtn.style.height = '56px';
  toggleBtn.style.borderRadius = '28px';
  toggleBtn.style.backgroundColor = '#0f766e'; // Teal 700 (brand color)
  toggleBtn.style.color = '#fff';
  toggleBtn.style.border = 'none';
  toggleBtn.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)';
  toggleBtn.style.cursor = 'pointer';
  toggleBtn.style.display = 'flex';
  toggleBtn.style.alignItems = 'center';
  toggleBtn.style.justifyContent = 'center';
  toggleBtn.style.transition = 'transform 0.2s';
  
  // Icon SVG
  const chatIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  const closeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  
  toggleBtn.innerHTML = chatIcon;

  let isOpen = false;

  toggleBtn.onmouseover = function() {
    toggleBtn.style.transform = 'scale(1.05)';
  };
  toggleBtn.onmouseout = function() {
    toggleBtn.style.transform = 'scale(1)';
  };

  toggleBtn.onclick = function() {
    isOpen = !isOpen;
    if (isOpen) {
      iframeWrapper.style.display = 'block';
      // trigger reflow
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
    }
  };

  container.appendChild(iframeWrapper);
  container.appendChild(toggleBtn);
  document.body.appendChild(container);

  window.addEventListener('message', function(event) {
    if (event.data === 'supporthub-close-widget' && isOpen) {
      toggleBtn.click();
    }
    if (event.data && event.data.type === 'supporthub-config') {
      if (event.data.colorTheme) {
        toggleBtn.style.backgroundColor = event.data.colorTheme;
      }
    }
  });

  // Expose global SupportHub API
  window.SupportHub = {
    setUser: function(profileId, userData = {}) {
      if (!iframe || !iframe.contentWindow) return;
      
      const payload = {
        type: 'supporthub-set-user',
        profileId: profileId,
        name: userData.name || '',
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
    }
  };
})();
