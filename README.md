# Apollo client

[![Build status](https://travis-ci.org/apollostack/apollo-client.svg?branch=master)](https://travis-ci.org/apollostack/apollo-client)
[![Build status](https://ci.appveyor.com/api/projects/status/ajdf70delshw2ire/branch/master?svg=true)](https://ci.appveyor.com/project/stubailo/apollo-client/branch/master)
<a href="https://codeclimate.com/github/apollostack/apollo-client/coverage"><img src="https://codeclimate.com/github/apollostack/apollo-client/badges/coverage.svg" /></a>


A simple but functional GraphQL client with a great development experience.

[Read about our design principles.](design.md)

---

### Local development

```
# nvm use node
npm install
npm test
```

This project uses TypeScript for static typing and TSLint for linting. You can get both of these built into your editor with no configuration by opening this project in [Visual Studio Code](https://code.visualstudio.com/), an open source IDE which is available for free on all platforms.

### Useful tools

Should be moved into some kind of CONTRIBUTING.md soon...

- [AST explorer](https://astexplorer.net/): you can use this to see what the GraphQL query AST looks like for different queries
