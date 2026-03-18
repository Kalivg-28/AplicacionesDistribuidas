
// Configuración manual de servidores DNS
require("node:dns/promises").setServers(["0.0.0.0", "8.8.8.8"]);

const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();

let client = null;
let database = null;
let collection = null;

const dbName = "proyectosDB";
const collectionName = "proyectos";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Función para conectarse a MongoDB Atlas
 */
async function connectDB() {
  const uri =
    "mongodb+srv://Karen_db_user:KarenLVG817381@cluster0.smqcyvr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

  client = new MongoClient(uri);

  await client.connect();

  console.log("Conexión exitosa a MongoDB");
}

/**
 * Función para preparar la base de datos y colección
 */
function prepareDB() {
  database = client.db(dbName);
  collection = database.collection(collectionName);

  console.log(`Base de datos seleccionada: ${dbName}`);
  console.log(`Colección seleccionada: ${collectionName}`);
}


app.get("/", async function (req, res) {
  res.json({
    message: "Servidor funcionando correctamente",
    database: dbName,
    collection: collectionName,
  });
});

/**
 * Servicio para insertar proyectos en MongoDB
 *
 * Body esperado:
 * {
 *   "projects": [
 *     {
 *       "projectId": "P001",
 *       "nombre": "Sistema de Inventario",
 *       "responsable": "Ana López",
 *       "presupuesto": 25000,
 *       "estado": "En progreso",
 *       "fechaInicio": "2026-03-10"
 *     }
 *   ]
 * }
 */
app.post("/proyectos/insert", async function (req, res) {
  const projects = req.body.projects;

  if (!projects || !Array.isArray(projects) || projects.length === 0) {
    return res.status(400).json({
      result:
        "Error: el campo 'projects' es obligatorio y debe ser un arreglo con al menos un elemento.",
    });
  }

  try {
    const insertManyResult = await collection.insertMany(projects);

    console.log(
      `${insertManyResult.insertedCount} proyectos insertados correctamente.`
    );

    res.json({
      result: `${insertManyResult.insertedCount} proyectos insertados correctamente.`,
      insertedIds: insertManyResult.insertedIds,
    });
  } catch (err) {
    console.error("Error al insertar proyectos:", err);

    res.status(500).json({
      result: `Error al insertar proyectos: ${err.message}`,
    });
  }
});


app.get("/proyectos", async function (req, res) {
  try {
    const proyectos = await collection.find({}).toArray();

    res.json({
      total: proyectos.length,
      data: proyectos,
    });
  } catch (err) {
    res.status(500).json({
      result: `Error al consultar proyectos: ${err.message}`,
    });
  }
});


async function startServer() {
  try {
    await connectDB();
    prepareDB();

    app.listen(3000, function () {
      console.log("Servidor escuchando en el puerto 3000");
    });
  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
  }
}

startServer();