const { MongoClient } = require('mongodb');
const  {mongoURI, dbName} = require('../constants')
const {sleep} = require('./')

const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = { on: false, database:undefined,client }

const connect = async () =>  {
  db.on=false
  await client.connect()
    .then(() => {
      console.log('Connected to database')
      db.database = client.db(dbName)
      db.on = true;
    })
    .catch(err => {
      console.log('Failed to connect database. err:',err)
      throw err
    })
}

const close = async () => {
  await client.close();
  console.log('Connection to the database closed');
}

client.on("close",() =>connect)
client.on("connectionClosed",connect)
client.on("serverClosed",connect)

connect()
module.exports = {
  connect,
  close,
  db
};
