const { Pool } = require('pg');

const config = {

    database: process.env.DATABASE,
    host: process.env.HOST,
    user: process.env.USERDB,
    password: process.env.PASSWORD,
    port: process.env.PORT
}
const pool = new Pool(config)

//1. Crear una función asíncrona que registre una nueva transferencia utilizando una
//transacción SQL.Debe mostrar por consola la última transferencia registrada.

const transferencia = async () => {
    const client = await pool.connect()

    try {
        // Iniciar transacción
        await client.query("BEGIN");

        //Variables para parametros a ingresar por el usuario
        const cuenta_origen = process.argv[3]
        const cuenta_destino = process.argv[4]
        const monto = process.argv[5]
        const fecha = process.argv[6]
        const descripcion = process.argv[7]

        // Insertar registro en tabla transferencias
        //Orden segun los parametros cuenta_origen, cuenta_destino, monto, fecha, descripcion 
        const text = "INSERT INTO transferencias (descripcion, fecha, monto, cuenta_origen, cuenta_destino) VALUES($1,$2,$3,$4,$5) RETURNING *";

        const values = [descripcion, fecha, monto, cuenta_origen, cuenta_destino]

        const result = await client.query(text, values)

        // Actualización de la tabla cuentas
        const textCuenta1 = "UPDATE cuentas SET saldo = saldo - $1 WHERE id = $2";
        const valuesCuenta1 = [monto, cuenta_origen]

        await client.query(textCuenta1, valuesCuenta1)

        const textCuenta2 = "UPDATE cuentas SET saldo = saldo + $1 WHERE id = $2";
        const valuesCuenta2 = [monto, cuenta_destino]

        await client.query(textCuenta2, valuesCuenta2)

        // Finalizar transacción
        await client.query("COMMIT")
        console.log(result.rows)
    } catch (error) {
        console.error(error)
        await client.query("ROLLBACK")
    } finally {
        client.release()
        console.log("Operación terminada")
    }
};

//Realizar una función asíncrona que consulte la tabla de transferencias y retorne los
//últimos 10 registros de una cuenta en específico.

const registros = async () => {
    try {
        const text = 'SELECT * FROM transferencias where cuenta_origen = $1 OR cuenta_destino = $1 order by fecha desc limit 10';
        const values = [process.argv[3]]
        const result = await pool.query(text, values)
        console.log(result.rows);
    } catch (error) {
        console.error(error)
    }
}
//3. Realizar una función asíncrona que consulte el saldo de una cuenta en específico.

const saldo = async () => {
    try {
        const text = 'SELECT * FROM cuentas where id = $1 ';
        const values = [process.argv[3]]
        const result = await pool.query(text, values)
        console.log(result.rows);
    } catch (error) {
        console.error(error)
    }
}

//Menu de comandos
const inpt = process.argv[2];
switch (inpt) {

    case 'registro':
        registros();
        break;
    case 'transferencia':
        transferencia();
        break;
    case 'saldo':
        saldo()
        break;
    default:
        break;
}