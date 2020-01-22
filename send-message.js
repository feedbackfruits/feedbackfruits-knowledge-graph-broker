const memux = require('memux');
const { NAME, KAFKA_ADDRESS, OUTPUT_TOPIC, INPUT_TOPIC, MEDIA_URL, MEDIA_SERVICE_URL, KAFKA_PRIVATE_KEY, KAFKA_CERT, KAFKA_CA } = require('./lib/config');

const urlsBySourceOrganization = {
  "https://ocw.mit.edu": "https://ocw.mit.edu"
};

async function doStuff(doc) {
  console.log(`Sending message to ${INPUT_TOPIC}`)
  const ssl = {
    key: KAFKA_PRIVATE_KEY,
    cert: KAFKA_CERT,
    ca: KAFKA_CA,
  };

  const send = await memux.createSend({
    name: 'manual-submit-to-bus-broker',
    url: KAFKA_ADDRESS,
    topic: INPUT_TOPIC,
    concurrency: 1,
    ssl
  });

  await send({ action: 'write', key: doc['@id'], data: doc });
}

Promise.all(Object.entries(urlsBySourceOrganization).map(([ sourceOrganization, url ]) => {
  const doc = {
    "@id": url,
    "@type": [ "Resource", "WebPageResource" ],
    "sourceOrganization": [
      sourceOrganization
    ]
  };
  console.log(doc)
  return doStuff(doc);
})).then(console.log.bind(console), console.error.bind(console))
