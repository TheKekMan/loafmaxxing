import os
import sys

def setup_and_download():
    print("[LoafRate AI] Checking and installing dependencies...")

    try:
        import huggingface_hub
    except ImportError:
        import subprocess
        print("[LoafRate AI] Installing huggingface_hub...")
        subprocess.check_call([
            sys.executable,
            "-m",
            "pip",
            "install",
            "huggingface-hub",
            "python-dotenv"
        ])
        import huggingface_hub

    try:
        from dotenv import load_dotenv
    except ImportError:
        import subprocess
        print("[LoafRate AI] Installing python-dotenv...")
        subprocess.check_call([
            sys.executable,
            "-m",
            "pip",
            "install",
            "python-dotenv"
        ])
        from dotenv import load_dotenv

    # Load .env file
    load_dotenv()

    # Read HuggingFace token from .env
    hf_token = os.environ.get("HF_TOKEN")

    if not hf_token:
        print(
            "\n[LoafRate AI] ERROR: HF_TOKEN not found in .env",
            file=sys.stderr
        )
        print("Add this to your .env:")
        print("HF_TOKEN=your_huggingface_token")
        sys.exit(1)

    # Read model config from environment
    model_id = os.environ.get(
        "LOAF_HF_MODEL_ID",
        "Qwen/Qwen3-VL-8B-Instruct"
    )

    # Determine local directory
    env_model_path = os.environ.get("LOAF_MODEL_PATH", "")

    if env_model_path and not env_model_path.startswith("/app"):
        local_dir = env_model_path
    else:
        slug = model_id.split("/")[-1].lower().replace("_", "-")
        current_dir = os.path.dirname(os.path.abspath(__file__))
        local_dir = os.path.join(current_dir, "models", slug)

    print(f"[LoafRate AI] Model     : {model_id}")
    print(f"[LoafRate AI] Target dir: {local_dir}")
    print("[LoafRate AI] Downloading model...")
    print("[LoafRate AI] This may take a while (~4-15 GB)...")

    try:
        huggingface_hub.snapshot_download(
            repo_id=model_id,
            local_dir=local_dir,
            token=hf_token,
            ignore_patterns=["*.pt", "*.bin"]  # Prefer safetensors
        )

        print(f"\n[LoafRate AI] SUCCESS: Model saved to: {local_dir}")

        print("\n[LoafRate AI] Add these to your .env:")
        print("LOAF_MODEL_TYPE=local")
        print(f"LOAF_MODEL_PATH={local_dir}")

    except Exception as e:
        print(
            f"\n[LoafRate AI] ERROR downloading model: {e}",
            file=sys.stderr
        )
        sys.exit(1)


if __name__ == "__main__":
    setup_and_download()