import {ConfigManager} from "../src";

const configManager = new ConfigManager("conf/main.json");
const dbConfigManager = new ConfigManager("conf/db.json");

export type AppConfig = {
    test: string,
    nested: {
        num: number,
        bool: boolean,
        str: string
    }
};

export type DBConfig = {
    host: string,
    port: number,
    credentials: {
        username: string,
        password: string
    } | null,
    dbName: string
};

const defaultAppConfig: AppConfig = {
    nested: {bool: false, num: 0, str: "hello"},
    test: "successful"
};

const defaultDBConfig: DBConfig = {
    credentials: {username: "admin", password: "s3cur3"},
    dbName: "my-cool-db",
    host: "localhost",
    port: 1337
};

const DBConfig = dbConfigManager.configSection("DATABASE", defaultDBConfig);
const AppConfig = configManager.configSection("APP", defaultAppConfig);
