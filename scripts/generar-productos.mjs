import { readFileSync, writeFileSync } from "node:fs";

const categorias = JSON.parse(readFileSync("data/categorias.json", "utf8")).categorias;

// Por categoría: 5 productos por subcategoría, en el mismo orden que categorias.json.
// Cada producto: [nombre, precio COP ficticio, existencias ficticias, uso]
// El uso es una frase corta para que la búsqueda (por palabras y por embeddings) entienda para qué sirve.
const catalogo = {
  "empaques-desechables": [
    /* Platos y bandejas */ [
      ["Platos desechables x25", 8500, 120, "platos de un solo uso para servir comidas en fiestas y eventos"],
      ["Platos hondos desechables x25", 9500, 90, "platos hondos de un solo uso para sopas, cremas y postres"],
      ["Bandejas desechables rectangulares x20", 11000, 45, "bandejas para servir o empacar porciones de comida"],
      ["Platos biodegradables x20", 14500, 30, "platos que se degradan, para servir comida con menos impacto ambiental"],
      ["Platos grandes x50", 15500, 60, "platos grandes de un solo uso para almuerzos y asados"],
    ],
    /* Línea ecológica */ [
      ["Vasos biodegradables x20", 12000, 60, "vasos que se degradan, para bebidas frías o calientes"],
      ["Cubiertos biodegradables x24", 10500, 40, "cucharas, tenedores y cuchillos que se degradan, para comidas para llevar"],
      ["Pitillos de papel x100", 9000, 75, "pajillas de papel para jugos y bebidas, alternativa al plástico"],
      ["Portacomidas de caña x25", 21000, 22, "cajas de fibra de caña para empacar comida para llevar"],
      ["Bolsas compostables x30", 12500, 2, "bolsas que se compostan, para residuos orgánicos o empaque"],
    ],
    /* Servilletas, higiénicos y toallas */ [
      ["Servilletas x300", 6500, 200, "servilletas de papel para la mesa, restaurantes y cafeterías"],
      ["Servilletas de mesa x500", 9500, 110, "servilletas de papel en paquete grande para negocios de comida"],
      ["Papel higiénico institucional x12", 24000, 35, "rollos de papel higiénico para baños de oficinas y negocios"],
      ["Toallas de manos en rollo", 13500, 28, "toalla de papel para secarse las manos en baños y cocinas"],
      ["Toalla de cocina x3 rollos", 11000, 55, "papel absorbente para secar, limpiar derrames y quitar grasa en la cocina"],
    ],
    /* Bolsas */ [
      ["Bolsas plásticas x50", 7000, 0, "bolsas de plástico medianas para empacar y llevar productos"],
      ["Bolsas plásticas pequeñas x100", 6500, 85, "bolsas pequeñas para empacar porciones, dulces o granos"],
      ["Bolsas plásticas grandes x50", 9500, 40, "bolsas grandes para mercado y productos voluminosos"],
      ["Bolsas de papel kraft x50", 15000, 33, "bolsas de papel para panaderías y comida para llevar"],
      ["Bolsas para basura x10", 8000, 120, "bolsas resistentes para la basura de la casa o el negocio"],
    ],
    /* Portacomidas cartón, icopor y aluminio */ [
      ["Portacomidas de icopor x25", 15000, 80, "cajas térmicas de icopor para empacar almuerzos para llevar"],
      ["Portacomidas de cartón x25", 17500, 50, "cajas de cartón para empacar comida rápida y almuerzos"],
      ["Portacomidas de aluminio x10", 19000, 26, "recipientes de aluminio para hornear, congelar o llevar comida"],
      ["Portacomidas con divisiones x25", 18500, 38, "cajas con compartimentos para separar arroz, carne y ensalada"],
      ["Portacomidas pequeños de icopor x50", 20000, 70, "cajas pequeñas de icopor para porciones, postres o acompañamientos"],
    ],
    /* Neveras de icopor */ [
      ["Nevera de icopor 20 L", 22000, 15, "nevera portátil para mantener frías bebidas y alimentos en paseos"],
      ["Nevera de icopor 10 L", 15000, 24, "nevera pequeña para llevar bebidas y comida fría"],
      ["Nevera de icopor 40 L", 36000, 8, "nevera grande para paseos, eventos y transporte de alimentos fríos"],
      ["Nevera de icopor 5 L", 9500, 30, "nevera mini para almuerzos, medicamentos o pocas bebidas"],
      ["Nevera de icopor 60 L", 52000, 4, "nevera muy grande para eventos y transporte de carnes o hielo"],
    ],
    /* Bases, cajas y domos */ [
      ["Domos transparentes x20", 18000, 40, "tapas transparentes para cubrir tortas, postres y ensaladas"],
      ["Cajas para pizza x10", 14000, 35, "cajas de cartón para empacar y llevar pizza"],
      ["Bases de cartón para tortas x10", 11500, 28, "bases rígidas para presentar y transportar tortas"],
      ["Cajas para hamburguesa x25", 16000, 42, "cajas para empacar hamburguesas y comida rápida"],
      ["Domos medianos x20", 19500, 0, "tapas transparentes medianas para postres y porciones de torta"],
    ],
    /* Papel chicle, parafinado y aluminio */ [
      ["Papel aluminio rollo", 9500, 70, "papel aluminio para envolver, hornear y conservar alimentos"],
      ["Papel parafinado rollo", 8500, 45, "papel encerado para envolver sándwiches, arepas y panes"],
      ["Papel chicle x200 hojas", 7500, 60, "hojas de papel para envolver alimentos y separar porciones"],
      ["Papel aluminio industrial rollo", 28000, 12, "rollo grande de aluminio para cocinas de restaurantes"],
      ["Papel vinilpel rollo", 10500, 38, "película plástica para cubrir y conservar alimentos en la nevera"],
    ],
    /* Pitillos, mezcladores y palos de madera */ [
      ["Pitillos x100", 4500, 150, "pajillas plásticas para jugos y gaseosas"],
      ["Pitillos flexibles x200", 6500, 90, "pajillas con codo flexible para bebidas"],
      ["Mezcladores x500", 5500, 65, "palitos para revolver café y bebidas calientes"],
      ["Palos de madera x100", 3500, 80, "palos de madera para paletas, chuzos y manualidades"],
      ["Pitillos gruesos para batidos x50", 5000, 48, "pajillas anchas para malteadas, batidos y bebidas con perlas"],
    ],
    /* Carbón, encendedores y otros */ [
      ["Carbón vegetal bolsa 3 kg", 11000, 25, "carbón para asados en parrilla o asador"],
      ["Carbón vegetal bolsa 10 kg", 32000, 14, "bolsa grande de carbón para asados y negocios de comida a la brasa"],
      ["Encendedores de cocina", 4500, 100, "encendedor de mango largo para prender estufas a gas y velas"],
      ["Pastillas encendedoras x24", 7500, 55, "pastillas para prender carbón o leña con facilidad"],
      ["Gel para encender parrilla", 9500, 5, "gel inflamable para iniciar el fuego del carbón en asados"],
    ],
    /* Cubiertos */ [
      ["Cubiertos plásticos x50", 7500, 90, "juego de cucharas, tenedores y cuchillos desechables para fiestas"],
      ["Cucharas plásticas x100", 6500, 120, "cucharas desechables para sopas, postres y helados"],
      ["Tenedores plásticos x100", 6500, 110, "tenedores desechables para almuerzos y ensaladas"],
      ["Cuchillos plásticos x100", 6500, 95, "cuchillos desechables para porciones y comidas para llevar"],
      ["Set de cubiertos con servilleta x50", 14500, 40, "kits individuales de cubiertos con servilleta para domicilios"],
    ],
    /* Contenedores y Sello Plus */ [
      ["Contenedores con tapa x10", 14000, 55, "recipientes plásticos con tapa para guardar o llevar comida"],
      ["Contenedores redondos 500 ml x25", 21000, 30, "recipientes redondos para salsas, sopas pequeñas y postres"],
      ["Contenedores rectangulares 1 L x25", 25000, 27, "recipientes grandes para almuerzos y porciones familiares"],
      ["Contenedores para sopa x25", 23500, 0, "recipientes con tapa hermética para llevar sopas y caldos"],
      ["Sello Plus para empacar rollo", 18000, 18, "película para sellar vasos y contenedores en máquina selladora"],
    ],
    /* Vasos y tapas */ [
      ["Vasos de cartón con tapa x25", 13000, 100, "vasos para café, chocolate y bebidas calientes para llevar"],
      ["Vasos de 7 oz x50", 6000, 140, "vasos plásticos pequeños para tinto, jugos y gaseosa"],
      ["Vasos de 12 oz x50", 8500, 105, "vasos plásticos medianos para jugos y bebidas frías"],
      ["Tapas para vaso de 12 oz x50", 5500, 130, "tapas para cerrar vasos de 12 onzas y evitar derrames"],
      ["Vasos de 16 oz x25", 9500, 3, "vasos grandes para jugos, limonadas y granizados"],
    ],
    /* Copas y tapas */ [
      ["Copas con tapa x20", 9000, 35, "copas plásticas con tapa para postres y salsas"],
      ["Copas de 4 oz x50", 8000, 60, "copas pequeñas para salsas, aderezos y muestras"],
      ["Copas de 8 oz x50", 9500, 52, "copas medianas para postres, gelatinas y fruta picada"],
      ["Tapas para copas x50", 5000, 70, "tapas para cerrar copas plásticas"],
      ["Copas de postre transparentes x20", 10500, 25, "copas transparentes para presentar postres y mousse"],
    ],
    /* Guantes, gorros y tapabocas */ [
      ["Guantes desechables x100", 16000, 45, "guantes de un solo uso para manipular alimentos"],
      ["Guantes de nitrilo x100", 28000, 20, "guantes resistentes de un solo uso para cocina y aseo"],
      ["Gorros desechables x100", 12000, 50, "gorros para cubrir el cabello al preparar alimentos"],
      ["Tapabocas x50", 9000, 85, "tapabocas desechables para cocinas y atención al público"],
      ["Delantales desechables x50", 17000, 0, "delantales de un solo uso para proteger la ropa al cocinar"],
    ],
  ],
  "carnes-frias": [
    /* Mortadela y jamón */ [
      ["Mortadela de pollo 500 g", 9800, 30, "embutido tajado para sándwiches, desayunos y loncheras"],
      ["Mortadela de res 500 g", 10500, 25, "embutido tajado para sándwiches y arepas"],
      ["Jamón de cerdo 500 g", 16500, 20, "jamón tajado para sándwiches, pizzas y desayunos"],
      ["Jamón de pollo 500 g", 13500, 18, "jamón tajado de pollo para sándwiches y loncheras"],
      ["Mortadela con aceitunas 500 g", 11500, 0, "embutido tajado con aceitunas para picadas y sándwiches"],
    ],
    /* Salchichas y salchichones */ [
      ["Salchichas x12", 11500, 60, "salchichas para perros calientes, desayunos y picadas"],
      ["Salchichas x24", 21000, 40, "paquete grande de salchichas para perros calientes y negocios de comida rápida"],
      ["Salchichas de pollo x12", 10500, 45, "salchichas de pollo para perros calientes y loncheras"],
      ["Salchichón cervecero 500 g", 15500, 22, "salchichón para picadas y pasabocas"],
      ["Salchichas cocktail x30", 14500, 5, "salchichas pequeñas para pasabocas y fiestas"],
    ],
    /* Chorizos, butifarras y longanizas */ [
      ["Chorizo parrillero x6", 14500, 0, "chorizos para asar en parrilla y acompañar con arepa"],
      ["Chorizo santarrosano x6", 16500, 30, "chorizo tradicional para asados y bandeja paisa"],
      ["Butifarra x12", 15000, 26, "butifarras para picadas y acompañar con limón"],
      ["Longaniza x6", 17500, 18, "longaniza para asados y fritos"],
      ["Chorizo de pollo x6", 13500, 34, "chorizo de pollo para asados y desayunos"],
    ],
    /* Tocinetas */ [
      ["Tocineta ahumada 500 g", 18500, 20, "tocineta para desayunos, hamburguesas y pastas"],
      ["Tocineta en tiras 250 g", 11500, 32, "tiras de tocineta para freír y acompañar huevos"],
      ["Tocineta de cerdo 1 kg", 34000, 12, "tocineta en presentación grande para restaurantes y comidas rápidas"],
      ["Tocineta en cubos 500 g", 17500, 15, "cubos de tocineta para ensaladas, pastas y arroces"],
      ["Tocineta precocida 200 g", 13500, 4, "tocineta lista para calentar en hamburguesas y desayunos"],
    ],
    /* Carnes de hamburguesa y productos preparados */ [
      ["Carne de hamburguesa x10", 21000, 40, "carnes para preparar hamburguesas a la plancha o parrilla"],
      ["Carne de hamburguesa x20", 39000, 22, "paquete grande de carnes para hamburgueserías y eventos"],
      ["Hamburguesas de pollo x10", 19500, 28, "carnes de pollo para hamburguesas"],
      ["Albóndigas x20", 18000, 35, "albóndigas para preparar en salsa o con pasta"],
      ["Carne molida preparada 500 g", 14500, 0, "carne molida sazonada para rellenos, arepas y pastas"],
    ],
    /* Filetes y chuzos */ [
      ["Chuzos de pollo x6", 16500, 25, "chuzos de pollo para asar en parrilla"],
      ["Chuzos de cerdo x6", 17500, 20, "chuzos de cerdo para asados"],
      ["Filetes de pollo x6", 24000, 30, "pechuga en filetes para asar, apanar o preparar a la plancha"],
      ["Filetes de pescado x6", 26000, 16, "filetes de pescado para freír, hornear o apanar"],
      ["Chuzos mixtos x12", 30000, 2, "chuzos de pollo y res para asados y eventos"],
    ],
    /* Palitos y panzerotis */ [
      ["Palitos de queso x20", 15500, 35, "pasabocas congelados de queso para freír u hornear"],
      ["Palitos de queso x40", 29000, 18, "paquete grande de palitos de queso para fiestas y cafeterías"],
      ["Panzerotis de pollo x12", 17000, 24, "panzerotis congelados de pollo para freír u hornear"],
      ["Panzerotis de carne x12", 17500, 21, "panzerotis congelados de carne para freír u hornear"],
      ["Palitos de yuca x20", 13500, 30, "palitos de yuca congelados para freír como acompañante"],
    ],
    /* Empanadas y patacones */ [
      ["Empanadas de carne x12", 13500, 50, "empanadas congeladas de carne listas para freír"],
      ["Empanadas de pollo x12", 13500, 46, "empanadas congeladas de pollo listas para freír"],
      ["Empanadas de papa x12", 12000, 38, "empanadas congeladas de papa listas para freír"],
      ["Patacones precocidos x20", 12500, 33, "patacones de plátano listos para freír como acompañante"],
      ["Empanadas mixtas x24", 25000, 0, "empanadas congeladas surtidas para fiestas y cafeterías"],
    ],
    /* Maíz y papas congeladas */ [
      ["Papa a la francesa 1 kg", 12500, 45, "papas congeladas para freír en casa"],
      ["Papa a la francesa 2,5 kg", 28000, 25, "bolsa grande de papas congeladas para negocios de comida rápida"],
      ["Papa criolla congelada 1 kg", 11000, 30, "papa criolla lista para freír o acompañar"],
      ["Maíz tierno congelado 500 g", 8500, 40, "granos de maíz para ensaladas, arroces y sopas"],
      ["Papa en cascos 1 kg", 13500, 3, "papas en cascos congeladas para freír u hornear"],
    ],
    /* Pinchos, nuggets y milanesas */ [
      ["Nuggets de pollo 500 g", 17000, 3, "trocitos de pollo apanado congelados para freír u hornear"],
      ["Nuggets de pollo 1 kg", 31000, 45, "paquete grande de nuggets de pollo para niños y comidas rápidas"],
      ["Milanesas de pollo x6", 22000, 28, "pechugas apanadas congeladas listas para freír"],
      ["Pinchos de pollo x12", 19500, 24, "pinchos de pollo congelados para asar o freír"],
      ["Nuggets de pescado 500 g", 18500, 40, "trocitos de pescado apanado congelados para freír"],
    ],
  ],
  "lacteos-refrigerados": [
    /* Leches y yogurt */ [
      ["Leche entera 1 L", 4200, 150, "leche para tomar, desayunos y preparar postres"],
      ["Leche deslactosada 1 L", 5200, 90, "leche sin lactosa para personas con intolerancia"],
      ["Leche entera bolsa 900 ml", 3800, 120, "leche en bolsa para el consumo diario"],
      ["Yogurt natural 1 L", 7500, 45, "yogurt sin sabor para desayunos, frutas y recetas"],
      ["Yogurt con fruta 1 L", 8000, 0, "yogurt con trozos de fruta para desayunos y meriendas"],
    ],
    /* Helados */ [
      ["Helado de vainilla 1 L", 14000, 20, "helado de vainilla para postres y malteadas"],
      ["Helado de chocolate 1 L", 14500, 18, "helado de chocolate para postres y malteadas"],
      ["Helado de fresa 1 L", 14500, 15, "helado de fresa para postres y ensaladas de frutas"],
      ["Helado de vainilla 4 L", 42000, 6, "tarro grande de helado para heladerías y eventos"],
      ["Paletas de crema x12", 19000, 25, "paletas heladas individuales para niños y fiestas"],
    ],
    /* Quesos, quesitos y cuajadas */ [
      ["Queso campesino 500 g", 12000, 35, "queso fresco para arepas, desayunos y sándwiches"],
      ["Queso mozzarella 500 g", 17500, 28, "queso para pizzas, lasañas y gratinar"],
      ["Cuajada fresca 500 g", 10500, 22, "cuajada para acompañar con melao, arepas o postres"],
      ["Quesitos x12", 13000, 30, "quesitos frescos para desayunos y loncheras"],
      ["Queso costeño 500 g", 13500, 0, "queso salado para arepas, bollos y patacones"],
    ],
    /* Mantequillas y esparcibles */ [
      ["Mantequilla 250 g", 8000, 40, "mantequilla para untar pan, arepas y cocinar"],
      ["Mantequilla 500 g", 15000, 32, "mantequilla para repostería, cocina y untar"],
      ["Margarina para untar 450 g", 9000, 45, "margarina suave para untar pan y arepas"],
      ["Mantequilla con sal 250 g", 8500, 36, "mantequilla salada para untar y dar sabor"],
      ["Esparcible de ajo 250 g", 9500, 4, "mantequilla de ajo para pan de ajo y carnes"],
    ],
    /* Cremas de leche */ [
      ["Crema de leche 900 ml", 11500, 0, "crema para salsas, postres y sopas cremosas"],
      ["Crema de leche 500 ml", 7500, 35, "crema para salsas, postres y fresas con crema"],
      ["Crema de leche 1 L", 12500, 28, "crema para repostería, salsas y cocina de restaurante"],
      ["Crema para cocinar 200 ml", 4500, 60, "crema para espesar salsas y pastas"],
      ["Crema de leche light 500 ml", 8000, 18, "crema baja en grasa para salsas y postres"],
    ],
    /* Arepas */ [
      ["Arepas de maíz x10", 6500, 80, "arepas blancas listas para asar en el desayuno"],
      ["Arepas de queso x10", 9500, 45, "arepas con queso listas para asar"],
      ["Arepas de choclo x10", 8500, 38, "arepas dulces de maíz tierno para asar con queso"],
      ["Arepas delgadas x20", 11500, 50, "arepas delgadas para acompañar comidas"],
      ["Arepas rellenas x6", 13000, 2, "arepas rellenas listas para calentar"],
    ],
    /* Ensaladas preparadas */ [
      ["Ensalada de frutas 500 g", 7500, 12, "fruta picada lista para comer o acompañar con helado"],
      ["Ensalada rusa 500 g", 8500, 15, "ensalada de papa y verduras para acompañar carnes"],
      ["Ensalada de pasta 500 g", 9000, 14, "ensalada fría de pasta lista para servir"],
      ["Ensalada de repollo 500 g", 6500, 20, "ensalada de repollo para acompañar asados y hamburguesas"],
      ["Ensalada de frutas 1 kg", 13500, 0, "fruta picada en presentación grande para eventos"],
    ],
  ],
  "salsas-aderezos": [
    /* Salsas tradicionales */ [
      ["Salsa de tomate 1 kg", 9000, 90, "salsa para perros calientes, hamburguesas y papas fritas"],
      ["Salsa de tomate 3 kg", 24000, 40, "salsa de tomate en presentación grande para negocios de comida rápida"],
      ["Mayonesa 1 kg", 11500, 70, "aderezo para sándwiches, ensaladas y comidas rápidas"],
      ["Mostaza 500 g", 6500, 55, "aderezo para perros calientes, hamburguesas y aderezos"],
      ["Salsa de tomate sobres x100", 14000, 0, "sobres individuales de salsa para domicilios y comida para llevar"],
    ],
    /* Salsas especiales */ [
      ["Salsa BBQ 500 g", 8500, 50, "salsa ahumada para costillas, alitas y asados"],
      ["Salsa de ajo 500 g", 8800, 42, "salsa para pizzas, papas y pan"],
      ["Salsa picante 500 g", 7800, 48, "salsa para dar picante a comidas, empanadas y alitas"],
      ["Salsa tártara 500 g", 9500, 30, "salsa para pescados y mariscos fritos"],
      ["Salsa de champiñones 500 g", 10500, 3, "salsa para carnes, pollo y pastas"],
    ],
    /* Salsas dulces */ [
      ["Salsa de piña 500 g", 7800, 30, "salsa dulce para perros calientes y hamburguesas"],
      ["Salsa de mora 500 g", 8200, 28, "salsa dulce para postres, helados y carnes"],
      ["Salsa de caramelo 500 g", 9200, 32, "salsa para helados, postres y café"],
      ["Salsa de chocolate 500 g", 9000, 35, "salsa para helados, fresas y postres"],
      ["Salsa de frutos rojos 500 g", 9500, 0, "salsa para cheesecake, helados y postres"],
    ],
    /* Sazonadores */ [
      ["Sazonador completo 200 g", 5500, 100, "mezcla de especias para dar sabor a carnes, sopas y arroces"],
      ["Sazonador para carnes 200 g", 5800, 80, "especias para adobar carne de res y cerdo"],
      ["Sazonador para pollo 200 g", 5800, 75, "especias para adobar pollo asado o frito"],
      ["Sazonador de ajo 200 g", 5500, 65, "ajo en polvo para sazonar cualquier comida"],
      ["Sazonador completo 1 kg", 21000, 25, "sazonador en presentación grande para restaurantes"],
    ],
    /* Vinagretas y vinagres */ [
      ["Vinagre blanco 1 L", 4000, 60, "vinagre para cocinar, encurtidos y también limpiar"],
      ["Vinagre de manzana 500 ml", 6500, 40, "vinagre suave para ensaladas y adobos"],
      ["Vinagreta italiana 500 ml", 8500, 33, "aderezo listo para ensaladas"],
      ["Vinagre balsámico 250 ml", 11500, 20, "vinagre para ensaladas y reducciones"],
      ["Vinagre blanco 4 L", 13000, 2, "vinagre en presentación grande para cocina y limpieza"],
    ],
  ],
  "panaderia-snacks": [
    /* Repostería */ [
      ["Chips de chocolate 500 g", 15000, 28, "gotas de chocolate para galletas, tortas y postres"],
      ["Esencia de vainilla 250 ml", 8500, 40, "saborizante para tortas, galletas y postres"],
      ["Polvo de hornear 200 g", 5500, 55, "leudante para que tortas y panes crezcan"],
      ["Colorantes comestibles x6", 7500, 30, "colores para decorar tortas, cupcakes y galletas"],
      ["Glaseado listo 500 g", 12500, 0, "cobertura lista para decorar tortas y cupcakes"],
    ],
    /* Mezclas listas, harinas y apanadores */ [
      ["Mezcla lista para panqueques 500 g", 9500, 45, "mezcla para preparar panqueques en el desayuno"],
      ["Harina de trigo 1 kg", 4800, 120, "harina para hornear pan, tortas y galletas"],
      ["Harina de maíz 1 kg", 5200, 95, "harina precocida para preparar arepas"],
      ["Apanador 500 g", 7500, 50, "mezcla para apanar pollo, pescado y carnes"],
      ["Mezcla para brownies 500 g", 11000, 4, "mezcla lista para hornear brownies de chocolate"],
    ],
    /* Tortillas */ [
      ["Tortillas de trigo x10", 8800, 40, "tortillas para burritos, wraps y quesadillas"],
      ["Tortillas de trigo x20", 15500, 28, "paquete grande de tortillas para burritos y wraps"],
      ["Tortillas de maíz x20", 9500, 35, "tortillas para tacos y nachos"],
      ["Tortillas integrales x10", 9800, 22, "tortillas integrales para wraps y almuerzos ligeros"],
      ["Tortillas grandes x8", 11500, 0, "tortillas grandes para burritos y wraps rellenos"],
    ],
    /* Galletas */ [
      ["Galletas saladas x6 paquetes", 6200, 120, "galletas para acompañar sopas, tinto y loncheras"],
      ["Galletas de vainilla x6 paquetes", 7000, 95, "galletas dulces para meriendas y loncheras"],
      ["Galletas de chocolate x6 paquetes", 7800, 80, "galletas dulces de chocolate para meriendas"],
      ["Galletas integrales x6 paquetes", 7500, 60, "galletas con fibra para meriendas ligeras"],
      ["Galletas de coco x12 paquetes", 13500, 0, "galletas dulces de coco para compartir"],
    ],
    /* Panadería */ [
      ["Pan tajado 500 g", 6000, 18, "pan en tajadas para sándwiches y tostadas"],
      ["Pan para perro caliente x12", 7500, 30, "panes alargados para preparar perros calientes"],
      ["Pan para hamburguesa x12", 9500, 26, "panes redondos para preparar hamburguesas"],
      ["Pan integral 500 g", 7000, 20, "pan integral en tajadas para desayunos y sándwiches"],
      ["Pan tajado grande 700 g", 8000, 2, "pan en tajadas en presentación familiar"],
    ],
    /* Cereales y frutos frescos */ [
      ["Avena en hojuelas 500 g", 5200, 75, "avena para coladas, batidos y desayunos"],
      ["Cereal de maíz 500 g", 11500, 40, "hojuelas de maíz para el desayuno con leche"],
      ["Granola 500 g", 13500, 28, "cereal con avena y frutos para yogurt y desayunos"],
      ["Pasas 250 g", 7500, 35, "uvas pasas para postres, arroces y meriendas"],
      ["Mezcla de frutos secos 250 g", 12500, 0, "maní, almendras y frutos secos para meriendas"],
    ],
    /* Papa ripio y snacks */ [
      ["Papa ripio 500 g", 8000, 65, "papa frita en tiras finas para perros calientes y hamburguesas"],
      ["Papas fritas de paquete x12", 18000, 40, "paquetes de papas para loncheras y meriendas"],
      ["Maíz pira x10", 9500, 45, "maíz para preparar crispetas en casa"],
      ["Chicharrones x12", 14500, 32, "paquetes de chicharrón para picar"],
      ["Platanitos x12", 13500, 5, "paquetes de plátano frito para loncheras y meriendas"],
    ],
    /* Dulces tradicionales y confites */ [
      ["Confites surtidos 500 g", 7000, 0, "dulces surtidos para piñatas y fiestas infantiles"],
      ["Caramelos surtidos 500 g", 6500, 70, "caramelos para regalar, piñatas y mostradores"],
      ["Chocolatinas x24", 17500, 40, "chocolatinas individuales para loncheras y regalos"],
      ["Bocadillo veleño x12", 10500, 36, "dulce de guayaba para acompañar con queso"],
      ["Gomitas surtidas 500 g", 9500, 48, "gomitas para fiestas, piñatas y postres"],
    ],
  ],
  despensa: [
    /* Aceites y margarinas */ [
      ["Aceite vegetal 3 L", 28000, 50, "aceite de cocina para freír y preparar comidas"],
      ["Aceite vegetal 1 L", 10500, 90, "aceite de cocina para freír, sofreír y aderezar"],
      ["Aceite de girasol 1 L", 13500, 45, "aceite liviano para cocinar y ensaladas"],
      ["Margarina 1 kg", 13000, 38, "margarina para cocinar, hornear y freír"],
      ["Aceite vegetal 5 L", 45000, 0, "aceite de cocina en presentación grande para freidoras y restaurantes"],
    ],
    /* Cafés y chocolates */ [
      ["Café molido 500 g", 17500, 60, "café para preparar tinto en greca o cafetera"],
      ["Café instantáneo 170 g", 14500, 40, "café soluble para preparar en segundos"],
      ["Café molido 250 g", 9500, 75, "café para preparar tinto en casa"],
      ["Chocolate en barra 500 g", 13500, 50, "chocolate de mesa para preparar chocolate caliente"],
      ["Café sin cafeína 250 g", 12500, 3, "café descafeinado para tomar en la noche"],
    ],
    /* Modificadores de leche */ [
      ["Chocolate en polvo 400 g", 12500, 40, "polvo para preparar leche achocolatada fría o caliente"],
      ["Achocolatado 1 kg", 21000, 35, "polvo achocolatado para el desayuno de los niños"],
      ["Modificador sabor fresa 400 g", 11500, 28, "polvo para dar sabor a fresa a la leche"],
      ["Modificador sabor vainilla 400 g", 11500, 26, "polvo para dar sabor a vainilla a la leche"],
      ["Chocolate en polvo 2 kg", 52000, 0, "chocolate en polvo en presentación grande para cafeterías"],
    ],
    /* Granos, pastas, enlatados y huevos */ [
      ["Huevos tipo AA x30", 19000, 70, "panal de huevos para desayunos, repostería y cocina"],
      ["Arroz 5 kg", 21500, 85, "arroz blanco para el almuerzo diario"],
      ["Fríjol rojo 1 kg", 9500, 55, "fríjol para preparar frijolada y bandeja paisa"],
      ["Pasta espagueti 500 g", 4200, 100, "pasta larga para preparar con salsa"],
      ["Atún en lata x3", 17500, 4, "atún enlatado para ensaladas, arroces y sándwiches"],
    ],
    /* Condimentos */ [
      ["Comino molido 100 g", 4200, 85, "especia para sazonar carnes, fríjoles y guisos"],
      ["Pimienta negra 100 g", 5500, 60, "especia para sazonar carnes y salsas"],
      ["Orégano 50 g", 3200, 70, "hierba seca para pizzas, pastas y salsas"],
      ["Color en polvo 200 g", 4800, 55, "condimento para dar color amarillo a arroces y guisos"],
      ["Laurel 30 g", 2800, 0, "hojas secas para sopas, frijoles y guisos"],
    ],
    /* Aromáticas e infusiones */ [
      ["Aromática de manzanilla x20", 5800, 55, "bolsitas para preparar aromática caliente relajante"],
      ["Aromática de menta x20", 5800, 48, "bolsitas para preparar aromática de menta"],
      ["Té negro x25", 7500, 40, "bolsitas de té para tomar caliente o frío"],
      ["Aromática de frutos rojos x20", 6800, 33, "bolsitas para preparar aromática frutal"],
      ["Té verde x25", 8000, 0, "bolsitas de té verde para infusiones"],
    ],
    /* Azúcar y endulzantes */ [
      ["Azúcar blanca 5 kg", 21000, 90, "azúcar para endulzar bebidas y repostería"],
      ["Azúcar morena 1 kg", 5200, 70, "azúcar morena para bebidas y postres"],
      ["Panela 1 kg", 5800, 80, "panela para aguapanela, jugos y postres"],
      ["Endulzante en polvo 200 g", 9500, 35, "endulzante sin azúcar para bebidas"],
      ["Azúcar blanca 1 kg", 4400, 5, "azúcar para el consumo diario en casa"],
    ],
    /* Bebidas y siropes */ [
      ["Sirope de chocolate 500 ml", 9500, 22, "sirope para malteadas, cafés y postres"],
      ["Sirope de caramelo 500 ml", 9800, 20, "sirope para cafés especiales y postres"],
      ["Jugo de fruta 1 L", 5500, 60, "bebida de fruta lista para tomar"],
      ["Bebida de avena 1 L", 7500, 30, "bebida de avena lista para tomar fría"],
      ["Sirope de fresa 500 ml", 9500, 0, "sirope para granizados, malteadas y postres"],
    ],
  ],
  "aseo-hogar": [
    /* Lavalozas */ [
      ["Lavaloza líquido 750 ml", 9800, 70, "jabón para lavar platos, ollas y utensilios de cocina"],
      ["Lavaloza en crema 500 g", 6500, 85, "jabón en crema para lavar loza y quitar grasa de ollas"],
      ["Lavaloza líquido 3 L", 24000, 30, "jabón para platos en presentación grande para restaurantes"],
      ["Lavaloza antibacterial 750 ml", 11000, 45, "jabón para lavar platos que también elimina bacterias"],
      ["Lavaloza líquido 1,5 L", 14500, 0, "jabón líquido para lavar platos y utensilios"],
    ],
    /* Escobas, traperos y recogedores */ [
      ["Escoba de cerdas suaves", 10500, 30, "escoba para barrer pisos lisos dentro de la casa"],
      ["Trapero de microfibra", 14500, 25, "trapero para trapear y secar pisos"],
      ["Recogedor plástico", 6500, 40, "recogedor para recoger basura y polvo después de barrer"],
      ["Escoba de cerdas duras", 11500, 22, "escoba para barrer patios, garajes y exteriores"],
      ["Trapero industrial", 19500, 3, "trapero grande para trapear negocios y bodegas"],
    ],
    /* Limpiadores y desinfectantes */ [
      ["Desinfectante 1 L", 8800, 65, "líquido para desinfectar pisos, baños y superficies"],
      ["Desinfectante 4 L", 26000, 32, "desinfectante en presentación grande para negocios"],
      ["Limpiador multiusos 750 ml", 8200, 50, "limpiador para mesones, estufas y superficies de la cocina"],
      ["Limpiavidrios 500 ml", 7000, 38, "limpiador para vidrios, espejos y ventanas"],
      ["Desinfectante lavanda 1 L", 9200, 0, "desinfectante con aroma a lavanda para pisos y baños"],
    ],
    /* Detergentes y blanqueadores */ [
      ["Detergente en polvo 2 kg", 17500, 48, "jabón en polvo para lavar ropa a mano o en lavadora"],
      ["Detergente líquido 2 L", 24000, 30, "jabón líquido para lavar ropa en lavadora"],
      ["Blanqueador 1 L", 4500, 80, "cloro para blanquear ropa y desinfectar superficies"],
      ["Detergente en polvo 5 kg", 40000, 18, "jabón en polvo en presentación grande para lavar ropa"],
      ["Blanqueador 4 L", 14500, 4, "cloro en presentación grande para limpieza y desinfección"],
    ],
    /* Esponjas y paños */ [
      ["Esponjas x3", 5200, 100, "esponjas para lavar platos y ollas"],
      ["Paños de cocina x5", 8500, 60, "paños para secar loza y limpiar mesones de la cocina"],
      ["Esponja de acero x6", 4800, 70, "esponjillas para quitar lo pegado de ollas y parrillas"],
      ["Paño microfibra x3", 9500, 40, "paños para limpiar y brillar superficies sin rayar"],
      ["Esponjas doble faz x10", 12500, 0, "esponjas con lado suave y lado abrasivo para lavar loza"],
    ],
    /* Jabón manos y antibacteriales */ [
      ["Jabón antibacterial 500 ml", 9500, 40, "jabón líquido para lavarse las manos y eliminar bacterias"],
      ["Jabón de manos líquido 1 L", 11500, 50, "jabón líquido para lavamanos de baños y cocinas"],
      ["Gel antibacterial 500 ml", 10500, 35, "gel para desinfectar las manos sin agua"],
      ["Jabón de manos recarga 3 L", 29000, 15, "recarga de jabón para dispensadores de baños"],
      ["Jabón en barra x3", 5500, 5, "jabón en barra para lavarse las manos o el cuerpo"],
    ],
    /* Guantes, gorros y tapabocas */ [
      ["Guantes de caucho para aseo", 7500, 5, "guantes para lavar loza y hacer aseo sin maltratar las manos"],
      ["Guantes de caucho talla L", 8500, 35, "guantes de caucho talla grande para aseo y lavado"],
      ["Guantes de caucho talla M", 8500, 40, "guantes de caucho talla mediana para aseo y lavado"],
      ["Tapabocas de tela x5", 12500, 25, "tapabocas lavables y reutilizables"],
      ["Gorros para aseo x20", 7500, 0, "gorros para cubrir el cabello durante el aseo"],
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
    for (const [nombre, precio, existencias, uso] of grupos[i]) {
      if (typeof uso !== "string" || uso.length === 0) {
        throw new Error(`"${nombre}": falta la frase de uso.`);
      }
      n += 1;
      productos.push({
        id: `demo-${String(n).padStart(3, "0")}`,
        nombre: `[Demo] ${nombre}`,
        categoria: cat.id,
        subcategoria: sub,
        descripcion: `Producto ficticio de demostración (subcategoría "${sub}"): ${uso}.`,
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
    "DATOS FICTICIOS (nombres, precios, existencias y descripciones) para probar la interfaz y el chatbot. No son datos reales de BERPA.",
  productos,
};

writeFileSync("data/productos.json", JSON.stringify(salida, null, 2) + "\n");
console.log(`Generados ${productos.length} productos en data/productos.json`);
