const CTP = {
    base:      [30,  30,  46],
    mantle:    [24,  24,  37],
    crust:     [17,  17,  27],
    surface0:  [49,  50,  68],
    surface1:  [69,  71,  90],
    surface2:  [88,  91,  112],
    overlay0:  [108, 112, 134],
    overlay1:  [127, 132, 156],
    text:      [205, 214, 244],
    mauve:     [203, 166, 247],
    lavender:  [180, 190, 254],
    blue:      [137, 180, 250],
    sapphire:  [116, 199, 236],
    teal:      [148, 226, 213],
    green:     [166, 227, 161],
    yellow:    [249, 226, 175],
    peach:     [250, 179, 135],
    pink:      [245, 194, 231],
    red:       [243, 139, 168],
    rosewater: [245, 224, 220],
    flamingo:  [242, 205, 205],
};

function clamp(v) {
    return Math.max(0, Math.min(255, Math.round(v)));
}

// ─── WebGL Bayer Dither Background ──────────────────────────────────────────
function initDitherBackground(canvas) {
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) { canvas.style.display = 'none'; return; }

    const vert = `
        attribute vec2 a_pos;
        void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
    `;

    // Catppuccin Mocha palette colors passed as uniforms
    const frag = `
        precision highp float;
        uniform float u_time;
        uniform vec2  u_res;

        // CTP colors
        uniform vec3 u_col0; // crust
        uniform vec3 u_col1; // mantle
        uniform vec3 u_col2; // base
        uniform vec3 u_col3; // surface0
        uniform vec3 u_col4; // surface1
        uniform vec3 u_col5; // mauve
        uniform vec3 u_col6; // blue
        uniform vec3 u_col7; // pink
        uniform vec3 u_col8; // lavender

        // FBM noise
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) {
            vec2 i = floor(p), f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(
                mix(hash(i), hash(i + vec2(1,0)), f.x),
                mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),
                f.y);
        }
        float fbm(vec2 p) {
            float v = 0.0, a = 0.5;
            mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
            for (int i = 0; i < 6; i++) {
                v += a * noise(p);
                p = rot * p * 2.0 + vec2(0.5, 1.3);
                a *= 0.5;
            }
            return v;
        }

        // Bayer ordered dithering
        float Bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
        #define Bayer4(a)  (Bayer2(0.5*(a))  * 0.25 + Bayer2(a))
        #define Bayer8(a)  (Bayer4(0.5*(a))  * 0.25 + Bayer2(a))

        // Pick a palette color by index (0..8)
        vec3 paletteColor(float t) {
            if (t < 0.125) return u_col0;
            if (t < 0.25)  return u_col1;
            if (t < 0.375) return u_col2;
            if (t < 0.5)   return u_col3;
            if (t < 0.625) return u_col4;
            if (t < 0.75)  return u_col5;
            if (t < 0.875) return u_col6;
            return u_col7;
        }

        void main() {
            vec2 fragCoord = gl_FragCoord.xy;
            float aspect = u_res.x / u_res.y;

            const float PIXEL_SIZE = 6.0;
            vec2 pixelId = floor(fragCoord / PIXEL_SIZE);
            vec2 cellCoord = pixelId * PIXEL_SIZE;
            vec2 uv = cellCoord / u_res * vec2(aspect, 1.0);

            // Animated fbm field
            float t = u_time * 0.07;
            float n = fbm(uv * 1.4 + vec2(t * 0.5, t * 0.3));
            n += fbm(uv * 0.8 - vec2(t * 0.2, t * 0.4)) * 0.5;
            n = clamp(n, 0.0, 1.0);

            // Subtle color gradient across screen
            float gradX = uv.x / aspect;
            float gradY = uv.y;
            n = n * 0.7 + gradX * 0.1 + gradY * 0.1;

            // Dither with Bayer8
            float dither = Bayer8(pixelId);

            // Map to 8 palette steps
            float steps = 8.0;
            float quantized = floor(n * steps + dither - 0.5) / steps;
            quantized = clamp(quantized, 0.0, 1.0);

            // Accent color blended in via a separate fbm layer
            float accent = fbm(uv * 2.5 + vec2(-t * 0.4, t * 0.2));
            accent = smoothstep(0.6, 0.9, accent);
            float accentDither = Bayer4(pixelId);
            accent = step(accentDither, accent * 0.6);

            vec3 base = paletteColor(quantized);
            vec3 col = mix(base, u_col8, accent * 0.35);

            gl_FragColor = vec4(col, 1.0);
        }
    `;

    function compile(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes  = gl.getUniformLocation(prog, 'u_res');

    // Set CTP palette uniforms (normalized 0-1)
    const cols = [
        CTP.crust, CTP.mantle, CTP.base, CTP.surface0, CTP.surface1,
        CTP.mauve, CTP.blue, CTP.pink, CTP.lavender
    ];
    cols.forEach((c, i) => {
        const loc = gl.getUniformLocation(prog, `u_col${i}`);
        gl.uniform3f(loc, c[0]/255, c[1]/255, c[2]/255);
    });

    function resize() {
        // Run at half resolution for that pixelated dither look
        const w = Math.floor(window.innerWidth / 2);
        const h = Math.floor(window.innerHeight / 2);
        canvas.width  = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
    }
    resize();
    window.addEventListener('resize', resize);

    let start = performance.now();
    function render() {
        const t = (performance.now() - start) / 1000;
        gl.uniform1f(uTime, t);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        requestAnimationFrame(render);
    }
    render();
}
// ─────────────────────────────────────────────────────────────────────────────

function sierraDither(imageData, palette) {
    const { width, height, data } = imageData;
    const buf = new Float32Array(width * height * 3);
    for (let i = 0; i < width * height; i++) {
        buf[i * 3]     = data[i * 4];
        buf[i * 3 + 1] = data[i * 4 + 1];
        buf[i * 3 + 2] = data[i * 4 + 2];
    }

    function closestColor(r, g, b) {
        let minDist = Infinity, best = palette[0];
        for (const c of palette) {
            const dr = r - c[0], dg = g - c[1], db = b - c[2];
            const d = dr * dr + dg * dg + db * db;
            if (d < minDist) { minDist = d; best = c; }
        }
        return best;
    }

    function addErr(ex, ey, er, eg, eb, w) {
        if (ex < 0 || ex >= width || ey < 0 || ey >= height) return;
        const idx = (ey * width + ex) * 3;
        buf[idx] += er * w; buf[idx+1] += eg * w; buf[idx+2] += eb * w;
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 3;
            const oR = buf[idx], oG = buf[idx+1], oB = buf[idx+2];
            const [nR, nG, nB] = closestColor(oR, oG, oB);
            const px = (y * width + x) * 4;
            data[px] = nR; data[px+1] = nG; data[px+2] = nB; data[px+3] = 255;
            const eR = oR - nR, eG = oG - nG, eB = oB - nB;

            addErr(x+1,y,   eR,eG,eB, 5/32);
            addErr(x+2,y,   eR,eG,eB, 3/32);
            addErr(x-2,y+1, eR,eG,eB, 2/32);
            addErr(x-1,y+1, eR,eG,eB, 4/32);
            addErr(x,  y+1, eR,eG,eB, 5/32);
            addErr(x+1,y+1, eR,eG,eB, 4/32);
            addErr(x+2,y+1, eR,eG,eB, 2/32);
            addErr(x-1,y+2, eR,eG,eB, 2/32);
            addErr(x,  y+2, eR,eG,eB, 3/32);
            addErr(x+1,y+2, eR,eG,eB, 2/32);
        }
    }
    return imageData;
}

const FULL_PALETTE = [
    CTP.crust, CTP.mantle, CTP.base, CTP.surface0, CTP.surface1,
    CTP.surface2, CTP.overlay0, CTP.overlay1, CTP.text,
    CTP.rosewater, CTP.flamingo, CTP.pink, CTP.mauve, CTP.red,
    CTP.maroon, CTP.peach, CTP.yellow, CTP.green, CTP.teal,
    CTP.sky, CTP.sapphire, CTP.blue, CTP.lavender,
];

function ditherImageOnCanvas(canvas, src, w, h, palette) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Setup CrossOrigin before SRC
        img.onload = () => {
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');

            const imgRatio = img.width / img.height;
            const canvasRatio = w / h;
            let sx, sy, sw, sh;

            if (imgRatio > canvasRatio) {
                sh = img.height;
                sw = img.height * canvasRatio;
                sx = (img.width - sw) / 2;
                sy = 0;
            } else {
                sw = img.width;
                sh = img.width / canvasRatio;
                sx = 0;
                sy = (img.height - sh) / 2;
            }

            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);

            const imgData = ctx.getImageData(0, 0, w, h);
            sierraDither(imgData, palette || FULL_PALETTE);
            ctx.putImageData(imgData, 0, 0);
            resolve();
        };
        img.onerror = () => {
            console.warn(`Failed to load image: ${src}, using fallback`);
            reject(new Error('Image load failed'));
        };
        img.src = src;
    });
}

function generateBanner(canvas) {
    // Increased width to 800 to match max-width of card
    const w = 800, h = 160;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const nx = x / w, ny = y / h;
            const hill1 = Math.sin(nx * 4.5 + 1.2) * 0.15 + 0.5;
            const hill2 = Math.sin(nx * 7.8 + 3.0) * 0.08 + 0.5;
            const horizon = hill1 * 0.7 + hill2 * 0.3;
            const skyBlend = Math.max(0, Math.min(1, (horizon - ny) * 3));
            const groundBlend = Math.max(0, Math.min(1, (ny - horizon) * 4));
            const skyR = CTP.mauve[0] * (1 - nx * 0.4) + CTP.blue[0] * (nx * 0.4);
            const skyG = CTP.mauve[1] * (1 - nx * 0.4) + CTP.blue[1] * (nx * 0.4);
            const skyB = CTP.mauve[2] * (1 - nx * 0.4) + CTP.blue[2] * (nx * 0.4);
            const gndR = CTP.surface0[0] + (CTP.surface1[0] - CTP.surface0[0]) * ny;
            const gndG = CTP.surface0[1] + (CTP.surface1[1] - CTP.surface0[1]) * ny;
            const gndB = CTP.surface0[2] + (CTP.surface1[2] - CTP.surface0[2]) * ny;
            const starNoise = Math.sin(x * 127.1 + y * 311.7) * Math.sin(x * 269.5 + y * 183.3);
            const starBright = starNoise > 0.97 && ny < horizon ? 1 : 0;
            const r = clamp(skyR * skyBlend + gndR * groundBlend + CTP.base[0] * (1 - skyBlend - groundBlend) + starBright * 60);
            const g = clamp(skyG * skyBlend + gndG * groundBlend + CTP.base[1] * (1 - skyBlend - groundBlend) + starBright * 60);
            const b = clamp(skyB * skyBlend + gndB * groundBlend + CTP.base[2] * (1 - skyBlend - groundBlend) + starBright * 80);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    const imgData = ctx.getImageData(0, 0, w, h);
    sierraDither(imgData, [
        CTP.crust, CTP.mantle, CTP.base, CTP.surface0, CTP.surface1,
        CTP.surface2, CTP.overlay0, CTP.mauve, CTP.lavender, CTP.blue,
        CTP.pink, CTP.text
    ]);
    ctx.putImageData(imgData, 0, 0);
}

function generateAvatar(canvas) {
    const s = 96;
    canvas.width = s; canvas.height = s;
    const ctx = canvas.getContext('2d');

    for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
            const cx = s / 2, cy = s / 2;
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / (s / 2);
            const angle = Math.atan2(y - cy, x - cx);
            const swirl = (angle + dist * 3) / (Math.PI * 2) + 0.5;
            const t = ((swirl % 1) + 1) % 1;
            const r = clamp(CTP.mauve[0] * (1-t) + CTP.peach[0] * t + Math.sin(dist * 6) * 30);
            const g = clamp(CTP.mauve[1] * (1-t) + CTP.peach[1] * t + Math.cos(dist * 5) * 20);
            const b = clamp(CTP.mauve[2] * (1-t) + CTP.peach[2] * t);
            const edge = Math.max(0, 1 - dist * 1.1);
            ctx.fillStyle = `rgb(${clamp(r*edge)},${clamp(g*edge)},${clamp(b*edge)})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    const imgData = ctx.getImageData(0, 0, s, s);
    sierraDither(imgData, [
        CTP.crust, CTP.mantle, CTP.base, CTP.surface0, CTP.surface1,
        CTP.mauve, CTP.lavender, CTP.pink, CTP.peach, CTP.rosewater, CTP.text
    ]);
    ctx.putImageData(imgData, 0, 0);
}

function generateProjectThumb(canvas, seed) {
    const s = 48;
    canvas.width = s; canvas.height = s;
    const ctx = canvas.getContext('2d');

    const colorSets = [
        { a: CTP.blue, b: CTP.sapphire },
        { a: CTP.peach, b: CTP.yellow },
        { a: CTP.teal, b: CTP.green },
    ];
    const c = colorSets[seed % colorSets.length];

    for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
            const nx = x / s, ny = y / s;
            const v = Math.sin(nx * 8 + seed * 2) * Math.cos(ny * 6 + seed) * 0.5 + 0.5;
            const r = clamp(CTP.base[0] + (c.a[0] - CTP.base[0]) * v + (c.b[0] - CTP.base[0]) * (1 - v) * 0.3);
            const g = clamp(CTP.base[1] + (c.a[1] - CTP.base[1]) * v + (c.b[1] - CTP.base[1]) * (1 - v) * 0.3);
            const b = clamp(CTP.base[2] + (c.a[2] - CTP.base[2]) * v + (c.b[2] - CTP.base[2]) * (1 - v) * 0.3);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    const imgData = ctx.getImageData(0, 0, s, s);
    sierraDither(imgData, [CTP.crust, CTP.mantle, CTP.base, CTP.surface0, c.a, c.b, CTP.overlay0]);
    ctx.putImageData(imgData, 0, 0);
}

function generateDivider(canvas) {
    // Increased width to 800 to match max-width of card
    const w = 800, h = 8;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const fade = 1 - Math.abs(y - h / 2) / (h / 2);
            const wave = (Math.sin(x / w * 12.56) * 0.5 + 0.5) * fade;
            const r = clamp(CTP.base[0] + (CTP.surface2[0] - CTP.base[0]) * wave);
            const g = clamp(CTP.base[1] + (CTP.surface2[1] - CTP.base[1]) * wave);
            const b = clamp(CTP.base[2] + (CTP.surface2[2] - CTP.base[2]) * wave);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    const imgData = ctx.getImageData(0, 0, w, h);
    sierraDither(imgData, [CTP.base, CTP.mantle, CTP.surface0, CTP.surface1, CTP.surface2]);
    ctx.putImageData(imgData, 0, 0);
}

function generateButtonDither(canvas, accentColor) {
    const w = canvas.parentElement.offsetWidth || 380;
    const h = canvas.parentElement.offsetHeight || 42;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const a = accentColor || CTP.mauve;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const blend = x / w + Math.sin(y * 0.4) * 0.04;
            const r = clamp(a[0] * blend + CTP.surface1[0] * (1 - blend));
            const g = clamp(a[1] * blend + CTP.surface1[1] * (1 - blend));
            const b = clamp(a[2] * blend + CTP.surface1[2] * (1 - blend));
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    const imgData = ctx.getImageData(0, 0, w, h);
    sierraDither(imgData, [CTP.crust, CTP.base, CTP.surface0, CTP.surface1, a, CTP.text, CTP.overlay0]);
    ctx.putImageData(imgData, 0, 0);
}

const DISCORD_USER_ID = '257252196926750720';

const STATUS_MAP = {
    online:  { color: 'green',  text: 'online',  cssVar: '--ctp-green'  },
    idle:    { color: 'yellow', text: 'idle',     cssVar: '--ctp-yellow' },
    dnd:     { color: 'red',    text: 'dnd',      cssVar: '--ctp-red'    },
    offline: { color: 'gray',   text: 'offline',  cssVar: '--ctp-overlay0' },
};

async function fetchLanyardStatus() {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');

    if (!dot || !text) return;

    try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`);
        const json = await res.json();

        const status = json.data.discord_status || 'offline';
        const info = STATUS_MAP[status] || STATUS_MAP.offline;

        dot.style.background = `var(${info.cssVar})`;
        text.textContent = info.text;

        if (status === 'online') {
            dot.style.animation = 'pulse 2s ease-in-out infinite';
        } else {
            dot.style.animation = 'none';
        }

        const activities = json.data.activities || [];
        const playing = activities.find(a => a.type === 0);
        const listening = activities.find(a => a.type === 2);

        if (playing) {
            text.textContent = `playing ${playing.name}`;
        } else if (listening) {
            text.textContent = `listening to ${listening.name}`;
        }

    } catch (err) {
        console.warn('Lanyard fetch failed:', err);
        dot.style.background = 'var(--ctp-overlay0)';
        text.textContent = 'offline';
    }
}


document.addEventListener('DOMContentLoaded', () => {

    // Init WebGL dither background
    const ditherBgCanvas = document.getElementById('dither-bg');
    if (ditherBgCanvas) initDitherBackground(ditherBgCanvas);

    const banner = document.getElementById('banner-canvas');
    if (banner) {
        const src = banner.getAttribute('data-src');
        if (src) {
            ditherImageOnCanvas(banner, src, 800, 160).catch(() => generateBanner(banner));
        } else {
            generateBanner(banner);
        }
    }

    const bgToggle = document.getElementById('bg-toggle');
    const ditherBg = document.getElementById('dither-bg');

    if (bgToggle && ditherBg) {
        bgToggle.addEventListener('click', () => {
            const isRevealed = ditherBg.classList.toggle('revealed');
            bgToggle.textContent = isRevealed ? 'dim bg' : 'toggle bg';
        });
    }

    const avatar = document.getElementById('avatar-canvas');
    if (avatar) {
        const src = avatar.getAttribute('data-src');
        if (src) {
            ditherImageOnCanvas(avatar, src, 384, 384).catch(() => generateAvatar(avatar));
        } else {
            generateAvatar(avatar);
        }
    }

    document.querySelectorAll('.project-canvas').forEach((c, i) => {
        const src = c.getAttribute('data-src');
        if (src) {
            ditherImageOnCanvas(c, src, 48, 48).catch(() => generateProjectThumb(c, i));
        } else {
            generateProjectThumb(c, i);
        }
    });

    document.querySelectorAll('.divider-canvas').forEach(c => generateDivider(c));

    const btnColors = [CTP.mauve, CTP.blue, CTP.teal, CTP.peach];
    document.querySelectorAll('.link-btn').forEach((btn, i) => {
        const c = btn.querySelector('canvas');
        if (c) requestAnimationFrame(() => generateButtonDither(c, btnColors[i % btnColors.length]));
    });

    fetchLanyardStatus();
    setInterval(fetchLanyardStatus, 30000);

    let rt;
    window.addEventListener('resize', () => {
        clearTimeout(rt);
        rt = setTimeout(() => {
            document.querySelectorAll('.link-btn').forEach((btn, i) => {
                const c = btn.querySelector('canvas');
                if (c) generateButtonDither(c, btnColors[i % btnColors.length]);
            });
        }, 200);
    });
});