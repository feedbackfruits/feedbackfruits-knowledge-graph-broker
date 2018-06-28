import { Quad, Doc } from 'feedbackfruits-knowledge-engine';
export declare function quickDiff(existing: Quad[], other: Quad[]): Quad[];
export declare function deduplicateQuads(quads: Quad[]): Quad[];
export declare function existingQuadsForDoc(doc: Doc): Promise<Quad[]>;
export declare function splitArray(array: any[], chunkSize?: number): any[][];
