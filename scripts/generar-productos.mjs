import { readFileSync, writeFileSync } from "node:fs";

const categorias = JSON.parse(readFileSync("data/categorias.json", "utf8")).categorias;

// Por categoría: 5 productos por subcategoría, en el mismo orden que categorias.json.
// Cada producto: [nombre, precio COP ficticio, existencias ficticias]
const catalogo = {
  "empaques-desechables": [
    /* Platos y bandejas */ [
      ["Platos desechables x25", 8500, 120], ["Platos hondos desechables x25", 9500, 90],
      ["Bandejas desechables rectangulares x20", 11000, 45], ["Platos biodegradables x20", 14500, 30],
      ["Platos grandes x50", 15500, 60],
    ],
    /* Línea ecológica */ [
      ["Vasos biodegradables x20", 12000, 60], ["Cubiertos biodegradables x24", 10500, 40],
      ["Pitillos de papel x100", 9000, 75], ["Portacomidas de caña x25", 21000, 22],
      ["Bolsas compostables x30", 12500, 2],
    ],
    /* Servilletas, higiénicos y toallas */ [
      ["Servilletas x300", 6500, 200], ["Servilletas de mesa x500", 9500, 110],
      ["Papel higiénico institucional x12", 24000, 35], ["Toallas de manos en rollo", 13500, 28],
      ["Toalla de cocina x3 rollos", 11000, 55],
    ],
    /* Bolsas */ [
      ["Bolsas plásticas x50", 7000, 0], ["Bolsas plásticas pequeñas x100", 6500, 85],
      ["Bolsas plásticas grandes x50", 9500, 40], ["Bolsas de papel kraft x50", 15000, 33],
      ["Bolsas para basura x10", 8000, 120],
    ],
    /* Portacomidas cartón, icopor y aluminio */ [
      ["Portacomidas de icopor x25", 15000, 80], ["Portacomidas de cartón x25", 17500, 50],
      ["Portacomidas de aluminio x10", 19000, 26], ["Portacomidas con divisiones x25", 18500, 38],
      ["Portacomidas pequeños de icopor x50", 20000, 70],
    ],
    /* Neveras de icopor */ [
      ["Nevera de icopor 20 L", 22000, 15], ["Nevera de icopor 10 L", 15000, 24],
      ["Nevera de icopor 40 L", 36000, 8], ["Nevera de icopor 5 L", 9500, 30],
      ["Nevera de icopor 60 L", 52000, 4],
    ],
    /* Bases, cajas y domos */ [
      ["Domos transparentes x20", 18000, 40], ["Cajas para pizza x10", 14000, 35],
      ["Bases de cartón para tortas x10", 11500, 28], ["Cajas para hamburguesa x25", 16000, 42],
      ["Domos medianos x20", 19500, 0],
    ],
    /* Papel chicle, parafinado y aluminio */ [
      ["Papel aluminio rollo", 9500, 70], ["Papel parafinado rollo", 8500, 45],
      ["Papel chicle x200 hojas", 7500, 60], ["Papel aluminio industrial rollo", 28000, 12],
      ["Papel vinilpel rollo", 10500, 38],
    ],
    /* Pitillos, mezcladores y palos de madera */ [
      ["Pitillos x100", 4500, 150], ["Pitillos flexibles x200", 6500, 90],
      ["Mezcladores x500", 5500, 65], ["Palos de madera x100", 3500, 80],
      ["Pitillos gruesos para batidos x50", 5000, 48],
    ],
    /* Carbón, encendedores y otros */ [
      ["Carbón vegetal bolsa 3 kg", 11000, 25], ["Carbón vegetal bolsa 10 kg", 32000, 14],
      ["Encendedores de cocina", 4500, 100], ["Pastillas encendedoras x24", 7500, 55],
      ["Gel para encender parrilla", 9500, 5],
    ],
    /* Cubiertos */ [
      ["Cubiertos plásticos x50", 7500, 90], ["Cucharas plásticas x100", 6500, 120],
      ["Tenedores plásticos x100", 6500, 110], ["Cuchillos plásticos x100", 6500, 95],
      ["Set de cubiertos con servilleta x50", 14500, 40],
    ],
    /* Contenedores y Sello Plus */ [
      ["Contenedores con tapa x10", 14000, 55], ["Contenedores redondos 500 ml x25", 21000, 30],
      ["Contenedores rectangulares 1 L x25", 25000, 27], ["Contenedores para sopa x25", 23500, 0],
      ["Sello Plus para empacar rollo", 18000, 18],
    ],
    /* Vasos y tapas */ [
      ["Vasos de cartón con tapa x25", 13000, 100], ["Vasos de 7 oz x50", 6000, 140],
      ["Vasos de 12 oz x50", 8500, 105], ["Tapas para vaso de 12 oz x50", 5500, 130],
      ["Vasos de 16 oz x25", 9500, 3],
    ],
    /* Copas y tapas */ [
      ["Copas con tapa x20", 9000, 35], ["Copas de 4 oz x50", 8000, 60],
      ["Copas de 8 oz x50", 9500, 52], ["Tapas para copas x50", 5000, 70],
      ["Copas de postre transparentes x20", 10500, 25],
    ],
    /* Guantes, gorros y tapabocas */ [
      ["Guantes desechables x100", 16000, 45], ["Guantes de nitrilo x100", 28000, 20],
      ["Gorros desechables x100", 12000, 50], ["Tapabocas x50", 9000, 85],
      ["Delantales desechables x50", 17000, 0],
    ],
  ],
  "carnes-frias": [
    /* Mortadela y jamón */ [
      ["Mortadela de pollo 500 g", 9800, 30], ["Mortadela de res 500 g", 10500, 25],
      ["Jamón de cerdo 500 g", 16500, 20], ["Jamón de pollo 500 g", 13500, 18],
      ["Mortadela con aceitunas 500 g", 11500, 0],
    ],
    /* Salchichas y salchichones */ [
      ["Salchichas x12", 11500, 60], ["Salchichas x24", 21000, 40],
      ["Salchichas de pollo x12", 10500, 45], ["Salchichón cervecero 500 g", 15500, 22],
      ["Salchichas cocktail x30", 14500, 5],
    ],
    /* Chorizos, butifarras y longanizas */ [
      ["Chorizo parrillero x6", 14500, 0], ["Chorizo santarrosano x6", 16500, 30],
      ["Butifarra x12", 15000, 26], ["Longaniza x6", 17500, 18],
      ["Chorizo de pollo x6", 13500, 34],
    ],
    /* Tocinetas */ [
      ["Tocineta ahumada 500 g", 18500, 20], ["Tocineta en tiras 250 g", 11500, 32],
      ["Tocineta de cerdo 1 kg", 34000, 12], ["Tocineta en cubos 500 g", 17500, 15],
      ["Tocineta precocida 200 g", 13500, 4],
    ],
    /* Carnes de hamburguesa y productos preparados */ [
      ["Carne de hamburguesa x10", 21000, 40], ["Carne de hamburguesa x20", 39000, 22],
      ["Hamburguesas de pollo x10", 19500, 28], ["Albóndigas x20", 18000, 35],
      ["Carne molida preparada 500 g", 14500, 0],
    ],
    /* Filetes y chuzos */ [
      ["Chuzos de pollo x6", 16500, 25], ["Chuzos de cerdo x6", 17500, 20],
      ["Filetes de pollo x6", 24000, 30], ["Filetes de pescado x6", 26000, 16],
      ["Chuzos mixtos x12", 30000, 2],
    ],
    /* Palitos y panzerotis */ [
      ["Palitos de queso x20", 15500, 35], ["Palitos de queso x40", 29000, 18],
      ["Panzerotis de pollo x12", 17000, 24], ["Panzerotis de carne x12", 17500, 21],
      ["Palitos de yuca x20", 13500, 30],
    ],
    /* Empanadas y patacones */ [
      ["Empanadas de carne x12", 13500, 50], ["Empanadas de pollo x12", 13500, 46],
      ["Empanadas de papa x12", 12000, 38], ["Patacones precocidos x20", 12500, 33],
      ["Empanadas mixtas x24", 25000, 0],
    ],
    /* Maíz y papas congeladas */ [
      ["Papa a la francesa 1 kg", 12500, 45], ["Papa a la francesa 2,5 kg", 28000, 25],
      ["Papa criolla congelada 1 kg", 11000, 30], ["Maíz tierno congelado 500 g", 8500, 40],
      ["Papa en cascos 1 kg", 13500, 3],
    ],
    /* Pinchos, nuggets y milanesas */ [
      ["Nuggets de pollo 500 g", 17000, 3], ["Nuggets de pollo 1 kg", 31000, 45],
      ["Milanesas de pollo x6", 22000, 28], ["Pinchos de pollo x12", 19500, 24],
      ["Nuggets de pescado 500 g", 18500, 40],
    ],
  ],
  "lacteos-refrigerados": [
    /* Leches y yogurt */ [
      ["Leche entera 1 L", 4200, 150], ["Leche deslactosada 1 L", 5200, 90],
      ["Leche entera bolsa 900 ml", 3800, 120], ["Yogurt natural 1 L", 7500, 45],
      ["Yogurt con fruta 1 L", 8000, 0],
    ],
    /* Helados */ [
      ["Helado de vainilla 1 L", 14000, 20], ["Helado de chocolate 1 L", 14500, 18],
      ["Helado de fresa 1 L", 14500, 15], ["Helado de vainilla 4 L", 42000, 6],
      ["Paletas de crema x12", 19000, 25],
    ],
    /* Quesos, quesitos y cuajadas */ [
      ["Queso campesino 500 g", 12000, 35], ["Queso mozzarella 500 g", 17500, 28],
      ["Cuajada fresca 500 g", 10500, 22], ["Quesitos x12", 13000, 30],
      ["Queso costeño 500 g", 13500, 0],
    ],
    /* Mantequillas y esparcibles */ [
      ["Mantequilla 250 g", 8000, 40], ["Mantequilla 500 g", 15000, 32],
      ["Margarina para untar 450 g", 9000, 45], ["Mantequilla con sal 250 g", 8500, 36],
      ["Esparcible de ajo 250 g", 9500, 4],
    ],
    /* Cremas de leche */ [
      ["Crema de leche 900 ml", 11500, 0], ["Crema de leche 500 ml", 7500, 35],
      ["Crema de leche 1 L", 12500, 28], ["Crema para cocinar 200 ml", 4500, 60],
      ["Crema de leche light 500 ml", 8000, 18],
    ],
    /* Arepas */ [
      ["Arepas de maíz x10", 6500, 80], ["Arepas de queso x10", 9500, 45],
      ["Arepas de choclo x10", 8500, 38], ["Arepas delgadas x20", 11500, 50],
      ["Arepas rellenas x6", 13000, 2],
    ],
    /* Ensaladas preparadas */ [
      ["Ensalada de frutas 500 g", 7500, 12], ["Ensalada rusa 500 g", 8500, 15],
      ["Ensalada de pasta 500 g", 9000, 14], ["Ensalada de repollo 500 g", 6500, 20],
      ["Ensalada de frutas 1 kg", 13500, 0],
    ],
  ],
  "salsas-aderezos": [
    /* Salsas tradicionales */ [
      ["Salsa de tomate 1 kg", 9000, 90], ["Salsa de tomate 3 kg", 24000, 40],
      ["Mayonesa 1 kg", 11500, 70], ["Mostaza 500 g", 6500, 55],
      ["Salsa de tomate sobres x100", 14000, 0],
    ],
    /* Salsas especiales */ [
      ["Salsa BBQ 500 g", 8500, 50], ["Salsa de ajo 500 g", 8800, 42],
      ["Salsa picante 500 g", 7800, 48], ["Salsa tártara 500 g", 9500, 30],
      ["Salsa de champiñones 500 g", 10500, 3],
    ],
    /* Salsas dulces */ [
      ["Salsa de piña 500 g", 7800, 30], ["Salsa de mora 500 g", 8200, 28],
      ["Salsa de caramelo 500 g", 9200, 32], ["Salsa de chocolate 500 g", 9000, 35],
      ["Salsa de frutos rojos 500 g", 9500, 0],
    ],
    /* Sazonadores */ [
      ["Sazonador completo 200 g", 5500, 100], ["Sazonador para carnes 200 g", 5800, 80],
      ["Sazonador para pollo 200 g", 5800, 75], ["Sazonador de ajo 200 g", 5500, 65],
      ["Sazonador completo 1 kg", 21000, 25],
    ],
    /* Vinagretas y vinagres */ [
      ["Vinagre blanco 1 L", 4000, 60], ["Vinagre de manzana 500 ml", 6500, 40],
      ["Vinagreta italiana 500 ml", 8500, 33], ["Vinagre balsámico 250 ml", 11500, 20],
      ["Vinagre blanco 4 L", 13000, 2],
    ],
  ],
  "panaderia-snacks": [
    /* Repostería */ [
      ["Chips de chocolate 500 g", 15000, 28], ["Esencia de vainilla 250 ml", 8500, 40],
      ["Polvo de hornear 200 g", 5500, 55], ["Colorantes comestibles x6", 7500, 30],
      ["Glaseado listo 500 g", 12500, 0],
    ],
    /* Mezclas listas, harinas y apanadores */ [
      ["Mezcla lista para panqueques 500 g", 9500, 45], ["Harina de trigo 1 kg", 4800, 120],
      ["Harina de maíz 1 kg", 5200, 95], ["Apanador 500 g", 7500, 50],
      ["Mezcla para brownies 500 g", 11000, 4],
    ],
    /* Tortillas */ [
      ["Tortillas de trigo x10", 8800, 40], ["Tortillas de trigo x20", 15500, 28],
      ["Tortillas de maíz x20", 9500, 35], ["Tortillas integrales x10", 9800, 22],
      ["Tortillas grandes x8", 11500, 0],
    ],
    /* Galletas */ [
      ["Galletas saladas x6 paquetes", 6200, 120], ["Galletas de vainilla x6 paquetes", 7000, 95],
      ["Galletas de chocolate x6 paquetes", 7800, 80], ["Galletas integrales x6 paquetes", 7500, 60],
      ["Galletas de coco x12 paquetes", 13500, 0],
    ],
    /* Panadería */ [
      ["Pan tajado 500 g", 6000, 18], ["Pan para perro caliente x12", 7500, 30],
      ["Pan para hamburguesa x12", 9500, 26], ["Pan integral 500 g", 7000, 20],
      ["Pan tajado grande 700 g", 8000, 2],
    ],
    /* Cereales y frutos frescos */ [
      ["Avena en hojuelas 500 g", 5200, 75], ["Cereal de maíz 500 g", 11500, 40],
      ["Granola 500 g", 13500, 28], ["Pasas 250 g", 7500, 35],
      ["Mezcla de frutos secos 250 g", 12500, 0],
    ],
    /* Papa ripio y snacks */ [
      ["Papa ripio 500 g", 8000, 65], ["Papas fritas de paquete x12", 18000, 40],
      ["Maíz pira x10", 9500, 45], ["Chicharrones x12", 14500, 32],
      ["Platanitos x12", 13500, 5],
    ],
    /* Dulces tradicionales y confites */ [
      ["Confites surtidos 500 g", 7000, 0], ["Caramelos surtidos 500 g", 6500, 70],
      ["Chocolatinas x24", 17500, 40], ["Bocadillo veleño x12", 10500, 36],
      ["Gomitas surtidas 500 g", 9500, 48],
    ],
  ],
  despensa: [
    /* Aceites y margarinas */ [
      ["Aceite vegetal 3 L", 28000, 50], ["Aceite vegetal 1 L", 10500, 90],
      ["Aceite de girasol 1 L", 13500, 45], ["Margarina 1 kg", 13000, 38],
      ["Aceite vegetal 5 L", 45000, 0],
    ],
    /* Cafés y chocolates */ [
      ["Café molido 500 g", 17500, 60], ["Café instantáneo 170 g", 14500, 40],
      ["Café molido 250 g", 9500, 75], ["Chocolate en barra 500 g", 13500, 50],
      ["Café sin cafeína 250 g", 12500, 3],
    ],
    /* Modificadores de leche */ [
      ["Chocolate en polvo 400 g", 12500, 40], ["Achocolatado 1 kg", 21000, 35],
      ["Modificador sabor fresa 400 g", 11500, 28], ["Modificador sabor vainilla 400 g", 11500, 26],
      ["Chocolate en polvo 2 kg", 52000, 0],
    ],
    /* Granos, pastas, enlatados y huevos */ [
      ["Huevos tipo AA x30", 19000, 70], ["Arroz 5 kg", 21500, 85],
      ["Fríjol rojo 1 kg", 9500, 55], ["Pasta espagueti 500 g", 4200, 100],
      ["Atún en lata x3", 17500, 4],
    ],
    /* Condimentos */ [
      ["Comino molido 100 g", 4200, 85], ["Pimienta negra 100 g", 5500, 60],
      ["Orégano 50 g", 3200, 70], ["Color en polvo 200 g", 4800, 55],
      ["Laurel 30 g", 2800, 0],
    ],
    /* Aromáticas e infusiones */ [
      ["Aromática de manzanilla x20", 5800, 55], ["Aromática de menta x20", 5800, 48],
      ["Té negro x25", 7500, 40], ["Aromática de frutos rojos x20", 6800, 33],
      ["Té verde x25", 8000, 0],
    ],
    /* Azúcar y endulzantes */ [
      ["Azúcar blanca 5 kg", 21000, 90], ["Azúcar morena 1 kg", 5200, 70],
      ["Panela 1 kg", 5800, 80], ["Endulzante en polvo 200 g", 9500, 35],
      ["Azúcar blanca 1 kg", 4400, 5],
    ],
    /* Bebidas y siropes */ [
      ["Sirope de chocolate 500 ml", 9500, 22], ["Sirope de caramelo 500 ml", 9800, 20],
      ["Jugo de fruta 1 L", 5500, 60], ["Bebida de avena 1 L", 7500, 30],
      ["Sirope de fresa 500 ml", 9500, 0],
    ],
  ],
  "aseo-hogar": [
    /* Lavalozas */ [
      ["Lavaloza líquido 750 ml", 9800, 70], ["Lavaloza en crema 500 g", 6500, 85],
      ["Lavaloza líquido 3 L", 24000, 30], ["Lavaloza antibacterial 750 ml", 11000, 45],
      ["Lavaloza líquido 1,5 L", 14500, 0],
    ],
    /* Escobas, traperos y recogedores */ [
      ["Escoba de cerdas suaves", 10500, 30], ["Trapero de microfibra", 14500, 25],
      ["Recogedor plástico", 6500, 40], ["Escoba de cerdas duras", 11500, 22],
      ["Trapero industrial", 19500, 3],
    ],
    /* Limpiadores y desinfectantes */ [
      ["Desinfectante 1 L", 8800, 65], ["Desinfectante 4 L", 26000, 32],
      ["Limpiador multiusos 750 ml", 8200, 50], ["Limpiavidrios 500 ml", 7000, 38],
      ["Desinfectante lavanda 1 L", 9200, 0],
    ],
    /* Detergentes y blanqueadores */ [
      ["Detergente en polvo 2 kg", 17500, 48], ["Detergente líquido 2 L", 24000, 30],
      ["Blanqueador 1 L", 4500, 80], ["Detergente en polvo 5 kg", 40000, 18],
      ["Blanqueador 4 L", 14500, 4],
    ],
    /* Esponjas y paños */ [
      ["Esponjas x3", 5200, 100], ["Paños de cocina x5", 8500, 60],
      ["Esponja de acero x6", 4800, 70], ["Paño microfibra x3", 9500, 40],
      ["Esponjas doble faz x10", 12500, 0],
    ],
    /* Jabón manos y antibacteriales */ [
      ["Jabón antibacterial 500 ml", 9500, 40], ["Jabón de manos líquido 1 L", 11500, 50],
      ["Gel antibacterial 500 ml", 10500, 35], ["Jabón de manos recarga 3 L", 29000, 15],
      ["Jabón en barra x3", 5500, 5],
    ],
    /* Guantes, gorros y tapabocas */ [
      ["Guantes de caucho para aseo", 7500, 5], ["Guantes de caucho talla L", 8500, 35],
      ["Guantes de caucho talla M", 8500, 40], ["Tapabocas de tela x5", 12500, 25],
      ["Gorros para aseo x20", 7500, 0],
    ],
  ],
};

const productos = [];
let n = 0;

for (const cat of categorias) {
  const grupos = catalogo[cat.id];
  if (!grupos || grupos.length !== cat.subcategorias.length) {
    throw new Error(
      `Categoría "${cat.id}": hay ${grupos?.length ?? 0} grupos y ${cat.subcategorias.length} subcategorías.`
    );
  }
  cat.subcategorias.forEach((sub, i) => {
    if (grupos[i].length !== 5) {
      throw new Error(`"${cat.id}" / "${sub}": debe tener 5 productos y tiene ${grupos[i].length}.`);
    }
    for (const [nombre, precio, existencias] of grupos[i]) {
      n += 1;
      productos.push({
        id: `demo-${String(n).padStart(3, "0")}`,
        nombre: `[Demo] ${nombre}`,
        categoria: cat.id,
        subcategoria: sub,
        descripcion: `Producto ficticio de prueba de la subcategoría "${sub}".`,
        precio,
        existencias,
        imagen: null,
        fuente: "ficticio",
        verificado: false,
        fechaVerificacion: null,
      });
    }
  });
}

const salida = {
  aviso:
    "DATOS FICTICIOS (nombres, precios y existencias) para probar la interfaz y el chatbot. No son datos reales de BERPA.",
  productos,
};

writeFileSync("data/productos.json", JSON.stringify(salida, null, 2) + "\n");
console.log(`Generados ${productos.length} productos en data/productos.json`);