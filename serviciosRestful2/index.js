const express = require("express");
const crypto = require("crypto");
const { error } = require("console");

const app = express();
app.use(express.json());

function esCadena(valor) {
  return typeof valor === "string";
}

function solicitudIncorrecta(respuesta, mensaje) {
  return respuesta.status(400).json({
    exito: false,
    error: mensaje,
  });
}


/*
  { "nombre": "string" }
 */
app.post("/saludo", (peticion, respuesta) => {
  const { nombre } = peticion.body;

  if (typeof nombre !== "string") {
    return respuesta.status(400).json({
      exito: false,
      mensaje: "El parámetro 'nombre' debe ser un string."
    });
  }

  return respuesta.json({
    exito: true,
    estado: "OK",
    mensaje: "Hola, " + nombre
  });
});

app.get("/", (peticion, respuesta) => {
  respuesta.json({
    exito: true,
    mensaje: "API lista",
    rutas: [
      "POST /saludo",
    ],
  });
});

/* 
  { "a": number, "b": number, "operacion": "suma|resta|multiplicacion|division" }
*/
app.post("/calcular", (peticion, respuesta) => {
  const { a, b, operacion } = peticion.body;

  if (typeof a !== "number" || typeof b !== "number") {
    return respuesta.status(400).json({
      error: "Los parámetros 'a' y 'b' deben ser números."
    });
  }

  if (typeof operacion !== "string") {
    return respuesta.status(400).json({
      error: "El parámetro 'operacion' debe ser un string."
    });
  }

  let resultado;

  switch (operacion) {
    case "suma":
      resultado = a + b;
      break;

    case "resta":
      resultado = a - b;
      break;

    case "multiplicacion":
      resultado = a * b;
      break;

    case "division":
      if (b === 0) {
        return respuesta.status(400).json({
          error: "No se puede dividir entre cero."
        });
      }
      resultado = a / b;
      break;

    default:
      return respuesta.status(400).json({
        error: "Operación no válida."
      });
  }

  return respuesta.json({
    estado: "OK",
    resultado: resultado
  });
});


/*
   { "id": number, "titulo": string, "completada": boolean } 
 */

const tareas = [];

app.post("/tareas", (peticion, respuesta) => {

  const {id, titulo, completada} = peticion.body;

  if(typeof id !== "number"){
    return respuesta.status(400).json({
      estado: "error",
      error: "Id debe ser un número"
    });
  }

  if(typeof  titulo !== "string"){
    return respuesta.status(400).json({
      estado: "error",
      error: "Título debe ser string"
    });
  }

  if(typeof completada !== "boolean"){
    return respuesta.status(400).json({
      estado: "error",
      error: "Completada debe ser booleano"
    });
  }

  const nuevatarea = {id, titulo, completada};
  tareas.push(nuevatarea);

  return respuesta.status(201).json({
    estado: "ok",
    tarea: nuevatarea
  });

});

app.get("/tareas", (peticion, respuesta) => {
  return respuesta.json({
    estado: "ok",
    tareas: tareas,
  });
});

app.put("/tareas/:id", (peticion, respuesta) => {
  const id = Number(peticion.params.id);
  const { titulo, completada } = peticion.body;

  const tarea = tareas.find(t => t.id === id);

  if (!tarea) {
    return respuesta.status(404).json({
      estado: "ERROR",
      error: "Tarea no encontrada"
    });
  }

  if (typeof titulo === "string") {
    tarea.titulo = titulo;
  }

  if (typeof completada === "boolean") {
    tarea.completada = completada;
  }

  return respuesta.json({
    estado: "OK",
    tarea: tarea
  });
});

/*
 { "password": "string" }
*/
app.post("/validar-password", (peticion,respuesta)=> {
  const { password } = peticion.body;

  if(typeof password !== "string"){
    return respuesta.status(400).json({
      estado: "error",
      error: "Password debe ser string"
    });
  }

  let errores = [];

  if (password.length < 8){
    errores.push("Debe tener al menos 8 caracteres")
  }

  if (!/[A-Z]/.test(password)) {
    errores.push("Debe tener al menos una mayuscula");
  }

  if (!/[a-z]/.test(password)) {
    errores.push("Debe tener al menos una minuscula");
  }

  if (!/[0-9]/.test(password)) {
    errores.push("Debe tener al menos un numero");
  }

  const esValida = errores.length == 0;

  return respuesta.json({
    estado: "ok",
    esValida: esValida,
    errores: errores

  });

});

/*
  { "valor": number, "desde": "C|F|K", "hacia": "C|F|K" } 
*/

app.post("/convertir-temperatura", (peticion,respuesta)=>{
  const { valor, desde, hacia } = peticion.body;

  if (typeof valor !== "number") {
    return respuesta.status(400).json({
      estado: "error",
      error: "El valor debe ser number"
    });
  }

  if (typeof desde !== "string" || typeof hacia !== "string") {
    return respuesta.status(400).json({
      estado: "error",
      error: "Las escalas deben ser string"
    });
  }

  const escalas = ["C", "F", "K"];

  if (!escalasValidas.includes(desde) || !escalasValidas.includes(hacia)) {
    return respuesta.status(400).json({
      estado: "error",
      error: "Escalas permitidas: C, F o K"
    });
  }

  let valorConvertido;

if (desde === hacia) {
    valorConvertido = valor;
  } else {
    let enCelsius;

    if (desde === "C") {
      enCelsius = valor;
    } else if (desde === "F") {
      enCelsius = (valor - 32) * 5 / 9;
    } else if (desde === "K") {
      enCelsius = valor - 273.15;
    }

    if (hacia === "C") {
      valorConvertido = enCelsius;
    } else if (hacia === "F") {
      valorConvertido = (enCelsius * 9 / 5) + 32;
    } else if (hacia === "K") {
      valorConvertido = enCelsius + 273.15;
    }
  }

  return respuesta.json({
    estado: "ok",
    valorOriginal: valor,
    valorConvertido: Number(valorConvertido.toFixed(2)),
    escalaOriginal: desde,
    escalaConvertida: hacia
  });
});

/*
   { "array": any[], "elemento": any } 
*/
app.post("/buscar", (peticion, respuesta) => {
  const { array, elemento } = peticion.body;

  if (!Array.isArray(array)) {
    return respuesta.status(400).json({
      estado: "error",
      error: "El campo 'array' debe ser un arreglo (any[])"
    });
  }

  const indice = array.findIndex((x) => x === elemento);
  const encontrado = indice !== -1;

  return respuesta.json({
    estado: "ok",
    encontrado: encontrado,
    indice: encontrado ? indice : -1,
    tipoElemento: typeof elemento
  });
});

/*
  { "texto": "string" }
*/
app.post("/contar-palabras", (peticion, respuesta) => {
  const { texto } = peticion.body;

  if (typeof texto !== "string") {
    return respuesta.status(400).json({
      estado: "error",
      error: "El campo 'texto' debe ser string"
    });
  }

  const textoLimpio = texto.trim();

  const totalCaracteres = texto.length;

  const palabras = textoLimpio === "" ? [] : textoLimpio.split(/\s+/);
  const totalPalabras = palabras.length;

  const normalizadas = palabras
    .map((p) => p.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter((p) => p !== "");

  const palabrasUnicas = new Set(normalizadas).size;

  return respuesta.json({
    estado: "ok",
    totalPalabras: totalPalabras,
    totalCaracteres: totalCaracteres,
    palabrasUnicas: palabrasUnicas
  });
});

const PUERTO = process.env.PORT || 3000;

app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});
