var express = require('express');
var app = express(); //Contenedor de Endpoints o WS Restful

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const numero = Math.floor(Math.random() * 100) + 1;

app.get("/", async function (request, response) {

    r ={
        "numero":numero
    };

    response.json(r);
});

app.listen(3000, function() {
    console.log('Aplicación ejemplo, escuchando el puerto 3000!');
});
