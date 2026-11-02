/**
 * Validation helpers shared by the profile forms (Yup based).
 */

import * as yup from "yup";

/** Extract the list of possible values from an option list. */
export const optionValues = <T extends string>(
  opts: ReadonlyArray<{ value: T }>,
): T[] => opts.map((o) => o.value);

/**
 * Optional number field: "" / NaN / null are normalized to undefined.
 */
export const optionalNumber = (
  min: number,
  max: number,
  minMsg?: string,
  maxMsg?: string,
) =>
  yup
    .number()
    .transform((value, original) =>
      original === "" || original == null || Number.isNaN(value)
        ? undefined
        : value,
    )
    .integer()
    .min(min, minMsg)
    .max(max, maxMsg)
    .optional();

/** Array of enum values, all required. */
export const enumArray = <T extends string>(
  opts: ReadonlyArray<{ value: T }>,
) =>
  yup
    .array()
    .of(yup.mixed<T>().oneOf(optionValues(opts)).required())
    .defined();

/** Single optional enum value. */
export const enumField = <T extends string>(
  opts: ReadonlyArray<{ value: T }>,
) => yup.mixed<T>().oneOf(optionValues(opts)).optional();
