import { Quad, Doc } from 'feedbackfruits-knowledge-engine';
export declare function deduplicateQuads(quads: Quad[]): Quad[];
export declare function existingQuadsForDoc(doc: Doc): Promise<Quad[]>;
export declare function quadExists(quad: Quad): Promise<boolean>;
export declare function getQuads(subject: any): Promise<Quad[]>;
export declare function writeQuads(quads: Quad[]): any;
export declare function deleteQuads(quads: Quad[]): any;
