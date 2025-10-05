#!/usr/bin/env python3
"""
Orchestrator to run Kepler processing using the cloned ExoMiner repository.

This copy is placed under AI/pipelines/pipeline_kepler/run_kepler_process.py in the reorganized project.

Usage example (run from project root `ExoLens`):
	python AI/pipelines/pipeline_kepler/run_kepler_process.py --input AI/pipelines/pipeline_kepler/input/kepler_tce_table.csv --output AI/pipelines/pipeline_kepler/output

This script will:
 - create /app/lightcurves and /app/tfrecords and the specified output directory
 - read the input CSV, extract unique kepids and try to download Kepler lightcurves using lightkurve
 - write a /app/kepler_config.yaml configured for Kepler preprocessing
 - call ExoMiner's generate_input_records.py to produce TFRecords (when not using --stub-run)
 - call ExoMiner's prediction entrypoint to generate a CSV of predictions into the --output folder (when not using --stub-run)

Notes:
 - The ExoMiner repository location is now fixed relative to this script: ../../_source_repos/ExoMiner/
 - lightkurve and its dependencies must be available in the environment for downloads to work.
"""

import argparse
import os
import sys
import subprocess
from pathlib import Path
import pandas as pd
import time
import shutil
import glob

try:
	import lightkurve as lk
except Exception:
	lk = None


def prepare_directories(app_lightcurves: Path, app_tfrecords: Path, output_dir: Path):
	for d in (app_lightcurves, app_tfrecords, output_dir):
		if not d.exists():
			print(f"Creating directory: {d}")
			d.mkdir(parents=True, exist_ok=True)
		else:
			print(f"Directory already exists: {d}")


def download_kepler_lightcurves(kepids, download_dir: Path):
	if lk is None:
		print("lightkurve not available in the environment. Skipping downloads. Install lightkurve to enable downloads.")
		return

	for i, k in enumerate(kepids, start=1):
		try:
			k_int = int(k)
		except Exception:
			print(f"Skipping invalid kepid: {k}")
			continue

		print(f"[{i}/{len(kepids)}] Searching lightcurves for KEPID {k_int}...")

		tried_names = [f'kplr{int(k_int):09d}', f'KIC {k_int}', str(k_int)]
		search_results = None
		for name in tried_names:
			try:
				search_results = lk.search_lightcurvefile(name, mission='Kepler')
			except Exception:
				search_results = None
			if search_results is not None and len(search_results) > 0:
				print(f"  Found {len(search_results)} items for '{name}'")
				break

		if search_results is None or len(search_results) == 0:
			print(f"  No lightcurves found for kepid {k_int} with tried names {tried_names}.")
			continue

		# download all matching files into a subfolder for this kepid
		dest = download_dir / f"kplr{k_int:09d}"
		dest.mkdir(parents=True, exist_ok=True)
		try:
			print(f"  Downloading to {dest} ...")
			# lightkurve's download_all returns a list of LocalPath objects
			search_results.download_all(download_dir=str(dest))
			print(f"  Download complete for {k_int}.")
		except Exception as e:
			print(f"  Failed to download for {k_int}: {e}")

		# short pause to not overload MAST
		time.sleep(1)


def write_kepler_yaml(config_fp: Path, input_csv: str):
	# Multi-line YAML content tuned for Kepler
	yaml_content = f"""
# Auto-generated config for Kepler preprocessing
output_dir: /app/tfrecords
input_tce_csv_file: {input_csv}
lc_data_dir: /app/lightcurves
using_exominer_pipeline: false
using_mpi: false
process_i: -1
n_shards: 10
n_processes: 4
random_seed: 24
ffi_data: false
shuffle: false
satellite: kepler
plot_figures: false
num_bins_glob: 301
num_bins_loc: 31
bin_width_factor_loc: 0.16
num_durations: 2.5
impute_missing_values: true
# prefer spline detrending for Kepler
detrending_method: 'spline'
quarter_sampling: true
# additional default params
plot_prob: 0.001
num_examples_per_tce: 1
augmentation: false
"""
	config_fp.write_text(yaml_content)
	print(f"Wrote kepler config to {config_fp}")


def run_preprocessing(exominer_dir: Path, config_fp: Path):
	gen_script = exominer_dir / 'src_preprocessing' / 'lc_preprocessing' / 'generate_input_records.py'
	if not gen_script.exists():
		raise FileNotFoundError(f'Preprocessing script not found: {gen_script}')

	cmd = [sys.executable, str(gen_script), '--config_fp', str(config_fp)]
	print(f"Running preprocessing: {' '.join(cmd)}")
	# Ensure ExoMiner repo is on PYTHONPATH so internal imports like src_preprocessing work
	env = os.environ.copy()
	prev_py = env.get('PYTHONPATH', '')
	env['PYTHONPATH'] = str(exominer_dir) + (os.pathsep + prev_py if prev_py else '')
	subprocess.run(cmd, check=True, cwd=str(exominer_dir), env=env)


def run_prediction(exominer_dir: Path, tfrecord_glob: str, model_dir: Path, output_predictions_fp: Path):
	# We follow the user's assumption that ExoMiner has src/main.py accepting these flags
	main_script = exominer_dir / 'src' / 'main.py'
	if not main_script.exists():
		print(f"Warning: prediction entrypoint not found at {main_script}. Attempting to continue with assumed command.")

	cmd = f"{sys.executable} {str(main_script)} --mode=predict --model_dir={str(model_dir)} --input_records={tfrecord_glob} --output_predictions={str(output_predictions_fp)}"
	print(f"Running prediction (shell): {cmd}")
	env = os.environ.copy()
	prev_py = env.get('PYTHONPATH', '')
	env['PYTHONPATH'] = str(exominer_dir) + (os.pathsep + prev_py if prev_py else '')
	# Use shell=True to allow glob expansion; run in ExoMiner cwd so relative imports/resources resolve
	subprocess.run(cmd, shell=True, check=True, cwd=str(exominer_dir), env=env)


def main():
	parser = argparse.ArgumentParser(description='Run Kepler processing using local ExoMiner clone')
	parser.add_argument('--input', required=True, help='Path to input Kepler TCE CSV (e.g. /app/input/kepler_tce_table.csv)')
	parser.add_argument('--output', required=True, help='Path to output directory where final CSV will be saved (e.g. /app/output)')
	parser.add_argument('--max-kepids', type=int, required=False, help='If set, process only the first N unique kepids from the input CSV')
	parser.add_argument('--stub-run', action='store_true', help='If set, skip preprocessing/prediction and produce a fake predictions CSV')
	args = parser.parse_args()

	input_csv = Path(args.input)
	output_dir = Path(args.output)

	# Try to be forgiving with input path resolution across platforms.
	def resolve_input_path(p: Path) -> Path:
		# If path exists as given, return it
		if p.exists():
			return p
		# Try resolve (may raise) and check
		try:
			rp = p.resolve()
			if rp.exists():
				return rp
		except Exception:
			pass
		# Try joining with current working directory
		cw = Path.cwd() / p
		if cw.exists():
			return cw
		# Try replacing forward/back slashes variations
		alt = Path(str(p).replace('/', '\\'))
		if alt.exists():
			return alt
		alt2 = Path(str(p).replace('\\', '/'))
		if alt2.exists():
			return alt2
		# Finally, try to search for the basename under the repository root
		name = p.name
		matches = list(Path.cwd().rglob(name))
		if len(matches) == 1:
			print(f"Found input CSV by search at: {matches[0]}")
			return matches[0]
		elif len(matches) > 1:
			print(f"Multiple matches found for {name}; using the first: {matches[0]}")
			return matches[0]
		return p

	input_csv = resolve_input_path(input_csv)

	# Prepare in-container directories
	app_lightcurves = Path('/app/lightcurves')
	app_tfrecords = Path('/app/tfrecords')
	prepare_directories(app_lightcurves, app_tfrecords, output_dir)

	# Read input CSV and get unique kepids
	if not input_csv.exists():
		print(f"Input CSV not found: {input_csv}")
		sys.exit(1)

	# The Kepler TCE CSVs often contain leading comment lines starting with '#'.
	# Tell pandas to treat lines starting with '#' as comments so the header row
	# is parsed correctly and we avoid tokenization errors.
	df = pd.read_csv(str(input_csv), comment='#')
	if 'kepid' in df.columns:
		kepids = sorted(df['kepid'].dropna().unique().tolist())
	elif 'target_id' in df.columns:
		kepids = sorted(df['target_id'].dropna().unique().tolist())
	else:
		print("Input CSV does not contain 'kepid' or 'target_id' columns. Provide a valid Kepler TCE table.")
		sys.exit(1)

	# Apply max-kepids truncation if requested
	if args.max_kepids is not None and args.max_kepids > 0:
		kepids = kepids[: args.max_kepids]

	print(f"Found {len(kepids)} unique kepids in the input CSV (after truncation if applied).")

	# Download lightcurves
	download_kepler_lightcurves(kepids, app_lightcurves)

	# Generate YAML config file for Kepler preprocessing
	config_fp = Path('/app/kepler_config.yaml')
	write_kepler_yaml(config_fp, str(input_csv))

	# If stub-run is requested, produce a fake predictions CSV and exit after downloads/config
	if args.stub_run:
		import random
		import csv
		preds_fp = Path(output_dir) / 'kepler_predictions.csv'
		print(f"Stub run enabled: writing fake predictions to {preds_fp}")
		preds_fp.parent.mkdir(parents=True, exist_ok=True)
		with preds_fp.open('w', newline='') as csvfile:
			writer = csv.writer(csvfile)
			writer.writerow(['kepid', 'score'])
			for k in kepids:
				score = round(random.uniform(0.85, 0.99), 3)
				writer.writerow([k, score])
		print(f"Stub run complete. Wrote {len(kepids)} fake predictions to {preds_fp}")
		return

	# Inside the container both the orchestrator and the ExoMiner repo are copied
	# into /app. Use the simple relative path 'ExoMiner' which resolves to
	# /app/ExoMiner when the container's WORKDIR is /app.
	exominer_dir = Path('ExoMiner').resolve()
	if not exominer_dir.exists():
		print(f"Could not locate ExoMiner repository at expected in-container path: {exominer_dir}")
		sys.exit(1)
	print(f"Using ExoMiner repo at: {exominer_dir}")

	# Run preprocessing to create TFRecords
	try:
		run_preprocessing(exominer_dir, config_fp)
	except subprocess.CalledProcessError as e:
		print(f"Preprocessing failed with exit code {e.returncode}")
		sys.exit(e.returncode)
	except Exception as e:
		print(f"Preprocessing error: {e}")
		sys.exit(1)

	# Run inference/prediction
	model_dir = exominer_dir / 'models' / 'kepler_model'
	output_predictions_fp = Path(output_dir) / 'predictions_kepler.csv'
	tfrecord_glob = '/app/tfrecords/*.tfrecord'

	try:
		run_prediction(exominer_dir, tfrecord_glob, model_dir, output_predictions_fp)
	except subprocess.CalledProcessError as e:
		print(f"Prediction failed with exit code {e.returncode}")
		sys.exit(e.returncode)
	except Exception as e:
		print(f"Prediction error: {e}")
		sys.exit(1)

	print(f"Done. Final predictions saved to: {output_predictions_fp}")


if __name__ == '__main__':
	main()

