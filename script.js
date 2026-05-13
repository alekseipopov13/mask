const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");

const controls = {
  maskText: document.getElementById("maskText"),
  width: document.getElementById("width"),
  height: document.getElementById("height"),
  density: document.getElementById("density"),
  radius: document.getElementById("radius"),
  spread: document.getElementById("spread"),
  speed: document.getElementById("speed"),
  pulse: document.getElementById("pulse"),
  drift: document.getElementById("drift"),
  particleColor: document.getElementById("particleColor"),
  backgroundColor: document.getElementById("backgroundColor"),
  seed: document.getElementById("seed"),
  blur: document.getElementById("blur"),
};

const outputs = {
  density: document.getElementById("densityOut"),
  radius: document.getElementById("radiusOut"),
  spread: document.getElementById("spreadOut"),
  speed: document.getElementById("speedOut"),
  pulse: document.getElementById("pulseOut"),
  drift: document.getElementById("driftOut"),
};

const state = {
  particles: [],
  running: true,
  lastFrame: performance.now(),
  fps: 60,
};

const presets = {
  bank: { density: 1.35, radius: 2.1, spread: 7, speed: 0.75, pulse: 0.36, drift: 5.5, blur: 1 },
  dense: { density: 2.2, radius: 1.7, spread: 5, speed: 0.55, pulse: 0.22, drift: 3.5, blur: 0.5 },
  soft: { density: 0.85, radius: 2.8, spread: 12, speed: 1.05, pulse: 0.5, drift: 9, blur: 1.5 },
};

function numberValue(id) {
  return Number(controls[id].value);
}

function settings() {
  return {
    text: controls.maskText.value,
    width: Math.max(280, Math.round(numberValue("width"))),
    height: Math.max(160, Math.round(numberValue("height"))),
    density: numberValue("density"),
    radius: numberValue("radius"),
    spread: numberValue("spread"),
    speed: numberValue("speed"),
    pulse: numberValue("pulse"),
    drift: numberValue("drift"),
    particleColor: controls.particleColor.value,
    backgroundColor: controls.backgroundColor.value,
    seed: Math.round(numberValue("seed")),
    blur: numberValue("blur"),
  };
}

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function buildParticles() {
  const cfg = settings();
  canvas.width = cfg.width;
  canvas.height = cfg.height;
  document.getElementById("canvasSize").textContent = `${cfg.width} x ${cfg.height}`;

  const lines = cfg.text.split("\n").filter(Boolean);
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 1);
  const fontSize = Math.min(cfg.height / Math.max(lines.length * 1.8, 2.4), cfg.width / Math.max(longest * 0.72, 8), 92);
  const lineHeight = fontSize * 1.18;
  const totalHeight = lineHeight * lines.length;
  const startY = (cfg.height - totalHeight) / 2 + fontSize * 0.82;

  const sample = document.createElement("canvas");
  sample.width = cfg.width;
  sample.height = cfg.height;
  const sampleCtx = sample.getContext("2d");
  sampleCtx.fillStyle = "#fff";
  sampleCtx.font = `700 ${fontSize}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
  sampleCtx.textBaseline = "alphabetic";

  lines.forEach((line, index) => {
    const width = sampleCtx.measureText(line).width;
    sampleCtx.fillText(line, (cfg.width - width) / 2, startY + index * lineHeight);
  });

  const image = sampleCtx.getImageData(0, 0, cfg.width, cfg.height);
  const random = seeded(cfg.seed);
  const step = Math.max(3, Math.round(9 / cfg.density));
  const particles = [];

  for (let y = 0; y < cfg.height; y += step) {
    for (let x = 0; x < cfg.width; x += step) {
      const alpha = image.data[(y * cfg.width + x) * 4 + 3];
      if (alpha > 20 && random() < alpha / 255) {
        const angle = random() * Math.PI * 2;
        particles.push({
          x: x + (random() - 0.5) * cfg.spread,
          y: y + (random() - 0.5) * cfg.spread,
          phase: random() * Math.PI * 2,
          angle,
          orbit: 0.25 + random() * 0.75,
          alpha: 0.35 + random() * 0.65,
          size: cfg.radius * (0.65 + random() * 0.7),
        });
      }
    }
  }

  state.particles = particles;
  document.getElementById("particleCount").textContent = `${particles.length} частиц`;
  updateOutputs();
  updateCode();
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function draw(now) {
  const cfg = settings();
  const dt = now - state.lastFrame;
  state.lastFrame = now;
  state.fps = state.fps * 0.92 + (1000 / Math.max(dt, 1)) * 0.08;
  document.getElementById("fpsCounter").textContent = `${Math.round(state.fps)} FPS`;

  ctx.fillStyle = cfg.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.filter = cfg.blur > 0 ? `blur(${cfg.blur}px)` : "none";

  const rgb = hexToRgb(cfg.particleColor);
  const t = now * 0.001 * cfg.speed;
  for (const p of state.particles) {
    const wave = Math.sin(t * 2.4 + p.phase);
    const wander = Math.cos(t * 1.7 + p.phase * 1.9);
    const x = p.x + Math.cos(p.angle + wave) * cfg.drift * p.orbit + wander * cfg.spread * 0.12;
    const y = p.y + Math.sin(p.angle + wander) * cfg.drift * p.orbit + wave * cfg.spread * 0.12;
    const radius = Math.max(0.35, p.size * (1 + wave * cfg.pulse * 0.28));
    const alpha = Math.min(1, Math.max(0.08, p.alpha * (0.78 + wave * cfg.pulse)));
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.filter = "none";

  if (state.running) requestAnimationFrame(draw);
}

function updateOutputs() {
  outputs.density.textContent = numberValue("density").toFixed(2);
  outputs.radius.textContent = `${numberValue("radius").toFixed(1)} px`;
  outputs.spread.textContent = `${numberValue("spread").toFixed(1)} px`;
  outputs.speed.textContent = numberValue("speed").toFixed(2);
  outputs.pulse.textContent = numberValue("pulse").toFixed(2);
  outputs.drift.textContent = `${numberValue("drift").toFixed(1)} px`;
}

function swiftString(value) {
  return value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", "\\n");
}

function kotlinString(value) {
  return value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", "\\n");
}

function swiftCode(cfg) {
  const text = swiftString(cfg.text);
  return `import SwiftUI
import UIKit

struct HiddenAmountParticles: View {
    private let particles = ParticleModel.generate(
        text: "${text}",
        canvas: CGSize(width: ${cfg.width}, height: ${cfg.height}),
        density: ${cfg.density.toFixed(2)},
        radius: ${cfg.radius.toFixed(1)},
        spread: ${cfg.spread.toFixed(1)},
        seed: ${cfg.seed}
    )

    var body: some View {
        TimelineView(.animation) { timeline in
            Canvas { context, size in
                let time = timeline.date.timeIntervalSinceReferenceDate * ${cfg.speed.toFixed(2)}
                context.fill(Path(CGRect(origin: .zero, size: size)), with: .color(Color(hex: "${cfg.backgroundColor}")))
                context.addFilter(.blur(radius: ${cfg.blur.toFixed(1)}))
                for p in particles {
                    let wave = sin(time * 2.4 + p.phase)
                    let wander = cos(time * 1.7 + p.phase * 1.9)
                    let x = p.x + cos(p.angle + wave) * ${cfg.drift.toFixed(1)} * p.orbit + wander * ${cfg.spread.toFixed(1)} * 0.12
                    let y = p.y + sin(p.angle + wander) * ${cfg.drift.toFixed(1)} * p.orbit + wave * ${cfg.spread.toFixed(1)} * 0.12
                    let r = max(0.35, p.size * (1 + wave * ${cfg.pulse.toFixed(2)} * 0.28))
                    let rect = CGRect(x: x - r, y: y - r, width: r * 2, height: r * 2)
                    context.fill(Path(ellipseIn: rect), with: .color(Color(hex: "${cfg.particleColor}").opacity(p.alpha)))
                }
            }
        }
        .frame(width: ${cfg.width}, height: ${cfg.height})
    }
}

struct ParticleModel {
    let x: Double, y: Double, phase: Double, angle: Double, orbit: Double, alpha: Double, size: Double

    static func generate(text: String, canvas: CGSize, density: Double, radius: Double, spread: Double, seed: UInt32) -> [ParticleModel] {
        let scale = UIScreen.main.scale
        let format = UIGraphicsImageRendererFormat()
        format.scale = scale
        let renderer = UIGraphicsImageRenderer(size: canvas, format: format)
        let image = renderer.image { context in
            UIColor.clear.setFill()
            context.fill(CGRect(origin: .zero, size: canvas))

            let lines = text.components(separatedBy: "\\n").filter { !$0.isEmpty }
            let longest = max(lines.map { $0.count }.max() ?? 1, 1)
            let fontSize = min(canvas.height / max(Double(lines.count) * 1.8, 2.4), canvas.width / max(Double(longest) * 0.72, 8), 92)
            let font = UIFont.systemFont(ofSize: fontSize, weight: .bold)
            let paragraph = NSMutableParagraphStyle()
            paragraph.alignment = .center
            let attrs: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: UIColor.white, .paragraphStyle: paragraph]
            let lineHeight = fontSize * 1.18
            let totalHeight = lineHeight * CGFloat(lines.count)
            let startY = (canvas.height - totalHeight) / 2
            for (index, line) in lines.enumerated() {
                line.draw(in: CGRect(x: 0, y: startY + CGFloat(index) * lineHeight, width: canvas.width, height: lineHeight), withAttributes: attrs)
            }
        }

        guard let cgImage = image.cgImage,
              let data = cgImage.dataProvider?.data,
              let bytes = CFDataGetBytePtr(data) else { return [] }

        var rng = SeededRandom(seed: seed)
        let width = cgImage.width
        let height = cgImage.height
        let step = max(3, Int((9 * scale / density).rounded()))
        var result: [ParticleModel] = []

        stride(from: 0, to: height, by: step).forEach { y in
            stride(from: 0, to: width, by: step).forEach { x in
                let alpha = Double(bytes[(y * width + x) * 4 + 3]) / 255
                if alpha > 0.08 && rng.next() < alpha {
                    let angle = rng.next() * .pi * 2
                    result.append(ParticleModel(
                        x: (Double(x) + (rng.next() - 0.5) * spread * scale) / scale,
                        y: (Double(y) + (rng.next() - 0.5) * spread * scale) / scale,
                        phase: rng.next() * .pi * 2,
                        angle: angle,
                        orbit: 0.25 + rng.next() * 0.75,
                        alpha: 0.35 + rng.next() * 0.65,
                        size: radius * (0.65 + rng.next() * 0.7)
                    ))
                }
            }
        }
        return result
    }
}

struct SeededRandom {
    private var value: UInt32
    init(seed: UInt32) { value = seed }
    mutating func next() -> Double {
        value = value &* 1_664_525 &+ 1_013_904_223
        return Double(value) / Double(UInt32.max)
    }
}

extension Color {
    init(hex: String) {
        let value = UInt64(hex.dropFirst(), radix: 16) ?? 0
        self.init(red: Double((value >> 16) & 255) / 255, green: Double((value >> 8) & 255) / 255, blue: Double(value & 255) / 255)
    }
}`;
}

function androidCode(cfg) {
  const text = kotlinString(cfg.text);
  return `import android.graphics.Bitmap
import android.graphics.Paint
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin

@Composable
fun HiddenAmountParticles(modifier: Modifier = Modifier) {
    val density = LocalDensity.current
    val widthPx = with(density) { ${cfg.width}.dp.toPx() }
    val heightPx = with(density) { ${cfg.height}.dp.toPx() }
    val particles = remember(widthPx, heightPx) {
        ParticleModel.generate(
            text = "${text}",
            canvas = Size(widthPx, heightPx),
            density = ${cfg.density.toFixed(2)}f,
            radius = ${cfg.radius.toFixed(1)}f,
            spread = ${cfg.spread.toFixed(1)}f,
            seed = ${cfg.seed}
        )
    }
    val infinite = rememberInfiniteTransition(label = "hidden-amount")
    val time by infinite.animateFloat(
        initialValue = 0f,
        targetValue = 1000f,
        animationSpec = infiniteRepeatable(tween(1_000_000, easing = LinearEasing)),
        label = "time"
    )
    Canvas(modifier.size(${cfg.width}.dp, ${cfg.height}.dp)) {
        drawRect(Color(${cfg.backgroundColor.replace("#", "0xFF")}))
        val t = time * ${cfg.speed.toFixed(2)}f
        particles.forEach { p ->
            val wave = sin(t * 2.4f + p.phase)
            val wander = cos(t * 1.7f + p.phase * 1.9f)
            val x = p.x + cos(p.angle + wave) * ${cfg.drift.toFixed(1)}f * p.orbit + wander * ${cfg.spread.toFixed(1)}f * 0.12f
            val y = p.y + sin(p.angle + wander) * ${cfg.drift.toFixed(1)}f * p.orbit + wave * ${cfg.spread.toFixed(1)}f * 0.12f
            val radius = max(0.35f, p.size * (1f + wave * ${cfg.pulse.toFixed(2)}f * 0.28f))
            drawCircle(Color(${cfg.particleColor.replace("#", "0xFF")}).copy(alpha = p.alpha), radius, Offset(x, y))
        }
    }
}

data class ParticleModel(
    val x: Float,
    val y: Float,
    val phase: Float,
    val angle: Float,
    val orbit: Float,
    val alpha: Float,
    val size: Float
) {
    companion object {
        fun generate(text: String, canvas: Size, density: Float, radius: Float, spread: Float, seed: Int): List<ParticleModel> {
            val width = canvas.width.toInt().coerceAtLeast(1)
            val height = canvas.height.toInt().coerceAtLeast(1)
            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            val nativeCanvas = android.graphics.Canvas(bitmap)
            val lines = text.split("\\n").filter { it.isNotEmpty() }
            val longest = lines.maxOfOrNull { it.length } ?: 1
            val fontSize = min(height / max(lines.size * 1.8f, 2.4f), min(width / max(longest * 0.72f, 8f), 92f * android.content.res.Resources.getSystem().displayMetrics.density))
            val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = android.graphics.Color.WHITE
                textAlign = Paint.Align.CENTER
                textSize = fontSize
                typeface = android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD)
            }
            val lineHeight = fontSize * 1.18f
            val totalHeight = lineHeight * lines.size
            val startY = (height - totalHeight) / 2f - (paint.ascent() + paint.descent()) / 2f
            lines.forEachIndexed { index, line ->
                nativeCanvas.drawText(line, width / 2f, startY + index * lineHeight, paint)
            }

            val rng = SeededRandom(seed)
            val step = max(3, (9f / density).toInt())
            val result = mutableListOf<ParticleModel>()
            var y = 0
            while (y < height) {
                var x = 0
                while (x < width) {
                    val alpha = android.graphics.Color.alpha(bitmap.getPixel(x, y)) / 255f
                    if (alpha > 0.08f && rng.next() < alpha) {
                        val angle = rng.next() * PI.toFloat() * 2f
                        result += ParticleModel(
                            x = x + (rng.next() - 0.5f) * spread,
                            y = y + (rng.next() - 0.5f) * spread,
                            phase = rng.next() * PI.toFloat() * 2f,
                            angle = angle,
                            orbit = 0.25f + rng.next() * 0.75f,
                            alpha = 0.35f + rng.next() * 0.65f,
                            size = radius * (0.65f + rng.next() * 0.7f)
                        )
                    }
                    x += step
                }
                y += step
            }
            return result
        }
    }
}

class SeededRandom(seed: Int) {
    private var value = seed
    fun next(): Float {
        value = value * 1_664_525 + 1_013_904_223
        return (value ushr 1).toFloat() / Int.MAX_VALUE.toFloat()
    }
}`;
}

function updateCode() {
  const cfg = settings();
  document.getElementById("iosCode").value = swiftCode(cfg);
  document.getElementById("androidCode").value = androidCode(cfg);
}

async function copyFrom(id) {
  const field = document.getElementById(id);
  const status = document.getElementById("copyStatus");
  try {
    await navigator.clipboard.writeText(field.value);
    status.textContent = "Код скопирован.";
  } catch {
    field.focus();
    field.select();
    status.textContent = "Код выделен. Используйте Cmd+C или Ctrl+C.";
  }
}

for (const input of Object.values(controls)) {
  input.addEventListener("input", () => {
    buildParticles();
  });
}

document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    const preset = presets[button.dataset.preset];
    Object.entries(preset).forEach(([key, value]) => {
      controls[key].value = value;
    });
    buildParticles();
  });
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === tab));
    document.getElementById("controlsTab").classList.toggle("active", tab.dataset.tab === "controls");
    document.getElementById("exportTab").classList.toggle("active", tab.dataset.tab === "export");
    updateCode();
  });
});

document.getElementById("pauseBtn").addEventListener("click", (event) => {
  state.running = !state.running;
  event.currentTarget.textContent = state.running ? "Пауза" : "Запуск";
  state.lastFrame = performance.now();
  if (state.running) requestAnimationFrame(draw);
});

document.getElementById("randomizeBtn").addEventListener("click", () => {
  controls.seed.value = Math.floor(Math.random() * 999999);
  buildParticles();
});

document.getElementById("copyIosBtn").addEventListener("click", () => copyFrom("iosCode"));
document.getElementById("copyAndroidBtn").addEventListener("click", () => copyFrom("androidCode"));

buildParticles();
requestAnimationFrame(draw);
