const async = require("async");

const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const packageDef = protoLoader.loadSync("payments.proto", {});
const grpcObj = grpc.loadPackageDefinition(packageDef);
const paymentsPackage = grpcObj.payments;

const delay = require("lodash/delay");
const random = require("lodash/random");

const transactions = require("./database.json");

const client = new paymentsPackage.Transaction("localhost:3001", grpc.credentials.createInsecure());

function simulateCreateTransactions (callback) {
  const call = client.createTransactionsStream((err, summary) => {
    console.log("transactions summary: " + JSON.stringify(summary));
    callback();
  });

  function logTransaction(name, price) {
    return function (callback) {
      call.write({
        name,
        price
      });

      delay(callback, random(500, 1500));
    };
  }

  var transaction_stream = [];

  for (const {name, price} of transactions) {
    const transactionItem = logTransaction(name, price);
    transaction_stream.push(transactionItem);
  }

  async.series(transaction_stream, function() {
    call.end();
  });
}

function notifyStartTransactions (callback) {
  client.setDayStatus({ receiving: true }, () => {});
  callback();
}

function notifyEndTransactions (callback) {
  client.setDayStatus({ receiving: false }, () => {});
  callback();
}

function main() {
  async.series([
    notifyStartTransactions,
    simulateCreateTransactions,
    notifyEndTransactions
  ]);
}

main();
