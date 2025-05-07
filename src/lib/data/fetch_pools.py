import requests
import json

# Base endpoint for fetching pool list
BASE_URL = "https://api.koios.rest/api/v1/pool_list"

# Fields to retrieve for each pool
FIELDS = ["pool_id_bech32", "ticker", "pledge", "active_stake"]

def fetch_pools(offset=0, limit=1000):
    """
    Fetch a single page of pools from Koios API.
    """
    params = {
        "select": ",".join(FIELDS),
        "offset": offset,
        "limit": limit,
    }
    response = requests.get(BASE_URL, params=params)
    response.raise_for_status()  # Stop on any HTTP error
    return response.json()

def get_all_pools():
    """
    Retrieve all pools by iterating through paginated results.
    """
    offset = 0
    limit = 1000
    all_pools = []

    while True:
        batch = fetch_pools(offset=offset, limit=limit)
        if not batch:
            break
        # Only include pools that are not retired and have a non-null active_stake
        for pool in batch:
            # If 'pool_status' is present and is 'retired', skip
            if pool.get("pool_status") == "retired":
                continue
            # If 'active_stake' is missing or None/null, skip
            if pool.get("active_stake") is None:
                continue
            all_pools.append(pool)
        offset += limit

    return all_pools

def assign_pool_groups(pools_data):
    """
    Assigns a 'group' to each pool based on its ticker by matching
    with 'label' from an external data source.
    Also converts 'pledge' and 'stake' fields from lovelace to ADA (divides by 1_000_000).
    Ensures every pool has a 'group' field.
    """
    try:
        response = requests.get("https://www.balanceanalytics.io/api/mavdata.json")
        response.raise_for_status()
        mav_data = response.json()
        mav_data = mav_data["api_data"] 
    except requests.exceptions.RequestException as e:
        print(f"Error fetching MAV data: {e}")
        # Even if MAV data can't be fetched, ensure every pool has a 'group'
        updated_pools = []
        for pool in pools_data:
            # Convert 'pledge' from lovelace to ADA as int if present and is a string or int
            pledge_val = pool.get("pledge")
            if pledge_val is not None:
                try:
                    pool["pledge"] = int(int(pledge_val) / 1_000_000)
                except (ValueError, TypeError):
                    pass  # Leave as is if not convertible

            # Convert 'stake' or 'active_stake' from lovelace to ADA as int if present and is a string or int
            for stake_key in ("stake", "active_stake"):
                stake_val = pool.get(stake_key)
                if stake_val is not None:
                    try:
                        pool[stake_key] = int(int(stake_val) / 1_000_000)
                    except (ValueError, TypeError):
                        pass  # Leave as is if not convertible

            # Always assign a group, fallback to "sSPO"
            pool["group"] = pool.get("group", "sSPO")
            updated_pools.append(pool)
        return updated_pools

    mav_map = {item["label"]: item["class"] for item in mav_data}
    
    updated_pools = []
    for pool in pools_data:
        # Convert 'pledge' from lovelace to ADA as int if present and is a string or int
        pledge_val = pool.get("pledge")
        if pledge_val is not None:
            try:
                pool["pledge"] = int(int(pledge_val) / 1_000_000)
            except (ValueError, TypeError):
                pass  # Leave as is if not convertible

        # Convert 'stake' or 'active_stake' from lovelace to ADA as int if present and is a string or int
        for stake_key in ("stake", "active_stake"):
            stake_val = pool.get(stake_key)
            if stake_val is not None:
                try:
                    pool[stake_key] = int(int(stake_val) / 1_000_000)
                except (ValueError, TypeError):
                    pass  # Leave as is if not convertible

        ticker = pool.get("ticker")
        if ticker is None:
            continue

        matched_count = 0
        assigned_group = None

        # Check for direct match in the pre-processed map
        if ticker in mav_map:
            assigned_group = mav_map[ticker]
            matched_count = 1
            # Check if this ticker might appear more than once in the raw mav_data (edge case for non-unique labels)
            if sum(1 for item in mav_data if item["label"] == ticker) > 1:
                 print(f"DEBUG: Ticker '{ticker}' (Pool ID: {pool.get('pool_id_bech32')}) matched more than once in MAV data. Using the first match.")

        if matched_count == 1:
            pool["group"] = assigned_group
        else:
            pool["group"] = "sSPO"

        updated_pools.append(pool)
    
    return updated_pools

def reconcile_groups_with_backup(pools_with_groups):
    """
    If a ticker is found in pools_BACKUP.json, all pools with that ticker
    from pools_with_groups are removed. Then, all pools with that ticker
    from pools_BACKUP.json are added (with 'group' normalized,
    'name' field renamed to 'pool_id_bech32', and 'stake' renamed to 'active_stake').
    Pools from pools_with_groups with tickers not in backup are kept.
    """
    with open("pools_BACKUP.json", "r") as f:
        backup_pools_raw = json.load(f)

    # Create a list of backup pools with transformations applied,
    # and a set of unique tickers present in the backup file.
    backup_pools_processed = []
    backup_tickers_present_in_backup_file = set()

    for bp_data in backup_pools_raw:
        # Make a copy to avoid modifying the original list items
        bp_copy = bp_data.copy()
        
        # Normalize "Single Pool" to "sSPO"
        if bp_copy.get("group") == "Single Pool":
            bp_copy["group"] = "sSPO"
        
        # If "name" field exists, rename it to "pool_id_bech32"
        if "name" in bp_copy:
            bp_copy["pool_id_bech32"] = bp_copy.pop("name")
        
        # If "stake" field exists, rename it to "active_stake"
        if "stake" in bp_copy:
            bp_copy["active_stake"] = bp_copy.pop("stake")
            
        backup_pools_processed.append(bp_copy)
        
        # Collect unique tickers from the backup file
        if bp_copy.get("ticker"):
            backup_tickers_present_in_backup_file.add(bp_copy.get("ticker"))

    # Initialize the final list of pools.
    # Start with pools from pools_with_groups whose tickers are NOT in the backup file.
    final_pools_list = [
        pool for pool in pools_with_groups 
        if pool.get("ticker") not in backup_tickers_present_in_backup_file
    ]

    # Now, add all pools from the processed backup list that correspond to
    # the tickers we identified as being present in the backup file.
    for bp_processed in backup_pools_processed:
        if bp_processed.get("ticker") in backup_tickers_present_in_backup_file:
            final_pools_list.append(bp_processed)

    # Manual correction loop.  I hate this.
    mpo_tickers = {"LQWD", "GMO1", "GMO2", "IOG1"}
    for pool in final_pools_list:
        if pool.get("ticker") in mpo_tickers:
            pool["group"] = "MPO"
            
    return final_pools_list

if __name__ == "__main__":
    pools = get_all_pools()
    pools_with_groups = assign_pool_groups(pools)
    pools_with_groups = reconcile_groups_with_backup(pools_with_groups)
    # Save to JSON file
    with open("pools.json", "w") as f:
        json.dump(pools_with_groups, f, indent=2)
    print(f"Saved {len(pools_with_groups)} pools with group assignments to pools.json")
