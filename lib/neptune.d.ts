import { Quad } from 'feedbackfruits-knowledge-engine';
export declare function parseResult(result: any): any;
export declare function queryNeptune(query: string): Promise<any>;
export declare function updateNeptune(update: string): Promise<any>;
export declare function getQuads(...subjects: string[]): Promise<any>;
export declare function writeQuads(quads: Quad[]): Promise<void>;
export declare function deleteQuads(quads: Quad[]): Promise<void>;
