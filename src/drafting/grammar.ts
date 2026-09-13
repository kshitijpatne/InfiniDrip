// The garment grammar: a typed, dependency-ordered composition of reusable
// components. Existing recipes still expose `draft(...): Block`; this module
// supplies the stricter composition contract behind that seam.

import type { Measurements } from "./measurements";
import type { GarmentOptions } from "./options";
import { Block } from "./block";
import { Component, ComponentResult, assembleComponents } from "./component";
import { Interface, Stitch, interfaceLength as measureInterfaceLength } from "./stitch";

/** One bound component invocation in a composed garment. `kind` is stable
 * grammar vocabulary for inspection/UI; `id` identifies one instance, so two
 * bodices can be used without confusing their interfaces. */
export interface CompositionInstance {
  readonly id: string;
  readonly kind: string;
  readonly result: ComponentResult;
}

/** What a component can read while its parameters are being resolved. The
 * partial Block contains only components already executed in dependency order. */
export interface CompositionContext {
  readonly measurements: Measurements;
  readonly options: GarmentOptions;
  readonly components: ReadonlyMap<string, CompositionInstance>;
  readonly block: Block;
  readonly interfaceOf: (componentId: string, interfaceName: string) => Interface;
  readonly interfaceLength: (componentId: string, interfaceName: string) => number;
}

/** A bound component in the grammar graph. `run` is deliberately context-based
 * so a later component can consume the actual interface of an earlier one. */
export interface CompositionNode {
  readonly id: string;
  readonly kind: string;
  readonly dependsOn: readonly string[];
  readonly run: (context: CompositionContext) => ComponentResult;
}

/** A garment's declarative composition graph and its inter-component seams. */
export interface GarmentGrammar {
  readonly id: string;
  readonly nodes: readonly CompositionNode[];
  readonly connect: (context: CompositionContext) => readonly Stitch[];
}

export interface Composition {
  readonly block: Block;
  readonly components: readonly CompositionInstance[];
}

/** Bind a typed component and its owned parameter resolver to a graph node. */
export function componentNode<P>(
  id: string,
  kind: string,
  component: Component<P>,
  params: (context: CompositionContext) => P,
  dependsOn: readonly string[] = []
): CompositionNode {
  return {
    id,
    kind,
    dependsOn,
    run: (context) => component(context.measurements, params(context)),
  };
}

/** Build a grammar. The default connector is useful for a component that has
 * no external seams, while keeping the final Block construction identical. */
export function garmentGrammar(
  id: string,
  nodes: readonly CompositionNode[],
  connect: (context: CompositionContext) => readonly Stitch[] = () => []
): GarmentGrammar {
  return { id, nodes, connect };
}

/** Compose a grammar into the ordinary Block consumed by every existing layer. */
export function composeGrammar(
  grammar: GarmentGrammar,
  measurements: Measurements,
  options: GarmentOptions = {}
): Composition {
  const nodesById = new Map<string, CompositionNode>();
  for (const node of grammar.nodes) {
    if (nodesById.has(node.id)) {
      throw new Error(`Grammar "${grammar.id}" contains duplicate component id "${node.id}"`);
    }
    nodesById.set(node.id, node);
  }

  for (const node of grammar.nodes) {
    const seenDependencies = new Set<string>();
    for (const dependency of node.dependsOn) {
      if (dependency === node.id) {
        throw new Error(`Grammar "${grammar.id}" component "${node.id}" depends on itself`);
      }
      if (seenDependencies.has(dependency)) {
        throw new Error(`Grammar "${grammar.id}" component "${node.id}" repeats dependency "${dependency}"`);
      }
      seenDependencies.add(dependency);
      if (!nodesById.has(dependency)) {
        throw new Error(`Grammar "${grammar.id}" component "${node.id}" depends on missing component "${dependency}"`);
      }
    }
  }

  const state = new Map<string, "visiting" | "visited">();
  const order: CompositionNode[] = [];
  const visit = (id: string, stack: readonly string[]): void => {
    const current = state.get(id);
    if (current === "visited") return;
    if (current === "visiting") {
      throw new Error(`Grammar "${grammar.id}" contains a dependency cycle: ${[...stack, id].join(" -> ")}`);
    }
    state.set(id, "visiting");
    const node = nodesById.get(id)!;
    for (const dependency of node.dependsOn) visit(dependency, [...stack, id]);
    state.set(id, "visited");
    order.push(node);
  };
  for (const node of grammar.nodes) visit(node.id, []);

  const instances: CompositionInstance[] = [];
  const contextFor = (current: readonly CompositionInstance[]): CompositionContext => {
    const components = new Map(current.map((instance) => [instance.id, instance] as const));
    const block = assembleComponents(current.map((instance) => instance.result));
    const interfaceOf = (componentId: string, interfaceName: string): Interface => {
      const instance = components.get(componentId);
      if (!instance) {
        throw new Error(`Grammar "${grammar.id}" has no executed component "${componentId}"`);
      }
      const exposed = instance.result.interfaces[interfaceName];
      if (!exposed) {
        throw new Error(`Component "${componentId}" exposes no interface "${interfaceName}"`);
      }
      return exposed;
    };
    return {
      measurements,
      options,
      components,
      block,
      interfaceOf,
      interfaceLength: (componentId, interfaceName) =>
        measureInterfaceLength(block, interfaceOf(componentId, interfaceName)),
    };
  };

  for (const node of order) {
    const result = node.run(contextFor(instances));
    instances.push({ id: node.id, kind: node.kind, result });
  }

  const finalContext = contextFor(instances);
  const connectingStitches = grammar.connect(finalContext);
  // Validate the composition-owned seam graph at the composition boundary.
  // Without this pass, a typo in a final connector would survive until a
  // downstream checker happened to inspect that stitch.
  for (const stitch of connectingStitches) {
    measureInterfaceLength(finalContext.block, stitch.a);
    measureInterfaceLength(finalContext.block, stitch.b);
  }
  return {
    components: instances,
    block: assembleComponents(instances.map((instance) => instance.result), connectingStitches),
  };
}

/** Convenience for callers that only need the established Block contract. */
export function composeBlock(
  grammar: GarmentGrammar,
  measurements: Measurements,
  options: GarmentOptions = {}
): Block {
  return composeGrammar(grammar, measurements, options).block;
}
