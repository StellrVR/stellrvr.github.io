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

// ─── ReactBits Dither Background (vanilla WebGL port) ────────────────────────
// Faithfully ported from the react-bits Dither component (React Three Fiber).
// Two-pass: pass 1 renders the animated wave (Perlin FBM), pass 2 applies the
// Bayer 8×8 ordered dither post-process — exactly matching the source shaders.
function initDitherBackground(canvas, opts) {
    opts = Object.assign({
        waveSpeed:             0.05,
        waveFrequency:         3.0,
        waveAmplitude:         0.3,
        waveColor:             [CTP.mauve[0]/255, CTP.mauve[1]/255, CTP.mauve[2]/255],
        colorNum:              4.0,
        pixelSize:             2.0,
        enableMouseInteraction: true,
        mouseRadius:           0.3,
    }, opts);

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) { canvas.style.display = 'none'; return; }

    // ── shared vertex shader (full-screen quad, also used for post pass) ──
    const vertSrc = `
        attribute vec2 a_pos;
        varying vec2 v_uv;
        void main() {
            v_uv = a_pos * 0.5 + 0.5;
            gl_Position = vec4(a_pos, 0.0, 1.0);
        }
    `;

    // ── Pass 1: wave shader — direct port of waveFragmentShader ──────────
    const waveFrag = `
        precision highp float;
        varying vec2 v_uv;
        uniform vec2  resolution;
        uniform float time;
        uniform float waveSpeed;
        uniform float waveFrequency;
        uniform float waveAmplitude;
        uniform vec3  waveColor;
        uniform vec2  mousePos;
        uniform int   enableMouseInteraction;
        uniform float mouseRadius;

        vec4 mod289v4(vec4 x) { return x - floor(x*(1.0/289.0))*289.0; }
        vec4 permute(vec4 x)   { return mod289v4(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314*r; }
        vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

        float cnoise(vec2 P) {
            vec4 Pi = floor(P.xyxy) + vec4(0.0,0.0,1.0,1.0);
            vec4 Pf = fract(P.xyxy) - vec4(0.0,0.0,1.0,1.0);
            Pi = mod289v4(Pi);
            vec4 ix=Pi.xzxz, iy=Pi.yyww, fx=Pf.xzxz, fy=Pf.yyww;
            vec4 i = permute(permute(ix)+iy);
            vec4 gx = fract(i*(1.0/41.0))*2.0-1.0;
            vec4 gy = abs(gx)-0.5;
            vec4 tx = floor(gx+0.5);
            gx -= tx;
            vec2 g00=vec2(gx.x,gy.x), g10=vec2(gx.y,gy.y);
            vec2 g01=vec2(gx.z,gy.z), g11=vec2(gx.w,gy.w);
            vec4 norm = taylorInvSqrt(vec4(dot(g00,g00),dot(g01,g01),dot(g10,g10),dot(g11,g11)));
            g00*=norm.x; g01*=norm.y; g10*=norm.z; g11*=norm.w;
            float n00=dot(g00,vec2(fx.x,fy.x)), n10=dot(g10,vec2(fx.y,fy.y));
            float n01=dot(g01,vec2(fx.z,fy.z)), n11=dot(g11,vec2(fx.w,fy.w));
            vec2 fade_xy = fade(Pf.xy);
            vec2 n_x = mix(vec2(n00,n01),vec2(n10,n11),fade_xy.x);
            return 2.3*mix(n_x.x,n_x.y,fade_xy.y);
        }

        float fbm(vec2 p) {
            float value=0.0, amp=1.0, freq=waveFrequency;
            for (int i=0; i<4; i++) {
                value += amp * abs(cnoise(p));
                p     *= freq;
                amp   *= waveAmplitude;
            }
            return value;
        }

        float pattern(vec2 p) {
            vec2 p2 = p - time * waveSpeed;
            return fbm(p + fbm(p2));
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / resolution.xy;
            uv -= 0.5;
            uv.x *= resolution.x / resolution.y;
            float f = pattern(uv);
            if (enableMouseInteraction == 1) {
                vec2 mouseNDC = (mousePos / resolution - 0.5) * vec2(1.0, -1.0);
                mouseNDC.x *= resolution.x / resolution.y;
                float dist   = length(uv - mouseNDC);
                float effect = 1.0 - smoothstep(0.0, mouseRadius, dist);
                f -= 0.5 * effect;
            }
            vec3 col = mix(vec3(0.0), waveColor, f);
            gl_FragColor = vec4(col, 1.0);
        }
    `;

    // ── Pass 2: Bayer 8×8 dither post-process (WebGL1-compatible, no array literals) ──
    const ditherFragCompat = `
        precision highp float;
        varying vec2 v_uv;
        uniform sampler2D inputBuffer;
        uniform vec2  resolution;
        uniform float colorNum;
        uniform float pixelSize;

        float bayerVal(int idx) {
            if(idx== 0) return  0.0/64.0; if(idx== 1) return 48.0/64.0;
            if(idx== 2) return 12.0/64.0; if(idx== 3) return 60.0/64.0;
            if(idx== 4) return  3.0/64.0; if(idx== 5) return 51.0/64.0;
            if(idx== 6) return 15.0/64.0; if(idx== 7) return 63.0/64.0;
            if(idx== 8) return 32.0/64.0; if(idx== 9) return 16.0/64.0;
            if(idx==10) return 44.0/64.0; if(idx==11) return 28.0/64.0;
            if(idx==12) return 35.0/64.0; if(idx==13) return 19.0/64.0;
            if(idx==14) return 47.0/64.0; if(idx==15) return 31.0/64.0;
            if(idx==16) return  8.0/64.0; if(idx==17) return 56.0/64.0;
            if(idx==18) return  4.0/64.0; if(idx==19) return 52.0/64.0;
            if(idx==20) return 11.0/64.0; if(idx==21) return 59.0/64.0;
            if(idx==22) return  7.0/64.0; if(idx==23) return 55.0/64.0;
            if(idx==24) return 40.0/64.0; if(idx==25) return 24.0/64.0;
            if(idx==26) return 36.0/64.0; if(idx==27) return 20.0/64.0;
            if(idx==28) return 43.0/64.0; if(idx==29) return 27.0/64.0;
            if(idx==30) return 39.0/64.0; if(idx==31) return 23.0/64.0;
            if(idx==32) return  2.0/64.0; if(idx==33) return 50.0/64.0;
            if(idx==34) return 14.0/64.0; if(idx==35) return 62.0/64.0;
            if(idx==36) return  1.0/64.0; if(idx==37) return 49.0/64.0;
            if(idx==38) return 13.0/64.0; if(idx==39) return 61.0/64.0;
            if(idx==40) return 34.0/64.0; if(idx==41) return 18.0/64.0;
            if(idx==42) return 46.0/64.0; if(idx==43) return 30.0/64.0;
            if(idx==44) return 33.0/64.0; if(idx==45) return 17.0/64.0;
            if(idx==46) return 45.0/64.0; if(idx==47) return 29.0/64.0;
            if(idx==48) return 10.0/64.0; if(idx==49) return 58.0/64.0;
            if(idx==50) return  6.0/64.0; if(idx==51) return 54.0/64.0;
            if(idx==52) return  9.0/64.0; if(idx==53) return 57.0/64.0;
            if(idx==54) return  5.0/64.0; if(idx==55) return 53.0/64.0;
            if(idx==56) return 42.0/64.0; if(idx==57) return 26.0/64.0;
            if(idx==58) return 38.0/64.0; if(idx==59) return 22.0/64.0;
            if(idx==60) return 41.0/64.0; if(idx==61) return 25.0/64.0;
            if(idx==62) return 37.0/64.0; if(idx==63) return 21.0/64.0;
            return 0.0;
        }

        vec3 dither(vec2 uv, vec3 color) {
            vec2 scaledCoord = floor(uv * resolution / pixelSize);
            int x = int(mod(scaledCoord.x, 8.0));
            int y = int(mod(scaledCoord.y, 8.0));
            float threshold = bayerVal(y * 8 + x) - 0.25;
            float step = 1.0 / (colorNum - 1.0);
            color += threshold * step;
            color  = clamp(color - 0.2, 0.0, 1.0);
            return floor(color * (colorNum - 1.0) + 0.5) / (colorNum - 1.0);
        }

        void main() {
            vec2 normalizedPixelSize = pixelSize / resolution;
            vec2 uvPixel = normalizedPixelSize * floor(v_uv / normalizedPixelSize);
            vec4 color   = texture2D(inputBuffer, uvPixel);
            color.rgb    = dither(v_uv, color.rgb);
            gl_FragColor = color;
        }
    `;

    // ── compile helper ────────────────────────────────────────────────────
    function makeProgram(vs, fs) {
        function compile(type, src) {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
                console.error(gl.getShaderInfoLog(s));
            return s;
        }
        const p = gl.createProgram();
        gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
        gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS))
            console.error(gl.getProgramInfoLog(p));
        return p;
    }

    const waveProg   = makeProgram(vertSrc, waveFrag);
    const ditherProg = makeProgram(vertSrc, ditherFragCompat);

    // ── full-screen quad buffer (shared by both passes) ───────────────────
    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    function bindQuad(prog) {
        const loc = gl.getAttribLocation(prog, 'a_pos');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }

    // ── framebuffer + texture for pass 1 output ───────────────────────────
    let fbo, fbTex, fbW = 0, fbH = 0;

    function createFBO(w, h) {
        if (fbo) { gl.deleteFramebuffer(fbo); gl.deleteTexture(fbTex); }
        fbTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, fbTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbTex, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        fbW = w; fbH = h;
    }

    // ── resize ────────────────────────────────────────────────────────────
    function resize() {
        const w = canvas.clientWidth  || window.innerWidth;
        const h = canvas.clientHeight || window.innerHeight;
        canvas.width  = w;
        canvas.height = h;
        createFBO(w, h);
    }
    resize();
    window.addEventListener('resize', resize);

    // ── wave program uniforms ─────────────────────────────────────────────
    gl.useProgram(waveProg);
    const wU = {
        resolution:             gl.getUniformLocation(waveProg, 'resolution'),
        time:                   gl.getUniformLocation(waveProg, 'time'),
        waveSpeed:              gl.getUniformLocation(waveProg, 'waveSpeed'),
        waveFrequency:          gl.getUniformLocation(waveProg, 'waveFrequency'),
        waveAmplitude:          gl.getUniformLocation(waveProg, 'waveAmplitude'),
        waveColor:              gl.getUniformLocation(waveProg, 'waveColor'),
        mousePos:               gl.getUniformLocation(waveProg, 'mousePos'),
        enableMouseInteraction: gl.getUniformLocation(waveProg, 'enableMouseInteraction'),
        mouseRadius:            gl.getUniformLocation(waveProg, 'mouseRadius'),
    };
    gl.uniform1f(wU.waveSpeed,              opts.waveSpeed);
    gl.uniform1f(wU.waveFrequency,          opts.waveFrequency);
    gl.uniform1f(wU.waveAmplitude,          opts.waveAmplitude);
    gl.uniform3fv(wU.waveColor,             opts.waveColor);
    gl.uniform1i(wU.enableMouseInteraction, opts.enableMouseInteraction ? 1 : 0);
    gl.uniform1f(wU.mouseRadius,            opts.mouseRadius);

    // ── dither program uniforms ───────────────────────────────────────────
    gl.useProgram(ditherProg);
    const dU = {
        inputBuffer: gl.getUniformLocation(ditherProg, 'inputBuffer'),
        resolution:  gl.getUniformLocation(ditherProg, 'resolution'),
        colorNum:    gl.getUniformLocation(ditherProg, 'colorNum'),
        pixelSize:   gl.getUniformLocation(ditherProg, 'pixelSize'),
    };
    gl.uniform1i(dU.inputBuffer, 0);
    gl.uniform1f(dU.colorNum,    opts.colorNum);
    gl.uniform1f(dU.pixelSize,   opts.pixelSize);

    // ── mouse tracking ────────────────────────────────────────────────────
    const mouse = { x: 0, y: 0 };
    if (opts.enableMouseInteraction) {
        window.addEventListener('mousemove', e => {
            const r = canvas.getBoundingClientRect();
            mouse.x = e.clientX - r.left;
            mouse.y = e.clientY - r.top;
        });
    }

    // ── render loop ───────────────────────────────────────────────────────
    let start = performance.now();
    function render() {
        const t = (performance.now() - start) / 1000;
        const w = canvas.width, h = canvas.height;

        // — Pass 1: wave → FBO —
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.viewport(0, 0, w, h);
        gl.useProgram(waveProg);
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
        bindQuad(waveProg);
        gl.uniform2f(wU.resolution, w, h);
        gl.uniform1f(wU.time, t);
        gl.uniform2f(wU.mousePos, mouse.x, mouse.y);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // — Pass 2: dither → screen —
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, w, h);
        gl.useProgram(ditherProg);
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
        bindQuad(ditherProg);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fbTex);
        gl.uniform2f(dU.resolution, w, h);
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

    // Init WebGL dither background — react-bits Dither port, Catppuccin mauve wave
    const ditherBgCanvas = document.getElementById('dither-bg');
    if (ditherBgCanvas) initDitherBackground(ditherBgCanvas, {
        waveColor:              [CTP.mauve[0]/255, CTP.mauve[1]/255, CTP.mauve[2]/255],
        colorNum:               4.0,
        pixelSize:              2.0,
        waveSpeed:              0.05,
        waveFrequency:          3.0,
        waveAmplitude:          0.3,
        mouseRadius:            0.3,
        enableMouseInteraction: true,
    });

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