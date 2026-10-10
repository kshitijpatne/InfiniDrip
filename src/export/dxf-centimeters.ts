import { AllowanceSpec, Piece } from "../drafting";
import { exportDxf } from "./dxf";

const CENTIMETER_HEADER =
  "0\nSECTION\n2\nHEADER\n" +
  "9\n$ACADVER\n1\nAC1015\n" +
  "9\n$INSUNITS\n70\n5\n" +
  "0\nENDSEC\n";

/**
 * Add explicit centimeter units to the legacy DXF entity stream without
 * changing its entity body. This generic serialization helper is not an
 * apparel-CAD profile or a compatibility claim.
 */
export function exportDxfCentimeters(
  pieces: readonly Piece[], allowance: AllowanceSpec,
): string {
  return CENTIMETER_HEADER + exportDxf(pieces, allowance);
}
