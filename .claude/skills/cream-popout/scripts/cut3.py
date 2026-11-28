"""Smooth cut: keep chosen speech chunks, merge close ones, dissolve every cut (4 frames) with alternating gentle zoom.
usage: cut3.py src.mp4 keep.json out.mp4 out_pieces.json   keep.json: {"keep":[[a,b],...], "speed":1.05, "zoom":1.07}"""
import json, subprocess, sys, os, tempfile, shutil
src, kj, out, pj = sys.argv[1:5]
K = json.load(open(kj))
SRCS = K.get("srcs", {"_": src}); SP = K.get("speed", 1.0); Z = K.get("zoom", 1.07); XF = K.get("xfade", 4) / 30
PRE, POST, MERGE = 0.14, 0.08, 0.32
pieces = []
for item in K["keep"]:
    k, a, b = item if len(item) == 3 else ("_", item[0], item[1])
    if pieces and pieces[-1][0] == k and 0 <= a - pieces[-1][2] <= MERGE: pieces[-1][2] = b
    else: pieces.append([k, a, b])
pieces = [[k, round(max(0, a - PRE) * 30) / 30, round((b + POST) * 30) / 30] for k, a, b in pieces]
tmp = tempfile.mkdtemp(dir=os.path.dirname(os.path.abspath(out))); files = []
for i, (k, a, b) in enumerate(pieces):
    d = b - a + (XF if i < len(pieces) - 1 else 0)          # handle so the dissolve does not eat words
    z = 1.0 if i % 2 == 0 else Z
    vf = f"scale={int(1080*z)//2*2}:{int(1920*z)//2*2},crop=1080:1920:(iw-1080)/2:(ih-1920)*0.35" if z > 1 else "scale=1080:1920"
    f = f"{tmp}/p{i:02d}.mp4"
    r = subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{a:.4f}", "-i", SRCS[k], "-r", "30", "-frames:v", str(round(d * 30)), "-vf", vf,
        "-af", f"apad,atrim=0:{d:.4f}", "-c:v", "libx264", "-crf", "14", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "1", f], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr[-300:]
    files.append((f, d))
# chain xfade / acrossfade
args = []; [args.extend(["-i", f]) for f, _ in files]
fc = ""; lv, la = "[0:v]", "[0:a]"; t = files[0][1]
for i in range(1, len(files)):
    off = t - XF
    fc += f"{lv}[{i}:v]xfade=transition=fade:duration={XF:.4f}:offset={off:.4f}[v{i}];{la}[{i}:a]acrossfade=d={XF:.4f}:c1=tri:c2=tri[a{i}];"
    lv, la = f"[v{i}]", f"[a{i}]"; t = off + files[i][1]
fc += f"{lv}setpts=PTS/{SP}[vo];{la}atempo={SP},highpass=f=80,afftdn=nr=10:nf=-42,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2,loudnorm=I=-16:TP=-1.5:LRA=9[ao]"
r = subprocess.run(["ffmpeg", "-v", "error", "-y", *args, "-filter_complex", fc, "-map", "[vo]", "-map", "[ao]", "-threads", "4",
    "-c:v", "libx264", "-crf", "16", "-preset", "fast", "-pix_fmt", "yuv420p", "-g", "15", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", out], capture_output=True, text=True)
assert r.returncode == 0, r.stderr[-600:]
shutil.rmtree(tmp)
# where each piece starts in the output (for zoom-aware graphics if needed)
starts = []; t = 0
for i, (_, d) in enumerate(files): starts.append(round(t / SP, 3)); t += d - XF
json.dump({"pieces": pieces, "starts": starts, "duration": round(t / SP, 3)}, open(pj, "w"))
print("pieces", len(pieces), "duration", round((t + XF) / SP, 2))
