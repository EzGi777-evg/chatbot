export type Categoria = {
  id: string;
  nombre: string;
  icono: string;
  subcategorias: string[];
};

export type Producto = {
  id: string;
  nombre: string;
  categoria: string;
  subcategoria: string;
  descripcion: string;
  precio: number | null;
  existencias: number | null;
  imagen: string | null;
  fuente: string;
  verificado: boolean;
  fechaVerificacion: string | null;
};

export type Pregunta = {
  id: string;
  pregunta: string;
  palabrasClave: string[];
  respuesta: string;
  fuente: string;
  fechaVerificacion: string;
  verificado: boolean;
};

export type TemaSinInformacion = {
  tema: string;
  palabrasClave: string[];
};

export type MensajeChat = {
  role: "user" | "assistant";
  content: string;
  productos?: Producto[];
  simulada?: boolean;
};

export type RespuestaChat = {
  respuesta: string;
  productos: Producto[];
  simulada: boolean;
};
