/** The default target depth for reachability reindexes. */
export const DEFAULT_REINDEX_DEPTH: bigint = 100n;

/** The default slack interval used by the reachability algorithm to encounter for blocks out of the selected chain. */
export const DEFAULT_REINDEX_SLACK: bigint = 1n << 14n;

const BASELINE_HEADER_DATA_CACHE_SIZE: bigint = 10000n;
const BASELINE_BLOCK_DATA_CACHE_SIZE: bigint = 200n;
const BASELINE_BLOCK_WINDOW_CACHE_SIZE: number = 2000;
const BASELINE_UTXOSET_CACHE_SIZE: number = 10000;

export interface PerfParams {
  /** Preferred cache size for header-related data */
  header_data_cache_size: bigint;
  /** Preferred cache size for block-body-related data */
  block_data_cache_size: bigint;
  /** Preferred cache size for UTXO-related data */
  utxo_set_cache_size: number;
  /** Preferred cache size for block-window-related data */
  block_window_cache_size: number;
  /** Number of threads for block processors */
  block_processors_num_threads: number;
  /** Number of threads for virtual processors */
  virtual_processor_num_threads: number;
}

const PERF_PARAMS: PerfParams = {
  header_data_cache_size: BASELINE_HEADER_DATA_CACHE_SIZE,
  block_data_cache_size: BASELINE_BLOCK_DATA_CACHE_SIZE,
  utxo_set_cache_size: BASELINE_UTXOSET_CACHE_SIZE,
  block_window_cache_size: BASELINE_BLOCK_WINDOW_CACHE_SIZE,
  block_processors_num_threads: 0,
  virtual_processor_num_threads: 0
};

export { PERF_PARAMS };
