const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const packageDef = protoLoader.loadSync("payments.proto", {});
const grpcObj = grpc.loadPackageDefinition(packageDef);
const paymentsPackage = grpcObj.payments;

const client = new paymentsPackage.Transaction("localhost:3001", grpc.credentials.createInsecure());

const call = client.getTransactionsStream();

call.on("data", item => console.log("recieved item from server: " + JSON.stringify(item)));

call.on("end", () => console.log("stream finished processing"));
