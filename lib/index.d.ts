import { Operation } from 'memux';
import { Doc } from 'feedbackfruits-knowledge-engine';
export declare type BrokerConfig = {
    name: string;
};
export declare type SendFn = (operation: Operation<Doc>) => Promise<void>;
declare function init({ name }: BrokerConfig): Promise<any>;
export default init;
