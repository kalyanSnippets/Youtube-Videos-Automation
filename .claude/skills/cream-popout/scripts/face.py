import cv2, json, sys
src, out = sys.argv[1:3]
det = cv2.FaceDetectorYN.create("/home/user/Youtube-Videos-Automation/.claude/skills/effects/models/yunet.onnx", "", (270, 480), 0.6)
cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS); T, CX, CY, Hh = [], [], [], []; i = 0; last = (540, 700, 400)
while True:
    ok, fr = cap.read()
    if not ok: break
    if i % 6 == 0:
        _, f = det.detect(cv2.resize(fr, (270, 480)))
        if f is not None and len(f):
            b = max(f, key=lambda r: r[2] * r[3]); last = ((b[0] + b[2] / 2) * 4, (b[1] + b[3] / 2) * 4, b[3] * 4)
        T.append(round(i / fps, 3)); CX.append(round(last[0])); CY.append(round(last[1])); Hh.append(round(last[2]))
    i += 1
def sm(a):
    return [round(sum(a[max(0, k - 3):k + 4]) / len(a[max(0, k - 3):k + 4])) for k in range(len(a))]
json.dump({"t": T, "cx": sm(CX), "cy": sm(CY), "h": sm(Hh)}, open(out, "w"))
print(len(T), min(CY), max(CY), min(CX), max(CX), min(Hh), max(Hh))
