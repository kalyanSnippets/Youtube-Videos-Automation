"""Synthesised royalty-free bed (no samples): soft pad chords + light pulse. usage: music.py out.wav seconds bpm"""
import numpy as np, wave, sys
out, dur, bpm = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
sr = 44100; n = int(sr * dur); t = np.arange(n) / sr; beat = 60 / bpm; bar = beat * 4
chords = [[220.0, 261.63, 329.63, 392.0], [174.61, 220.0, 261.63, 329.63], [130.81, 196.0, 261.63, 329.63], [196.0, 246.94, 293.66, 392.0]]
L = np.zeros(n); R = np.zeros(n)
for b in range(int(dur / bar) + 1):
    ch = chords[b % 4]; a = int(b * bar * sr); e = min(n, int((b + 1) * bar * sr) + int(0.4 * sr))
    if a >= n: break
    tt = np.arange(e - a) / sr
    env = np.minimum(1, tt / 0.5) * np.minimum(1, (tt[-1] - tt) / 0.5 + 0.001)
    for k, fq in enumerate(ch):
        s = (np.sin(2 * np.pi * fq * tt) + 0.35 * np.sin(2 * np.pi * fq * 2 * tt + 0.3) + 0.5 * np.sin(2 * np.pi * fq * 1.003 * tt)) * env * 0.11
        pan = 0.35 + 0.1 * k; L[a:e] += s * (1 - pan); R[a:e] += s * pan
    bs = np.sin(2 * np.pi * ch[0] / 2 * tt) * env * 0.22; L[a:e] += bs; R[a:e] += bs
    for q in range(8):  # plucked arpeggio on eighth notes
        p = a + int(q * beat / 2 * sr); m = min(n - p, int(0.35 * sr))
        if m <= 0: break
        pt = np.arange(m) / sr; fq = ch[[0, 2, 1, 3, 2, 1, 3, 2][q]] * 2
        pl = np.sin(2 * np.pi * fq * pt) * np.exp(-pt * 9) * 0.10
        (L if q % 2 else R)[p:p + m] += pl * 0.8; (R if q % 2 else L)[p:p + m] += pl * 0.4
    for q in range(4):  # soft kick on 1 and 3, tick on 2 and 4
        p = a + int(q * beat * sr); m = min(n - p, int(0.18 * sr))
        if m <= 0: break
        pt = np.arange(m) / sr
        hit = np.sin(2 * np.pi * (55 + 60 * np.exp(-pt * 30)) * pt) * np.exp(-pt * 22) * 0.30 if q % 2 == 0 else np.random.default_rng(q).standard_normal(m) * np.exp(-pt * 70) * 0.035
        L[p:p + m] += hit; R[p:p + m] += hit
st = np.stack([L, R], 1); st = st / np.max(np.abs(st)) * 0.7
w = wave.open(out, "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes((st * 32767).astype(np.int16).tobytes()); w.close()
