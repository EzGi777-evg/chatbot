export const LIMITES = {
  maxMensajes: 30,
  maxCaracteresUsuario: 500,
  maxCaracteresAsistente: 4000,
};

// Cada llamada al modelo de chat: un solo intento de hasta 20 s (antes 30 s con un reintento: ~65 s de espera).
export const TIEMPO_MAXIMO_CHAT_MS = 20_000;

export const WHATSAPP = "3023322766";
export const MINIMO_COMPRA = 80000;
export const MAX_ITEMS_COTIZACION = 20;
export const MAX_CANTIDAD = 500;
export const MAX_UNIDADES = 5000;
// Tarjetas por respuesta: una por cada producto pedido; las sugerencias no pedidas siguen limitadas a 3 en el prompt.
export const MAX_TARJETAS = 8;
