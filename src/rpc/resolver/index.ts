import * as toml from 'toml';
import { IResolverConfig } from './types';

function tryParseResolvers(tomlConfig: string): string[] {
  const config: IResolverConfig = toml.parse(tomlConfig);

  let resolvers = config.resolver.filter((resolver) => resolver.enable !== false).map((resolver) => resolver.address);

  const groups = config.group.filter((group) => group.enable !== false);

  for (const group of groups) {
    const { template, nodes } = group;
    for (const node of nodes) {
      resolvers.push(template.replace('*', node));
    }
  }

  return resolvers;
}

export * from './borsh-resolver';
export * from './json-resolver';
export { tryParseResolvers };
