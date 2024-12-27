/**
 * Configuration for the resolver.
 * This TOML content is sourced from:
 * https://github.com/kaspanet/rusty-kaspa/blob/master/rpc/wrpc/client/Resolvers.toml
 */
const RESOLVER_CONFIG = `[[resolver]]
enable = false
address = "http://127.0.0.1:8888"

[[group]]
template = "https://*.kaspa.stream"
nodes = ["eric","maxim","sean","troy"]

[[group]]
template = "https://*.kaspa.red"
nodes = ["john", "mike", "paul", "alex"]

[[group]]
template = "https://*.kaspa.green"
nodes = ["jake", "mark", "adam", "liam"]

[[group]]
template = "https://*.kaspa.blue"
nodes = ["noah", "ryan", "jack", "luke"]`;

/**
 * Export the resolver configuration.
 */
export { RESOLVER_CONFIG };
