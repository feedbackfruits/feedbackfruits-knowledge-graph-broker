export declare type Quad = {
    subject: string;
    predicate: string;
    object: string;
    label?: string;
};
export declare const isQuad: (quad: object) => quad is Quad;
export default Quad;
