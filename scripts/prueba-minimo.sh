#!/usr/bin/env bash
cd "$(dirname "$0")/.."
python3 -c '
import json
resumen = ("Resumen de tu solicitud\n- 2 x Salchichas x12 (id demo-081)\nTotal de productos: $23.000 (domicilio no incluido)\n"
  "Nombre: Juan Prueba\nTeléfono: 3001234567\nMunicipio: Envigado\nBarrio: Centro\nDirección: Calle 10 20-30\n¿Confirmas que registre la solicitud?")
print(json.dumps({"messages":[
  {"role":"user","content":"Quiero 2 Salchichas x12"},
  {"role":"assistant","content":resumen},
  {"role":"user","content":"Sí, confirmo"}]}))
' | curl -s -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d @- | python3 -c '
import sys, json
d = json.load(sys.stdin)
print(d.get("respuesta") or d.get("error"))
print("solicitudId:", d.get("solicitudId"))
'
ls data/pedidos
