import React, { useState, useEffect } from "react";
import {
  SlidersHorizontal,
  RotateCcw,
  Search,
  X,
  LayoutGrid,
  List,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Gender } from "@/api/users";
import {
  useDiscoverStore,
  DEFAULT_AGE_MIN,
  DEFAULT_AGE_MAX,
} from "@/store/useDiscoverStore";
import { validateAgeRange } from "@/utils/discover";
import { Slider } from "@/components/ui/slider";

interface DiscoverFiltersProps {
  totalResults?: number;
  filteredCount?: number;
  onOpenMobileFilters?: () => void;
}

export const DiscoverFilters: React.FC<DiscoverFiltersProps> = ({
  totalResults = 0,
  filteredCount,
  onOpenMobileFilters,
}) => {
  const { t } = useTranslation("discover");

  const {
    gender,
    ageMin,
    ageMax,
    clientSearch,
    viewMode,
    setGender,
    setAgeRange,
    setClientSearch,
    setViewMode,
    removeFilter,
    resetFilters,
  } = useDiscoverStore();

  // Local draft state for smooth slider interactions before committing or validation
  const [sliderValues, setSliderValues] = useState<[number, number]>([
    ageMin,
    ageMax,
  ]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Keep local slider in sync with store
  useEffect(() => {
    setSliderValues([ageMin, ageMax]);
  }, [ageMin, ageMax]);

  const validation = validateAgeRange(sliderValues[0], sliderValues[1], t);

  const hasGenderFilter = gender !== undefined;
  const hasAgeFilter = ageMin !== DEFAULT_AGE_MIN || ageMax !== DEFAULT_AGE_MAX;
  const hasAnyFilter = hasGenderFilter || hasAgeFilter || Boolean(clientSearch);

  const activeFiltersCount = (hasGenderFilter ? 1 : 0) + (hasAgeFilter ? 1 : 0);

  const handleSliderChange = (vals: number[]) => {
    if (vals.length >= 2) {
      setSliderValues([vals[0], vals[1]]);
    }
  };

  const handleSliderCommit = (vals: number[]) => {
    if (vals.length >= 2) {
      const [min, max] = vals;
      if (min <= max) {
        setAgeRange(min, max);
      }
    }
  };

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setSliderValues([val, sliderValues[1]]);
      if (val >= 18 && val <= sliderValues[1]) {
        setAgeRange(val, sliderValues[1]);
      }
    }
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setSliderValues([sliderValues[0], val]);
      if (val >= sliderValues[0] && val <= 100) {
        setAgeRange(sliderValues[0], val);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Controls Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border/80 shadow-sm">
        {/* Left: Client-side Search Field */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            id="discover-local-search"
            aria-label={t("filters.searchAria")}
            placeholder={t("filters.searchPlaceholder")}
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-9 rounded-xl bg-secondary/80 border border-transparent focus:border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
          {clientSearch && (
            <button
              type="button"
              onClick={() => setClientSearch("")}
              aria-label={t("filters.clearSearch")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-foreground rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Filter Buttons & Layout Toggle */}
        <div className="flex items-center justify-between md:justify-end gap-2 flex-wrap">
          {/* Desktop Filter Panel Toggle */}
          <button
            type="button"
            id="discover-filter-toggle"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`hidden sm:inline-flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-semibold border transition-all ${
              isFilterOpen || activeFiltersCount > 0
                ? "bg-zinc-800 border-zinc-600 text-white"
                : "bg-secondary hover:bg-zinc-800 border-transparent text-zinc-300"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{t("filters.button")}</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Mobile Filter Drawer Button */}
          <button
            type="button"
            id="discover-mobile-filter-button"
            onClick={onOpenMobileFilters}
            className="sm:hidden inline-flex items-center gap-2 h-10 px-3.5 rounded-xl text-xs font-semibold bg-secondary hover:bg-zinc-800 border border-border text-zinc-200 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{t("filters.button")}</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Reset Action (desktop quick icon) */}
          {hasAnyFilter && (
            <button
              type="button"
              onClick={resetFilters}
              title={t("filters.resetFilters")}
              aria-label={t("filters.resetFilters")}
              className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t("filters.reset")}</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-secondary/80 border border-border/50">
            <button
              type="button"
              id="view-mode-grid"
              onClick={() => setViewMode("grid")}
              aria-label={t("filters.viewGrid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="view-mode-list"
              onClick={() => setViewMode("list")}
              aria-label={t("filters.viewList")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Desktop Filters Panel */}
      {isFilterOpen && (
        <div className="hidden sm:flex flex-col gap-5 p-5 rounded-2xl bg-zinc-900/90 border border-border/80 shadow-md animate-accordion-down">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Gender Filter */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {t("filters.genderPreference")}
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-secondary/70 border border-border/60">
                <button
                  type="button"
                  id="gender-filter-all"
                  onClick={() => setGender(undefined)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    gender === undefined
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                  }`}
                >
                  {t("filters.allGenders")}
                </button>
                <button
                  type="button"
                  id="gender-filter-female"
                  onClick={() => setGender(Gender.FEMALE)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    gender === Gender.FEMALE
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                  }`}
                >
                  {t("filters.female")}
                </button>
                <button
                  type="button"
                  id="gender-filter-male"
                  onClick={() => setGender(Gender.MALE)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    gender === Gender.MALE
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                  }`}
                >
                  {t("filters.male")}
                </button>
              </div>
            </div>

            {/* Age Range Filter */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {t("filters.ageRange")}
                </label>
                <span className="text-xs font-semibold text-primary">
                  {t("filters.years", {
                    min: sliderValues[0],
                    max: sliderValues[1],
                  })}
                </span>
              </div>

              {/* Slider */}
              <div className="pt-2 px-1">
                <Slider
                  min={18}
                  max={100}
                  step={1}
                  value={sliderValues}
                  onValueChange={handleSliderChange}
                  onValueCommit={handleSliderCommit}
                  className="w-full"
                />
              </div>

              {/* Manual numeric inputs */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500 font-medium">
                    {t("filters.min")}
                  </span>
                  <input
                    type="number"
                    min={18}
                    max={100}
                    value={sliderValues[0]}
                    onChange={handleMinInputChange}
                    className="w-16 h-8 px-2 rounded-lg bg-secondary text-xs text-center text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <span className="text-zinc-600">—</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500 font-medium">
                    {t("filters.max")}
                  </span>
                  <input
                    type="number"
                    min={18}
                    max={100}
                    value={sliderValues[1]}
                    onChange={handleMaxInputChange}
                    className="w-16 h-8 px-2 rounded-lg bg-secondary text-xs text-center text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Validation Warning */}
              {!validation.isValid && (
                <div className="flex items-center gap-1.5 text-xs text-destructive mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{validation.error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Panel Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border/40">
            <span className="text-xs text-zinc-500">
              {t("filters.filtersNotice")}
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-secondary transition-colors"
            >
              {t("filters.resetFilters")}
            </button>
          </div>
        </div>
      )}

      {/* Active Filter Chips & Results Count Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {/* Chips */}
        <div className="flex items-center gap-2 flex-wrap min-h-7">
          {hasGenderFilter && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-200 border border-zinc-700/60">
              <span>
                {t("filters.chipGender", {
                  gender:
                    gender === Gender.MALE
                      ? t("filters.male")
                      : t("filters.female"),
                })}
              </span>
              <button
                type="button"
                onClick={() => removeFilter("gender")}
                aria-label="Remove gender filter"
                className="hover:text-primary transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {hasAgeFilter && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-200 border border-zinc-700/60">
              <span>{t("filters.chipAge", { min: ageMin, max: ageMax })}</span>
              <button
                type="button"
                onClick={() => removeFilter("age")}
                aria-label="Remove age filter"
                className="hover:text-primary transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {clientSearch && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
              <span>{t("filters.chipSearch", { query: clientSearch })}</span>
              <button
                type="button"
                onClick={() => setClientSearch("")}
                aria-label="Clear local search filter"
                className="hover:text-primary transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {hasAnyFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2 ml-1"
            >
              {t("filters.clearAll")}
            </button>
          )}
        </div>

        {/* Results Counter */}
        <div className="text-xs text-muted-foreground ml-auto">
          {filteredCount !== undefined && clientSearch ? (
            <span>
              {t("filters.matchingLoaded", {
                filtered: filteredCount,
                total: totalResults,
              })}
            </span>
          ) : (
            <span>
              {t("filters.availableProfiles", { count: totalResults })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
