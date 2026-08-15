#!/usr/bin/env python3
"""Focused re-OCR for review-flagged slips (attr/ganzhi precision).
Run AFTER main batch. Slips: 3,6,7,9,10,11,13 + any poem-uncertain.
Output: ocr/review/NN.txt
"""
import json, sys, subprocess, time, os, hashlib

BASE = os.path.dirname(os.path.abspath(__file__))
TMP = os.environ.get("STUDY03_TMP") or ""
if not TMP or not os.path.isdir(TMP) or not os.path.isdir(os.path.join(TMP, "ocr")):
    sys.exit(f"ERROR: STUDY03_TMP 無效（{TMP}）：需包含 ocr/ 子目錄。請以環境變數 STUDY03_TMP 注入。")
TARGETS = [3, 6, 7, 9, 10, 11, 13]
PROMPT = ("這是一張北港朝天宮官方六十甲子籤詩圖。請只專注轉錄以下欄位，逐字輸出，不要解說："
          "1) 籤號干支（如甲子）；2) 卦名（如乾為天卦）；3) 卦象記號（○/● 序列）；"
          "4) 五行屬性行（如『屬金利在秋天』）逐字；5) 方位行（如『宜其西方』或『宜屬北方』）逐字；"
          "6) 四句詩逐字。若某欄位字跡模糊，用［?］標記每個不確定的字。")

def token():
    t = subprocess.run(["curl","-s","-m","10","http://127.0.0.1:18432/get_token"],
                       capture_output=True, text=True).stdout.strip()
    return t[len("Bearer "):] if t.lower().startswith("bearer ") else t

def sign(ts):
    return hashlib.md5(f"100003&{ts}&38d2391985e2369a5fb8227d8e6cd5e5".encode()).hexdigest()

def call(url, payload, method="POST", retries=3):
    for _ in range(retries):
        ts = str(int(time.time()))
        cmd = ["curl","-s","-m","120","-X",method,url,
               "-H", f"Authorization: Bearer {token()}",
               "-H", "X-Auth-Appid: 100003", "-H", f"X-Auth-TimeStamp: {ts}",
               "-H", f"X-Auth-Sign: {sign(ts)}"] + payload
        r = subprocess.run(cmd, capture_output=True, text=True)
        try:
            d = json.loads(r.stdout)
            if d.get("code") == 0: return d
        except Exception: pass
        time.sleep(4)
    return None

outdir = os.path.join(TMP, "ocr", "review")
os.makedirs(outdir, exist_ok=True)
log = open(os.path.join(TMP, "ocr", "review_progress.log"), "a", encoding="utf-8")
for n in TARGETS:
    out = os.path.join(outdir, f"{n:02d}.txt")
    if os.path.exists(out): continue
    d = call("https://autoglm-api.autoglm.ai/agentdr/v1/assistant/skills/image-recognition",
             ["-H","Content-Type: application/json",
              "-d", json.dumps({"prompt": PROMPT, "image_url": json.load(open(os.path.join(TMP,"beigang_slip_urls.json")))[str(n)]["url"]}, ensure_ascii=False)])
    if d:
        open(out, "w", encoding="utf-8").write(d["data"].get("text",""))
        log.write(f"{n:02d} OK\n")
    else:
        log.write(f"{n:02d} FAIL\n")
    log.flush(); time.sleep(1)
print("review OCR done:", os.listdir(outdir))
