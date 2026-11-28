"""Split speech at silences and transcribe each chunk on its own, so repeats and fillers show up. usage: chunks.py in.wav"""
import sys, re, subprocess, wave, numpy as np
from faster_whisper import WhisperModel
p = sys.argv[1]
r = subprocess.run(["ffmpeg", "-i", p, "-af", "silencedetect=n=-32dB:d=0.12", "-f", "null", "-"], capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r)]; en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r)]
wf = wave.open(p); sr = wf.getframerate(); aud = np.frombuffer(wf.readframes(wf.getnframes()), np.int16).astype(np.float32) / 32768
dur = len(aud) / sr
speech = []; prev = 0.0
for s0, s1 in zip(st, en + [dur] * (len(st) - len(en))):
    if s0 - prev > 0.08: speech.append((prev, s0))
    prev = s1
if dur - prev > 0.08: speech.append((prev, dur))
m = WhisperModel("small.en", device="cpu", compute_type="int8", cpu_threads=4)
for a, b in speech:
    seg = aud[int(max(0, a - 0.05) * sr):int((b + 0.05) * sr)]
    seg = np.concatenate([np.zeros(int(0.3 * sr), np.float32), seg, np.zeros(int(0.3 * sr), np.float32)])
    out, _ = m.transcribe(seg, beam_size=5, condition_on_previous_text=False, initial_prompt="Umm, uh, so, so what if, I mean, uh...")
    txt = " ".join(s.text.strip() for s in out)
    print(f"{a:6.2f}-{b:6.2f} ({b-a:4.2f}) | {txt}")
