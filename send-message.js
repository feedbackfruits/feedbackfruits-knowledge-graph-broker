const memux = require('memux');
const { NAME, KAFKA_ADDRESS, OUTPUT_TOPIC, INPUT_TOPIC, MEDIA_URL, MEDIA_SERVICE_URL, KAFKA_PRIVATE_KEY, KAFKA_CERT, KAFKA_CA } = require('./lib/config');

const doc = {
  "@id": "https://staging-media.feedbackfruits.com/5712633a-52f9-48c7-9546-794b7adf7427.pdf",
  "@type": [
    "Resource",
    "Document"
  ],
  "sourceOrganization": [
    "https://fontys.nl"
  ],
  "image": [
    "https://staging-media.feedbackfruits.com/5712633a-52f9-48c7-9546-794b7adf7427/preview.png?width=400&height=200&strategy=fit"
  ],
  "numPages": 160,
  "encoding": [
    {
      "@id": "https://staging-media.feedbackfruits.com/5712633a-52f9-48c7-9546-794b7adf7427",
      "@type": "MediaObject",
      "name": "Responsive Web Design-2nd-edition",
      "contentUrl": "https://staging-media.feedbackfruits.com/5712633a-52f9-48c7-9546-794b7adf7427/Responsive Web Design-2nd-edition.pdf",
      "encodingFormat": "pdf"
    }
  ]
}
// const message = {"action":"write","data":{"@id":"https://staging-media.feedbackfruits.com/e04612d5-087f-4137-a729-070172e09a2a.pdf","@type":["Resource","Document"],"sourceOrganization":["https://fontys.nl"],"image":["https://staging-media.feedbackfruits.com/e04612d5-087f-4137-a729-070172e09a2a/preview.png?width=400&height=200&strategy=fit"],"numPages":749,"encoding":[{"@id":"https://staging-media.feedbackfruits.com/e04612d5-087f-4137-a729-070172e09a2a","@type":"MediaObject","name":"HTML5 Canvas","contentUrl":"https://staging-media.feedbackfruits.com/e04612d5-087f-4137-a729-070172e09a2a/HTML5 Canvas.pdf","encodingFormat":"pdf"}]},"key":"https://staging-media.feedbackfruits.com/e04612d5-087f-4137-a729-070172e09a2a.pdf","label":"manually-annotated-by-steffan"}

async function doStuff() {
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

doStuff().then(console.log.bind(console), console.error.bind(console))
