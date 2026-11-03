#!/usr/bin/env bash
# Uso: ./scripts/probar.sh "mensaje 1" "mensaje 2" ...   (otra URL: EVALUAR_URL=http://localhost:3001)
# Termina con código 1 si algún mensaje no recibe respuesta (error HTTP o servidor apagado).
URL="${EVALUAR_URL:-http://localhost:3000}/api/chat"
fallas=0
for msg in "$@"; do
  echo "=== $msg"
  payload=$(MSG="$msg" python3 -c 'import os,json; print(json.dumps({"messages":[{"role":"user","content":os.environ["MSG"]}]}))')
  curl -s -X POST "$URL" -H "Content-Type: application/json" -d "$payload" | python3 -c '
import sys, json
raw = sys.stdin.read()
try:
    d = json.loads(raw)
except Exception:
    print("Sin respuesta válida del servidor (¿está corriendo npm run dev?):", raw[:200])
    sys.exit(1)
if not d.get("respuesta"):
    print("Error:", d.get("error"))
    sys.exit(1)
print(d["respuesta"])
print("tarjetas:", [p["nombre"] for p in d.get("productos", [])], "| simulada:", d.get("simulada"))
' || fallas=$((fallas + 1))
done
exit $((fallas > 0))
