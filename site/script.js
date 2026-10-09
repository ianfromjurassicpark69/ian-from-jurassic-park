(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var INK = '#101010', SHEET = '#f4f4f0', RED = '#e03a1e';

  /* Fig. 2: bifurcation diagram of the logistic map, x -> r x (1 - x) */
  (function () {
    var c = document.getElementById('bifurcation');
    if (!c) return;
    var ctx = c.getContext('2d'), W = c.width, H = c.height, R0 = 2.8, R1 = 4.0;
    var out = document.getElementById('readout');
    ctx.fillStyle = SHEET; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(16,16,16,.55)';
    for (var px = 0; px < W; px++) {
      var r = R0 + (R1 - R0) * px / W, x = 0.5, i;
      for (i = 0; i < 300; i++) x = r * x * (1 - x);
      for (i = 0; i < 120; i++) { x = r * x * (1 - x); ctx.fillRect(px, H - 10 - x * (H - 20), 1.6, 1.6); }
    }
    var base = ctx.getImageData(0, 0, W, H);
    function label(r) {
      if (r < 3.0) return 'settles on one value';
      if (r < 3.449) return 'flips between two values';
      if (r < 3.5699) return 'doubling: four, eight, sixteen';
      return 'chaos';
    }
    function move(e) {
      var b = c.getBoundingClientRect();
      var px = Math.max(0, Math.min(W, (e.clientX - b.left) / b.width * W));
      var r = R0 + (R1 - R0) * px / W;
      ctx.putImageData(base, 0, 0);
      ctx.fillStyle = RED; ctx.fillRect(px - 1.5, 0, 3, H);
      out.innerHTML = 'r = ' + r.toFixed(2) + ' &nbsp;/&nbsp; ' + label(r);
    }
    c.addEventListener('pointermove', move);
    c.addEventListener('pointerdown', move);
    c.addEventListener('pointerleave', function () { ctx.putImageData(base, 0, 0); });
  })();

  /* Fig. 1: the drop test. A drop balanced on a hill; the sign of a tiny offset decides the side. */
  (function () {
    var c = document.getElementById('drop-canvas');
    if (!c) return;
    var ctx = c.getContext('2d'), W = c.width, H = c.height, CX = W / 2;
    var go = document.getElementById('drop-go'), reset = document.getElementById('drop-reset');
    var rOut = document.getElementById('drop-readout'), tOut = document.getElementById('drop-tally');
    var left = 0, right = 0, running = false, trail = [];
    function hill(x) { return H * 0.72 - 210 * Math.exp(-Math.pow(x - CX, 2) / (2 * 150 * 150)); }
    function scene(drop) {
      ctx.fillStyle = SHEET; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(16,16,16,.12)'; ctx.lineWidth = 1;
      for (var g = 40; g < W; g += 40) { ctx.beginPath(); ctx.moveTo(g, 0); ctx.lineTo(g, H); ctx.stroke(); }
      for (var h = 40; h < H; h += 40) { ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(W, h); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(0, H);
      for (var x = 0; x <= W; x += 6) ctx.lineTo(x, hill(x));
      ctx.lineTo(W, H); ctx.closePath();
      ctx.fillStyle = INK; ctx.fill();
      ctx.strokeStyle = RED; ctx.lineWidth = 3; ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(CX, 20); ctx.lineTo(CX, hill(CX) - 30); ctx.stroke(); ctx.setLineDash([]);
      for (var i = 0; i < trail.length; i++) {
        ctx.fillStyle = 'rgba(224,58,30,' + (i / trail.length * 0.5) + ')';
        ctx.beginPath(); ctx.arc(trail[i][0], trail[i][1], 6, 0, 7); ctx.fill();
      }
      if (drop) {
        ctx.fillStyle = '#ffe600'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(drop[0], drop[1] - 14, 14, 0, 7); ctx.fill(); ctx.stroke();
      }
    }
    function tally() { tOut.innerHTML = 'left ' + left + ' &nbsp;/&nbsp; right ' + right; }
    function release() {
      if (running) return;
      running = true; go.disabled = true; trail = [];
      var d = (Math.random() < 0.5 ? -1 : 1) * (0.0001 + Math.random() * 0.0009);
      rOut.textContent = 'start offset: ' + (d > 0 ? '+' : '') + d.toFixed(6) + ' px';
      var x = CX + d, v = 0, steps = 0;
      (function tick() {
        v += 0.0095 * (x - CX) + 0.0000001 * Math.sign(x - CX);
        x += v; steps++;
        if (Math.abs(x - CX) > 130) { v += Math.sign(x - CX) * 0.6; }
        trail.push([x, hill(x) - 14]); if (trail.length > 40) trail.shift();
        scene([x, hill(x)]);
        if (x < 24 || x > W - 24 || steps > 4000) {
          if (x < CX) left++; else right++;
          tally(); rOut.textContent += '  /  rolled ' + (x < CX ? 'left' : 'right');
          running = false; go.disabled = false; return;
        }
        requestAnimationFrame(tick);
      })();
    }
    scene([CX, hill(CX)]);
    go.addEventListener('click', release);
    reset.addEventListener('click', function () { if (running) return; left = right = 0; trail = []; tally(); rOut.textContent = 'start offset: waiting'; scene([CX, hill(CX)]); });
  })();

  /* Fig. 3: ripples */
  (function () {
    var c = document.getElementById('ripples');
    if (!c) return;
    var ctx = c.getContext('2d'), W = c.width, H = c.height, rings = [], last = 0;
    function add(x, y) { rings.push({ x: x, y: y, t: 0 }); }
    function draw() {
      ctx.fillStyle = INK; ctx.fillRect(0, 0, W, H);
      ctx.lineWidth = 3;
      for (var i = rings.length - 1; i >= 0; i--) {
        var r = rings[i];
        for (var k = 0; k < 4; k++) {
          var rad = r.t - k * 26; if (rad <= 0) continue;
          var a = Math.max(0, 1 - r.t / 520) * (1 - k * 0.2);
          ctx.strokeStyle = 'rgba(244,244,240,' + a.toFixed(3) + ')';
          ctx.beginPath(); ctx.ellipse(r.x, r.y, rad * 1.7, rad * 0.45, 0, 0, 7); ctx.stroke();
        }
        if (r.t > 560) rings.splice(i, 1);
      }
    }
    function frame(ts) {
      if (ts - last > 2400) { add(W * (0.3 + Math.random() * 0.4), H * 0.5); last = ts; }
      for (var i = 0; i < rings.length; i++) rings[i].t += 3;
      draw(); requestAnimationFrame(frame);
    }
    c.addEventListener('pointerdown', function (e) {
      var b = c.getBoundingClientRect();
      add((e.clientX - b.left) / b.width * W, (e.clientY - b.top) / b.height * H);
    });
    if (reduce) { add(W / 2, H / 2); rings[0].t = 300; draw(); }
    else requestAnimationFrame(frame);
  })();
})();
