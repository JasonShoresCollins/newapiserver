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

// Helper function to log with timestamps
function logWithTimestamp(message, data = null) {
  const timestamp = new Date().toISOString();
  if (data !== null) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

// Function to flatten nested JSON (e.g., location fields)
function flattenPayload(payload) {
  return {
    ...payload,
    ...payload.location,  // Flatten the location fields to the top level
  };
}

// JSON parsing
app.use(express.json());
app.use(cors());

logWithTimestamp("Server initialization started.");

// 200 response
app.get("/APITEST", (req, res) => {
  logWithTimestamp("GET /APITEST called");
  res.status(200).send({
    teststatus: "good",
    testmessage: "Welcome to the Collins API server",
  });
});

app.get("/", (req, res) => {
  logWithTimestamp("GET / called");
  res.status(200).send({
    teststatus: "good",
    testmessage: "Welcome to the Collins API server",
  });
});

// Whitelist for CORS
var whitelist = [
  `http://localhost:${PORT}`,
  `http://127.0.0.1:${PORT}`, // Include for local requests
  "api.target.com/work_orders/v1",
  "https://stage-api.target.com/visitors/v1/visits",
  "https://api.target.com/visitors/v1/visits",
  "https://ec2-3-144-25-50.us-east-2.compute.amazonaws.com",
  "https://ec2-3-23-194-47.us-east-2.compute.amazonaws.com",
  "http://ec2-3-144-25-50.us-east-2.compute.amazonaws.com",
  "http://ec2-3-23-194-47.us-east-2.compute.amazonaws.com",
  "http://ec2-3-23-194-47.us-east-2.compute.amazonaws.com:8080",
  "https://tse.collins-cs.com",
];

logWithTimestamp("CORS whitelist configured:", whitelist);

var corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  const origin = req.header("Origin");
  logWithTimestamp("CORS request received from:", origin);

  if (!origin) {
    logWithTimestamp("CORS request without Origin header, allowing request.");
    corsOptions = { origin: true };
  } else if (whitelist.indexOf(origin) !== -1) {
    logWithTimestamp("CORS request allowed.");
    corsOptions = { origin: true };
  } else {
    logWithTimestamp("CORS request denied.");
    corsOptions = { origin: false };
  }

  callback(null, corsOptions);
};

// Function to invoke a Lambda function
function invokeLambda(lambdaFunctionName, payload) {
  logWithTimestamp(`Attempting to invoke Lambda function: ${lambdaFunctionName} with payload:`, payload);
  const params = {
    FunctionName: lambdaFunctionName,
    Payload: JSON.stringify(payload)
  };

  return lambda.invoke(params).promise()
    .then(data => {
      logWithTimestamp(`Lambda ${lambdaFunctionName} invoked successfully.`);
      logWithTimestamp("Response from Lambda:", data);
    })
    .catch(err => {
      logWithTimestamp(`Error invoking Lambda ${lambdaFunctionName}:`, err);
    });
}

// Capture and post
app.post("/workrequest/:id", cors(corsOptionsDelegate), (req, res) => {
  const { id } = req.params;
  var jsonbody = req.body;

  logWithTimestamp("POST /workrequest/:id called with ID:", id);
  logWithTimestamp("Request body:", jsonbody);

  // Flatten the payload
  const flatPayload = flattenPayload(jsonbody);

  // Acknowledgement sent
  res.send({
    workrequest: `WO received.`,
  });
  logWithTimestamp("Acknowledgement sent to client.");

  // Invoke the Lambdas immediately after acknowledgement
  logWithTimestamp("Invoking Lambdas immediately...");

  // Invoke the NetSuite Lambda function
  logWithTimestamp("Invoking NetSuite Lambda...");
  invokeLambda('collinsAPI_sendtoNS', { body: flatPayload });

  // Invoke the Logging/Acumatica Lambda function
  logWithTimestamp("Invoking Acumatica Lambda...");
  invokeLambda('collinsAPI_sendtoACU', { body: jsonbody });
});

app.get("/workrequest/:id", cors(corsOptionsDelegate), (req, res) => {
  const { id } = req.params;
  var jsonbody = req.body;

  logWithTimestamp("GET /workrequest/:id called with ID:", id);
  logWithTimestamp("Request body:", jsonbody);

  // Acknowledgement sent
  res.send({
    workrequest: `WO received.`,
  });
  logWithTimestamp("Acknowledgement sent to client.");
});

// Listener
app.listen(PORT, () => {
  logWithTimestamp(`Server version 0.01 running on http://localhost:${PORT}`);
});
