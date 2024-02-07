## Install framing
- Open Ubuntu.
- Change to administrator mode and update Ubuntu packages.

```
sudo su
apt update
apt-get autoremove
apt-get autoclean
apt install curl git unzip -y
apt-get update && apt-get install -y llvm clang
# Use arrow keys and space bar to select all processes, tab button to 'Ok' and hit enter
sudo apt install python3-dev python3-pip
# >>> Y
```

Choose one of the following:
 - A) Clone the framing GitHub repo.
```bash
git clone https://github.com/iandavis1937/framing
```
- B) Download the framing GitHub repository .zip file to your local computer. Unpack the package. Then use a file manager like [FileZilla](https://filezilla-project.org/download.php?type=client) to move the /framing/ folder your directory of choice.

 ### Install Python Dependencies
-  Install Miniconda to manage Python packages. 
    - Note: there is a yes/no (with default no) after the 'Export;Cryptography' section of the Miniconda user agreement. Press Enter up to this header and then slow down.
    - You will need to choose an installation directory for miniconda3. The default is fine, just record it in case you need to add Miniconda to the path.
    - Additionally, framing was written to be used with Python 3.11.

```bash 
wget https://repo.anaconda.com/miniconda/Miniconda3-py311_23.11.2-0-Linux-x86_64.sh
bash Miniconda3-py311_23.11.2-0-Linux-x86_64.sh
# >>> yes
# >>> /home/<username>/miniconda3/   # This is an example, choose what is easiest for your system
# >>> yes
export PATH="/home/<username>/miniconda3/bin:$PATH"    # Again, change to match install directory
conda --version
conda update conda
# >>> y
```
- Create a conda environment for managing Python packages.
```bash
conda init bash
conda create --name <name of conda env> -c conda-forge python=3.11
# >>> y

# Ex.
conda init bash
conda create --name condaenv -c conda-forge python=3.11
# >>> y
```
- Restart your terminal and activate the conda environment.
```bash
conda activate <name of conda env>
~/miniconda3/envs/<env_name>/bin/python --version
~/miniconda3/envs/<env_name>/bin/pip --version
conda install pip   # Update pip if needed

# Ex.
sudo su
conda activate condaenv
~/miniconda3/envs/condaenv/bin/python --version
~/miniconda3/envs/condaenv/bin/pip --version
conda install pip   # Update pip if needed
```
 
- Navigate to /py/
```bash
cd <path>/framing/py
```
- Install PyTorch and related dependencies. 
	- Note: this is a large package which, during framing's development, has crashed EC2 servers during installation. The present tutorial's instructions for installing PyTorch have been carefully optimized for a low-memory AWS EC2 instance.
```bash
conda install numpy wheel packaging requests opt_einsum
conda install keras-preprocessing
conda install nltk pydantic jinja2 setuptools packaging
export TF_PYTHON_VERSION=3.11
conda install cmake ninja mkl mkl-include
conda install pytorch torchvision torchaudio cpuonly -c pytorch
conda install tokenizers transformers protobuf sentencepiece numpy requests pydantic jinja2 setuptools
conda install pyzmq nltk inflect spacy
~/miniconda3/envs/<env_name>/bin/pip install benepar    # Ex. ~/miniconda3/envs/condaenv/bin/pip install benepar
~/miniconda3/envs/<env_name>/bin/python -m spacy download en_core_web_sm     # Ex. ~/miniconda3/envs/condaenv/bin/python
```

Launch the Python script.
```bash
~/miniconda3/envs/<env_name>/bin/python app_7_24.py

# Ex.
~/miniconda3/envs/condaenv/bin/python app_7_24.py
```

### JS Dependencies 
- Open a new terminal.
- Navigate to framing/js/
```
cd  <your path>/framing/js
```
- Activate the miniconda environment.
- Delete any outdated version of Node (JS) and then install the latest version.

```
conda activate <env_name>
sudo apt-get purge nodejs
sudo rm -f /etc/apt/sources.list.d/nodesource.list
sudo apt-get autoremove
sudo apt-get autoclean
sudo apt-get update
curl -sL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
```

 - Install PM2 (the JS process manager).
 ```
 npm install pm2@latest -g
 ```
 - Install the required dependencies.
```
npm install
```
- Check the package configuration by launching the JS script and looking at the log.
 ```
 pm2 start js2_7.0.js
 pm2 logs js2_7.0.js
 ```

### Using the JS script:
-- Launch -- 
 ```bash
 pm2 start js2_7.0.js
 ```
-- Monitor via logs and process status -- 
```
# Logs
pm2 logs js2_7.0.js

# Process status
pm2 list

# Clear logs
pm2 flush
```
-- Quit -- 
```
pm2 stop all
```
