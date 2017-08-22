require('dotenv').load({ silent: true });

const {
  NAME = 'feedbackfruits-knowledge-graph-broker',
  CAYLEY_ADDRESS = 'http://localhost:64210',
  KAFKA_ADDRESS = 'tcp://localhost:9092',
  INPUT_TOPIC = 'update_requests',
  OUTPUT_TOPIC = 'updates',
  KAFKA_PRIVATE_KEY,
  KAFKA_CERT,
  KAFKA_CA,
} = process.env;

const CONCURRENCY = parseInt(process.env.CONCURRENCY) || 100;

export {
  NAME,
  CAYLEY_ADDRESS,
  KAFKA_ADDRESS,
  INPUT_TOPIC,
  OUTPUT_TOPIC,
  CONCURRENCY,
  KAFKA_PRIVATE_KEY,
  KAFKA_CERT,
  KAFKA_CA,
};