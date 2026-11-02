#!/usr/bin/env bash
# Requiere RESERVA_MINUTOS = 1 en lib/config.ts y el servidor corriendo.
cd "$(dirname "$0")/.."
rm -f data/pedidos/solicitudes.json

registrar() {
  python3 -c '
import json
resumen = ("Resumen de tu solicitud\n- 10 x Salchichas x12\n- 2 x Aceite vegetal 3 L\nTotal de productos: $171.000 (domicilio no incluido)\n"
  "Nombre: Juan Prueba\nTeléfono: 3001234567\nMunicipio: Envigado\nBarrio: Zúñiga\nDirección: Calle 37 Sur 45-10\n¿Confirmas que registre la solicitud?")
print(json.dumps({"messages":[
  {"role":"user","content":"Quiero 10 Salchichas x12 y 2 Aceite vegetal 3 L"},
  {"role":"assistant","content":resumen},
  {"role":"user","content":"Sí, confirmo"}]}))
' | curl -s -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d @- | python3 -c '
import sys, json
d = json.load(sys.stdin)
print("solicitudId:", d.get("solicitudId"), "| error:", d.get("error"))
'
}

echo "1) Registro (espera un SOL-...)"; registrar
echo "2) Mismo registro otra vez, dentro del plazo (espera el MISMO SOL-...)"; registrar
echo "3) Con la reserva vigente (espera: solo hay 50)"; ./scripts/probar.sh "Hay 55 Salchichas x12?"
echo "Esperando 70 s a que venza la reserva..."; sleep 70
echo "4) Con la reserva vencida (espera: sí alcanzan, hay 60)"; ./scripts/probar.sh "Hay 55 Salchichas x12?"
echo "5) Registros en el archivo (espera 1)"
python3 -c "import json; print(len(json.load(open('data/pedidos/solicitudes.json'))))"
