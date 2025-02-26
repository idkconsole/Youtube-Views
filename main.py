import webbrowser
import os
import time
import subprocess

if __name__ == "__main__":
    port = 8000
    website_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Website')
    server_process = subprocess.Popen(['python', '-m', 'http.server', str(port)], cwd=website_dir)
    time.sleep(1)
    webbrowser.open(f"http://localhost:{port}")
    try:
        server_process.wait()
    except KeyboardInterrupt:
        server_process.terminate()