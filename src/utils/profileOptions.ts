/**
 * Shared option lists for the profile forms.
 * Each option points to an i18n key so the labels stay translated.
 */

import type {
  HasChildren,
  ProfileVisibility,
  RelationshipType,
  SexualInterest,
  WantsChildren,
} from "@/api/users";

export interface ProfileOption<T extends string> {
  value: T;
  labelKey: string;
}

export const GENDER_PREFERENCE_OPTIONS = [
  { value: "male", labelKey: "edit.gender.male" },
  { value: "female", labelKey: "edit.gender.female" },
] as const satisfies ReadonlyArray<ProfileOption<"male" | "female">>;

export const RELATIONSHIP_TYPE_OPTIONS = [
  {
    value: "DISCREET_RELATIONSHIP",
    labelKey: "edit.relationshipTypes.discreetRelationship",
  },
  {
    value: "ENHANCED_FRIENDSHIP",
    labelKey: "edit.relationshipTypes.enhancedFriendship",
  },
  {
    value: "ONE_ON_ONE_SEX",
    labelKey: "edit.relationshipTypes.oneOnOneSex",
  },
  {
    value: "ONE_NIGHT_STAND",
    labelKey: "edit.relationshipTypes.oneNightStand",
  },
  {
    value: "EXPERIMENTING",
    labelKey: "edit.relationshipTypes.experimenting",
  },
  {
    value: "EROTIC_FANTASIES",
    labelKey: "edit.relationshipTypes.eroticFantasies",
  },
] as const satisfies ReadonlyArray<ProfileOption<RelationshipType>>;

export const SEXUAL_INTEREST_OPTIONS = [
  { value: "ROLEPLAY", labelKey: "edit.sexualInterests.roleplay" },
  { value: "BDSM", labelKey: "edit.sexualInterests.bdsm" },
  { value: "SENSORY_PLAY", labelKey: "edit.sexualInterests.sensoryPlay" },
  {
    value: "VOYEURISM_EXHIBITIONISM",
    labelKey: "edit.sexualInterests.voyeurismExhibitionism",
  },
  { value: "SWINGING", labelKey: "edit.sexualInterests.swinging" },
  {
    value: "GROUP_EXPERIENCES",
    labelKey: "edit.sexualInterests.groupExperiences",
  },
  { value: "TANTRA", labelKey: "edit.sexualInterests.tantra" },
  { value: "POWER_EXCHANGE", labelKey: "edit.sexualInterests.powerExchange" },
  { value: "OTHER", labelKey: "edit.sexualInterests.other" },
] as const satisfies ReadonlyArray<ProfileOption<SexualInterest>>;

export const HAS_CHILDREN_OPTIONS = [
  { value: "NO", labelKey: "edit.hasChildren.no" },
  {
    value: "YES_LIVING_WITH_ME",
    labelKey: "edit.hasChildren.yesLivingWithMe",
  },
  {
    value: "YES_NOT_LIVING_WITH_ME",
    labelKey: "edit.hasChildren.yesNotLivingWithMe",
  },
  {
    value: "PREFER_NOT_TO_SAY",
    labelKey: "edit.hasChildren.preferNotToSay",
  },
] as const satisfies ReadonlyArray<ProfileOption<HasChildren>>;

export const WANTS_CHILDREN_OPTIONS = [
  { value: "YES", labelKey: "edit.wantsChildren.yes" },
  { value: "NO", labelKey: "edit.wantsChildren.no" },
  { value: "MAYBE", labelKey: "edit.wantsChildren.maybe" },
  {
    value: "PREFER_NOT_TO_SAY",
    labelKey: "edit.wantsChildren.preferNotToSay",
  },
] as const satisfies ReadonlyArray<ProfileOption<WantsChildren>>;

export const PROFILE_VISIBILITY_OPTIONS = [
  { value: "PUBLIC", labelKey: "edit.visibility.public" },
  { value: "MATCHES_ONLY", labelKey: "edit.visibility.matchesOnly" },
  { value: "HIDDEN", labelKey: "edit.visibility.hidden" },
] as const satisfies ReadonlyArray<ProfileOption<ProfileVisibility>>;

/** Max length of the bio field. */
export const BIO_MAX = 500;

/** Max length of the erotica fantasies field. */
export const FANTASIES_MAX = 2000;
