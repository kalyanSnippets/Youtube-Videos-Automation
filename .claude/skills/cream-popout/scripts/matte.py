# person cut-out video with alpha (VP9 webm) using the selfie segmenter + guided-filter edge refine, temporally smoothed.
# usage: matte.py in.mp4 out.webm [scale]
import sys, subprocess, cv2, numpy as np
from ai_edge_litert.interpreter import Interpreter
src, out = sys.argv[1:3]; sc = float(sys.argv[3]) if len(sys.argv) > 3 else 0.5
cap = cv2.VideoCapture(src); W0, H0 = int(cap.get(3)), int(cap.get(4)); W, H = int(W0 * sc) // 2 * 2, int(H0 * sc) // 2 * 2
it = Interpreter(model_path="/home/user/Youtube-Videos-Automation/.claude/skills/effects/models/selfie_segmenter.tflite"); it.allocate_tensors()
ii, oo = it.get_input_details()[0]['index'], it.get_output_details()[0]['index']
ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', f'{W}x{H}', '-r', '30', '-i', '-', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '28', '-row-mt', '1', '-deadline', 'realtime', '-cpu-used', '8', out], stdin=subprocess.PIPE)
box = lambda z: cv2.boxFilter(z, -1, (9, 9)); prev = None; n = 0
while True:
    ok, bgr = cap.read()
    if not ok: break
    bgr = cv2.resize(bgr, (W, H), interpolation=cv2.INTER_AREA); rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    it.set_tensor(ii, cv2.resize(rgb, (256, 256)).astype(np.float32)[None] / 255.0); it.invoke()
    m = cv2.resize(it.get_tensor(oo)[0, :, :, 0], (W, H), interpolation=cv2.INTER_CUBIC)
    m = m if prev is None else 0.55 * m + 0.45 * prev; prev = m
    I = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    mI, mp = box(I), box(m); a = (box(I * m) - mI * mp) / (box(I * I) - mI * mI + 2e-3); b = mp - a * mI
    al = np.clip(np.clip(box(a) * I + box(b), 0, 1) * 1.7 - 0.35, 0, 1)
    ff.stdin.write(np.dstack([bgr, (al * 255).astype(np.uint8)]).tobytes()); n += 1
ff.stdin.close(); ff.wait(); print('frames', n, W, H)
