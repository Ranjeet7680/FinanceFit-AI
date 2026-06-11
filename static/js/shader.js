function initWebGLShader(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  function syncSize() {
    const w = canvas.clientWidth  || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width  = w;
      canvas.height = h;
    }
  }
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(syncSize).observe(canvas);
  } else {
    window.addEventListener('resize', syncSize);
  }
  syncSize();

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    console.warn("WebGL not supported in this browser.");
    return;
  }

  const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

  const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
varying vec2 v_texCoord;

void main() {
    vec2 uv = v_texCoord;
    vec2 p = (uv * 2.0 - 1.0);
    p.x *= u_resolution.x / u_resolution.y;

    float t = u_time * 0.15;
    
    // Mouse interaction influence
    vec2 mNorm = u_mouse / u_resolution;
    float distToMouse = distance(uv, mNorm);
    float mouseWave = sin(distToMouse * 10.0 - u_time * 2.0) * 0.05 * exp(-distToMouse * 3.0);
    
    // Smooth moving noise for background depth
    float n = sin(p.x * 1.5 + t + mouseWave * 5.0) * cos(p.y * 1.2 - t);
    float n2 = cos(p.x * 2.0 - t * 0.5) * sin(p.y * 1.8 + t * 0.7 + mouseWave * 3.0);
    
    vec3 color1 = vec3(0.04, 0.08, 0.18); // Deep Navy Space
    vec3 color2 = vec3(0.06, 0.20, 0.50);  // Corporate Electric Blue
    vec3 color3 = vec3(0.0, 0.75, 0.58);    // Neon Teal / Emerald Glow
    
    vec3 color = mix(color1, color2, n * 0.5 + 0.5);
    color = mix(color, color3, n2 * 0.25);
    
    // Add particle-like points (glowing stars)
    float p1 = fract(sin(dot(uv * 12.0, vec2(12.9898, 78.233))) * 43758.5453);
    float p2 = fract(sin(dot(uv * 24.0, vec2(12.9898, 78.233))) * 43758.5453);
    
    if (p1 > 0.994) color += 0.25 * sin(u_time * 1.5 + p1 * 10.0) * (1.0 - distToMouse * 0.5);
    if (p2 > 0.997) color += 0.35 * cos(u_time * 0.8 + p2 * 5.0) * (1.0 - distToMouse * 0.5);

    gl_FragColor = vec4(color, 1.0);
}`;

  function cs(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error("Shader compile error: ", gl.getShaderInfoLog(s));
    }
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error("Program linking error: ", gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

  const pos = gl.getAttribLocation(prog, 'a_position');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uRes = gl.getUniformLocation(prog, 'u_resolution');
  const uMouse = gl.getUniformLocation(prog, 'u_mouse');

  let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
  window.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width && rect.height) {
      const nx = (event.clientX - rect.left) / rect.width;
      const ny = 1.0 - (event.clientY - rect.top) / rect.height;
      mouse.x = nx * canvas.width;
      mouse.y = ny * canvas.height;
    }
  });

  function render(t) {
    if (typeof ResizeObserver === 'undefined') syncSize();
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (uTime) gl.uniform1f(uTime, t * 0.001);
    if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
    if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }
  render(0);
}
