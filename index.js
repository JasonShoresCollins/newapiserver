// Jason Shores
// Collins API Server

// Express package and port
const express = require("express");
const cors = require("cors");
const AWS = require("aws-sdk");
const app = express();
const PORT = 8080;

// AWS Lambda configuration
const lambda = new AWS.Lambda({
  region: "us-east-2"
});

// JSON parsing
app.use(express.json());
app.use(cors());

console.log("Server initialization started.");

// 200 response
app.get("/APITEST", (req, res) => {
  console.log("GET /APITEST called");
  res.status(200).send({
    teststatus: "good",
    testmessage: "Welcome to the Collins API server",
  });
});

app.get("/", (req, res) => {
  console.log("GET / called");
  res.status(200).send({
    teststatus: "good",
    testmessage: "Welcome to the Collins API server",
  });
});

// Whitelist for CORS
var whitelist = [
  `http://localhost:${PORT}`,
  "api.target.com/work_orders/v1",
  "https://stage-api.target.com/visitors/v1/visits",
  "https://api.target.com/visitors/v1/visits",
  "23.235.32.0/20",
  "43.249.72.0/22",
  "103.244.50.0/24",
  "103.245.222.0/23",
  "103.245.224.0/24",
  "104.156.80.0/20",
  "140.248.64.0/18",
  "140.248.128.0/17",
  "146.75.0.0/17",
  "151.101.0.0/16",
  "157.52.64.0/18",
  "167.82.0.0/17",
  "167.82.128.0/20",
  "167.82.160.0/20",
  "167.82.224.0/20",
  "172.111.64.0/18",
  "185.31.16.0/22",
  "199.27.72.0/21",
  "199.232.0.0/16",
  "2a04:4e40::/32",
  "2a04:4e42::/32",
  "135.129.208.50",
  "https://stage-api.target.com/rest_hook_subscriptions/v1",
  "https://api.target.com/rest_hook_subscriptions/v1",
  "https://stage-api.target.com/work_orders/v1",
  "https://api.target.com/work_orders/v1",
  "https://ec2-3-144-25-50.us-east-2.compute.amazonaws.com",
  "https://ec2-3-23-194-47.us-east-2.compute.amazonaws.com",
  "http://ec2-3-144-25-50.us-east-2.compute.amazonaws.com",
  "http://ec2-3-23-194-47.us-east-2.compute.amazonaws.com",
  "http://ec2-3-23-194-47.us-east-2.compute.amazonaws.com:8080",
  "https://tse.collins-cs.com",
];

console.log("CORS whitelist configured:", whitelist);

var corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  console.log("CORS request received from:", req.header("Origin"));
  if (whitelist.indexOf(req.header("Origin")) !== -1) {
    console.log("CORS request allowed.");
    corsOptions = { origin: true }; // reflect (enable) the requested origin in the CORS response
  } else {
    console.log("CORS request denied.");
    corsOptions = { origin: false }; // disable CORS for this request
  }
  callback(null, corsOptions); // callback expects two parameters: error and options
};

var pause = 60000;

// Function to invoke a Lambda function
function invokeLambda(lambdaFunctionName, payload) {
  console.log(`Invoking Lambda function: ${lambdaFunctionName} with payload:`, payload);
  const params = {
    FunctionName: lambdaFunctionName,
    Payload: JSON.stringify(payload)
  };

  return lambda.invoke(params).promise()
    .then(data => {
      console.log(`Lambda ${lambdaFunctionName} invoked successfully.`);
      console.log("Response:", data);
    })
    .catch(err => {
      console.error(`Error invoking Lambda ${lambdaFunctionName}:`, err);
    });
}

// Capture and post
app.post("/workrequest/:id", cors(corsOptionsDelegate), (req, res) => {
  const { id } = req.params;
  var jsonbody = req.body;

  console.log("POST /workrequest/:id called with ID:", id);
  console.log("Request body:", jsonbody);

  // Acknowledgement sent
  res.send({
    workrequest: `WO received.`,
  });
  console.log("Acknowledgement sent to client.");

  // Apply delay logic before sending to Lambdas
  if (pause <= 120000) {
    pause += 30000;
  } else {
    pause = 60000;
  }
  console.log(`Applying delay of ${pause + 30000} ms before invoking Lambdas.`);

  setTimeout(() => {
    console.log("Invoking Lambdas after delay...");

    // Invoke the NetSuite Lambda function
    invokeLambda('collinsAPI_sendtoNS', { body: jsonbody });

    // Invoke the Logging/Acumatica Lambda function
    invokeLambda('collinsAPI_sendtoACU', { body: jsonbody });

  }, pause + 30000);
});

app.get("/workrequest/:id", cors(corsOptionsDelegate), (req, res) => {
  const { id } = req.params;
  var jsonbody = req.body;

  console.log("GET /workrequest/:id called with ID:", id);
  console.log("Request body:", jsonbody);

  // Acknowledgement sent
  res.send({
    workrequest: `WO received.`,
  });
  console.log("Acknowledgement sent to client.");
});

// Listener
app.listen(PORT, () => {
  console.log(`Server version 0.01 running on http://localhost:${PORT}`);
});
