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

def _convert_pool_values(pool_dict: dict) -> dict:
    """Converts pledge and active_stake from lovelace to ADA in a pool dictionary."""
    # Convert 'pledge'
    pledge_val = pool_dict.get("pledge")
    if pledge_val is not None:
        try:
            pool_dict["pledge"] = int(int(pledge_val) / 1_000_000)
        except (ValueError, TypeError):
            # If conversion fails, print a warning but leave the value as is
            print(f"Warning: Could not convert pledge '{pledge_val}' for pool {pool_dict.get('pool_id_bech32', 'N/A')}")
            pass

    # Convert 'active_stake' (handles both 'stake' and 'active_stake' keys)
    # The Koios API uses 'active_stake', but 'stake' might exist from other sources like backup.
    for stake_key in ("stake", "active_stake"):
        if stake_key in pool_dict: # Process only if the key exists
            stake_val = pool_dict.get(stake_key)
            if stake_val is not None:
                try:
                    pool_dict[stake_key] = int(int(stake_val) / 1_000_000)
                except (ValueError, TypeError):
                    print(f"Warning: Could not convert {stake_key} '{stake_val}' for pool {pool_dict.get('pool_id_bech32', 'N/A')}")
                    pass
    return pool_dict

def assign_pool_groups(pools_data: list) -> list:
    """
    Assigns a 'group' to each pool based on its 'pool_id_bech32' by matching
    with 'pool_hash' from an external data source.
    If the Koios ticker is null, it attempts to use the ticker from the external source.
    Converts 'pledge' and 'active_stake' fields from lovelace to ADA.
    Group assignment logic:
    - If external data's 'pool_group' is "SINGLEPOOL", assigns "sSPO".
    - Otherwise (for any other 'pool_group' value from external data), assigns "MPO".
    - If no match in external data, or external data unavailable/malformed, assigns "sSPO".
    Pools without a 'pool_id_bech32' are skipped from the final list.
    """
    
    # Stores {api_pool_hash: {"group_name": api_pool_group, "ticker_from_api": api_pool_ticker}}
    external_data_by_pool_hash = {} 
    
    try:
        response = requests.get("https://www.balanceanalytics.io/api/groupdata.json")
        response.raise_for_status() 
        api_response_data = response.json()
        
        if (isinstance(api_response_data, list) and 
            len(api_response_data) > 0 and
            isinstance(api_response_data[0], dict) and
            "pool_group_json" in api_response_data[0] and
            isinstance(api_response_data[0]["pool_group_json"], list)):
            
            group_data_items = api_response_data[0]["pool_group_json"]
            for item in group_data_items:
                hash_from_api = item.get("pool_hash")
                pool_group_value_from_api = item.get("pool_group")
                ticker_from_api = item.get("pool_ticker") # Get ticker from external API
                
                if hash_from_api and pool_group_value_from_api is not None:
                    if hash_from_api in external_data_by_pool_hash:
                        print(f"DEBUG: Duplicate pool_hash '{hash_from_api}' in external data. Existing: '{external_data_by_pool_hash[hash_from_api]}', New group: '{pool_group_value_from_api}', New ticker: '{ticker_from_api}'. Using the new (last encountered) values.")
                    external_data_by_pool_hash[hash_from_api] = {
                        "group_name": pool_group_value_from_api,
                        "ticker_from_api": ticker_from_api
                    }
        else:
            print("Warning: External group data from API is not in the expected format. Defaulting groups to 'sSPO' and not updating tickers from external source.")

    except requests.exceptions.RequestException as e:
        print(f"Error fetching external group data from API: {e}. Defaulting groups to 'sSPO' and not updating tickers from external source.")
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from external group data API: {e}. Defaulting groups to 'sSPO' and not updating tickers from external source.")

    updated_pools = []
    for original_pool_item in pools_data:
        pool = original_pool_item.copy()
        pool = _convert_pool_values(pool)

        pool_id_bech32 = pool.get("pool_id_bech32")

        if pool_id_bech32 is None:
            print(f"Warning: Pool data item missing 'pool_id_bech32'. Skipping item: {pool}")
            continue

        assigned_group = "sSPO" 
        current_koios_ticker = pool.get("ticker")

        if pool_id_bech32 in external_data_by_pool_hash:
            external_info = external_data_by_pool_hash[pool_id_bech32]
            external_group_name = external_info["group_name"]
            
            if external_group_name == "SINGLEPOOL":
                assigned_group = "sSPO"
            else: 
                assigned_group = "MPO"
            
            # If Koios ticker is None, and external ticker is available, use it.
            if current_koios_ticker is None:
                ticker_from_external_api = external_info.get("ticker_from_api")
                if ticker_from_external_api is not None:
                    pool["ticker"] = ticker_from_external_api
                    # print(f"DEBUG: Pool {pool_id_bech32} had null ticker from Koios. Using ticker '{ticker_from_external_api}' from Balance Analytics.")
        
        pool["group"] = assigned_group
        updated_pools.append(pool)
            
    return updated_pools

def manual_fixes(pools_with_groups):
    """
    Iterate through pools_with_groups to make manual fixes.
    """
    for pool in pools_with_groups:
        if pool.get("ticker") is None:
            pool_id = pool.get("pool_id_bech32")
            if pool_id == "pool1ktkhv4sw2y68d4xgfg9sjw829kejnvnh5zajq6g7jycry6cd7h5":
                pool["ticker"] = "EMPL"
            elif pool_id == "pool1a6wdglfp93m2z4nhptx9xhjazgyqusjpu387gdrp899cj98yuqq":
                pool["ticker"] = "HYVEN"
            elif pool_id == "pool1mgkn6k5esursgcwyvhxy7guhnx8cdwjjcfmz2t5hve5n7shtphl":
                pool["ticker"] = "NIGHT"
            elif pool_id == "pool1j045vdrzmj3hl36p50c6mhhpwtu2q7cmecnrqjuqq0khja02sr0":
                pool["ticker"] = "BNB"
            elif pool_id is not None:
                pool["ticker"] = "private" + pool_id[-4:]
            
        if pool.get("ticker") == "GMO2":
            pool["group"] = "MPO"
    return pools_with_groups

if __name__ == "__main__":
    pools = get_all_pools()
    pools_with_groups = assign_pool_groups(pools)
    pools_with_groups = manual_fixes(pools_with_groups)
    # Save to JSON file
    with open("pools.json", "w") as f:
        json.dump(pools_with_groups, f, indent=2)
    print(f"Saved {len(pools_with_groups)} pools with group assignments to pools.json")
