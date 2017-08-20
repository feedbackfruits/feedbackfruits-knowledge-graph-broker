require('dotenv').load({ silent: true });

const {
  NAME = 'feedbackfruits-knowledge-graph-broker',
  CAYLEY_ADDRESS = 'http://localhost:64210',
  KAFKA_ADDRESS = 'tcp://localhost:9092',
  INPUT_TOPIC = 'update_requests',
  OUTPUT_TOPIC = 'updates',
  CONCURRENCY = '100',
} = process.env;

export {
  NAME,
  CAYLEY_ADDRESS,
  KAFKA_ADDRESS,
  INPUT_TOPIC,
  OUTPUT_TOPIC,
  CONCURRENCY,
};
