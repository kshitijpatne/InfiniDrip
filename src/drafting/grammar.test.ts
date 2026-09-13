import { describe, expect, it } from "vitest";
import { STANDARD_M } from "./measurements";
import { GARMENTS } from "./recipe";
import type { Component, ComponentResult } from "./component";
import {
  componentNode,
  composeBlock,
  composeGrammar,
  garmentGrammar,
} from "./grammar";
import { edgeRef, iface, Stitch } from "./stitch";
import { Edge, Piece } from "./piece";

function linePiece(name: string, width: number): Piece {
  const edge: Edge = { kind: "line", name: "join", start: { x: 0, y: 0 }, end: { x: width, y: 0 } };
  return { name, onFold: false, edges: [edge] };
}

function result(role: string, width: number): ComponentResult {
  return {
    pieces: { [role]: linePiece(role, width) },
    stitches: [],
    interfaces: { join: iface(edgeRef(role, "join")) },
  };
}

const fixed = (role: string, width: number): Component<Record<never, never>> => () => result(role, width);

describe("componentNode and garmentGrammar", () => {
  it("bind a typed component, owned params, and a default connector", () => {
    const node = componentNode(
      "front",
      "bodice",
      (_m, params: { readonly chest: number }) => result("front", params.chest),
      (context) => ({ chest: context.measurements.chest }),
    );
    const grammar = garmentGrammar("typed", [node]);
    const composed = composeGrammar(grammar, STANDARD_M, { proof: 1 });

    expect(composed.components.map((entry) => [entry.id, entry.kind])).toEqual([["front", "bodice"]]);
    expect(composed.block.roles.front.edges[0]).toMatchObject({ end: { x: STANDARD_M.chest, y: 0 } });
    expect(composed.block.stitches).toEqual([]);
    expect(composeBlock(grammar, STANDARD_M).roles.front.name).toBe("front");
  });
});

describe("composeGrammar", () => {
  it("routes every registered garment through a named grammar", () => {
    for (const recipe of GARMENTS) {
      const grammar = recipe.grammar;
      expect(grammar, `${recipe.name} grammar`).toBeDefined();
      expect(grammar!.id).toBe(recipe.name);
      expect(new Set(grammar!.nodes.map((node) => node.id)).size).toBe(grammar!.nodes.length);

      const composed = composeGrammar(grammar!, STANDARD_M, {});
      expect(composed.components).toHaveLength(grammar!.nodes.length);
      expect(Object.keys(composed.block.roles)).toEqual(Object.keys(recipe.draft(STANDARD_M).roles));
      expect(composed.block.roles).not.toEqual({});
    }
  });

  it("executes dependencies first and exposes measured interfaces to later components", () => {
    const order: string[] = [];
    const base = componentNode("base", "panel", () => {
      order.push("base");
      return result("base", 7);
    }, () => ({}));
    const dependent = componentNode(
      "dependent",
      "sleeve",
      (_m, params: { readonly width: number }) => {
        order.push("dependent");
        return result("dependent", params.width);
      },
      (context) => ({ width: context.interfaceLength("base", "join") }),
      ["base"],
    );
    const independent = componentNode("independent", "note", () => {
      order.push("independent");
      return result("independent", 2);
    }, () => ({}));

    const composed = composeGrammar(
      garmentGrammar("ordered", [dependent, independent, base]), STANDARD_M,
    );

    expect(order).toEqual(["base", "dependent", "independent"]);
    expect(composed.components.map((entry) => entry.id)).toEqual(["base", "dependent", "independent"]);
    expect(composed.block.roles.dependent.edges[0]).toMatchObject({ end: { x: 7, y: 0 } });
  });

  it("connects exposed interfaces into the final Block and forwards options", () => {
    let seenOptions = 0;
    const left = componentNode("left", "panel", (_context) => {
      return result("left", 4);
    }, () => ({}));
    const right = componentNode("right", "panel", (_context, params: { readonly width: number }) => {
      return result("right", params.width);
    }, (context) => {
      seenOptions = context.options.width ?? 0;
      return { width: context.interfaceLength("left", "join") };
    }, ["left"]);
    const stitch: Stitch = {
      label: "left ↔ right",
      a: iface(edgeRef("left", "join")),
      b: iface(edgeRef("right", "join")),
    };
    const composed = composeGrammar(
      garmentGrammar("connected", [left, right], (context) => {
        expect(context.interfaceOf("left", "join")).toEqual(iface(edgeRef("left", "join")));
        return [stitch];
      }),
      STANDARD_M,
      { width: 9 },
    );

    expect(seenOptions).toBe(9);
    expect(composed.block.stitches).toEqual([stitch]);
  });

  it("rejects a final connector that references an unknown piece or edge", () => {
    const panel = componentNode("panel", "panel", fixed("panel", 4), () => ({}));
    expect(() => composeGrammar(
      garmentGrammar("bad-connector", [panel], () => [{
        label: "panel ↔ missing",
        a: iface(edgeRef("panel", "join")),
        b: iface(edgeRef("missing", "join")),
      }]),
      STANDARD_M,
    )).toThrow('Block has no piece in role "missing"');

    expect(() => composeGrammar(
      garmentGrammar("bad-edge", [panel], () => [{
        label: "panel ↔ missing edge",
        a: iface(edgeRef("panel", "missing")),
        b: iface(edgeRef("panel", "join")),
      }]),
      STANDARD_M,
    )).toThrow('Piece "panel" has no edge named "missing"');
  });

  it("keeps a shared dependency from executing twice", () => {
    const calls: string[] = [];
    const base = componentNode("base", "panel", () => { calls.push("base"); return result("base", 1); }, () => ({}));
    const first = componentNode("first", "panel", () => { calls.push("first"); return result("first", 1); }, () => ({}), ["base"]);
    const second = componentNode("second", "panel", () => { calls.push("second"); return result("second", 1); }, () => ({}), ["base"]);

    composeGrammar(garmentGrammar("shared", [first, second, base]), STANDARD_M);
    expect(calls).toEqual(["base", "first", "second"]);
  });

  it("rejects duplicate IDs, self dependencies, repeated dependencies, and missing dependencies", () => {
    const one = componentNode("one", "panel", fixed("one", 1), () => ({}));
    expect(() => composeGrammar(garmentGrammar("duplicate", [one, one]), STANDARD_M))
      .toThrow('duplicate component id "one"');
    expect(() => composeGrammar(garmentGrammar("self", [componentNode("one", "panel", fixed("one", 1), () => ({}), ["one"])]), STANDARD_M))
      .toThrow('depends on itself');
    expect(() => composeGrammar(garmentGrammar("repeat", [componentNode("one", "panel", fixed("one", 1), () => ({}), ["two", "two"]), componentNode("two", "panel", fixed("two", 1), () => ({}))]), STANDARD_M))
      .toThrow('repeats dependency "two"');
    expect(() => composeGrammar(garmentGrammar("missing", [componentNode("one", "panel", fixed("one", 1), () => ({}), ["two"])]), STANDARD_M))
      .toThrow('depends on missing component "two"');
  });

  it("rejects dependency cycles and role collisions", () => {
    const a = componentNode("a", "panel", fixed("a", 1), () => ({}), ["b"]);
    const b = componentNode("b", "panel", fixed("b", 1), () => ({}), ["a"]);
    expect(() => composeGrammar(garmentGrammar("cycle", [a, b]), STANDARD_M)).toThrow("dependency cycle");

    const first = componentNode("first", "panel", fixed("same", 1), () => ({}));
    const second = componentNode("second", "panel", fixed("same", 1), () => ({}));
    expect(() => composeGrammar(garmentGrammar("collision", [first, second]), STANDARD_M))
      .toThrow('role "same" claimed by more than one component');
  });

  it("fails loudly when a later component requests an unknown instance or interface", () => {
    const unknownInstance = componentNode("later", "panel", fixed("later", 1), (context) => {
      context.interfaceOf("missing", "join");
      return {} as ComponentResult;
    });
    expect(() => composeGrammar(garmentGrammar("unknown-instance", [unknownInstance]), STANDARD_M))
      .toThrow('no executed component "missing"');

    const noInterface = componentNode("base", "panel", () => ({ pieces: { base: linePiece("base", 1) }, stitches: [], interfaces: {} }), () => ({}));
    const unknownInterface = componentNode("later", "panel", fixed("later", 1), (context) => {
      context.interfaceOf("base", "missing");
      return {} as ComponentResult;
    }, ["base"]);
    expect(() => composeGrammar(garmentGrammar("unknown-interface", [unknownInterface, noInterface]), STANDARD_M))
      .toThrow('exposes no interface "missing"');
  });

  it("can compose an empty grammar", () => {
    const composed = composeGrammar(garmentGrammar("empty", []), STANDARD_M);
    expect(composed.components).toEqual([]);
    expect(composed.block.roles).toEqual({});
    expect(composed.block.stitches).toEqual([]);
  });
});
