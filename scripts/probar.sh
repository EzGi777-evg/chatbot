#!/usr/bin/env bash
# Uso: ./scripts/probar.sh "mensaje 1" "mensaje 2" ...
for msg in "$@"; do
  echo "=== $msg"
  payload=$(MSG="$msg" python3 -c 'import os,json; print(json.dumps({"messages":[{"role":"user","content":os.environ["MSG"]}]}))')
  curl -s -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d "$payload" | python3 -c '
import sys, json
raw = sys.stdin.read()
try:
    d = json.loads(raw)
except Exception:
    print("Sin respuesta válida del servidor (¿está corriendo npm run dev?):", raw[:200])
    sys.exit()
print(d.get("respuesta") or d.get("error"))
print("tarjetas:", [p["nombre"] for p in d.get("productos", [])], "| simulada:", d.get("simulada"))
'
done
