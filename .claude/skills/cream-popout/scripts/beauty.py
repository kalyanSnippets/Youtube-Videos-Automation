# face clean-up: skin-only smoothing + redness reduction + slight lift, inside the tracked face box. usage: beauty.py in.mp4 face.json out.mp4
import sys, json, subprocess, cv2, numpy as np
src, fj, out = sys.argv[1:4]; F = json.load(open(fj))
cap = cv2.VideoCapture(src); W, H = int(cap.get(3)), int(cap.get(4)); fps = cap.get(5) or 30
ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(fps), '-i', '-', '-i', src, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-c:a', 'copy', out], stdin=subprocess.PIPE)
def face_at(t):
    i = max(0, min(len(F['t']) - 1, int(np.searchsorted(F['t'], t)) - 1)); return F['cx'][i], F['cy'][i], F['h'][i]
n = 0
while True:
    ok, img = cap.read()
    if not ok: break
    cx, cy, h = face_at(n / fps); n += 1
    x0, x1 = int(max(0, cx - 0.85 * h)), int(min(W, cx + 0.85 * h)); y0, y1 = int(max(0, cy - 1.0 * h)), int(min(H, cy + 0.9 * h))
    roi = img[y0:y1, x0:x1]
    if roi.size:
        ycc = cv2.cvtColor(roi, cv2.COLOR_BGR2YCrCb)
        m = cv2.inRange(ycc, (40, 133, 77), (250, 178, 130)).astype(np.float32) / 255
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)); m = cv2.GaussianBlur(m, (0, 0), 7)
        # keep the box edge soft so nothing pops
        ry, rx = np.linspace(-1, 1, roi.shape[0])[:, None], np.linspace(-1, 1, roi.shape[1])[None, :]
        m *= np.clip((1 - np.maximum(abs(ry), abs(rx))) * 6, 0, 1)
        sm = cv2.bilateralFilter(roi, 0, 28, 7); sm = cv2.bilateralFilter(sm, 0, 22, 5)
        lab = cv2.cvtColor(sm, cv2.COLOR_BGR2LAB).astype(np.float32)
        lab[..., 1] = 128 + (lab[..., 1] - 128) * 0.86   # less redness
        lab[..., 0] = np.clip(lab[..., 0] * 1.03 + 3, 0, 255)  # tiny lift
        sm = cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2BGR)
        a = (m * 0.8)[..., None]
        img[y0:y1, x0:x1] = (roi * (1 - a) + sm * a).astype(np.uint8)
    ff.stdin.write(img.tobytes())
ff.stdin.close(); ff.wait(); print('frames', n)
