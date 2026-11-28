import sys, json
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8", cpu_threads=4)
for p in sys.argv[1:]:
    import wave, numpy as np; wf = wave.open(p); aud = np.frombuffer(wf.readframes(wf.getnframes()), np.int16).astype(np.float32) / 32768
    segs, _ = m.transcribe(aud, word_timestamps=True, vad_filter=False, beam_size=5, condition_on_previous_text=False)
    words = [{"text": w.word.strip(), "type": "word", "start": round(w.start, 3), "end": round(w.end, 3)} for s in segs for w in s.words]
    json.dump({"words": words}, open(p.rsplit('.', 1)[0] + "_words.json", "w"))
    print("==", p, len(words)); print(" ".join(f"[{w['start']:.1f}]{w['text']}" if i % 12 == 0 else w['text'] for i, w in enumerate(words)))
