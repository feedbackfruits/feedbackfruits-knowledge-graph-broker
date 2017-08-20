export type Quad = {
  subject: string,
  predicate: string,
  object: string,
  label?: string
};

export const isQuad = (quad: object): quad is Quad => {
  return quad != null &&
         typeof quad === 'object' &&
         typeof quad['subject'] === 'string' &&
         typeof quad['predicate'] === 'string' &&
         typeof quad['object'] === 'string';
};

export default Quad;
