import os
import sys

def setup_and_download():
    print("[LoafRate AI] Checking and installing huggingface_hub...")
    try:
        import huggingface_hub
    except ImportError:
        import subprocess
        print("[LoafRate AI] Installing huggingface_hub...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "huggingface-hub"])
        import huggingface_hub

    # Read model config from environment (or fall back to defaults)
    model_id = os.environ.get("LOAF_HF_MODEL_ID", "Qwen/Qwen2-VL-2B-Instruct")

    # Determine local directory: prefer LOAF_MODEL_PATH from env, else use backend/models/<slug>
    env_model_path = os.environ.get("LOAF_MODEL_PATH", "")
    if env_model_path and not env_model_path.startswith("/app"):
        # Native run: use path from env directly
        local_dir = env_model_path
    else:
        # Fallback: download next to this script under models/<slug>
        slug = model_id.split("/")[-1].lower().replace("_", "-")
        current_dir = os.path.dirname(os.path.abspath(__file__))
        local_dir = os.path.join(current_dir, "models", slug)

    print(f"[LoafRate AI] Model     : {model_id}")
    print(f"[LoafRate AI] Target dir: {local_dir}")
    print("[LoafRate AI] Downloading — this may take a while (~4-15 GB depending on model)...")
    
    try:
        huggingface_hub.snapshot_download(
            repo_id=model_id,
            local_dir=local_dir,
            ignore_patterns=["*.pt", "*.bin"]  # Prefer safetensors to save bandwidth and storage
        )
        print(f"\n[LoafRate AI] SUCCESS: Model saved to: {local_dir}")
        print("[LoafRate AI] Set these in your .env to activate local inference:")
        print("  LOAF_MODEL_TYPE=local")
        print(f"  LOAF_MODEL_PATH={local_dir}")
    except Exception as e:
        print(f"\n[LoafRate AI] ERROR downloading model: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    setup_and_download()
