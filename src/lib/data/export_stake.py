import json
import csv
import os

def export_stakes_csv(json_path: str) -> None:
    """
    Reads pools data from json_path and writes out a CSV
    where each line is the pool's active_stake value (excluding pools with 0 stake).
    The output filename is based on the number of pools (agents) with nonzero stake.
    """
    # Load the JSON
    with open(json_path, 'r') as jf:
        pools = json.load(jf)

    stakes = []
    for pool in pools:
        stake = pool.get('active_stake')
        if stake and stake != 0:
            stakes.append([stake])

    num_agents = len(stakes)

    filename = f"synthetic-stake-distribution-{num_agents}-agents.csv"
    csv_path = os.path.join(os.path.dirname(json_path), filename)

    # Ensure output directory exists
    os.makedirs(os.path.dirname(csv_path), exist_ok=True)

    # Write the CSV
    with open(csv_path, 'w', newline='') as cf:
        writer = csv.writer(cf)
        writer.writerows(stakes)

    print(f"Exported {num_agents} stakes to {csv_path!r}")

if __name__ == "__main__":
    # Adjust path if you run this from a different CWD
    JSON_FILE = os.path.join(os.path.dirname(__file__), 'pools.json')
    export_stakes_csv(JSON_FILE)