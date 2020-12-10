# merlins-config-manager
A simple configuration manager that uses the advantages of typescript to easily create templated config sections.

## Installation

`
$ npm i merlins-config-manager
`

## Usage

If you want to have all configurations of your application in one file please take a look at the Basics section below.
Use the "ConfigFactory" otherwise as it's as simple as the ConfigManager and can handle multiple configs at once.

### Basics
Usage is as simple as it could be. Just create an instance of the ConfigManager class and start adding sections.
When a section is defined, the config.json file in the project root is created/updated and the default values provided are added.

```typescript
import {ConfigManager} from 'merlins-config-manager';

interface DatabaseConfig {
  host: string,
  port: number,
  userName: string,
  password: string
}

const DefaultDatabaseConfig: DatabaseConfig = {
  host: 'localhost',
  port: 27017,
  userName: '',
  password: ''
};

const cm = new ConfigManager()
const databaseConfig = cm.configSection('DATABASE', DefaultDatabaseConfig);
```

"databaseConfig" automatically has the same type as "DefaultDatabaseConfig" and can be used as production configuration.
When the code is executed the first time, the ConfigurationManager creates the config.json file and adds a "DATABASE" section to it containing the default database config.
Now you can change your config.json and it will automatically load the changed values.

If you delete a value from the config.json file, the ConfigurationManager will recreate it based on the default values at the next start or configuration update at runtime.

### Configuration paths
Sections can be stored at section paths. A path describes where a section appears in the config.
In the example above, the path of the database is just "DATABASE". This results in a root field called "DATABASE" in your json document:

```json
{
  "DATABASE": {}
}
```

You can also define nested sections defining a more complex path separated by dots.
The path "DATABASE.SCHEMAS" will result in this json structure:

```json
{
  "DATABASE": {
    "SCHEMAS": {}
  }
}
```

The default "DATABASE"-section will still work but keep in mind that adding a section with a path like "DATABASE.host" would overwrite the "host" field of the database config.
This is why you should define section paths in uppercase and section values in camel-case (thisIsCamelCase).

Paths can make use of alphanumeric chars, dashes and underscores. Sections are separated by dots.
Dots cannot be followed by another dot or placed at the start or end of the path.

### Profiles
Having different configuration profiles can be achieved by passing a string to the ConfigurationManager's constructor:

```typescript
const cm1 = new ConfigurationManager(); // -> config.json
const cm2 = new ConfigurationManager('test.json'); // -> test.json
```

### ConfigFactory
If you want to split your configs into files instead of sections, you can make use of the ConfigFactory:

```typescript
import {ConfigFactory} from "merlins-config-manager";

const defaultConfig = {
    database: {
        host: "localhost",
        dbName: "my-cool-database",
        authentication: {
            username: "admin",
            password: "s3cur3"
        }
    },
    webserver: {
        enabled: true,
        host: "0.0.0.0",
        port: 1337
    }
};

const factory = new ConfigFactory(defaultConfig);

console.log(factory.config.database.host);
// "localhost"
```

This will create the folder you specify as second parameter of the ConfigFactory-constructor (defaults to 'conf') and all config sections as
.json-files in it. In the example above, the following file-structure would be created:

```
Project root
|- conf
  |- database.json
  |- webserver.json
```
