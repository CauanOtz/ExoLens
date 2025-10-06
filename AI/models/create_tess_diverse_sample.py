#!/usr/bin/env python3
"""Create a stratified diverse TESS sample of 100 unique TICs.

Saves the result to: AI/pipelines/pipeline_tess/input/tess_targets_100_diverse.csv

This script is defensive: it checks for expected columns and prints helpful messages
if the source file or required columns are missing.
"""
import os
import sys
import math
import numpy as np
import pandas as pd
import requests


RAW_PATH = os.path.join("AI", "data_acquisition", "raw_data", "tess_toi_data.csv")
OUT_DIR = os.path.join("AI", "pipelines", "pipeline_tess", "input")
OUT_PATH = os.path.join(OUT_DIR, "tess_targets_100_diverse.csv")


def find_column(df, candidates):
    for c in candidates:
        if c in df.columns:
            return c
    return None


def make_bins(df):
    # period bins
    per = df["pl_orbper"]
    period_bin = pd.cut(per, bins=[-np.inf, 10, 50, np.inf], labels=["Curto", "Médio", "Longo"])
    df["period_bin"] = period_bin

    # radius bins
    rad = df["pl_rade"]
    radius_bin = pd.cut(rad, bins=[-np.inf, 2, 6, np.inf], labels=["Pequeno", "Médio", "Grande"])
    df["radius_bin"] = radius_bin


def stratified_sample(df, n_targets=100, random_state=None):
    rng = np.random.default_rng(random_state)

    groups = df.groupby(["period_bin", "radius_bin"])
    # list only non-empty groups
    group_keys = [k for k, g in groups if len(g) > 0]
    if not group_keys:
        return []

    n_groups = len(group_keys)
    # initial per-group target (rounded). Keep it reasonable and cap to 15 to avoid huge samples per group
    per_group = max(1, int(round(n_targets / n_groups)))
    per_group = min(per_group, 15)

    selected = []
    selected_set = set()
    remaining = n_targets

    # randomized order of groups to avoid bias
    rng_perm = rng.permutation(n_groups)
    keys_shuffled = [group_keys[i] for i in rng_perm]

    # First pass: sample up to per_group for each group
    for key in keys_shuffled:
        if remaining <= 0:
            break
        group_df = groups.get_group(key)
        unique_tics = group_df["tic_id"].dropna().unique()
        avail = [int(x) for x in unique_tics]
        if not avail:
            continue
        take = min(len(avail), per_group, remaining)
        pick = list(rng.choice(avail, size=take, replace=False))
        for t in pick:
            if t not in selected_set:
                selected.append(t)
                selected_set.add(t)
        remaining = n_targets - len(selected)

    # Second pass: if still need more, try to take one-by-one from groups with remaining members
    if remaining > 0:
        for key in keys_shuffled:
            if remaining <= 0:
                break
            group_df = groups.get_group(key)
            unique_tics = [int(x) for x in group_df["tic_id"].dropna().unique()]
            # available ones not yet selected
            avail = [t for t in unique_tics if t not in selected_set]
            if not avail:
                continue
            # take as many as needed from this group but at most what's available
            take = min(len(avail), remaining)
            pick = list(rng.choice(avail, size=take, replace=False))
            for t in pick:
                if t not in selected_set:
                    selected.append(t)
                    selected_set.add(t)
            remaining = n_targets - len(selected)

    return selected


def main():
    # If the raw CSV is not present, try to fetch TOI table from NASA Exoplanet Archive via TAP
    if not os.path.exists(RAW_PATH):
        print(f"Source file not found: {RAW_PATH}")
        print("Attempting to download TOI table from NASA Exoplanet Archive...")
        try:
            os.makedirs(os.path.dirname(RAW_PATH), exist_ok=True)
            # TAP sync query for TOI table in CSV format
            tap_url = (
                "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+*+from+toi&format=csv"
            )
            resp = requests.get(tap_url, timeout=120)
            resp.raise_for_status()
            with open(RAW_PATH, "wb") as f:
                f.write(resp.content)
            print(f"Downloaded TOI table to: {RAW_PATH}")
        except Exception as e:
            print(f"Failed to download TOI table: {e}")
            sys.exit(1)

    df = pd.read_csv(RAW_PATH)

    # check for required columns
    # the TOI table uses 'tid' for the TIC identifier in many exports; include it as a candidate
    tic_col = find_column(df, ["tic_id", "TIC", "tic", "tid"]) 
    if tic_col is None:
        print("Could not find a TIC id column (looked for tic_id/TIC/tic/tid)")
        sys.exit(1)
    # normalize column name
    df = df.rename(columns={tic_col: "tic_id"})

    # check period and radius
    if "pl_orbper" not in df.columns or "pl_rade" not in df.columns:
        print("Source table must contain 'pl_orbper' and 'pl_rade' columns")
        sys.exit(1)

    # drop rows missing the numeric values
    df = df.dropna(subset=["pl_orbper", "pl_rade"]).copy()

    # create bins
    make_bins(df)

    # remove rows with NaN bins (shouldn't happen after dropna but be safe)
    df = df.dropna(subset=["period_bin", "radius_bin"]).copy()

    # ensure tic_id is integer-like
    try:
        df["tic_id"] = df["tic_id"].astype(int)
    except Exception:
        # attempt safe conversion
        df["tic_id"] = pd.to_numeric(df["tic_id"], errors="coerce").dropna().astype(int)

    selected_tics = stratified_sample(df, n_targets=100, random_state=42)

    if not selected_tics:
        print("No TICs selected (no valid groups). Exiting.")
        sys.exit(1)

    if len(selected_tics) < 100:
        print(f"Warning: only {len(selected_tics)} unique TICs could be selected (less than 100).")

    # filter original (cleaned) df for selected TICs
    final_df = df[df["tic_id"].isin(selected_tics)].copy()

    # find sector column: prefer 'sector_run' or 'sec' or 'sector'
    sector_col = find_column(final_df, ["sector_run", "sec", "sector"]) 
    if sector_col is None:
        # if none found, create a placeholder column filled with NaN
        final_df["sector_run"] = pd.NA
    else:
        if sector_col != "sector_run":
            final_df = final_df.rename(columns={sector_col: "sector_run"})

    out_df = final_df[["tic_id", "sector_run"]].drop_duplicates(subset=["tic_id"]).reset_index(drop=True)

    os.makedirs(OUT_DIR, exist_ok=True)
    out_df.to_csv(OUT_PATH, index=False)

    # print counts per stratum
    counts = final_df.groupby(["period_bin", "radius_bin"]) ["tic_id"].nunique().reset_index()
    print(f"Created sample at: {OUT_PATH}")
    total = out_df["tic_id"].nunique()
    print(f"Total unique TICs in sample: {total}")
    for _, row in counts.iterrows():
        p = row["period_bin"]
        r = row["radius_bin"]
        c = int(row["tic_id"]) if not pd.isna(row["tic_id"]) else 0
        print(f"Grupo {p}/{r}: {c} alvos")


if __name__ == "__main__":
    main()
