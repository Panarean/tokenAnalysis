const { MongoClient } = require('mongodb');
const  {mongoURI, dbName} = require('../constants')


const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
/*const db = { on: false }
client.connect().then({
  console.log('Connected to data')
  db["database"]
})*/
async function connect() {
  try {
    await client.connect();
    console.log('Connected to the database');
    return client.db(dbName);
  } catch (error) {
    console.error('Error connecting to the database', error);
    throw error;
  }
}

async function close() {
  await client.close();
  console.log('Connection to the database closed');
}

module.exports = {
  connect,
  close,
};
