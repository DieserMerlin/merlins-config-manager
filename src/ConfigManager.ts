import {existsSync, readFileSync, writeFileSync, mkdirSync} from 'fs';
import {dirname} from 'path';
import {mergeConfigs} from './ConfigMerger';

export type ConfigValidation = {
  created: boolean | Array<string>;
  wrongTypes: Array<{path: string; expected: string; actual: string}>;
  unusedValues: Array<string>;
};

/**
 * Class for creating config with multiple sections and default values.
 * Also merges and saves the configs every time the program is started.
 */
export class ConfigManager {
  private readonly created: boolean;
  private readonly oldConfig: any = {};
  private readonly config: any;
  private readonly defaultConfig: any = {};
  public readonly configFileLoadingError: string | null;

  constructor(private configFileName: string = 'config.json') {
    this.configFileLoadingError = null;
    this.created = true;
    if (existsSync(configFileName)) {
      this.created = false;
      try {
        this.config = JSON.parse(readFileSync(configFileName).toString());
        this.oldConfig = mergeConfigs({}, this.config);
      } catch (e) {
        this.configFileLoadingError = e;
      }
    } else this.config = {};
  }

  /**
   * Create, save and get a new config section with default values.
   * @param path The path of the section separated by dots. "X.Y" will result in {"X": {"Y": ...}}.
   * @param defaultConfig The default config values.
   *
   * @return The merged config object in the scheme of the default config object.
   */
  public configSection<T>(path: string, defaultConfig: T): T {
    const root = this.getOrCreateConfigPath(path);
    if (root === defaultConfig) {
      return root;
    }
    this.addDefaultConfig(path, defaultConfig);
    return this.updateConfigPath(
      path,
      mergeConfigs(defaultConfig, root || {})
    ) as T;
  }

  /**
   * Function for merging a default config section into the complete default configuration.
   * @param path The path where the config section should be placed in the config.
   * @param defaultConfig The default config values.
   */
  private addDefaultConfig(path: string, defaultConfig: any): any {
    ConfigManager.validatePath(path);
    let root: any = defaultConfig;
    const paths = path.split('.').reverse();
    for (const p of paths) {
      root = {[p]: root};
    }
    mergeConfigs(this.defaultConfig, root);
  }

  /**
   * Get a config section by path (separated by dots) or create the complete path as empty object.
   * The path "X.Y" will either get the object 'Y' of {"X": {"Y": {...}}} or create the following empty config part: {"X": "Y": {}}.
   * @param path The path that should be get and (if necessary) created.
   */
  public getOrCreateConfigPath(path: string): any {
    if (path === '') return this.config;
    ConfigManager.validatePath(path);
    const paths = path.split('.');
    let root = this.config;
    for (const p of paths) {
      if (typeof root[p] !== 'object') {
        root[p] = {};
      }
      root = root[p];
    }
    return root;
  }

  /**
   * Update a config section by path (separated by dots).
   * Basically same as 'getOrCreateConfigPath(path: string)' but with initialized values.
   * Calling with the path "X.Y" and the values {"test": 123} will result in the following config part: {"X": {"Y": {"test": 123}}}.
   *
   * **WARNING**:
   * Please consider using "configSection(...)" instead since this is just raw config editing while "configSection" merges the existing config with default values.
   * @param path The path of the config section separated by dots.
   * @param values The object that should be created there.
   */
  public updateConfigPath(path: string, values: any): any {
    this.getOrCreateConfigPath(path); // Ensure path is created
    if (path !== '') {
      const paths = path.split('.').reverse(); // Follow the path reversed (last object first)
      paths.forEach((p, i) => {
        if (i + 1 !== paths.length) {
          values = {[p]: values}; // Now create nested objects from inside to outside ({x} -> {y: {x}} -> ...).
        } else {
          this.config[p] = values; // If last path element save that generated path to the real config.
        }
      });
    } else Object.assign(this.config, values);
    this.saveConfig();
    return this.getOrCreateConfigPath(path);
  }

  /**
   * Saves the current config to the file specified in the constructor.
   * File format is json formatted with two spaces.
   */
  public saveConfig() {
    mkdirSync(dirname(this.configFileName), {recursive: true});
    writeFileSync(this.configFileName, JSON.stringify(this.config, null, 2));
  }

  /**
   * Function for validating the current configuration and analyzing it after loading all sections against the previous config and the default config.
   * @param clearUnusedValues Whether unused config values should automatically be removed from the config.
   */
  public validateConfig(clearUnusedValues = false): ConfigValidation {
    const created: Array<string> = [];
    const result: ConfigValidation = {
      created,
      unusedValues: [],
      wrongTypes: [],
    };

    // Resolver function for recursive analyzing
    const resolve = (
      firstLevel: boolean,
      path: string,
      [conf, oldConf, defConf]: [any, any, any]
    ) => {
      // Loop through config keys
      for (const key of Object.keys(conf)) {
        // Determine current key including full path. Don't add dot at first level.
        const propKey = firstLevel ? key : path + '.' + key;

        // Check if it was undefined before the config was initialized.
        if (oldConf[key] === undefined) {
          created.push(propKey);
        }

        // Check if the value's type differs from what is stored in the default config.
        if (typeof conf[key] !== typeof defConf[key]) {
          // Check if the value is undefined in the default config
          if (typeof defConf[key] === 'undefined') {
            result.unusedValues.push(propKey);
            if (clearUnusedValues) {
              delete conf[key];
            }
          } else {
            result.wrongTypes.push({
              path: propKey,
              expected: typeof defConf[key],
              actual: typeof conf[key],
            });
          }
        }

        // Check if both, the config and the default config, have an object at this path
        if (typeof conf[key] === 'object' && typeof defConf[key] === 'object') {
          // If both have an object, we can start deep analyzing
          resolve(false, propKey, [
            conf[key],
            oldConf[key] || {},
            defConf[key],
          ]);
        }
      }
    };
    resolve(true, '', [this.config, this.oldConfig, this.defaultConfig]);
    if (this.created) {
      result.created = true;
    }
    if (clearUnusedValues) {
      this.saveConfig();
    }
    return result;
  }

  /**
   * Validates a config path against some rules:
   *
   * - Paths can have lower- and uppercase alphanumeric chars, dashes and underscores.
   * - Paths must start and end with any valid character (defined above).
   * - Dots are used to separate the different sections.
   * - Dots can not be the first or the last char.
   * - Two dots are not allowed since this would end in an empty section name ("section1..section2" => 'section1' > '' > 'section2').
   * @param path The path that should be validated.
   */
  private static validatePath(path: string) {
    if (path === '') return;
    if (!/[a-z0-9_\-.]+/gi.test(path))
      throw new Error(
        `The config path '${path}' is invalid. Please use alphanumeric characters, dashes, underscores and dots only.`
      );
    if (/(^\.)|(\.$)/g.test(path))
      throw new Error(
        `The config path '${path}' can't start or end with a dot.`
      );
    if (/[.]{2,}/g.test(path))
      throw new Error(
        `The config path '${path}' is invalid. Please only use one dot at once to separate a new config section.`
      );
  }
}
