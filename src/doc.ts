export type Doc = {
  '@id': string
};

export const isDoc = (doc: object) => {
  return typeof doc['@id'] === 'string';
};

export default Doc;
