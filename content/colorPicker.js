/**
 * Pixel-level color picker with magnifier.
 */

if (typeof window.__fccColorPicker === 'undefined') {
  window.__fccColorPicker = (() => {
    const core = window.__fccCore;

    let overlay = null;
    let canvas = null;
    let ctx = null;
    let screenshotImg = null;
    let isActive = false;
    let onColorPicked = null;

    const MAGNIFIER_RADIUS = 72;
    const MAGNIFIER_DIAMETER = MAGNIFIER_RADIUS * 2;
    const ZOOM = 8;
    const GRID_SIZE = Math.floor(MAGNIFIER_DIAMETER / ZOOM);
    const PIXEL_SIZE = MAGNIFIER_DIAMETER / GRID_SIZE;

    function start(callback) {
      if (isActive) return;

      onColorPicked = callback;

      chrome.runtime.sendMessage({ type: MSG.CAPTURE_SCREENSHOT }, (response) => {
        if (!response || !response.success) {
          console.error('FCC: Screenshot capture failed');
          return;
        }

        loadScreenshot(response.dataUrl);
      });
    }

    function loadScreenshot(dataUrl) {
      screenshotImg = new Image();
      screenshotImg.onload = () => {
        createOverlay();
        isActive = true;
      };
      screenshotImg.src = dataUrl;
    }

    function createOverlay() {
      const dpr = window.devicePixelRatio || 1;

      overlay = document.createElement('div');
      overlay.id = 'fcc-color-picker-overlay';
      Object.assign(overlay.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '2147483646',
        cursor: 'none',
      });

      canvas = document.createElement('canvas');
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      Object.assign(canvas.style, {
        width: '100vw',
        height: '100vh',
        display: 'block',
      });

      ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.scale(dpr, dpr);
      ctx.drawImage(screenshotImg, 0, 0, window.innerWidth, window.innerHeight);

      overlay._screenshotData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      overlay.appendChild(canvas);
      document.documentElement.appendChild(overlay);

      overlay.addEventListener('mousemove', handleMouseMove);
      overlay.addEventListener('click', handleClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    function handleMouseMove(event) {
      const dpr = window.devicePixelRatio || 1;
      const x = event.clientX;
      const y = event.clientY;

      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.drawImage(screenshotImg, 0, 0, window.innerWidth, window.innerHeight);

      const sample = getPixelColor(x, y);
      const magnifierX = getMagnifierX(x);
      const magnifierY = getMagnifierY(y);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      ctx.save();
      ctx.beginPath();
      ctx.arc(magnifierX, magnifierY, MAGNIFIER_RADIUS, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(screenshotImg, 0, 0, window.innerWidth, window.innerHeight);
      ctx.restore();

      drawMagnifier(x, y, magnifierX, magnifierY, sample);
    }

    function drawMagnifier(mouseX, mouseY, magnifierX, magnifierY, sample) {
      const dpr = window.devicePixelRatio || 1;
      const halfGrid = Math.floor(GRID_SIZE / 2);
      const imageData = overlay._screenshotData;
      const imageWidth = canvas.width;

      ctx.save();
      ctx.beginPath();
      ctx.arc(magnifierX, magnifierY, MAGNIFIER_RADIUS, 0, Math.PI * 2);
      ctx.clip();

      for (let gx = 0; gx < GRID_SIZE; gx += 1) {
        for (let gy = 0; gy < GRID_SIZE; gy += 1) {
          const srcX = Math.round((mouseX - halfGrid + gx) * dpr);
          const srcY = Math.round((mouseY - halfGrid + gy) * dpr);
          let red = 220;
          let green = 220;
          let blue = 220;

          if (srcX >= 0 && srcX < imageWidth && srcY >= 0 && srcY < canvas.height) {
            const index = (srcY * imageWidth + srcX) * 4;
            red = imageData.data[index];
            green = imageData.data[index + 1];
            blue = imageData.data[index + 2];
          }

          const drawX = magnifierX - MAGNIFIER_RADIUS + gx * PIXEL_SIZE;
          const drawY = magnifierY - MAGNIFIER_RADIUS + gy * PIXEL_SIZE;

          ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
          ctx.fillRect(drawX, drawY, PIXEL_SIZE, PIXEL_SIZE);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(drawX, drawY, PIXEL_SIZE, PIXEL_SIZE);
        }
      }

      const centerX = magnifierX - MAGNIFIER_RADIUS + halfGrid * PIXEL_SIZE;
      const centerY = magnifierY - MAGNIFIER_RADIUS + halfGrid * PIXEL_SIZE;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(centerX, centerY, PIXEL_SIZE, PIXEL_SIZE);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(magnifierX, magnifierY, MAGNIFIER_RADIUS, 0, Math.PI * 2);
      ctx.strokeStyle = sample.hex;
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(magnifierX, magnifierY, MAGNIFIER_RADIUS + 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = 2;
      ctx.stroke();

      const labelText = sample.hex.toUpperCase();
      const labelWidth = ctx.measureText(labelText).width + 44;
      const labelX = magnifierX - labelWidth / 2;
      const labelY = magnifierY + MAGNIFIER_RADIUS + 16;

      ctx.fillStyle = 'rgba(17, 24, 39, 0.92)';
      roundRect(ctx, labelX, labelY, labelWidth, 28, 8);
      ctx.fill();

      ctx.fillStyle = sample.hex;
      roundRect(ctx, labelX + 8, labelY + 7, 14, 14, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '600 13px system-ui, -apple-system, sans-serif';
      ctx.fillText(labelText, labelX + 30, labelY + 18);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(mouseX - 8, mouseY);
      ctx.lineTo(mouseX + 8, mouseY);
      ctx.moveTo(mouseX, mouseY - 8);
      ctx.lineTo(mouseX, mouseY + 8);
      ctx.stroke();
    }

    function handleClick(event) {
      event.preventDefault();
      event.stopPropagation();

      const sample = getPixelColor(event.clientX, event.clientY);

      navigator.clipboard.writeText(sample.hex).catch(() => {});

      if (onColorPicked) {
        onColorPicked({
          ...sample,
          source: 'pixel',
          sampledAt: new Date().toISOString(),
        });
      }

      destroy();
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        destroy();
      }
    }

    function getPixelColor(x, y) {
      const dpr = window.devicePixelRatio || 1;
      const imageData = overlay._screenshotData;
      const imageWidth = canvas.width;
      const srcX = Math.round(x * dpr);
      const srcY = Math.round(y * dpr);
      const index = (srcY * imageWidth + srcX) * 4;

      const color = {
        r: imageData.data[index] || 0,
        g: imageData.data[index + 1] || 0,
        b: imageData.data[index + 2] || 0,
      };

      return {
        ...color,
        hex: core.rgbToHex(color.r, color.g, color.b),
        rgb: core.formatRgb(color),
        hsl: core.formatHsl(color),
      };
    }

    function getMagnifierX(mouseX) {
      let x = mouseX + MAGNIFIER_RADIUS + 24;
      if (x + MAGNIFIER_RADIUS > window.innerWidth) {
        x = mouseX - MAGNIFIER_RADIUS - 24;
      }
      return x;
    }

    function getMagnifierY(mouseY) {
      let y = mouseY - MAGNIFIER_RADIUS - 24;
      if (y - MAGNIFIER_RADIUS < 0) {
        y = mouseY + MAGNIFIER_RADIUS + 24;
      }
      return y;
    }

    function roundRect(context, x, y, width, height, radius) {
      context.beginPath();
      context.moveTo(x + radius, y);
      context.lineTo(x + width - radius, y);
      context.quadraticCurveTo(x + width, y, x + width, y + radius);
      context.lineTo(x + width, y + height - radius);
      context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      context.lineTo(x + radius, y + height);
      context.quadraticCurveTo(x, y + height, x, y + height - radius);
      context.lineTo(x, y + radius);
      context.quadraticCurveTo(x, y, x + radius, y);
      context.closePath();
    }

    function destroy() {
      if (overlay) {
        overlay.removeEventListener('mousemove', handleMouseMove);
        overlay.removeEventListener('click', handleClick);
        overlay.remove();
      }

      document.removeEventListener('keydown', handleKeyDown);
      overlay = null;
      canvas = null;
      ctx = null;
      screenshotImg = null;
      isActive = false;
    }

    return {
      destroy,
      start,
    };
  })();
}
