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
  // ... other entries in your whitelist
];

logWithTimestamp("CORS whitelist configured:", whitelist);

var corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  const origin = req.header("Origin");
  logWithTimestamp("CORS request received from:", origin);

  if (!origin) {
    // Handle requests without an Origin header
    logWithTimestamp("CORS request without Origin header, allowing request.");
    corsOptions = { origin: true }; // Allow requests with no origin (e.g., server-to-server)
  } else if (whitelist.indexOf(origin) !== -1) {
    logWithTimestamp("CORS request allowed.");
    corsOptions = { origin: true }; // Allow requests from whitelisted origins
  } else {
    logWithTimestamp("CORS request denied.");
    corsOptions = { origin: false }; // Deny requests from other origins
  }
  
  callback(null, corsOptions); // callback expects two parameters: error and options
};

var pause = 60000;

// Function to invoke a Lambda function
function invokeLambda(lambdaFunctionName, payload) {
  logWithTimestamp(`Invoking Lambda function: ${lambdaFunctionName} with payload:`, payload);
  const params = {
    FunctionName: lambdaFunctionName,
    Payload: JSON.stringify(payload)
  };

  return lambda.invoke(params).promise()
    .then(data => {
      logWithTimestamp(`Lambda ${lambdaFunctionName} invoked successfully.`);
      logWithTimestamp("Response:", data);
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

  // Acknowledgement sent
  res.send({
    workrequest: `WO received.`,
  });
  logWithTimestamp("Acknowledgement sent to client.");

  // Apply delay logic before sending to Lambdas
  if (pause <= 120000) {
    pause += 30000;
  } else {
    pause = 60000;
  }
  logWithTimestamp(`Applying delay of ${pause + 30000} ms before invoking Lambdas.`);

  setTimeout(() => {
    logWithTimestamp("Invoking Lambdas after delay...");

    // Invoke the NetSuite Lambda function
    invokeLambda('collinsAPI_sendtoNS', { body: jsonbody });

    // Invoke the Logging/Acumatica Lambda function
    invokeLambda('collinsAPI_sendtoACU', { body: jsonbody });

  }, pause + 30000);
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
