import {ConfigFactory} from "../src/ConfigFactory";

const configFactory = new ConfigFactory({
    database: {test: 1, nested: {x: "y", z: false}},
    app: {debug: true}
});

console.log(configFactory.config);
