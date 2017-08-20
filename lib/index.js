"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').load({ silent: true });
const memux_1 = require("memux");
const helpers_1 = require("./helpers");
const Cayley = require('cayley');
const { Observable: { empty } } = require('rxjs');
const PQueue = require('p-queue');
const jsonld = require('jsonld');
const { NAME = 'feedbackfruits-knowledge-graph-broker', CAYLEY_ADDRESS = 'http://localhost:64210', KAFKA_ADDRESS = 'tcp://localhost:9092', INPUT_TOPIC = 'quad_update_requests', OUTPUT_TOPIC = 'quad_updates', CONCURRENCY = '100', } = process.env;
const cayley = null;
function init({ name, url, input, output }) {
    return __awaiter(this, void 0, void 0, function* () {
        const send = yield memux_1.createSend({
            name,
            url,
            topic: output,
            concurrency: parseInt(CONCURRENCY)
        });
        const receive = (operation) => {
            if (!memux_1.isOperation(operation))
                throw new Error();
            const { action, data } = operation;
            const quads = helpers_1.docToQuads(data);
            return new Promise((resolve, reject) => {
                cayley[action](quads, (error, body, response) => {
                    if (error)
                        return reject(error);
                    if (response.statusCode >= 200 && response.statusCode < 400) {
                        return Promise.all(helpers_1.quadsToDocs(cayley.get(data['@id'])).map(data => send({ action, key: data['@id'], data }))).then(() => resolve());
                    }
                    if (response.statusCode === 400) {
                        if ((body.error || body).match(/quad exists/))
                            return resolve();
                        if ((body.error || body).match(/invalid quad/))
                            return resolve();
                    }
                    reject();
                });
            });
        };
        return memux_1.createReceive({
            name,
            url,
            topic: input,
            receive
        });
    });
}
init({
    name: NAME,
    url: KAFKA_ADDRESS,
    input: INPUT_TOPIC,
    output: OUTPUT_TOPIC,
}).catch(console.error);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUV6QyxpQ0FBMEU7QUFHMUUsdUNBQW9EO0FBRXBELE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqQyxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDbEQsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ2xDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUVqQyxNQUFNLEVBQ0osSUFBSSxHQUFHLHVDQUF1QyxFQUM5QyxjQUFjLEdBQUcsd0JBQXdCLEVBQ3pDLGFBQWEsR0FBRyxzQkFBc0IsRUFDdEMsV0FBVyxHQUFHLHNCQUFzQixFQUNwQyxZQUFZLEdBQUcsY0FBYyxFQUM3QixXQUFXLEdBQUcsS0FBSyxHQUNwQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7QUFFaEIsTUFBTSxNQUFNLEdBQVEsSUFBSSxDQUFDO0FBU3pCLGNBQW9CLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFVOztRQUN0RCxNQUFNLElBQUksR0FBRyxNQUFNLGtCQUFVLENBQUM7WUFDNUIsSUFBSTtZQUNKLEdBQUc7WUFDSCxLQUFLLEVBQUUsTUFBTTtZQUNiLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDO1NBQ25DLENBQUMsQ0FBQztRQUVILE1BQU0sT0FBTyxHQUFHLENBQUMsU0FBeUI7WUFDeEMsRUFBRSxDQUFDLENBQUMsQ0FBQyxtQkFBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUFDLE1BQU0sSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUMvQyxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLFNBQVMsQ0FBQztZQUVuQyxNQUFNLEtBQUssR0FBRyxvQkFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRS9CLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNO2dCQUN2QyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxRQUFRO29CQUMxQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUM7d0JBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDaEMsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsSUFBSSxHQUFHLElBQUksUUFBUSxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUM1RCxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBVyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLE9BQU8sRUFBRSxDQUFDLENBQUM7b0JBQ3ZJLENBQUM7b0JBRUQsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUNoQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDOzRCQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDaEUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQzs0QkFBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ25FLENBQUM7b0JBRUQsTUFBTSxFQUFFLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQztRQUVGLE1BQU0sQ0FBQyxxQkFBYSxDQUFDO1lBQ25CLElBQUk7WUFDSixHQUFHO1lBQ0gsS0FBSyxFQUFFLEtBQUs7WUFDWixPQUFPO1NBQ1IsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUFBO0FBRUQsSUFBSSxDQUFDO0lBQ0gsSUFBSSxFQUFFLElBQUk7SUFDVixHQUFHLEVBQUUsYUFBYTtJQUNsQixLQUFLLEVBQUUsV0FBVztJQUNsQixNQUFNLEVBQUUsWUFBWTtDQUNyQixDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyJ9