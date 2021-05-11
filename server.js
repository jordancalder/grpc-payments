/**
 * grpc set up
 */
const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const packageDef = protoLoader.loadSync("payments.proto", {});
const grpcObj = grpc.loadPackageDefinition(packageDef);
const paymentsPackage = grpcObj.payments;

const idGenerator = require("./helpers/identifiers").idGenerator();

const server = new grpc.Server();
server.bind("0.0.0.0:3001", grpc.ServerCredentials.createInsecure());
server.addService(paymentsPackage.Transaction.service, {
  createTransactionsStream: createTransactionsStream,
  getTransactionsStream: getTransactionsStream,
  setDayStatus: setDayStatus
});
server.start();

const transactions = {};
let receiving = false;

/**
 * We create a readable stream to help our analytics client read
 * our processed transactions
 */
const Readable = require('stream').Readable;
const transactionPipeline = new Readable();
transactionPipeline._read = () => {};

function setDayStatus (call, callback) {
  receiving = call.request.receiving;
  callback();
}

function createTransactionsStream (call, callback) {
  call.on("data", function (data) {
    const id = idGenerator.next().value;
    const transaction = {
      id,
      ...data
    };

    transactions[id] = transaction;

    transactionPipeline.push(JSON.stringify(transaction));
  });

  call.on("end", function () {
    const totalItems = Object.keys(transactions).length;
    const totalRevenue = Object.values(transactions).reduce((sum, item) => sum + item.price, 0);

    callback(null, {
      totalItems,
      totalRevenue
    });

    transactionPipeline.push(null);
  });
}

function getTransactionsStream (call, callback) {
  transactionPipeline.on("data", (data) => call.write(JSON.parse(data)));

  transactionPipeline.on("end", () => call.end());
}
