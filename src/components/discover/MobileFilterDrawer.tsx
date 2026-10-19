import React, { useState, useEffect } from "react";
import { AlertCircle, RotateCcw, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Gender } from "@/api/users";
import {
  useDiscoverStore,
  DEFAULT_AGE_MIN,
  DEFAULT_AGE_MAX,
} from "@/store/useDiscoverStore";
import { validateAgeRange } from "@/utils/discover";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface MobileFilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation("discover");
  const { gender, ageMin, ageMax, setGender, setAgeRange, resetFilters } =
    useDiscoverStore();

  const [localGender, setLocalGender] = useState<Gender | undefined>(gender);
  const [localAgeRange, setLocalAgeRange] = useState<[number, number]>([
    ageMin,
    ageMax,
  ]);

  useEffect(() => {
    if (open) {
      setLocalGender(gender);
      setLocalAgeRange([ageMin, ageMax]);
    }
  }, [open, gender, ageMin, ageMax]);

  const validation = validateAgeRange(localAgeRange[0], localAgeRange[1], t);

  const handleApply = () => {
    if (validation.isValid) {
      setGender(localGender);
      setAgeRange(localAgeRange[0], localAgeRange[1]);
      onOpenChange(false);
    }
  };

  const handleReset = () => {
    resetFilters();
    setLocalGender(undefined);
    setLocalAgeRange([DEFAULT_AGE_MIN, DEFAULT_AGE_MAX]);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl max-h-[90vh] overflow-y-auto bg-card border-border p-6"
      >
        <SheetHeader className="text-left mb-6">
          <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
            {t("drawer.title")}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {t("drawer.description")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6">
          {/* Gender */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {t("filters.genderPreference")}
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-secondary border border-border">
              <button
                type="button"
                onClick={() => setLocalGender(undefined)}
                className={`py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  localGender === undefined
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {t("filters.allGenders")}
              </button>
              <button
                type="button"
                onClick={() => setLocalGender(Gender.FEMALE)}
                className={`py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  localGender === Gender.FEMALE
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {t("filters.female")}
              </button>
              <button
                type="button"
                onClick={() => setLocalGender(Gender.MALE)}
                className={`py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  localGender === Gender.MALE
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {t("filters.male")}
              </button>
            </div>
          </div>

          {/* Age Range */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {t("filters.ageRange")}
              </label>
              <span className="text-sm font-bold text-primary">
                {localAgeRange[0]} – {localAgeRange[1]} {t("filters.yrs")}
              </span>
            </div>

            <div className="py-2 px-1">
              <Slider
                min={18}
                max={100}
                step={1}
                value={localAgeRange}
                onValueChange={(vals) => {
                  if (vals.length >= 2) {
                    setLocalAgeRange([vals[0], vals[1]]);
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">
                  {t("filters.min")}
                </span>
                <input
                  type="number"
                  min={18}
                  max={100}
                  value={localAgeRange[0]}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) setLocalAgeRange([val, localAgeRange[1]]);
                  }}
                  className="w-16 h-9 px-2 text-center text-sm rounded-lg bg-secondary border border-border text-foreground"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">
                  {t("filters.max")}
                </span>
                <input
                  type="number"
                  min={18}
                  max={100}
                  value={localAgeRange[1]}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) setLocalAgeRange([localAgeRange[0], val]);
                  }}
                  className="w-16 h-9 px-2 text-center text-sm rounded-lg bg-secondary border border-border text-foreground"
                />
              </div>
            </div>

            {!validation.isValid && (
              <div className="flex items-center gap-2 text-xs text-destructive mt-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validation.error}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-secondary hover:bg-zinc-800 text-zinc-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t("filters.reset")}</span>
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!validation.isValid}
              className="flex-[2] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>{t("drawer.apply")}</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
