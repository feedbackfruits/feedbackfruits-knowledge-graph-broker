import { Operation } from 'memux';
import Doc from './doc';
export declare type DocOperation = Operation<Doc>;
export declare type BrokerConfig = {
    name: string;
    url: string;
    input: string;
    output: string;
};
declare function init({name, url, input, output}: BrokerConfig): Promise<any>;
export default init;
