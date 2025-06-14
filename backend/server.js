
require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const cors = require('cors');
app.use(cors());


// 3. Importar la conexión a la base de datos 
const dbConnection = require('./db');

app.use(express.json()); // Parsear el cuerpo de las solicitudes JSON

const TABLA_COLABORADORES = 'VIC.Registro_Colaboradores2';

// Ruta de prueba para verificar la conexión a la base de datos a través de una petición HTTP
app.get('/', (req, res) => {
        dbConnection.query('SELECT 1', (err) => {
            if (err) {
                console.error('Error al conectar a la base de datos desde la API:', err);
                res.status(500).send('Error al conectar a la base de datos: ' + err.message);
            }
            else {
                res.status(200).send('Conexión a la base de datos exitosa desde la API!');
            }
        });
});

app.get('/example3', (req, res) => {
    dbConnection.query('SELECT * FROM VIC.Registro_Colaboradores2 LIMIT 10', (err, row) => {
        if (!err) {
            res.json(row);
        } else {
            res.status(500).json({ messsage: 'Error al ejecutar consulta' });
        }
    });
});

//Obtener todos los colaboradores
app.get('/colaboradores', (req, res) => {
    const query = `SELECT 
    Nombre_Completo AS nombre_completo,
    Correo AS correo,
    Fecha_Ingreso AS fecha_ingreso,
    Estado_Bienvenida AS estado_bienvenida,
    Estado_Tecnico AS estado_tecnico,
    Fecha_Onboarding AS fecha_onboarding
    FROM VIC.Registro_Colaboradores2`;

    dbConnection.query(query, (err, rows) => {
        if (!err) {
            res.status(200).json(rows);
        } else {
            console.error('Error al obtener los colaboradores:', err);
            res.status(500).json({ message: 'Error al obtener los colaboradores', error: err.message });
        }
    });
});

//Crear un nuevo colaborador
app.post('/colaboradores', (req, res) => {
    const { Nombre_Completo, Correo, Fecha_Ingreso, Estado_Bienvenida, Estado_Tecnico, Fecha_Onboarding } = req.body;

    if (!Nombre_Completo || !Correo || !Fecha_Ingreso) {
        return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }
    const query = `INSERT INTO VIC.Registro_Colaboradores2 (
        Nombre_Completo
    ) VALUES (?, ?, ?, ?, ?)`;

    dbConnection.query(query, [
        Nombre_Completo,
        Correo,
        Fecha_Ingreso,
        Estado_Bienvenida || 'Pendiente',
        Estado_Tecnico || 'Pendiente',
        Fecha_Onboarding || null
    ], (err, result) => {
        if (err) {
            res.status(201).json({ message: 'Creado exitosamente', id: result.insertId });
        } else {
            console.error('Error al crear el colaborador', err);
            if (err.code === 'ER_DUP_ENTRY') {
                res.status(409).json({ message: 'El colaborador ya existe', error: err.message });
            }
            res.status(500).json({ message: 'Error al crear el colaborador', error: err.message });
        }
    });
});

//Obtener un Colaborador por Correo
app.get('/colaboradores/:correo', (req, res) => {
    const { correo } = req.params;
    const query = `SELECT
        Nombre_Completo AS nombre_completo,
        Correo AS correo,
        Fecha_Ingreso AS fecha_ingreso,
        Estado_Bienvenida AS estado_bienvenida,
        Estado_Tecnico AS estado_tecnico,
        Fecha_Onboarding AS fecha_onboarding
    FROM VIC.Registro_Colaboradores2
    WHERE Correo = ?`;

    dbConnection.query(query, [correo], (err, rows) => {
        if (!err) {
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Colaborador no encontrado' });
            }
            res.status(200).json(rows[0]);
        } else {
            console.error('Error al obteener el colaborador:', err);
            res.status(500).json({ message: 'Error al obtener el colaborador', error: err.message });
        }
    });
});

//Actualizar un colaborador
app.put('/colaboradores/:correo', (req, res) => {
    const { correo } = req.params;
    const { Estado_Bienvenida, Estado_Tecnico, Fecha_Onboarding } = req.body;

    if (!req.body || (
        Estado_Bienvenida === undefined &&
        Estado_Tecnico === undefined &&
        Fecha_Onboarding === undefined
    )) {
        return res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
    }
    let updateFields = [];
    let queryParams = [];
    if (Estado_Bienvenida !== undefined) {
        updateFields.push('Estado_Bienvenida = ?');
        queryParams.push(Estado_Bienvenida);
    }
    if (Estado_Tecnico !== undefined) {
        updateFields.push('Estado_Tecnico = ?');
        queryParams.push(Estado_Tecnico);
    }
    if (Fecha_Onboarding !== undefined) {
        updateFields.push('Fecha_Onboarding = ?');
        queryParams.push(Fecha_Onboarding);
    }
    if (updateFields.length === 0) {
        return res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
    }
    const query = `UPDATE VIC.Registro_Colaboradores2
        SET ${updateFields.join(', ')}
        WHERE Correo = ?`;
    queryParams.push(correo);

    dbConnection.query(query, queryParams, (err, result) => {
        if (!err) {
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Colaborador no encontrado' });
            }
            res.status(200).json({ message: 'Colaborador actualizado exitosamente' });
        } else {
            console.error('Error al actualizar Colaborador:', err);
            res.status(500).json({ message: 'Error al actualizar Colaborador', error: err.message });
        }
    });
});

//Eliminar un colaborador
app.delete('/colaboradores/:correo', (req, res) => {
    const { correo } = req.params;
    const query = `DELETE FROM VIC.Registro_Colaboradores2
    WHERE Correo = ?`;

    dbConnection.query(query, [correo], (err, result) => {
        if (!err){
            if (result.updateFields == 0 ){
                return res.status(404).json({ message: 'Colaborador no encontrado' });
            }
            res.status(200).json({ message: 'Colaborador eliminado exitosamente' });
        } else {
            console.error('Error al eliminar el colaborador:', err);
            res.status(500).json({ message: 'Error al eliminar el colaborador', error: err.message });
        }
    });
});

app.listen(port, () => {
    console.log(`Servidor backend escuchando en http://localhost:${port}`);
});