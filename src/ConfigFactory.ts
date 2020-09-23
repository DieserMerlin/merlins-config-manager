import {join} from "path";
import {ConfigManager, ConfigValidation} from "./ConfigManager";

export class ConfigFactory<T> {
    private _configManagers: { [key: string]: ConfigManager };
    private _config: T;

    constructor(private _defaultConfig: T, private _folder?: string) {
        if (typeof _defaultConfig !== "object")
            throw new TypeError("Config must be of type 'object'.");

        this._configManagers = {};
        this._config = _defaultConfig;

        this.readConfig();
    }

    public readConfig() {
        this._configManagers = {};
        this._config = this._defaultConfig;

        for (let key of Object.keys(this._defaultConfig)) {
            const cm = new ConfigManager(join(this._folder || 'conf', `${key}.json`));
            this._configManagers[key] = cm;
            const config = (this._defaultConfig as any)[key];
            (this._config as any)[key] = cm.configSection('', config);
        }
    }

    public get config(): T {
        return this._config;
    }

    public get defaultConfig(): T {
        return this._defaultConfig;
    }

    public get configAnalysis(): { [key: string]: ConfigValidation } {
        const out: { [key: string]: ConfigValidation } = {};
        for (let key of Object.keys(this._configManagers))
            out[key] = this._configManagers[key].validateConfig();
        return out;
    }
}
