## Install framing
### Installation
- Open Terminal (can be found by searching in the system search bar). 
- Check that your terminal is ready for use by verifying your package manager is installed.


```bash
# Verify Homebrew is ready:
brew

# Install Homebrew if not ready
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
# >>> <password>
# Add Homebrew to your PATH in ~/.zprofile: copy the 2 commands suggested by Homebrew
# They look like these:
# echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
# eval "$(/opt/homebrew/bin/brew shellenv)"

brew doctor
brew update
brew cleanup
brew install wget
```


- Navigate to the folder where you would like to install framing.
```bash
# (Recommended location):
cd /usr/local/bin/
```

Choose one of the following:
 - A) Clone the GitHub repo.
```bash
git clone https://github.com/iandavis1937/framing
```
- B) Download the GitHub repository .zip file. Unpack the package in the directory open in your terminal.
 


### Install Dependencies
 #### Python Dependencies
- Navigate to /py/
```bash
cd /usr/local/bin/framing/py
```
-  If not already installed, install Miniconda to manage Python packages.
	- Check your system architecture under the Apple menu > About this Mac. Choose the corresponding Intel x86 or M1 installer [here](https://docs.conda.io/en/latest/miniconda.html).

```bash
export PATH="/<your>/<path>/miniconda3/bin:$PATH"
echo 'export PATH="/<your>/<path>/miniconda3/bin:$PATH"' >> ~/.bash_profile
conda --version
conda update conda

# Ex.
export PATH=" /Users/username/miniconda3/bin:$PATH"
echo 'export PATH=" /Users/username/miniconda3/bin:$PATH"' >> ~/.bash_profile
conda --version
conda update conda
```

- Create a conda environment for managing Python packages.

```bash
conda create --name <name_of_conda_env> python
conda init bash

# Ex.
conda create --name condaenv python
conda init bash
```
- Close the terminal and reopen it for the changes to take effect.
- Navigate back to /framing/py/ and activate the conda environment.
```bash
cd /<your>/<path>/framing/py/
sudo su
conda activate <name of conda env>
python3 --version
pip --version

Ex.
cd /usr/local/bin/framing/py/
conda activate condaenv
python3 --version
pip --version
```
- Navigate to /py/
```bash
cd /var/www/framing/py
```
- Install PyTorch. 
	- Note: this is a large package which, during framing's development, has crashed the server during installation. The present tutorial's instructions for installing PyTorch have been carefully optimized for a low-memory AWS EC2 instance.
```bash
brew install curl git unzip
brew install llvm
brew install python3
pip3 install --upgrade pip
pip3 install -U pip numpy wheel packaging requests opt_einsum
pip3 install -U keras_preprocessing --no-deps
pip3 install nltk pydantic jinja2 setuptools packaging
export TF_PYTHON_VERSION=3.11
conda install cmake ninja mkl mkl-include
# >>> y
brew cleanup
conda install pytorch torchvision torchaudio cpuonly -c pytorch
# >>> y
```
- Install the remaining required Python packages (note: these may take a minute).
```bash
pip3 install torch-struct tokenizers transformers protobuf sentencepiece numpy requests pydantic jinja2 setuptools
pip3 install zmq nltk inflect spacy
pip3 install benepar
python3 -m spacy download en_core_web_sm
```

- Install Supervisor for the Python script. Launching the Python script with Python will keep the Python process alive even if the terminal is closed/goes stale/etc. Feel free to use an alternative process manager. 

```bash   
brew install supervisor
sudo which supervisorctl
```  
 	
- Create a configuration file. Read these steps:
    - Enter the first command (A). 
    - Check that the directories to your conda environment, Python script, and logs in (B) in the second block make sense. Otherwise, edit (C) to match your directory structure.
	- Run the next command (D) to open the 'supervisord.conf' file. Paste in (B)  (or (C) if you made edits).
    - Save (the keypress to save and exit is :wq).
```bash
# (A)
sudo echo_supervisord_conf > /opt/homebrew/etc/supervisord.conf
 ```
```bash
# Example (B)
[program:app_7_24] 
command=/usr/local/bin/framing/py/miniconda3/envs/condaenv/bin/python /var/www/framing/py/app_7_24.py
autostart=true
autorestart=true
stderr_logfile=/usr/local/bin/log/app_7_24.err.log
stdout_logfile=/usr/local/bin/log/app_7_24.out.log

# Edit this as needed (C)
[program:app_7_24]
command=/<your>/<path>/framing/py/miniconda3/envs/condaenv/bin/python /<your>/<path>/framing/py/app_7_24.py
autostart=true
autorestart=true
stderr_logfile=/<your>/<path>/app_7_24.err.log
stdout_logfile=/<your>/<path>/app_7_24.out.log
```
```bash
# (D)
sudo vim /opt/homebrew/etc/supervisord.conf
```
- Load the configuration file.
```bash
sudo supervisorctl reread
sudo supervisorctl reload  
```

- Check the package configuration by launching the Python script and looking at the error log, followed by the output log.
```bash
sudo supervisorctl status
sudo tail -f /var/log/app_7_24.err.log    

# If the script is not already running
sudo supervisorctl start app_7_24
sudo tail -f /var/log/app_7_24.err.log      
``` 	
#### JavaScript Dependencies
- Navigate to /framing/js/
```bash
cd /usr/local/bin/framing/js/
```

- If not already installed, install Node (JS).
```bash
brew install node
brew link --force --overwrite node@lts
node -v
```

 - Install the JS script's required dependencies.
```bash
npm install
```

- If not already installed, install PM2.
 ```bash
 npm install pm2@latest -g
 ```

### Using the Python Script:
-- Launch -- 
```bash
sudo supervisorctl start app_7_24
```
-- Monitor via logs and status -- 
```bash
# Regular output
sudo tail -f /var/log/app_7_24.out.log

# Error log
sudo tail -f /var/log/app_7_24.err.log

# Status
sudo supervisorctl status
```
-- Quit -- 
```bash
sudo supervisorctl stop app_7_24
```
 
### Using the JS script:
-- Launch -- 
 ```bash
 pm2 start js8_2.2.js
 ```
-- Monitor via logs and process status -- 
```
# Logs
pm2 logs js8_2.2.2.js

# Process status
pm2 list

# Clear logs
pm2 flush
```
-- Quit -- 
```
pm2 stop all
```
