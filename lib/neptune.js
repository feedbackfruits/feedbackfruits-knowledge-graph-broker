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
const node_fetch_1 = require("node-fetch");
const feedbackfruits_knowledge_engine_1 = require("feedbackfruits-knowledge-engine");
const Config = require("./config");
const DataLoader = require("dataloader");
const updateLoader = new DataLoader((updates) => __awaiter(this, void 0, void 0, function* () {
    console.log(`Batching ${updates.length} update requests.`);
    const batchedUpdate = updates.join('\n');
    const result = yield updateNeptune(batchedUpdate);
    const results = updates.map(x => result.update);
    return results;
}), {
    maxBatchSize: 100,
    cache: false
});
function parseResult(result) {
    let { head: { vars }, results: { bindings } } = result;
    const res = bindings.reduce((memo, binding) => {
        const { subject, predicate, object, datatype } = binding;
        const quad = {
            subject: subject.value,
            predicate: predicate.value,
            object: datatype ? `"${object.value}"^^<${datatype}>` : object.value,
        };
        return [...memo, quad];
    }, []);
    return res;
}
exports.parseResult = parseResult;
function queryNeptune(query) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `${Config.NEPTUNE_ADDRESS}`;
        console.log(`Querying ${url} for ${query}`);
        const response = yield node_fetch_1.default(url, {
            headers: {
                "Content-Type": "application/sparql-query"
            },
            method: 'post',
            body: query
        });
        const text = yield response.text();
        console.log('Neptune query reponse:', response.status, text);
        const json = JSON.parse(text);
        return json;
    });
}
exports.queryNeptune = queryNeptune;
function updateNeptune(update) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `${Config.NEPTUNE_ADDRESS}`;
        console.log(`Updating ${url} for ${update}`);
        const response = yield node_fetch_1.default(url, {
            headers: {
                "Content-Type": "application/sparql-update"
            },
            method: 'post',
            body: update
        });
        const text = yield response.text();
        console.log('Neptune update reponse:', response.status, text);
        return { update: response.status >= 200 && response.status < 400 };
    });
}
exports.updateNeptune = updateNeptune;
function getQuads(...subjects) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = `
    SELECT *
    WHERE {
      GRAPH ${Config.GRAPH} {
        VALUES (?subject) { ${subjects.map(subject => `( <${subject}> )`).join(' ')} }
        ?subject ?predicate ?object
      }
    }
  `;
        const result = yield queryNeptune(query);
        const parsed = parseResult(result);
        return parsed;
    });
}
exports.getQuads = getQuads;
function writeQuads(quads) {
    return __awaiter(this, void 0, void 0, function* () {
        const nquads = feedbackfruits_knowledge_engine_1.Quad.toNQuads(quads);
        const update = `
    INSERT DATA {
      GRAPH ${Config.GRAPH} {
        ${nquads}
      }
    }
  `;
        const result = yield updateLoader.load(update);
        console.log('Result:', JSON.stringify(result));
        return;
    });
}
exports.writeQuads = writeQuads;
function deleteQuads(quads) {
    return __awaiter(this, void 0, void 0, function* () {
        const nquads = feedbackfruits_knowledge_engine_1.Quad.toNQuads(quads);
        const update = `
    DELETE DATA {
      GRAPH ${Config.GRAPH} {
        ${nquads}
      }
    }
  `;
        const result = yield updateLoader.load(update);
        console.log('Result:', JSON.stringify(result));
        return;
    });
}
exports.deleteQuads = deleteQuads;
