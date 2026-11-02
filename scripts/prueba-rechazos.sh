#!/usr/bin/env bash
cd "$(dirname "$0")/.."
rm -f data/pedidos/solicitudes.json

caso() {
  echo "=== $1"
  PRODUCTOS="$2" TOTAL="$3" TEL="$4" MUN="$5" python3 -c '
import os, json
resumen = ("Resumen de tu solicitud\n- " + os.environ["PRODUCTOS"] + "\nTotal de productos: " + os.environ["TOTAL"] +
  " (domicilio no incluido)\nNombre: Juan Prueba\nTeléfono: " + os.environ["TEL"] + "\nMunicipio: " + os.environ["MUN"] +
  "\nBarrio: Centro\nDirección: Calle 10 20-30\n¿Confirmas que registre la solicitud?")
print(json.dumps({"messages":[
  {"role":"user","content":"Quiero hacer un pedido"},
  {"role":"assistant","content":resumen},
  {"role":"user","content":"Sí, confirmo"}]}))
' | curl -s -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d @- | python3 -c '
import sys, json
d = json.load(sys.stdin)
print(d.get("respuesta") or d.get("error"))
print("solicitudId:", d.get("solicitudId"))
'
}

caso "Bajo el mínimo (espera: no registra, explica el faltante)" "2 x Salchichas x12" '$23.000' 3001234567 Envigado
caso "Fuera de cobertura (espera: no registra, remite al WhatsApp)" "10 x Salchichas x12" '$115.000' 3001234567 Bello
caso "Teléfono inválido (espera: no registra, pide celular válido)" "10 x Salchichas x12" '$115.000' 12345 Envigado

echo
echo "Archivo de solicitudes (espera que no exista):"
ls data/pedidos
