import { Quad } from 'feedbackfruits-knowledge-engine';
export declare function nodesExists(subjects: string[]): Promise<boolean[]>;
export declare function getQuads(...subjects: string[]): Promise<Quad[]>;
export declare function writeQuads(quads: Quad[]): Promise<any[]>;
export declare function deleteQuads(quads: Quad[]): Promise<any>;
