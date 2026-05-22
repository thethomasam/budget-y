import os
import yaml
from pathlib import Path

config_path = Path(__file__).parent.parent / "config.yaml"
with open(config_path, "r") as f:
    config = yaml.safe_load(f)

# Allow env var overrides so each service can run on a separate host
if "REDIS_URL" in os.environ:
    config["redis"]["url"] = os.environ["REDIS_URL"]
if "OLLAMA_URL" in os.environ:
    config["llm"]["url"] = os.environ["OLLAMA_URL"]

REDIS_URL = config["redis"]["url"]
