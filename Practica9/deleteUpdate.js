const express = require("express");
require("node:dns").setServers(["8.8.8.8", "0.0.0.0"]);
const { MongoClient } = require("mongodb");

const app = express();

let client = null;
let database = null;
let collection = null;
let collectionAudit = null;
let collectionContador = null;


const PORT = 3000;

const MONGO_URI =
"mongodb+srv://Karen_db_user:0uyMK7RIhxdaJ2Cd@cluster0.smqcyvr.mongodb.net/?appName=Cluster0";

const dbName = "proyectosDB";
const collectionName = "proyectos";
const collectionName2 = "Audit";
const contadorCollectionName = "contador";


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function connectDB() {
  try {
    client = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });

    await client.connect();
    console.log("Conexión exitosa a MongoDB");
  } catch (error) {
    console.error("Error de conexión a MongoDB:", error.message);
    throw error;
  }
}

async function prepareDB() {
  database = client.db(dbName);
  collection = database.collection(collectionName);
  collectionAudit = database.collection(collectionName2);
  collectionContador = database.collection(contadorCollectionName);
}


async function idAutoincremental(secuencia) {
  const result = await collectionContador.findOneAndUpdate(
    { _id: secuencia },
    { $inc: { seq: 1 } },
    {
      upsert: true,
      returnDocument: "after"
    }
  );

}

// Auditoría

async function registrarAuditoria({
  queSeHizo,
  quienLoHizo,
  desdeDonde,
  quienAutorizo,
  descripcion
}) {
  const nextAuditId = await idAutoincremental("auditId");
  const ahora = new Date();

  const auditDoc = {
    auditId: nextAuditId,
    queSeHizo,
    quienLoHizo,
    desdeDonde,
    hora: ahora.toLocaleTimeString("es-MX"),
    fecha: ahora.toISOString().split("T")[0],
    quienAutorizo,
    descripcion
  };

  await collectionAudit.insertOne(auditDoc);
}


app.get("/", async function (req, res) {
  res.json({
    message: "Servidor funcionando correctamente",
    database: dbName,
    collection1: collectionName,
    collection2: collectionName2,
    collection3: contadorCollectionName
  });
});

// Insertar proyectos

app.post("/proyectos/insert", async function (req, res) {
  const projects = req.body.projects;

  if (!projects || !Array.isArray(projects) || projects.length === 0) {
    return res.status(400).json({
      result:
        "Error: el campo 'projects' es obligatorio y debe ser un arreglo con al menos un elemento."
    });
  }

  try {
    const projectsConId = [];

    for (const project of projects) {
      const nextProjectId = await idAutoincremental("projectId");

      projectsConId.push({
        projectId: nextProjectId,
        nombre: project.nombre,
        responsable: project.responsable,
        presupuesto: project.presupuesto,
        estado: project.estado,
        fechaInicio: project.fechaInicio,
        deleted: false
      });
    }

    const insertManyResult = await collection.insertMany(projectsConId);

    await registrarAuditoria({
      queSeHizo: "INSERT",
      quienLoHizo: req.body.quienLoHizo || "Sistema",
      desdeDonde: req.ip,
      quienAutorizo: req.body.quienAutorizo || "N/A",
      descripcion: "Inserción de proyectos en la colección proyectos"
    });

    res.json({
      result: `${insertManyResult.insertedCount} proyectos insertados correctamente.`,
      insertedIds: insertManyResult.insertedIds,
      data: projectsConId
    });
  } catch (err) {
    console.error("Error al insertar proyectos:", err);

    res.status(500).json({
      result: `Error al insertar proyectos: ${err.message}`
    });
  }
});

// Consultar proyectos no eliminados

app.get("/proyectos", async function (req, res) {
  try {
    const proyectos = await collection.find({ deleted: false }).toArray();

    res.json({
      total: proyectos.length,
      data: proyectos
    });
  } catch (err) {
    res.status(500).json({
      result: `Error al consultar proyectos: ${err.message}`
    });
  }
});

// Update por nombre

app.put("/proyectos/updateByName", async function (req, res) {
  const { nombre, nuevoEstado, quienLoHizo, quienAutorizo } = req.body;

  if (!nombre || !nuevoEstado) {
    return res.status(400).json({
      result: "Debes enviar 'nombre' y 'nuevoEstado'."
    });
  }

  try {
    const result = await collection.updateOne(
      { nombre: nombre, deleted: false },
      { $set: { estado: nuevoEstado } }
    );

    await registrarAuditoria({
      queSeHizo: "UPDATE",
      quienLoHizo: quienLoHizo || "Sistema",
      desdeDonde: req.ip,
      quienAutorizo: quienAutorizo || "N/A",
      descripcion: `Actualización del estado del proyecto con nombre '${nombre}' a '${nuevoEstado}'`
    });

    res.json({
      result: "Update ejecutado correctamente",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    res.status(500).json({
      result: `Error al actualizar proyecto: ${err.message}`
    });
  }
});

// Delete físico

app.delete("/proyectos/deleteFisico", async function (req, res) {
  const { projectId, quienLoHizo, quienAutorizo } = req.body;

  if (projectId === undefined) {
    return res.status(400).json({
      result: "Debes enviar 'projectId'."
    });
  }

  try {
    const result = await collection.deleteOne({ projectId: Number(projectId) });

    await registrarAuditoria({
      queSeHizo: "DELETE FISICO",
      quienLoHizo: quienLoHizo || "Sistema",
      desdeDonde: req.ip,
      quienAutorizo: quienAutorizo || "N/A",
      descripcion: `Eliminación física del proyecto con projectId ${projectId}`
    });

    res.json({
      result: "Delete físico ejecutado correctamente",
      deletedCount: result.deletedCount
    });
  } catch (err) {
    res.status(500).json({
      result: `Error al eliminar físicamente: ${err.message}`
    });
  }
});

// Delete lógico

app.put("/proyectos/deleteLogico", async function (req, res) {
  const { projectId, quienLoHizo, quienAutorizo } = req.body;

  if (projectId === undefined) {
    return res.status(400).json({
      result: "Debes enviar 'projectId'."
    });
  }

  try {
    const result = await collection.updateOne(
      { projectId: Number(projectId), deleted: false },
      { $set: { deleted: true } }
    );

    await registrarAuditoria({
      queSeHizo: "DELETE LOGICO",
      quienLoHizo: quienLoHizo || "Sistema",
      desdeDonde: req.ip,
      quienAutorizo: quienAutorizo || "N/A",
      descripcion: `Borrado lógico del proyecto con projectId ${projectId}`
    });

    res.json({
      result: "Delete lógico ejecutado correctamente",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    res.status(500).json({
      result: `Error al realizar delete lógico: ${err.message}`
    });
  }
});

// Consultar auditoria

app.get("/audit", async function (req, res) {
  try {
    const audit = await collectionAudit.find({}).toArray();

    res.json({
      total: audit.length,
      data: audit
    });
  } catch (err) {
    res.status(500).json({
      result: `Error al consultar auditoría: ${err.message}`
    });
  }
});

// Servidor 

async function startServer() {
  try {
    await connectDB();
    await prepareDB();

    app.listen(PORT, function () {
      console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
    console.error(
      "Sugerencia: si el error es 'querySrv ECONNREFUSED' o similar, copia desde Atlas la cadena estándar 'mongodb://...' en lugar de la 'mongodb+srv://...'."
    );
  }
}

startServer();