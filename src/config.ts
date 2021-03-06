require('dotenv').config();

const {
  NAME = 'feedbackfruits-knowledge-graph-broker',
  NODE_ENV = 'development',
  NEPTUNE_ADDRESS,
  CAYLEY_ADDRESS = 'http://localhost:64210',
  KAFKA_ADDRESS = 'tcp://localhost:9092',
  INPUT_TOPIC = 'update_requests',
  OUTPUT_TOPIC = 'updates',
  KAFKA_PRIVATE_KEY,
  KAFKA_CERT,
  KAFKA_CA,
} = process.env;

const CONCURRENCY = parseInt(process.env.CONCURRENCY) || 5;
const WEB_CONCURRENCY = parseInt(process.env.WEB_CONCURRENCY) || 50;
const GRAPH = 'GRAPH' in process.env ? process.env.GRAPH : `<https://knowledge.express/graph/${NODE_ENV}>`;
const SEND_UNUPDATED_DOCS = process.env.SEND_UNUPDATED_DOCS === "true" || false;

export {
  NAME,
  NODE_ENV,
  NEPTUNE_ADDRESS,
  CAYLEY_ADDRESS,
  KAFKA_ADDRESS,
  INPUT_TOPIC,
  OUTPUT_TOPIC,
  CONCURRENCY,
  WEB_CONCURRENCY,
  KAFKA_PRIVATE_KEY,
  KAFKA_CERT,
  KAFKA_CA,
  GRAPH,
  SEND_UNUPDATED_DOCS,
};
