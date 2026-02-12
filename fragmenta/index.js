

var express = require('express');
var app = express(); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async function (request, response) {

    r ={
      'message':'Nothing to send'
    };

    response.json(r);
});


/*
{
    "id": "pt001",
    "lat": "99.1234567898765",
    "long": "-19.4567654566543"
}
*/

app.post("/echo", async function (req, res) {

  const cid = req.body.id;
  const clat = req.body.lat;
  const clong = req.body.long;

  var latPartes = clat.split(".");
  var longPartes = clong.split(".");

  r ={
      'id_e': cid,
      'lat_entero': parseInt(latPartes[0]),
      'lat_decimal': parseInt(latPartes[1]),
      'long_entero': parseInt(longPartes[0]),
      'long_decimal': parseInt(longPartes[1])
    };

    res.json(r);
});

app.listen(3000, function() {
    console.log('Aplicación ejemplo, escuchando el puerto 3000!');
});
