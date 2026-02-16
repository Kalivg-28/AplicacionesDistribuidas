const express = require("express");
const crypto = require("crypto");

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

/**
 { "a": "texto", "b": "texto" }
 */
app.post("/mascaracteres", (peticion, respuesta) => {
  const { a, b } = peticion.body;

  if (!esCadena(a) || !esCadena(b)) {
    return solicitudIncorrecta(respuesta, "Parámetros inválidos: se requieren 'a' y 'b' como cadenas.");
  }

  const resultado = a.length >= b.length ? a : b;

  return respuesta.json({
    exito: true,
    a,
    b,
    resultado,
    longitudA: a.length,
    longitudB: b.length,
  });
});

/**
 { "a": "texto", "b": "texto" }
 */
app.post("/menoscaracteres", (peticion, respuesta) => {
  const { a, b } = peticion.body;

  if (!esCadena(a) || !esCadena(b)) {
    return solicitudIncorrecta(respuesta, "Parámetros inválidos: se requieren 'a' y 'b' como cadenas.");
  }

  const resultado = a.length <= b.length ? a : b;

  return respuesta.json({
    exito: true,
    a,
    b,
    resultado,
    longitudA: a.length,
    longitudB: b.length,
  });
});

/**
 { "texto": "hola" }
 */
app.post("/numcaracteres", (peticion, respuesta) => {
  const { texto } = peticion.body;

  if (!esCadena(texto)) {
    return solicitudIncorrecta(respuesta, "Parámetro inválido: se requiere 'texto' como cadena.");
  }

  return respuesta.json({
    exito: true,
    texto,
    longitud: texto.length,
  });
});

/**
{ "texto": "anita lava la tina" }
 */
app.post("/palindroma", (peticion, respuesta) => {
  const { texto } = peticion.body;

  if (!esCadena(texto)) {
    return solicitudIncorrecta(respuesta, "Parámetro inválido: se requiere 'texto' como cadena.");
  }

  const normalizado = texto.toLowerCase().replace(/\s+/g, "");

  if (normalizado.length === 0) {
    return solicitudIncorrecta(respuesta, "La cadena no puede quedar vacía después de normalizar.");
  }

  const invertido = normalizado.split("").reverse().join("");
  const esPalindromo = normalizado === invertido;

  return respuesta.json({
    exito: true,
    original: texto,
    normalizado,
    esPalindromo,
  });
});

/**
 { "a": "hola", "b": "mundo" }
 */
app.post("/concatenar", (peticion, respuesta) => {
  const { a, b } = peticion.body;

  if (!esCadena(a) || !esCadena(b)) {
    return solicitudIncorrecta(respuesta, "Parámetros inválidos: se requieren 'a' y 'b' como cadenas.");
  }

  return respuesta.json({
    exito: true,
    a,
    b,
    resultado: a + b,
  });
});

/**
 { "texto": "hola" }
 */
app.post("/aplicarsha256", (peticion, respuesta) => {
  const { texto } = peticion.body;

  if (!esCadena(texto)) {
    return solicitudIncorrecta(respuesta, "Parámetro inválido: se requiere 'texto' como cadena.");
  }

  if (texto.length === 0) {
    return solicitudIncorrecta(respuesta, "Parámetro inválido: 'texto' no puede ser cadena vacía.");
  }

  const hash = crypto.createHash("sha256").update(texto, "utf8").digest("hex");

  return respuesta.json({
    exito: true,
    original: texto,
    sha256: hash,
  });
});

/**
 { "textoPlano": "hola", "hashRecibido": "<sha256 en hex>" }
 */
app.post("/verificarsha256", (peticion, respuesta) => {
  const { textoPlano, hashRecibido } = peticion.body;

  if (!esCadena(textoPlano) || !esCadena(hashRecibido)) {
    return solicitudIncorrecta(respuesta, "Parámetros inválidos: se requieren 'textoPlano' y 'hashRecibido' como cadenas.");
  }

  if (textoPlano.length === 0) {
    return solicitudIncorrecta(respuesta, "Parámetro inválido: 'textoPlano' no puede ser cadena vacía.");
  }

  if (!/^[0-9a-fA-F]{64}$/.test(hashRecibido)) {
    return solicitudIncorrecta(respuesta, "Parámetro inválido: 'hashRecibido' debe ser un SHA256 en hex (64 caracteres).");
  }

  const hashCalculado = crypto.createHash("sha256").update(textoPlano, "utf8").digest("hex");
  const coincide = hashCalculado.toLowerCase() === hashRecibido.toLowerCase();

  return respuesta.json({
    exito: true,
    textoPlano,
    hashRecibido,
    hashCalculado,
    coincide,
  });
});

app.get("/", (peticion, respuesta) => {
  respuesta.json({
    exito: true,
    mensaje: "API lista",
    rutas: [
      "POST /mascaracteres",
      "POST /menoscaracteres",
      "POST /numcaracteres",
      "POST /palindroma",
      "POST /concatenar",
      "POST /aplicarsha256",
      "POST /verificarsha256",
    ],
  });
});

const PUERTO = process.env.PORT || 3000;

app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});
