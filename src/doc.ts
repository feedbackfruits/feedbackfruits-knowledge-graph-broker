export type Doc = {
  '@id': string
};

export const isDoc = (doc: object) => {
  return doc != null && typeof doc['@id'] === 'string';
};

export default Doc;
